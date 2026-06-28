import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Globe, Users, DollarSign, Calendar, Clock, 
  ChevronRight, TrendingDown, Info, ShieldAlert, Sparkles, 
  AlertCircle, ArrowLeft, BookOpen, Flame, Skull, Target, 
  EyeOff, Lightbulb, Compass, Landmark, ShieldCheck, HelpCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { clsx } from 'clsx';
import api from '../lib/api';
import StartupCard from '../components/StartupCard';
import GhostChat from '../components/GhostChat';
import Logo from '../components/Logo';
import FailureRiskIndex from '../components/FailureRiskIndex';
import { getDocumentaryData } from '../lib/documentaryData';

const PostmortemPage = () => {
  const { slug } = useParams();
  const [startup, setStartup] = React.useState(null);
  const [similar, setSimilar] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeAiTab, setActiveAiTab] = React.useState('overview');
  const [activeAutopsyTab, setActiveAutopsyTab] = React.useState('strategic');

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [res, resSim] = await Promise.all([
          api.get(`/startups/${slug}`),
          api.get(`/startups/${slug}/similar`)
        ]);
        setStartup(res.data);
        setSimilar(res.data.similar || resSim.data || []);
      } catch (err) {
        console.error("Failed to fetch startup postmortem:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-40 text-center animate-pulse text-accent font-data flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        DECRYPTING POSTMORTEM ARCHIVE...
      </div>
    );
  }
  
  if (!startup) {
    return (
      <div className="py-40 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold">Startup postmortem not found</h2>
        <Link to="/explore" className="mt-4 inline-block text-accent hover:underline">
          Return to explorer
        </Link>
      </div>
    );
  }

  // Get the enriched documentary-style data
  const doc = getDocumentaryData(slug, startup);

  const formatINR = (val) => {
    if (!val) return 'N/A';
    const num = Number(val);
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)} B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
    return `₹${(num / 100000).toFixed(1)} L`;
  };

  const aiAnalysis = startup.aiAnalyses?.[0] || {};

  // Calculate Failure Score
  const getFailureScore = (reasons) => {
    if (!reasons || reasons.length === 0) return 72;
    const primary = reasons.find(r => r.isPrimary);
    if (primary) {
      const cat = primary.category.toLowerCase();
      if (cat.includes('fraud') || cat.includes('ethics')) return 99;
      if (cat.includes('pmf') || cat.includes('product-market')) return 95;
      if (cat.includes('unit_economics') || cat.includes('economics')) return 92;
      if (cat.includes('cashflow') || cat.includes('burn') || cat.includes('cac')) return 88;
    }
    return Math.max(...reasons.map(r => r.severityScore || 50));
  };
  const failureScore = getFailureScore(startup.failureReasons || []);

  // Group reasons into quadrants for Radar Chart
  const getQuadrantBreakdown = (reasons = []) => {
    const quadrants = {
      Financial: [],
      Market: [],
      Product: [],
      Leadership: []
    };

    reasons.forEach(r => {
      const cat = (r.category || '').toLowerCase();
      if (['cashflow', 'unit_economics', 'cac', 'monetization', 'pricing'].some(k => cat.includes(k))) {
        quadrants.Financial.push(r.severityScore || 50);
      } else if (['pmf', 'competition', 'timing', 'regulation', 'legal'].some(k => cat.includes(k))) {
        quadrants.Market.push(r.severityScore || 50);
      } else if (['product', 'retention', 'platform_risk'].some(k => cat.includes(k))) {
        quadrants.Product.push(r.severityScore || 50);
      } else {
        quadrants.Leadership.push(r.severityScore || 50);
      }
    });

    const average = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 25;

    return [
      { subject: 'Financial', Score: average(quadrants.Financial) },
      { subject: 'Market Fit', Score: average(quadrants.Market) },
      { subject: 'Product Tech', Score: average(quadrants.Product) },
      { subject: 'Leadership', Score: average(quadrants.Leadership) }
    ];
  };

  const radarData = getQuadrantBreakdown(startup.failureReasons || []);

  // Status badges colors
  const statusColors = {
    failed: 'bg-red-500/10 text-danger border-red-500/20',
    acquired: 'bg-emerald-500/10 text-success border-emerald-500/20',
    pivoted: 'bg-amber-500/10 text-warning border-amber-500/20',
    zombie: 'bg-slate-500/10 text-text-secondary border-slate-500/20',
  };

  // Timeline stage icon mapping
  const timelineStageIcons = {
    founding: <Building2 className="w-4 h-4 text-blue-400" />,
    funding: <DollarSign className="w-4 h-4 text-emerald-400" />,
    growth: <TrendingDown className="w-4 h-4 text-purple-400 rotate-180" />, // trending up
    major_decisions: <Compass className="w-4 h-4 text-amber-400" />,
    warning_signs: <AlertCircle className="w-4 h-4 text-orange-400 animate-pulse" />,
    collapse: <Flame className="w-4 h-4 text-red-500" />,
    aftermath: <BookOpen className="w-4 h-4 text-slate-400" />,
  };

  const timelineStageColors = {
    founding: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    funding: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    growth: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    major_decisions: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    warning_signs: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    collapse: 'border-red-500/30 bg-red-500/10 text-red-400',
    aftermath: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  };

  return (
    <div className="pb-24 bg-bg text-text-primary selection:bg-accent/30 selection:text-white">
      
      {/* Cinematic Header / Hero */}
      <div className="border-b border-border/60 bg-surface/20 pt-16 pb-16 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-danger/5 rounded-full blur-3xl -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(109,94,245,0.02),transparent)] -z-10" />
        
        <div className="pv-content-container">
          <Link to="/explore" className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-accent mb-8 group transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Failures Explorer
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
              <Logo 
                name={startup.name} 
                domain={startup.domain} 
                size="xl"
                className="shrink-0 shadow-2xl border border-border/80"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2.5">
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">{startup.name}</h1>
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border font-data',
                    statusColors[startup.status] || statusColors.failed
                  )}>
                    {startup.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-text-muted text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-accent" /> {startup.industry}</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-accent" /> {startup.country}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {startup.lifetimeMonths} Months Active</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6">
              <div className="bg-surface/60 backdrop-blur-sm border border-border/60 px-6 py-4 rounded-card text-center min-w-[130px] shadow-lg">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-1 tracking-widest">Capital Burned</div>
                <div className="text-2xl font-data font-bold text-text-primary">{formatINR(startup.fundingInr)}</div>
              </div>
            </div>
          </div>

          {/* 1. Hero Summary Section */}
          <div className="mt-12">
            <h2 className="text-xs uppercase tracking-widest text-accent font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> The Insider Briefing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface/40 border border-border/40 p-6 rounded-card hover:border-accent/40 transition-all hover:translate-y-[-2px] duration-300 shadow-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-text-primary text-sm tracking-wide">The Dream</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{doc.heroSummary.dream}</p>
              </div>

              <div className="bg-surface/40 border border-border/40 p-6 rounded-card hover:border-accent/40 transition-all hover:translate-y-[-2px] duration-300 shadow-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-text-primary text-sm tracking-wide">The Investment Thesis</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{doc.heroSummary.thesis}</p>
              </div>

              <div className="bg-surface/40 border border-border/40 p-6 rounded-card hover:border-accent/40 transition-all hover:translate-y-[-2px] duration-300 shadow-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-text-primary text-sm tracking-wide">The Excitement</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{doc.heroSummary.excitement}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Grid */}
      <div className="pv-content-container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Narrative, Timeline, Autopsy */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* 2. Story Section */}
            <section className="relative">
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3 text-text-primary border-b border-border/40 pb-4">
                <BookOpen className="text-accent w-6 h-6" />
                Chapter 1: The Promise & The Pivot
              </h2>
              <div className="pv-card p-8 sm:p-10 leading-relaxed text-text-secondary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -z-10" />
                <div className="prose prose-invert max-w-none">
                  {/* Dropcap styling on first paragraph */}
                  {doc.story.split('\n\n').map((para, i) => {
                    if (i === 0) {
                      const firstChar = para.charAt(0);
                      const restOfPara = para.slice(1);
                      return (
                        <p key={i} className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
                          <span className="text-5xl font-display font-bold float-left mr-3 mt-1.5 text-accent line-height-none">{firstChar}</span>
                          {restOfPara}
                        </p>
                      );
                    }
                    return <p key={i} className="text-base text-text-secondary leading-relaxed mb-6">{para}</p>;
                  })}
                </div>
                {/* Immersive Pulled Quote */}
                <div className="mt-8 border-l-2 border-accent/60 pl-6 py-2 italic text-text-muted text-base md:text-lg bg-accent/5 rounded-r-lg">
                  "In {startup.foundingYear || 'the beginning'}, investors believed this startup had everything required to dominate its market. The reality, however, was far more unforgiving."
                </div>
              </div>
            </section>

            {/* 3. Timeline Section */}
            <section>
              <h2 className="text-2xl font-display font-bold mb-8 flex items-center gap-3 text-text-primary border-b border-border/40 pb-4">
                <Calendar className="text-accent w-6 h-6" />
                The Collapse Chronicles
              </h2>
              <p className="text-sm text-text-muted mb-8 leading-relaxed">
                Trace the path from initial spark to final liquidation. This timeline maps the crucial decision points and warning signs that sealed the company's fate.
              </p>
              
              <div className="relative pl-8 border-l-2 border-border/40 ml-4 space-y-12">
                {doc.timeline.map((event, i) => {
                  return (
                    <motion.div 
                      key={i} 
                      className="relative"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {/* Event Dot */}
                      <span className={clsx(
                        "absolute -left-12 top-1 w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center shadow-lg transition-all",
                        timelineStageColors[event.stage] || 'border-accent bg-accent/10 text-accent'
                      )}>
                        {timelineStageIcons[event.stage] || <Compass className="w-4 h-4" />}
                      </span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-surface/20 border border-border/20 p-5 rounded-card hover:border-border/60 transition-all shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-data text-accent font-bold uppercase tracking-wider">
                              {event.dateStr}
                            </span>
                            <span className={clsx(
                              "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-widest font-data",
                              timelineStageColors[event.stage]
                            )}>
                              {event.stage.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">{event.title}</h3>
                          <p className="text-text-muted text-sm leading-relaxed max-w-xl">{event.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* 4. Failure Investigation Section */}
            <section>
              <h2 className="text-2xl font-display font-bold mb-8 flex items-center gap-3 text-text-primary border-b border-border/40 pb-4">
                <ShieldAlert className="text-accent w-6 h-6" />
                The Forensic Autopsy
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-danger/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-danger">
                    <Skull className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Root Cause</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.rootCause}</p>
                </div>

                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-accent">
                    <EyeOff className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Hidden Cause</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.hiddenCause}</p>
                </div>

                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-orange-400/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-orange-400">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Missed Signals</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.missedSignals}</p>
                </div>

                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-blue-400/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-blue-400">
                    <Users className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Leadership Decisions</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.leadershipDecisions}</p>
                </div>

                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-purple-400/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-purple-400">
                    <Compass className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Market Mistakes</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.marketMistakes}</p>
                </div>

                <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-emerald-400/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3 text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider">Financial Problems</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.financialProblems}</p>
                </div>

              </div>

              <div className="bg-surface/30 border border-border/40 p-6 rounded-card hover:border-accent-2/30 transition-all duration-300 mt-6">
                <div className="flex items-center gap-3 mb-3 text-accent-2">
                  <Target className="w-5 h-5" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider">Execution Mistakes</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{doc.failureInvestigation.executionMistakes}</p>
              </div>
            </section>

            {/* 5. Lessons Section */}
            <section className="border border-amber-500/20 bg-amber-500/5 p-8 rounded-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -z-10" />
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3 text-amber-400">
                <Lightbulb className="w-6 h-6 animate-pulse" />
                The Postmortem Playbook
              </h2>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                Durable, actionable strategic takeaways extracted directly from this failure. Read these to avoid making the same high-stakes mistakes.
              </p>
              <div className="space-y-6">
                {doc.lessons.map((lesson, i) => (
                  <div key={i} className="flex gap-4 items-start bg-bg/40 border border-amber-500/10 p-5 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold font-data text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-base mb-1.5">{lesson.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{lesson.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: AI Analysis, Charts, and Recommendations */}
          <div className="space-y-12">
            <FailureRiskIndex startup={startup} />
            
            {/* 7. AI Investigator Section */}
            <section className="border border-accent-2/20 bg-accent-2/5 p-6 sm:p-8 rounded-card relative shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-2/10 rounded-full blur-xl -z-10" />
              <div className="inline-flex items-center gap-2 text-xs text-accent-2 font-bold uppercase tracking-widest mb-6 border-b border-accent-2/20 pb-2 w-full">
                <Sparkles className="w-4 h-4 animate-pulse" />
                AI Investigator Dossier
              </div>

              {/* HBR & Netflix Style Tabs */}
              <div className="flex border-b border-border/60 gap-4 mb-6 text-xs overflow-x-auto pb-0.5">
                <button 
                  onClick={() => setActiveAiTab('overview')}
                  className={clsx(
                    "pb-2 font-semibold transition-all shrink-0 uppercase tracking-wider",
                    activeAiTab === 'overview' ? 'text-accent-2 border-b-2 border-accent-2 font-bold' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveAiTab('analysis')}
                  className={clsx(
                    "pb-2 font-semibold transition-all shrink-0 uppercase tracking-wider",
                    activeAiTab === 'analysis' ? 'text-accent-2 border-b-2 border-accent-2 font-bold' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  HBR Case Analysis
                </button>
                <button 
                  onClick={() => setActiveAiTab('forensics')}
                  className={clsx(
                    "pb-2 font-semibold transition-all shrink-0 uppercase tracking-wider",
                    activeAiTab === 'forensics' ? 'text-accent-2 border-b-2 border-accent-2 font-bold' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Forensic Metrics
                </button>
              </div>

              <div className="space-y-4">
                {activeAiTab === 'overview' && (
                  <div className="text-sm text-text-muted leading-relaxed space-y-4">
                    <p className="first-line:uppercase first-line:tracking-wide">
                      {doc.aiInvestigator.overview}
                    </p>
                    <div className="bg-bg/50 border border-border/40 p-4 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-accent-2 mb-1">Primary Failure archetype</div>
                      <div className="text-sm font-bold text-text-primary">{aiAnalysis.primaryCause || doc.failureInvestigation.rootCause.split('.')[0]}</div>
                    </div>
                  </div>
                )}

                {activeAiTab === 'analysis' && (
                  <div className="text-sm text-text-muted leading-relaxed space-y-4">
                    <p className="whitespace-pre-line">
                      {doc.aiInvestigator.caseAnalysis}
                    </p>
                  </div>
                )}

                {activeAiTab === 'forensics' && (
                  <div className="text-sm text-text-muted leading-relaxed space-y-4">
                    <p>
                      {doc.aiInvestigator.forensicMetrics}
                    </p>
                    {startup.metricsSnapshots && startup.metricsSnapshots.length > 0 && (
                      <div className="bg-bg/60 border border-border/60 p-4 rounded-xl">
                        <div className="text-xs font-bold text-text-primary mb-2">Metrics Trend</div>
                        <div className="h-[120px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={startup.metricsSnapshots}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
                              <XAxis 
                                dataKey="recordedMonth" 
                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                                tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
                                axisLine={false}
                              />
                              <YAxis tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }} axisLine={false} />
                              <Line type="monotone" dataKey="users" stroke="rgb(var(--color-accent-2))" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="churnRate" stroke="rgb(var(--color-danger))" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between text-[10px] text-text-muted mt-2">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-2" /> Users</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger border-dashed" /> Churn %</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Failure Breakdown Chart */}
            <section className="pv-card p-6">
              <h3 className="text-sm uppercase tracking-widest font-bold mb-6 text-text-primary flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-accent" /> Failure Matrix Breakdown
              </h3>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgb(var(--color-border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 9 }} />
                    <Radar name="Severity" dataKey="Score" stroke="rgb(var(--color-accent))" fill="rgb(var(--color-accent))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 6. Similar Startups Section */}
            {similar && similar.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-sm uppercase tracking-widest font-bold text-text-primary flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-accent" /> Correlated Failures
                </h3>
                <div className="space-y-6">
                  {similar.map((s, idx) => {
                    // Find matching custom reason if available
                    const matchingDocInfo = doc.similarStartups.find(item => item.slug === s.slug);
                    return (
                      <div key={s.id || idx} className="group">
                        <StartupCard {...s} topFailureReason={s.keyLesson ? 'unit_economics' : null} />
                        {matchingDocInfo && (
                          <div className="mt-2 text-xs bg-surface/30 border border-border/30 p-4 rounded-b-card border-t-0 text-text-muted leading-relaxed italic group-hover:border-border/60 transition-all">
                            <strong className="text-text-primary not-italic block mb-1">Why their stories connect:</strong>
                            {matchingDocInfo.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
          </div>
        </div>
      </div>
      <GhostChat startupSlug={startup.slug} startupName={startup.name} />
    </div>
  );
};

export default PostmortemPage;
