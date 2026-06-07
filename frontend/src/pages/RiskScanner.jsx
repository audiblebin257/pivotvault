import clsx from 'clsx';
import React from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle2, Share2, ArrowRight, Loader2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://pivotvault-production.up.railway.app';

const RiskScanner = () => {
  const [step, setStep] = React.useState('form'); // form | scanning | result
  const [formData, setFormData] = React.useState({
    idea: '',
    audience: '',
    revenueModel: 'Subscription',
    teamSize: '2',
    industry: 'SaaS'
  });
  const [result, setResult] = React.useState(null);
  const [loadingText, setLoadingText] = React.useState('');

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
    
    // Cycle messages
    let msgIdx = 0;
    const interval = setInterval(() => {
      setLoadingText(loadingMessages[msgIdx % loadingMessages.length]);
      msgIdx++;
    }, 800);

    try {
      const response = await axios.post(`${API_URL}/api/ai/risk-scan`, formData);
      setResult(response.data);
      // Wait at least 2.5s for "perceived intelligence"
      setTimeout(() => {
        clearInterval(interval);
        setStep('result');
      }, 3000);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setStep('form');
    }
  };

  const radarData = result ? [
    { subject: 'CAC', A: result.riskBreakdown.customerAcquisition, fullMark: 100 },
    { subject: 'Retention', A: result.riskBreakdown.retention, fullMark: 100 },
    { subject: 'Revenue', A: result.riskBreakdown.monetization, fullMark: 100 },
    { subject: 'Market', A: result.riskBreakdown.competition, fullMark: 100 },
    { subject: 'Timing', A: result.riskBreakdown.timing, fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-12">
              <Zap className="w-16 h-16 text-accent mx-auto mb-4" />
              <h1 className="text-5xl font-display font-bold mb-4">AI Risk Scanner</h1>
              <p className="text-text-secondary text-lg">Input your startup details to see how you stack up against historical failure patterns.</p>
            </div>

            <form onSubmit={handleScan} className="glass-card p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Startup Idea</label>
                <textarea
                  required
                  placeholder="Describe your product and the core problem it solves..."
                  rows={4}
                  className="w-full bg-surface-2 border border-border rounded-lg p-4 focus:outline-none focus:border-accent text-lg"
                  value={formData.idea}
                  onChange={e => setFormData({...formData, idea: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Target Audience</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Early stage founders in India"
                    className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
                    value={formData.audience}
                    onChange={e => setFormData({...formData, audience: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Industry</label>
                  <select
                    className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
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
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-5 rounded-lg text-xl transition-all shadow-lg flex items-center justify-center gap-3"
              >
                Start AI Risk Assessment
                <ArrowRight className="w-6 h-6" />
              </button>
            </form>
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-40"
          >
            <div className="relative mb-12">
              <div className="w-32 h-32 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <Zap className="absolute inset-0 m-auto w-12 h-12 text-accent animate-pulse" />
            </div>
            <h2 className="text-2xl font-data text-accent mb-2">{loadingText}</h2>
            <p className="text-text-secondary">
  Comparing your idea against 437 data points...
            </p>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center">
                <div className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Aggregate Risk</div>
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-border" />
                    <circle 
                      cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={2 * Math.PI * 88}
                      strokeDashoffset={2 * Math.PI * 88 * (1 - result.riskScore / 100)}
                      className={clsx(
                        'transition-all duration-1000',
                        result.riskScore > 70 ? 'text-red' : result.riskScore > 40 ? 'text-accent' : 'text-green'
                      )}
                    />
                  </svg>
                  <div className="text-6xl font-data font-bold">{result.riskScore}</div>
                </div>
                <div className="text-red font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {result.riskScore > 60 ? 'HIGH RISK' : 'MODERATE RISK'}
                </div>
              </div>

              <div className="md:col-span-2 glass-card p-8">
                <div className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-6 text-center">Risk Analysis Matrix</div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#1E293B" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <Radar name="Risk" dataKey="A" stroke="#F97316" fill="#F97316" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card p-10">
              <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
                <CheckCircle2 className="text-green w-8 h-8" />
                AI Recommendations
              </h3>
              <div className="space-y-6">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-6 p-4 rounded-lg hover:bg-surface-2 transition-colors border border-transparent hover:border-border">
                    <div className={clsx(
                      'shrink-0 w-3 h-3 rounded-full mt-1.5',
                      rec.priority === 'high' ? 'bg-red' : 'bg-accent'
                    )} />
                    <div>
                      <div className="font-bold text-lg mb-1">{rec.action}</div>
                      <div className="text-text-secondary text-sm leading-relaxed">{rec.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => setStep('form')}
                className="text-text-muted hover:text-white transition-colors"
              >
                ← Scan another idea
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskScanner;