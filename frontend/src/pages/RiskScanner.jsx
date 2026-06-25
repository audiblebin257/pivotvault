import { clsx } from 'clsx';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Shuffle, Lightbulb, Sword, ShieldCheck, Target, RefreshCcw, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import PremiumRadarChart from '../components/PremiumRadarChart';
import ConversationPanel from '../components/ui/ConversationPanel';

const RiskScanner = () => {
  const [step, setStep] = React.useState('form'); // form | scanning | result
  const [formData, setFormData] = React.useState({
    idea: '',
    audience: '',
    revenueModel: 'Subscription',
    teamSize: '2',
    industry: 'SaaS'
  });
  const [conversation, setConversation] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [compLoading, setCompLoading] = React.useState(false);
  const [compResult, setCompResult] = React.useState(null);
  const [loadingText, setLoadingText] = React.useState('');
  const [simulating, setSimulating] = React.useState(null); 
  const [simulatedResult, setSimulatedResult] = React.useState(null);
  const [query, setQuery] = React.useState('');

  const loadingMessages = [
    "Scanning failure database...",
    "Analyzing market patterns...",
    "Comparing against 437 similar startups...",
    "Identifying high-risk categories...",
    "Generating preventative recommendations..."
  ];

  const handleScan = async (e) => {
    e.preventDefault();
    setStep('scanning');
    setLoading(true);
    let msgIdx = 0;
    const interval = setInterval(() => {
      setLoadingText(loadingMessages[msgIdx % loadingMessages.length]);
      msgIdx++;
    }, 800);

    try {
      const response = await api.post('/ai/risk-scan', formData);
      
      setConversation([
        {
          role: 'user',
          content: `Startup Idea: ${formData.idea}\nAudience: ${formData.audience}\nRevenue Model: ${formData.revenueModel}\nTeam Size: ${formData.teamSize}\nIndustry: ${formData.industry}`
        },
        {
          role: 'assistant',
          content: "Here's your risk assessment report.",
          fullResult: response.data
        }
      ]);

      setTimeout(() => {
        clearInterval(interval);
        setStep('result');
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setStep('form');
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    const newHistory = conversation.map(msg => ({ role: msg.role, content: msg.content }));

    try {
      const response = await api.post('/ai/risk-scan', { 
        ...formData,
        history: newHistory
      });

      setConversation(prev => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: "Here's your updated assessment.", fullResult: response.data }
      ]);
      setQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedFollowUp = (suggestedQuery) => {
    setQuery(suggestedQuery);
    handleFollowUp();
  };

  const handleSimulatePivot = (pivot, index) => {
    setSimulating(index);
    setTimeout(() => {
      const lastResult = conversation[conversation.length - 1]?.fullResult;
      if (!lastResult) return;
      const improvedScore = Math.max(20, lastResult.riskScore - 25);
      const improvedBreakdown = {
        ...lastResult.riskBreakdown,
        customerAcquisition: Math.max(15, lastResult.riskBreakdown.customerAcquisition - 30),
        retention: Math.max(10, lastResult.riskBreakdown.retention - 20)
      };
      setSimulatedResult({
        pivot,
        score: improvedScore,
        breakdown: improvedBreakdown
      });
      setSimulating(null);
    }, 2000);
  };

  const handleCompare = async () => {
    setCompLoading(true);
    try {
      const response = await api.post('/ai/compare-competitors', {
        idea: formData.idea,
        industry: formData.industry
      });
      setCompResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompLoading(false);
    }
  };

  const resetScan = () => {
    setStep('form');
    setConversation([]);
    setCompResult(null);
    setSimulatedResult(null);
    setQuery('');
  };

  const lastResult = conversation.length > 0 ? conversation[conversation.length - 1].fullResult : null;

  const radarData = lastResult ? [
    { subject: 'CAC', A: lastResult.riskBreakdown.customerAcquisition, fullMark: 100 },
    { subject: 'Retention', A: lastResult.riskBreakdown.retention, fullMark: 100 },
    { subject: 'Revenue', A: lastResult.riskBreakdown.monetization, fullMark: 100 },
    { subject: 'Market', A: lastResult.riskBreakdown.competition, fullMark: 100 },
    { subject: 'Timing', A: lastResult.riskBreakdown.timing, fullMark: 100 },
  ] : [];

  const currentScore = simulatedResult ? simulatedResult.score : lastResult?.riskScore;
  const currentBreakdown = simulatedResult && lastResult ? [
    { subject: 'CAC', A: simulatedResult.breakdown.customerAcquisition, fullMark: 100 },
    { subject: 'Retention', A: simulatedResult.breakdown.retention, fullMark: 100 },
    { subject: 'Revenue', A: lastResult.riskBreakdown.monetization, fullMark: 100 },
    { subject: 'Market', A: lastResult.riskBreakdown.competition, fullMark: 100 },
    { subject: 'Timing', A: lastResult.riskBreakdown.timing, fullMark: 100 },
  ] : radarData;

  const suggestedFollowUps = [
    "Explain deeper",
    "Show examples",
    "Compare startups",
    "Give recommendations",
    "Generate action plan"
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="pv-content-container py-12">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-8">
                <div className="text-xs font-bold uppercase text-text-muted tracking-[0.2em] mb-2">
                  Risk Assessment
                </div>
                <h1 className="text-4xl font-display font-bold text-text-primary mb-3">AI Risk Scanner</h1>
                <p className="text-text-secondary text-lg">Input your startup details to benchmark against historical failure patterns.</p>
              </div>

              <form onSubmit={handleScan} className="pv-card p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Startup Idea</label>
                  <textarea
                    required
                    placeholder="Describe your product and the core problem it solves..."
                    rows={4}
                    className="pv-field"
                    value={formData.idea}
                    onChange={e => setFormData({...formData, idea: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Target Audience</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Early stage founders"
                      className="pv-field"
                      value={formData.audience}
                      onChange={e => setFormData({...formData, audience: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Industry</label>
                    <div className="relative">
                      <select
                        className="pv-field pr-10 appearance-none cursor-pointer hover:border-border-strong hover:bg-surface-3 transition-colors"
                        value={formData.industry}
                        onChange={e => setFormData({...formData, industry: e.target.value})}
                      >
                        <option value="SaaS">SaaS</option>
                        <option value="FinTech">FinTech</option>
                        <option value="EdTech">EdTech</option>
                        <option value="Fitness">Fitness</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Healthcare">Healthcare</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Team Size</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 2"
                      className="pv-field"
                      value={formData.teamSize}
                      onChange={e => setFormData({...formData, teamSize: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="pv-btn-primary w-full justify-center text-lg"
                  >
                    Start Risk Assessment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-surface-3 border-t-accent rounded-full animate-spin" />
                <Zap className="absolute inset-0 m-auto w-8 h-8 text-accent animate-pulse" />
              </div>
              <h2 className="text-xl font-data text-accent mb-2">{loadingText}</h2>
              <p className="text-text-secondary text-sm">
                Comparing your idea against historical data...
              </p>
            </motion.div>
          )}

          {step === 'result' && lastResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Top Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted tracking-[0.2em] mb-1">
                    Assessment Complete
                  </div>
                  <h1 className="text-3xl font-display font-bold text-text-primary">Risk Analysis Report</h1>
                </div>
                <button
                  onClick={resetScan}
                  className="pv-btn-secondary flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  New Scan
                </button>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Card */}
                <div className="lg:col-span-1">
                  <div className="pv-card p-6 relative">
                    {simulatedResult && (
                      <div className="absolute top-4 right-4 bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Simulated Pivot
                      </div>
                    )}
                    <div className="text-xs font-bold uppercase text-text-muted tracking-widest mb-6">
                      Aggregate Risk
                    </div>
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-44 h-44">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                          <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-border" />
                          <circle 
                            cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent" 
                            strokeDasharray={502.65}
                            strokeDashoffset={502.65 * (1 - currentScore / 100)}
                            className={clsx(
                              'transition-all duration-1000',
                              currentScore > 70 ? 'text-danger' : currentScore > 40 ? 'text-accent' : 'text-success'
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-6xl font-data font-bold text-text-primary">{currentScore}</span>
                          <span className="text-xs font-bold uppercase text-text-muted tracking-wider mt-1">Risk Score</span>
                        </div>
                      </div>
                    </div>
                    <div className={clsx(
                      "flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider",
                      currentScore > 70 ? 'text-danger' : currentScore > 40 ? 'text-accent' : 'text-success'
                    )}>
                      {currentScore > 70 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      {currentScore > 70 ? 'HIGH RISK' : currentScore > 40 ? 'MODERATE RISK' : 'LOW RISK'}
                    </div>
                    {simulatedResult && (
                      <button 
                        onClick={() => setSimulatedResult(null)}
                        className="mt-4 w-full text-xs text-text-muted hover:text-accent underline font-bold tracking-widest"
                      >
                        Reset to Original
                      </button>
                    )}
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="lg:col-span-2">
                  <div className="pv-card p-6 h-full">
                    <div className="text-xs font-bold uppercase text-text-muted tracking-widest mb-4">
                      Risk Analysis Matrix
                    </div>
                    <div className="h-80">
                      <PremiumRadarChart data={currentBreakdown} isSimulated={!!simulatedResult} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="pv-card p-8">
                <h3 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-success w-6 h-6" />
                  Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lastResult.recommendations.map((rec, i) => (
                    <div key={i} className="border border-border rounded-lg p-5 bg-surface-2/30">
                      <div className="flex items-start gap-3">
                        <div className={clsx(
                          'shrink-0 w-2.5 h-2.5 rounded-full mt-1.5',
                          rec.priority === 'high' ? 'bg-danger' : 'bg-accent'
                        )} />
                        <div className="flex-1">
                          <div className="font-semibold text-text-primary mb-1">{rec.action}</div>
                          <div className="text-sm text-text-secondary leading-relaxed">{rec.rationale}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Battleground */}
              <div className="pv-card p-8 border-accent/20 bg-surface/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                      <Sword className="text-accent w-6 h-6" />
                      Market Battleground
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">Live web analysis of active competitors</p>
                  </div>
                  {!compResult && (
                    <button 
                      onClick={handleCompare}
                      disabled={compLoading}
                      className="pv-btn-primary disabled:opacity-50"
                    >
                      {compLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Target className="w-4 h-4 mr-2" />
                      )}
                      Compare Competitors
                    </button>
                  )}
                </div>

                {compLoading && (
                  <div className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                      <span className="text-sm font-data text-text-muted uppercase tracking-widest">
                        SCANNING LIVE WEB...
                      </span>
                    </div>
                  </div>
                )}

                {compResult && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {compResult.competitors.map((comp, i) => (
                        <div key={i} className="p-5 bg-surface border border-border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div className="font-semibold text-text-primary">{comp.name}</div>
                            <span className={clsx(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                              comp.threatLevel === 'high' ? "bg-danger text-white" : "bg-warning text-black"
                            )}>
                              {comp.threatLevel} threat
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary italic">"{comp.moat}"</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-surface-2 border border-border rounded-lg">
                        <h4 className="text-xs font-bold uppercase text-text-muted tracking-widest mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-success" />
                          Survival Strategy
                        </h4>
                        <p className="text-sm text-text-primary leading-relaxed">{compResult.survivalStrategy}</p>
                      </div>
                      <div className="p-6 bg-surface-2 border border-border rounded-lg">
                        <h4 className="text-xs font-bold uppercase text-text-muted tracking-widest mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-accent" />
                          Market Gap Analysis
                        </h4>
                        <p className="text-sm text-text-primary leading-relaxed">{compResult.gapAnalysis}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Pivots */}
              {lastResult.suggestedPivots && (
                <div className="pv-card p-8 border-accent/20 bg-surface/30">
                  <div className="mb-6">
                    <h3 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                      <Shuffle className="text-accent w-6 h-6" />
                      Strategic Pivots
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">Select a pivot to simulate its impact</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lastResult.suggestedPivots.map((pivot, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ y: -2 }}
                        className={clsx(
                          "p-6 border rounded-lg transition-all text-left relative overflow-hidden",
                          simulatedResult?.pivot === pivot 
                            ? "bg-success/5 border-success/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                            : "bg-surface border-border hover:border-accent/40"
                        )}
                        onClick={() => handleSimulatePivot(pivot, i)}
                      >
                        {simulating === i && (
                          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10 gap-2">
                            <Loader2 className="w-6 h-6 text-accent animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-accent">Simulating...</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className={clsx("w-5 h-5", simulatedResult?.pivot === pivot ? "text-success" : "text-accent")} />
                          <span className={clsx("text-xs font-bold uppercase tracking-widest", simulatedResult?.pivot === pivot ? "text-success" : "text-accent")}>{pivot.type}</span>
                        </div>
                        <div className="font-semibold text-text-primary mb-2">{pivot.description}</div>
                        <div className="text-sm text-text-secondary border-t border-border/20 pt-4 italic mt-3">
                          <span className="block text-[10px] font-bold uppercase text-text-muted tracking-widest not-italic mb-1">Historical Precedent</span>
                          "{pivot.historicalExample}"
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Panel */}
              <ConversationPanel
                conversation={conversation}
                query={query}
                setQuery={setQuery}
                loading={loading}
                onSend={handleFollowUp}
                suggestedFollowUps={suggestedFollowUps}
                onSuggestedFollowUp={handleSuggestedFollowUp}
                placeholder="Ask a follow-up question..."
                title="Continue Analysis"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RiskScanner;
