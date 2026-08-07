import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FileText, HeartPulse, ShieldAlert, ClipboardCheck, Target, Calendar,
  ArrowRight, RefreshCcw, Loader2, TrendingUp, TrendingDown, Minus, Building2,
  Lightbulb, FileUp, AlertCircle, Quote, Search, Zap, Users, Rocket, DollarSign,
  Gauge, HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import JSZip from 'jszip';
import api from '../lib/api';
import WorkspaceBar from '../components/WorkspaceBar';
import PremiumRadarChart from '../components/PremiumRadarChart';
import ConversationPanel from '../components/ui/ConversationPanel';
import ExpandableSection from '../components/ui/ExpandableSection';
import StartupTimeline from '../components/timeline/StartupTimeline';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../components/Toast';

const MODES = [
  { key: 'startup', label: 'Startup', icon: Building2, hint: 'Analyze an existing company from the archive' },
  { key: 'idea', label: 'Startup Idea', icon: Lightbulb, hint: 'Stress-test an idea before you build' },
  { key: 'deck', label: 'Pitch Deck', icon: FileText, hint: 'Review a deck for investor readiness' },
];

const QUICK_PICKS = [
  { name: 'Juicero', slug: 'juicero' },
  { name: 'Theranos', slug: 'theranos' },
  { name: 'WeWork', slug: 'wework' },
  { name: 'Quibi', slug: 'quibi' },
  { name: 'Webvan', slug: 'webvan' },
  { name: 'MoviePass', slug: 'moviepass' },
];

const LOADING_STAGES = [
  'Benchmarking against 413 failed ventures…',
  'Scoring market, product and team…',
  'Mapping failure patterns and historical precedents…',
  'Drafting the founder playbook…',
  'Reviewing pitch readiness…',
  'Composing your intelligence report…',
];

const EMPTY_FORM = {
  startup: '',
  idea: '',
  audience: '',
  industry: 'SaaS',
  teamSize: '2',
  revenueModel: 'Subscription',
  deckContent: '',
  deckIndustry: 'SaaS',
};

const FounderIntelligenceReport = () => {
  const { profile, getSharedHistory, recordAnalysis } = useWorkspace();
  const toast = useToast();

  const [mode, setMode] = React.useState('startup');
  const [form, setForm] = React.useState({
    ...EMPTY_FORM,
    startup: profile.companyName || '',
    idea: profile.idea || '',
    audience: profile.audience || '',
    industry: profile.industry || 'SaaS',
  });
  const [report, setReport] = React.useState(null);
  const [reportMeta, setReportMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState(LOADING_STAGES[0]);
  const [error, setError] = React.useState(null);
  const [conversation, setConversation] = React.useState([]);
  const [query, setQuery] = React.useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const buildPayload = () => {
    const base = { mode, industry: mode === 'deck' ? form.deckIndustry : form.industry };
    if (mode === 'startup') return { ...base, startupName: form.startup.trim() };
    if (mode === 'deck') return { ...base, deckContent: form.deckContent.trim() };
    return {
      ...base,
      idea: form.idea.trim(),
      audience: form.audience.trim(),
      revenueModel: form.revenueModel,
      teamSize: form.teamSize,
    };
  };

  const generate = async (e) => {
    e?.preventDefault();
    const payload = buildPayload();
    if (mode === 'startup' && !payload.startupName) {
      setError('Enter a company name to analyze.');
      return;
    }
    if (mode === 'idea' && (payload.idea || '').length < 10) {
      setError('Describe your startup idea in a little more detail (10+ characters).');
      return;
    }
    if (mode === 'deck' && !payload.deckContent) {
      setError('Paste or upload your pitch deck content first.');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setReportMeta(null);
    setConversation([]);
    let idx = 0;
    const interval = setInterval(() => {
      setLoadingText(LOADING_STAGES[idx % LOADING_STAGES.length]);
      idx += 1;
    }, 1600);

    try {
      const { data } = await api.post('/ai/intelligence-report', {
        ...payload,
        history: getSharedHistory([], 'Founder Intelligence Report'),
      });

      recordAnalysis({
        tool: 'Founder Intelligence Report',
        riskScore: data?.healthScore?.overall,
        summary: data?.executiveSummary?.verdict || `Health ${data?.healthScore?.overall}/100 · ${data?.healthScore?.riskLevel} risk.`,
        profilePatch: {
          companyName: mode === 'startup' ? payload.startupName : (profile.companyName || ''),
          idea: mode === 'idea' ? payload.idea : (profile.idea || ''),
          industry: payload.industry,
          businessModel: mode === 'idea' ? payload.revenueModel : (profile.businessModel || ''),
        },
      });

      setReport(data);
      setReportMeta(data._meta || {});
      setConversation([
        {
          role: 'user',
          content:
            mode === 'startup'
              ? `Analyze the startup: ${payload.startupName}`
              : mode === 'deck'
                ? `Analyze this pitch deck (${payload.industry}): ${payload.deckContent.slice(0, 140)}…`
                : `Startup Idea: ${payload.idea}\nAudience: ${payload.audience}\nIndustry: ${payload.industry}`,
        },
        { role: 'assistant', content: data?.consultantBrief || data?.executiveSummary?.summary || 'Here is your Founder Intelligence Report.', fullResult: data },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error;
      if (status === 404) {
        setError(message || 'Company not found in the intelligence database.');
      } else {
        setError(message || 'Could not generate the report. Please try again.');
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.pptx')) {
      toast({ title: 'Please upload a .pptx file, or paste the text manually.', type: 'error' });
      return;
    }
    setParsing(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        .sort((a, b) => (parseInt(a.match(/\d+/), 10) || 0) - (parseInt(b.match(/\d+/), 10) || 0));
      let fullText = '';
      for (const slideFile of slideFiles) {
        const content = await zip.files[slideFile].async('string');
        const doc = new DOMParser().parseFromString(content, 'text/xml');
        const texts = doc.getElementsByTagName('a:t');
        for (let i = 0; i < texts.length; i += 1) fullText += `${texts[i].textContent} `;
        fullText += '\n\n';
      }
      setForm((f) => ({ ...f, deckContent: fullText.trim() }));
    } catch (err) {
      toast({ title: 'Failed to parse the PPTX. Paste the text manually instead.', type: 'error' });
    } finally {
      setParsing(false);
    }
  };

  const handleFollowUp = async (followUpText) => {
    const question = (followUpText ?? query).trim();
    if (!question || !report) return;
    setLoading(true);
    const newHistory = conversation.map((m) => ({ role: m.role, content: m.content }));
    try {
      const { data } = await api.post('/ai/intelligence-report', {
        ...buildPayload(),
        history: getSharedHistory(newHistory, 'Founder Intelligence Report'),
        followUpQuestion: question,
      });
      setReport(data);
      setConversation((prev) => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.consultantBrief || 'Updated analysis.', fullResult: data },
      ]);
      setQuery('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not process the follow-up.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setReportMeta(null);
    setConversation([]);
    setQuery('');
    setError(null);
  };

  const radarData = report?.healthScore?.categories?.map((c) => ({
    subject: c.name,
    A: c.score,
    fullMark: 100,
  })) || [];

  const trendIcon =
    report?.healthScore?.trend === 'improving' ? <TrendingUp className="h-5 w-5" /> :
    report?.healthScore?.trend === 'declining' ? <TrendingDown className="h-5 w-5" /> :
    <Minus className="h-5 w-5" />;

  const scoreColor = (s) => (s >= 70 ? 'text-success' : s >= 50 ? 'text-accent' : 'text-danger');

  const suggestedFollowUps = [
    { label: 'Explain deeper', prompt: 'Explain the risk assessment above in more depth, with specific reasoning for each category.' },
    { label: 'Show examples', prompt: 'Show concrete examples of startups that failed due to the top risks identified above.' },
    { label: 'Give recommendations', prompt: 'Based on this report, give specific, actionable recommendations to raise my health score.' },
    { label: 'Generate action plan', prompt: 'Based on this report, generate a concrete step-by-step action plan for the next 90 days.' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="pv-content-container py-12">
        <WorkspaceBar />

        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase text-text-muted tracking-[0.2em] mb-2">
            Founder Intelligence
          </div>
          <h1 className="text-4xl font-display font-bold text-text-primary mb-3">
            Founder Intelligence Report
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
            One comprehensive AI report for a <strong className="text-text-primary">startup</strong>, a{' '}
            <strong className="text-text-primary">startup idea</strong>, or a{' '}
            <strong className="text-text-primary">pitch deck</strong> — merging risk analysis, a founder
            playbook, and investor review into a single workflow.
          </p>
        </div>

        {!report ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Mode selector */}
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setMode(m.key); setError(null); }}
                  className={clsx(
                    'rounded-2xl border p-5 text-left transition-all duration-200',
                    mode === m.key
                      ? 'border-accent/40 bg-accent/5 shadow-card'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2/40'
                  )}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className={clsx(
                      'grid h-10 w-10 place-items-center rounded-xl border',
                      mode === m.key ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-2 border-border text-text-muted'
                    )}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <span className={clsx('font-bold', mode === m.key ? 'text-accent' : 'text-text-primary')}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-muted">{m.hint}</p>
                </button>
              ))}
            </div>

            <form onSubmit={generate} className="pv-card p-8 space-y-6">
              {mode === 'startup' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="pv-label">Company or Startup Name</label>
                    <input
                      className="pv-field"
                      placeholder="e.g. Juicero, WeWork, Tesla…"
                      value={form.startup}
                      onChange={set('startup')}
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase text-text-muted tracking-widest">
                      Or pick from the archive
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PICKS.map((q) => (
                        <button
                          key={q.slug}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, startup: q.name }))}
                          className={clsx(
                            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                            form.startup === q.name
                              ? 'border-accent/40 bg-accent/10 text-accent'
                              : 'border-border bg-surface-2/50 text-text-secondary hover:border-accent/30 hover:text-accent'
                          )}
                        >
                          {q.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'idea' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="pv-label">Startup Idea</label>
                    <textarea
                      required
                      rows={4}
                      className="pv-field"
                      placeholder="Describe your product and the core problem it solves…"
                      value={form.idea}
                      onChange={set('idea')}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="pv-label">Industry</label>
                      <select className="pv-field" value={form.industry} onChange={set('industry')}>
                        {['SaaS', 'FinTech', 'EdTech', 'E-commerce', 'Healthcare', 'Consumer', 'Marketplace', 'Web3'].map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="pv-label">Target Audience</label>
                      <input className="pv-field" placeholder="e.g. Early-stage founders" value={form.audience} onChange={set('audience')} />
                    </div>
                    <div className="space-y-2">
                      <label className="pv-label">Team Size</label>
                      <input className="pv-field" type="number" min="1" max="100" value={form.teamSize} onChange={set('teamSize')} />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'deck' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="pv-label">Industry</label>
                      <select className="pv-field" value={form.deckIndustry} onChange={set('deckIndustry')}>
                        {['SaaS', 'FinTech', 'EdTech', 'E-commerce', 'Healthcare', 'Consumer', 'Marketplace', 'Web3'].map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="pv-label">Upload Pitch Deck (.pptx)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept=".pptx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                        aria-label="Upload pitch deck"
                      />
                      <div className={clsx(
                        'border-2 border-dashed rounded-2xl p-7 text-center transition-all',
                        parsing ? 'border-accent bg-accent/5 animate-pulse' : 'border-border group-hover:border-accent/50 group-hover:bg-surface-2'
                      )}>
                        {parsing ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            <span className="text-xs font-bold uppercase tracking-widest text-accent">Extracting slide text…</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileUp className="h-6 w-6 text-text-secondary group-hover:text-accent transition-colors" />
                            <span className="text-sm text-text-secondary">
                              <span className="font-bold text-accent">Click to upload</span> or drag &amp; drop
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">PowerPoint (.pptx) only</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="pv-label">Deck Content / Problem Statement</label>
                    <textarea
                      rows={8}
                      className="pv-field font-mono"
                      placeholder="Paste the text from your pitch deck — problem, solution, market size, monetization…"
                      value={form.deckContent}
                      onChange={set('deckContent')}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div className="text-sm text-text-primary">{error}</div>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading} className="pv-btn-primary w-full justify-center text-lg disabled:opacity-60">
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Generating Report…</>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Intelligence Report
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 border border-accent/25 text-accent">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-accent">Intelligence Report</div>
                  <h2 className="font-display text-2xl font-bold text-text-primary">
                    {report.executiveSummary?.verdict?.split('—')[0]?.split(':')[0] || 'Founder Intelligence Report'}
                  </h2>
                </div>
              </div>
              <button type="button" onClick={reset} className="pv-btn-secondary flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                New Report
              </button>
            </div>

            {reportMeta?.benchmarked != null && (
              <p className="text-xs font-medium text-text-muted">
                Benchmarking pool: {reportMeta.benchmarked} comparable ventures{reportMeta.mock ? ' (demo data)' : ''}
              </p>
            )}

            {/* 1. Executive Summary */}
            <ExpandableSection
              id="exec-summary"
              icon={Quote}
              title="Executive Summary"
              subtitle="Overall assessment, one-paragraph summary, biggest strengths and weaknesses"
              badge="Overview"
              defaultOpen
            >
              <div className="space-y-6">
                <p className="text-lg font-display font-bold text-text-primary leading-snug">
                  {report.executiveSummary?.verdict}
                </p>
                <p className="leading-relaxed text-text-secondary">
                  {report.executiveSummary?.summary}
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-success">Biggest Strengths</div>
                    <ul className="space-y-2">
                      {(report.executiveSummary?.strengths || ['—']).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-danger">Biggest Weaknesses</div>
                    <ul className="space-y-2">
                      {(report.executiveSummary?.weaknesses || ['—']).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ExpandableSection>

            {/* 2. Startup Health Score */}
            <ExpandableSection
              id="health-score"
              icon={HeartPulse}
              title="Startup Health Score"
              subtitle="Visual score out of 100 across 8 categories, with the reasoning behind every score"
              badge={`${report.healthScore?.overall || '—'}/100`}
              defaultOpen
            >
              <div className="space-y-8">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                  {/* Gauge */}
                  <div className="mx-auto flex flex-col items-center">
                    <div className="relative h-48 w-48">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 192 192">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-border" />
                        <circle
                          cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent"
                          strokeDasharray={502.65}
                          strokeDashoffset={502.65 * (1 - (report.healthScore?.overall || 0) / 100)}
                          className={clsx('transition-all duration-1000', scoreColor(report.healthScore?.overall || 0))}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-data text-5xl font-bold text-text-primary">{report.healthScore?.overall || '—'}</span>
                        <span className="mt-1 text-xs font-bold uppercase tracking-wider text-text-muted">Health Score</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider', scoreColor(report.healthScore?.overall || 0))}>
                        {trendIcon}
                        {report.healthScore?.trend || 'stable'}
                      </span>
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider',
                        report.healthScore?.riskLevel === 'low' ? 'border-success/30 bg-success/10 text-success' :
                        report.healthScore?.riskLevel === 'moderate' ? 'border-warning/30 bg-warning/10 text-warning' :
                        report.healthScore?.riskLevel === 'high' ? 'border-danger/30 bg-danger/10 text-danger' :
                        'border-danger/30 bg-danger/10 text-danger'
                      )}>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {report.healthScore?.riskLevel} risk
                      </span>
                    </div>
                  </div>

                  {/* Radar */}
                  <div className="h-80">
                    <PremiumRadarChart data={radarData} />
                  </div>
                </div>

                {/* Category bars with WHY */}
                <div className="space-y-3">
                  {report.healthScore?.categories?.map((c) => (
                    <div key={c.name} className="rounded-xl border border-border/60 bg-surface-2/40 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-text-primary">{c.name}</span>
                        <span className={clsx('font-data text-sm font-bold', scoreColor(c.score))}>{c.score}/100</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score}%` }}
                          transition={{ duration: 0.9, ease: [0.2, 0, 0, 1] }}
                          className={clsx('h-full rounded-full', c.score >= 70 ? 'bg-success' : c.score >= 50 ? 'bg-accent' : 'bg-danger')}
                        />
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-text-muted">{c.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ExpandableSection>

            {/* 3. Failure Analysis */}
            <ExpandableSection
              id="failure-analysis"
              icon={ShieldAlert}
              title="Failure Analysis"
              subtitle="Major & critical risks with probability, impact, evidence and suggested fixes"
              badge="Risk Scanner"
              defaultOpen={false}
            >
              <div className="space-y-5">
                {report.failureAnalysis?.map((risk, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-surface-2/30 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={clsx(
                          'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest border',
                          risk.type === 'critical' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning'
                        )}>
                          {risk.type}
                        </span>
                        <h4 className="font-bold text-text-primary">{risk.title}</h4>
                      </div>
                      <span className="font-data text-sm font-bold text-text-secondary">
                        Probability: <span className={risk.probability >= 60 ? 'text-danger' : 'text-text-primary'}>{risk.probability}%</span>
                        <span className="mx-2 text-border-strong">·</span>
                        Impact: <span className={risk.impact === 'high' ? 'text-danger' : 'text-text-primary'}>{risk.impact}</span>
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${risk.probability}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className={clsx('h-full rounded-full', risk.probability >= 60 ? 'bg-danger' : risk.probability >= 45 ? 'bg-warning' : 'bg-success')}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-danger">Why this matters</div>
                        <p className="text-sm leading-relaxed text-text-secondary">{risk.whyItMatters}</p>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-accent">Evidence</div>
                        <p className="text-sm leading-relaxed text-text-secondary">{risk.evidence}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">Historical examples</div>
                      <div className="flex flex-wrap gap-2">
                        {(risk.historicalExamples || []).map((ex, j) => (
                          <span key={j} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-4">
                      <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-success">
                        <Target className="h-3.5 w-3.5" /> Suggested fix
                      </div>
                      <p className="text-sm leading-relaxed text-text-primary">{risk.suggestedFix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>

            {/* 4. Founder Playbook */}
            <ExpandableSection
              id="playbook"
              icon={ClipboardCheck}
              title="Founder Playbook"
              subtitle="Immediate actions, 30/90-day plans, 12-month strategy, hiring, GTM and fundraising"
              badge="Playbook"
              defaultOpen={false}
            >
              <PlaybookGrid report={report} />
            </ExpandableSection>

            {/* 5. Pitch Analysis */}
            <ExpandableSection
              id="pitch-analysis"
              icon={FileText}
              title="Pitch Analysis"
              subtitle="Storytelling, market, competition, financials, traction, design & investor readiness"
              badge={`${report.pitchAnalysis?.investmentScore || '—'}/100`}
              defaultOpen={false}
            >
              <PitchAnalysisGrid report={report} />
            </ExpandableSection>

            {/* 6. Startup Timeline */}
            <ExpandableSection
              id="timeline"
              icon={Calendar}
              title="Startup Timeline"
              subtitle="Animated vertical timeline — click a node to open the event dossier + scoped AI chat"
              badge={`${report.timeline?.length || 0} events`}
              defaultOpen={false}
            >
              <StartupTimeline events={report.timeline || []} />
            </ExpandableSection>

            {/* Conversation / follow-ups */}
            <ConversationPanel
              conversation={conversation}
              query={query}
              setQuery={setQuery}
              loading={loading}
              onSend={handleFollowUp}
              suggestedFollowUps={suggestedFollowUps}
              onSuggestedFollowUp={(q) => { setQuery(q); handleFollowUp(q); }}
              placeholder="Ask a follow-up question about the report…"
              title="Continue Analysis"
            />
          </motion.div>
        )}

        {/* Full-screen generation overlay */}
        <AnimatePresence>
          {loading && !report && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-bg/85 backdrop-blur-sm px-4"
              role="status"
              aria-live="polite"
            >
              <div className="relative mb-8">
                <div className="h-24 w-24 rounded-full border-4 border-surface-3 border-t-accent animate-spin" />
                <Search className="absolute inset-0 m-auto h-9 w-9 text-accent animate-pulse" />
              </div>
              <div className="font-data text-lg text-accent mb-2">{loadingText}</div>
              <p className="text-sm text-text-secondary">Cross-referencing historical failure patterns…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PlaybookGrid = ({ report }) => {
  const rows = [
    { label: 'Immediate Actions', icon: Zap, items: report.playbook?.immediateActions },
    { label: '30 Day Plan', icon: Calendar, items: report.playbook?.plan30Day },
    { label: '90 Day Plan', icon: Target, items: report.playbook?.plan90Day },
    { label: '12 Month Strategy', icon: TrendingUp, items: report.playbook?.plan12Month },
    { label: 'Hiring Suggestions', icon: Users, items: report.playbook?.hiring },
    { label: 'Product Priorities', icon: Lightbulb, items: report.playbook?.productPriorities },
    { label: 'Go-To-Market Strategy', icon: Rocket, items: report.playbook?.gtmStrategy },
    { label: 'Fundraising Advice', icon: DollarSign, items: report.playbook?.fundraisingAdvice },
    { label: 'KPIs to Track', icon: Gauge, items: report.playbook?.kpis },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-border/60 bg-surface-2/30 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
            <row.icon className="h-4 w-4" />
            {row.label}
          </div>
          <ul className="space-y-2">
            {(row.items || ['—']).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const PitchAnalysisGrid = ({ report }) => {
  const p = report.pitchAnalysis || {};
  const fields = [
    { label: 'Storytelling', value: p.storytelling },
    { label: 'Market', value: p.market },
    { label: 'Competition', value: p.competition },
    { label: 'Financials', value: p.financials },
    { label: 'Traction', value: p.traction },
    { label: 'Design', value: p.design },
    { label: 'Investor Readiness', value: p.investorReadiness },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="text-center">
          <div className="font-data text-4xl font-bold text-accent">{p.investmentScore ?? '—'}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">Investment Score</div>
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Overall investor-readiness grade for this deck, derived from section coverage and narrative quality.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="rounded-xl border border-border/60 bg-surface-2/30 p-4">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">{f.label}</div>
            <p className="text-sm leading-relaxed text-text-secondary">{f.value || '—'}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-danger">Missing Slides</div>
          <div className="flex flex-wrap gap-2">
            {(p.missingSlides || []).map((s, i) => (
              <span key={i} className="rounded-full border border-danger/25 bg-surface px-3 py-1 text-xs font-semibold text-danger">{s}</span>
            ))}
            {(!p.missingSlides || p.missingSlides.length === 0) && <span className="text-sm text-text-muted">None — all key sections present.</span>}
          </div>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-accent">Investor Questions to Expect</div>
          <ul className="space-y-2">
            {(p.investorQuestions || []).map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FounderIntelligenceReport;
