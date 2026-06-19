import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ShieldAlert, Target, Activity, Loader2, Sparkles, AlertTriangle, Upload, FileUp, HelpCircle, Send, RefreshCcw, CheckCircle2, Lightbulb } from 'lucide-react';
import api from '../lib/api';
import { clsx } from 'clsx';
import JSZip from 'jszip';

const PitchDeckAutopsy = () => {
  const [deckContent, setDeckContent] = React.useState('');
  const [industry, setIndustry] = React.useState('SaaS');
  const [loading, setLoading] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [conversation, setConversation] = React.useState([]);
  const [followUpQuery, setFollowUpQuery] = React.useState('');
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.pptx')) {
      setParsing(true);
      try {
        const zip = await JSZip.loadAsync(file);
        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
        
        let fullText = '';
        for (const slideFile of slideFiles) {
          const content = await zip.files[slideFile].async('string');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          const textNodes = xmlDoc.getElementsByTagName('a:t');
          
          for (let i = 0; i < textNodes.length; i++) {
            fullText += textNodes[i].textContent + ' ';
          }
          fullText += '\n\n';
        }
        setDeckContent(fullText.trim());
      } catch (err) {
        console.error('Error parsing PPTX:', err);
        alert('Failed to parse PPTX file. Please try pasting the text manually.');
      } finally {
        setParsing(false);
      }
    } else {
      alert('Please upload a .pptx file.');
    }
  };

  const handleAutopsy = async (e) => {
    e.preventDefault();
    if (!deckContent.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/autopsy', { deckContent, industry });
      setConversation([
        {
          role: 'user',
          content: `Deck Content: ${deckContent.slice(0, 100)}...\nIndustry: ${industry}`
        },
        {
          role: 'assistant',
          content: "Here's your pitch deck autopsy.",
          fullResult: response.data
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!followUpQuery.trim()) return;

    setLoading(true);
    const newHistory = conversation.map(msg => ({ role: msg.role, content: msg.content }));

    try {
      const response = await api.post('/ai/autopsy', { deckContent, industry, history: newHistory });
      setConversation(prev => [
        ...prev,
        { role: 'user', content: followUpQuery },
        { role: 'assistant', content: "Here's your updated analysis.", fullResult: response.data }
      ]);
      setFollowUpQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedFollowUp = (query) => {
    setFollowUpQuery(query);
    handleFollowUp();
  };

  const reset = () => {
    setConversation([]);
    setDeckContent('');
    setIndustry('SaaS');
    setFollowUpQuery('');
  };

  const lastResult = conversation.length > 0 ? conversation[conversation.length - 1].fullResult : null;
  const suggestedFollowUps = [
    "Explain more",
    "Why is this risky?",
    "How can I improve this?",
    "Compare with successful startups"
  ];

  return (
    <div className="pv-content-container py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Activity className="w-16 h-16 text-accent mx-auto mb-4" />
          {conversation.length > 0 && (
            <button
              onClick={reset}
              className="pv-btn-secondary flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              New Autopsy
            </button>
          )}
        </div>
        <h1 className="text-5xl font-display font-bold mb-4">Pitch Deck Autopsy</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Our AI "Pathologist" scans your deck content for lethal weaknesses and cross-references them with historical failure patterns.
        </p>
      </div>

      {conversation.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pv-card p-10"
        >
          <form onSubmit={handleAutopsy} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Startup Industry</label>
                <select
                  className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                >
                  <option value="SaaS">SaaS</option>
                  <option value="FinTech">FinTech</option>
                  <option value="EdTech">EdTech</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Web3">Web3/Crypto</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest block">Upload Pitch Deck (.pptx)</label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  parsing ? "border-accent bg-accent/5 animate-pulse" : "border-border group-hover:border-accent/50 group-hover:bg-surface-2"
                )}>
                  {parsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-accent animate-spin" />
                      <div className="text-accent font-bold uppercase tracking-widest text-xs">Extracting Text from Slides...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <FileUp className="w-6 h-6 text-text-secondary group-hover:text-accent" />
                      </div>
                      <div className="text-sm text-text-secondary">
                        <span className="text-accent font-bold">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">PowerPoint (.pptx) only</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Deck Content / Problem Statement</label>
              <textarea
                required
                placeholder="Paste the text from your pitch deck here. Include your Problem, Solution, Market Size, and Monetization slides..."
                rows={10}
                className="w-full bg-surface-2 border border-border rounded-lg p-4 focus:outline-none focus:border-accent font-mono text-sm leading-relaxed"
                value={deckContent}
                onChange={e => setDeckContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red hover:bg-red-700 text-white font-bold py-5 rounded-lg text-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  PERFORMING AUTOPSY...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  Begin Autopsy
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {conversation.map((msg, idx) => (
            <div key={idx} className="space-y-10">
              {msg.fullResult && idx === conversation.length - 1 && (
                <>
                  {/* Risk Level Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={clsx(
                      "md:col-span-1 pv-card p-8 flex flex-col items-center justify-center text-center border-l-8",
                      msg.fullResult.overallRisk === 'Lethal' ? "border-l-red bg-red/5" : "border-l-warning bg-warning/5"
                    )}>
                      <div className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Overall Risk</div>
                      <div className={clsx(
                        "text-5xl font-data font-bold mb-2",
                        msg.fullResult.overallRisk === 'Lethal' ? "text-red" : "text-warning"
                      )}>{msg.fullResult.overallRisk}</div>
                      <div className="flex items-center gap-2 text-text-secondary text-xs uppercase font-bold tracking-widest">
                        <ShieldAlert className="w-4 h-4" />
                        Diagnostic Grade
                      </div>
                    </div>

                    <div className="md:col-span-2 pv-card p-8 bg-accent/5 border-accent/20">
                      <div className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Pathologist's Verdict
                      </div>
                      <p className="text-lg text-text-primary leading-relaxed italic">
                        "{msg.fullResult.pathologistVerdict}"
                      </p>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="pv-card p-10">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <FileText className="text-accent w-7 h-7" />
                      Executive Summary
                    </h3>
                    <p className="text-text-primary leading-relaxed">{msg.fullResult.executiveSummary}</p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="pv-card p-8">
                      <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-success">
                        <CheckCircle2 className="w-6 h-6" />
                        Strengths
                      </h3>
                      <div className="space-y-4">
                        {msg.fullResult.strengths?.map((strength, i) => (
                          <div key={i} className="p-4 rounded-lg bg-surface-2 border border-border/50">
                            <div className="font-semibold text-text-primary mb-1">{strength.title}</div>
                            <div className="text-sm text-text-secondary">{strength.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pv-card p-8">
                      <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-danger">
                        <AlertTriangle className="w-6 h-6" />
                        Weaknesses
                      </h3>
                      <div className="space-y-4">
                        {msg.fullResult.weaknesses?.map((weakness, i) => (
                          <div key={i} className="p-4 rounded-lg bg-surface-2 border border-border/50">
                            <div className="font-semibold text-text-primary mb-1">{weakness.title}</div>
                            <div className="text-sm text-text-secondary">{weakness.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Risk Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { title: 'Market Risks', data: msg.fullResult.marketRisks, icon: <Target className="w-6 h-6" /> },
                      { title: 'Product Risks', data: msg.fullResult.productRisks, icon: <AlertTriangle className="w-6 h-6" /> },
                      { title: 'GTM Risks', data: msg.fullResult.gtmRisks, icon: <Search className="w-6 h-6" /> },
                      { title: 'Financial Risks', data: msg.fullResult.financialRisks, icon: <Activity className="w-6 h-6" /> }
                    ].map((category, i) => (
                      <div key={i} className="pv-card p-8">
                        <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-accent">
                          {category.icon}
                          {category.title}
                        </h3>
                        <div className="space-y-4">
                          {category.data?.map((risk, j) => (
                            <div key={j} className="p-4 rounded-lg bg-surface-2 border border-border/50">
                              <div className="font-semibold text-text-primary mb-1">{risk.title}</div>
                              <div className="text-sm text-text-secondary">{risk.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PMF Analysis */}
                  <div className="pv-card p-10 bg-surface/50">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <Target className="text-success w-7 h-7" />
                      Product-Market Fit Analysis
                    </h3>
                    <p className="text-text-primary leading-relaxed">{msg.fullResult.pmfAnalysis}</p>
                  </div>

                  {/* Investor Concerns */}
                  <div className="pv-card p-10">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <ShieldAlert className="text-danger w-7 h-7" />
                      Investor Concerns
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {msg.fullResult.investorConcerns?.map((concern, i) => (
                        <div key={i} className="p-5 rounded-lg bg-danger/5 border border-danger/20">
                          <div className="font-semibold text-text-primary mb-2">{concern.title}</div>
                          <div className="text-sm text-text-secondary">{concern.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competitive Analysis */}
                  <div className="pv-card p-10">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <Activity className="text-accent w-7 h-7" />
                      Competitive Analysis
                    </h3>
                    <p className="text-text-primary leading-relaxed">{msg.fullResult.competitiveAnalysis}</p>
                  </div>

                  {/* Recommended Improvements */}
                  <div className="pv-card p-10">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <Lightbulb className="text-accent w-7 h-7" />
                      Recommended Improvements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {msg.fullResult.recommendedImprovements?.map((improvement, i) => (
                        <div key={i} className="p-5 rounded-lg bg-accent/5 border border-accent/20">
                          <div className="font-semibold text-text-primary mb-2">{improvement.title}</div>
                          <div className="text-sm text-text-secondary">{improvement.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div className="pv-card p-10 bg-surface/30">
                    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                      <Send className="text-success w-7 h-7" />
                      Action Plan
                    </h3>
                    <div className="space-y-6">
                      {msg.fullResult.actionPlan?.map((phase, i) => (
                        <div key={i} className="border-l-4 border-success pl-6">
                          <div className="font-semibold text-lg text-text-primary mb-3">{phase.phase}</div>
                          <ul className="list-disc list-inside space-y-2">
                            {phase.tasks.map((task, j) => (
                              <li key={j} className="text-text-secondary">{task}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lethal Weaknesses */}
                  <div className="pv-card p-10">
                    <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3 text-red">
                      <AlertTriangle className="w-8 h-8" />
                      Lethal Weaknesses Identified
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {msg.fullResult.lethalWeaknesses.map((weakness, i) => (
                        <div key={i} className="p-6 rounded-xl bg-surface-2 border border-border/50 hover:border-red/30 transition-all group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-bold text-red uppercase tracking-widest px-2 py-1 bg-red/10 rounded">{weakness.slide} Slide</div>
                          </div>
                          <div className="font-bold text-lg mb-3 text-text-primary group-hover:text-red transition-colors">{weakness.issue}</div>
                          <div className="text-sm text-text-secondary leading-relaxed border-t border-border/20 pt-4">
                            <span className="font-bold text-text-muted uppercase text-[10px] block mb-1">Historical Precedent</span>
                            {weakness.historicalPrecedent}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Structural Red Flags */}
                  <div className="glass-card p-10 bg-surface/30">
                    <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
                      <Target className="text-accent w-8 h-8" />
                      Structural Red Flags
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {msg.fullResult.structuralRedFlags.map((flag, i) => (
                        <div key={i} className="px-6 py-3 rounded-full bg-surface-2 border border-border text-text-secondary text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Follow-up Section */}
          <div className="pv-card p-8 border-accent/20 bg-surface/30">
            <h3 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
              <HelpCircle className="text-accent w-6 h-6" />
              Ask Follow-up Questions
            </h3>

            {/* Suggested Follow-up Chips */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase text-text-muted tracking-widest mb-3">Suggested</div>
              <div className="flex flex-wrap gap-2">
                {suggestedFollowUps.map((followUp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedFollowUp(followUp)}
                    className="px-4 py-2 border border-border rounded-lg bg-surface hover:border-accent/40 hover:bg-surface-2 transition-colors text-sm font-medium"
                  >
                    {followUp}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Input */}
            <form onSubmit={handleFollowUp} className="flex gap-3">
              <input
                type="text"
                placeholder="Ask a follow-up question..."
                className="flex-1 pv-field"
                value={followUpQuery}
                onChange={e => setFollowUpQuery(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !followUpQuery.trim()}
                className="pv-btn-primary disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default PitchDeckAutopsy;
