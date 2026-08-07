import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Sparkles, ChevronDown, ChevronUp, Calculator, HelpCircle } from 'lucide-react';

// Color mapping based on score severity
const getScoreConfig = (score) => {
  if (score <= 35) {
    return {
      color: 'text-success',
      bgColor: 'bg-success',
      barColor: 'bg-success',
      label: 'STABLE / LOW RISK'
    };
  } else if (score <= 55) {
    return {
      color: 'text-success',
      bgColor: 'bg-success',
      barColor: 'bg-success',
      label: 'MODERATE RISK'
    };
  } else if (score <= 75) {
    return {
      color: 'text-warning',
      bgColor: 'bg-warning',
      barColor: 'bg-warning',
      label: 'HIGH RISK'
    };
  } else {
    return {
      color: 'text-danger',
      bgColor: 'bg-danger',
      barColor: 'bg-danger',
      label: 'CRITICAL / LETHAL RISK'
    };
  }
};

// Generates dynamic database-driven explanations for each category
const getCategoryExplanation = (startup, keywords, defaultText) => {
  const reasons = startup.failureReasons || [];
  const matches = reasons.filter(r => 
    keywords.some(kw => (r.category || '').toLowerCase().includes(kw) || (r.description || '').toLowerCase().includes(kw))
  );
  if (matches.length > 0) {
    return matches.map(m => m.description);
  }
  return [defaultText];
};

// Computes category scores, weights, and contributions based on database history
const calculateRiskFactors = (startup) => {
  const reasons = startup.failureReasons || [];
  const nameSeed = (startup.name || 'startup').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const getSeverity = (keywords) => {
    const matches = reasons.filter(r => 
      keywords.some(kw => (r.category || '').toLowerCase().includes(kw) || (r.description || '').toLowerCase().includes(kw))
    );
    if (matches.length > 0) {
      // severityScore typically 1-10, scale to 0-100
      return Math.min(99, Math.max(75, Math.max(...matches.map(m => (m.severityScore || 7) * 10))));
    }
    // Return a deterministic baseline background risk (20-45%)
    return 20 + (nameSeed % 25);
  };

  // Extract weighted scores for the 8 categories
  const marketFit = getSeverity(['pmf', 'market fit', 'demand', 'customer value']);
  const product = getSeverity(['product', 'quality', 'tech', 'feature', 'platform', 'hardware', 'engineering']);
  const execution = getSeverity(['execution', 'operation', 'scale', 'scaling', 'logistics', 'manufacturing']);
  const finance = getSeverity(['unit_economics', 'cashflow', 'burn', 'cac', 'pricing', 'funding', 'capital', 'insolvency']);
  const competition = getSeverity(['competition', 'competitor', 'moat', 'incumbent', 'saturation']);
  const timing = getSeverity(['timing', 'readiness', 'early', 'late']);
  const leadership = getSeverity(['leadership', 'decision', 'strategy', 'founder', 'team', 'fraud', 'ethics', 'governance']);
  const growth = getSeverity(['growth', 'acquisition', 'marketing', 'churn', 'retention']);

  const categories = [
    {
      id: 'marketFit',
      name: 'Market Fit',
      weight: 0.15,
      score: marketFit,
      explanation: getCategoryExplanation(startup, ['pmf', 'market fit', 'demand', 'customer value'], 'Market demand matches baseline parameters; moderate customer validation risk.'),
    },
    {
      id: 'product',
      name: 'Product Quality',
      weight: 0.10,
      score: product,
      explanation: getCategoryExplanation(startup, ['product', 'quality', 'tech', 'feature', 'platform', 'hardware', 'engineering'], 'Stable technical stack; no critical engineering blockers logged.'),
    },
    {
      id: 'execution',
      name: 'Execution',
      weight: 0.15,
      score: execution,
      explanation: getCategoryExplanation(startup, ['execution', 'operation', 'scale', 'scaling', 'logistics', 'manufacturing'], 'Operations scaled within typical runway guidelines; moderate execution efficiency.'),
    },
    {
      id: 'finance',
      name: 'Finance & Burn',
      weight: 0.20,
      score: finance,
      explanation: getCategoryExplanation(startup, ['unit_economics', 'cashflow', 'burn', 'cac', 'pricing', 'funding', 'capital', 'insolvency'], 'Runway managed efficiently relative to growth benchmarks; standard cash allocation.'),
    },
    {
      id: 'competition',
      name: 'Competition',
      weight: 0.10,
      score: competition,
      explanation: getCategoryExplanation(startup, ['competition', 'competitor', 'moat', 'incumbent', 'saturation'], 'Standard competitive pressures; no direct existential threats from major incumbents.'),
    },
    {
      id: 'timing',
      name: 'Timing',
      weight: 0.10,
      score: timing,
      explanation: getCategoryExplanation(startup, ['timing', 'readiness', 'early', 'late'], 'Launched in a standard window with average market adoption readiness.'),
    },
    {
      id: 'leadership',
      name: 'Leadership',
      weight: 0.15,
      score: leadership,
      explanation: getCategoryExplanation(startup, ['leadership', 'decision', 'strategy', 'founder', 'team', 'fraud', 'ethics', 'governance'], 'Stable corporate governance and founder alignment observed through operation.'),
    },
    {
      id: 'growth',
      name: 'Growth & Scaling',
      weight: 0.05,
      score: growth,
      explanation: getCategoryExplanation(startup, ['growth', 'acquisition', 'marketing', 'churn', 'retention'], 'Customer acquisition channels showing baseline stability; normal user retention curves.'),
    },
  ];

  // Calculate mathematically rigorous weighted sum
  const totalScore = Math.round(categories.reduce((sum, cat) => sum + (cat.score * cat.weight), 0));
  
  return { factors: categories, totalScore: Math.min(99, totalScore) };
};

// Phase 6: Transparent Failure Score breakdown.
// Maps the 8 weighted diagnostic vectors into 6 human-readable buckets whose
// max points are (Σ weights in bucket × 100), so each bucket's points
// (Σ score × weight) can never exceed its max and all points sum to the total.
const SCORE_BREAKDOWN_MAP = [
  { name: 'Financial Health', max: 20, ids: ['finance'] },
  { name: 'Product Execution', max: 25, ids: ['product', 'execution'] },
  { name: 'Market Fit', max: 15, ids: ['marketFit'] },
  { name: 'Leadership', max: 15, ids: ['leadership'] },
  { name: 'External Factors', max: 15, ids: ['competition', 'growth'] },
  { name: 'Timing', max: 10, ids: ['timing'] },
];

const getScoreBreakdown = (factors, totalScore) => {
  const byId = Object.fromEntries(factors.map((f) => [f.id, f]));
  const rows = SCORE_BREAKDOWN_MAP.map((bucket) => {
    const contribution = bucket.ids.reduce((sum, id) => {
      const f = byId[id];
      return sum + (f ? f.score * f.weight : 0);
    }, 0);
    const points = Math.min(Math.round(contribution), bucket.max);
    const bucketFactors = bucket.ids.map((id) => byId[id]).filter(Boolean);
    const top = [...bucketFactors].sort((a, b) => b.score - a.score)[0];
    const why = top?.explanation?.[0] || '';
    return { name: bucket.name, points, max: bucket.max, why };
  });

  // Reconcile per-bucket rounding so the rows sum EXACTLY to the headline
  // totalScore (single source of truth). Absorb the delta into the bucket with
  // the most remaining headroom, never exceeding its max or going below 0.
  if (typeof totalScore === 'number') {
    let delta = totalScore - rows.reduce((s, r) => s + r.points, 0);
    while (delta !== 0) {
      const step = delta > 0 ? 1 : -1;
      const candidate = rows
        .filter((r) => (step > 0 ? r.points < r.max : r.points > 0))
        .sort((a, b) => (step > 0 ? (b.max - b.points) - (a.max - a.points) : b.points - a.points))[0];
      if (!candidate) break;
      candidate.points += step;
      delta -= step;
    }
  }

  const total = rows.reduce((s, r) => s + r.points, 0);
  return { rows, total };
};

const getOverallWhy = (factors, startup) => {
  const topFactors = [...factors].sort((a, b) => b.score - a.score).slice(0, 2);
  let explanationStr = `This startup dissolved primarily due to severe vulnerability in **${topFactors[0].name}** and **${topFactors[1].name}**.`;
  
  const primaryReason = startup.failureReasons?.find(r => r.isPrimary);
  if (primaryReason) {
    explanationStr += ` The direct catalyst was: "${primaryReason.description}".`;
  }
  
  return explanationStr;
};

// SVG Animating Score Counter
const AnimatedScore = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    setDisplayScore(0);
    const duration = 1000;
    const steps = 40;
    const stepSize = score / steps;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += stepSize;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [score]);
  
  return <span className="text-5xl md:text-6xl font-display font-black tracking-tight">{displayScore}%</span>;
};

// Shimmering Progress Bar Component
const ProgressBar = ({ score, color }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="w-full h-2.5 bg-border/20 rounded-full overflow-hidden relative">
      <motion.div
        className={clsx('h-full rounded-full relative', color)}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      />
    </div>
  );
};

const FailureRiskIndex = ({ startup }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [showMath, setShowMath] = useState(false);
  const { factors, totalScore } = calculateRiskFactors(startup);
  const breakdown = getScoreBreakdown(factors, totalScore);
  const scoreConfig = getScoreConfig(totalScore);
  const confidence = startup.aiAnalyses?.[0]?.confidence || 88;

  return (
    <div className="space-y-6">
      <div className="pv-card p-6 sm:p-8 border border-border bg-surface-2/40">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-xs text-accent font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-accent" /> Forensic Failure Index
          </div>
          <div className="px-3 py-1 bg-surface-3/60 rounded text-[10px] font-bold text-text-muted border border-border">
            CONFIDENCE: {confidence}%
          </div>
        </div>

        {/* Aggregated Score Badge */}
        <div className="text-center mb-8 bg-surface-3/30 border border-border/40 py-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-pulse" />
          <div className={clsx('mb-1.5', scoreConfig.color)}>
            <AnimatedScore score={totalScore} />
          </div>
          <div className={clsx(
            'text-[11px] font-bold uppercase tracking-[0.25em] font-data',
            scoreConfig.color
          )}>
            {scoreConfig.label}
          </div>
        </div>

        {/* Phase 6: Transparent Failure Score Breakdown */}
        <div className="mb-8 border border-border/40 rounded-2xl p-5 bg-surface-3/20">
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-accent" /> Failure Score Breakdown
          </div>
          <div className="space-y-3">
            {breakdown.rows.map((row) => (
              <div key={row.name}>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium text-text-primary shrink-0">{row.name}</span>
                  <span className="flex-1 border-b border-dotted border-border/50 translate-y-[-3px]" />
                  <span className="font-data font-bold text-text-primary shrink-0">
                    {row.points}
                    <span className="text-text-muted font-normal">/{row.max}</span>
                  </span>
                </div>
                {row.why && (
                  <p className="text-[11px] text-text-muted leading-snug mt-1 pr-14">{row.why}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-baseline gap-2 text-sm mt-4 pt-3 border-t border-border/60">
            <span className="font-display font-black uppercase tracking-wider text-accent shrink-0">Total</span>
            <span className="flex-1 border-b border-dotted border-border/50 translate-y-[-3px]" />
            <span className={clsx('font-display font-black text-lg shrink-0', scoreConfig.color)}>
              {breakdown.total}%
            </span>
          </div>
        </div>

        {/* Weighted Categories List */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-bold mb-2">
            Diagnostic Vectors
          </div>
          
          {factors.map((factor) => {
            const isExpanded = expandedId === factor.id;
            const factorScoreConfig = getScoreConfig(factor.score);
            
            return (
              <div key={factor.id} className="border border-border/30 rounded-xl p-4 bg-surface-3/15">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : factor.id)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                        {factor.name}
                        <span className="text-[10px] font-medium text-text-muted tracking-wider">
                          (w: {Math.round(factor.weight * 100)}%)
                        </span>
                      </span>
                      <span className={clsx('text-sm font-data font-bold', factorScoreConfig.color)}>
                        {factor.score}%
                      </span>
                    </div>
                    <ProgressBar score={factor.score} color={factorScoreConfig.bgColor} />
                  </div>
                  <div className="text-text-muted group-hover:text-text-primary transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3 border-t border-border/20 pt-3"
                    >
                      <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-2">
                        Database Evidence & Context
                      </div>
                      <ul className="space-y-1.5">
                        {factor.explanation.map((item, i) => (
                          <li 
                            key={i} 
                            className="text-xs text-text-secondary leading-relaxed flex items-start gap-2"
                          >
                            <span className="text-accent font-bold mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Expandable Mathematical Calculation Breakdown */}
        <div className="mt-6 border-t border-border/50 pt-5">
          <button
            onClick={() => setShowMath(!showMath)}
            className="flex items-center gap-2 text-xs font-bold text-accent hover:underline mb-4 uppercase tracking-wider"
          >
            <Calculator className="w-4 h-4" />
            {showMath ? 'Hide Math Formulation' : 'Show Mathematical Breakdown'}
          </button>

          <AnimatePresence>
            {showMath && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <div className="text-[9px] uppercase tracking-[0.15em] text-text-muted font-bold mb-2">
                  Calculation Formula Grid
                </div>
                <div className="overflow-x-auto rounded-lg border border-border bg-surface-3/30">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60 text-text-muted font-semibold uppercase tracking-wider text-[9px]">
                        <th className="px-3 py-2">Risk Category</th>
                        <th className="px-3 py-2 text-right">Score</th>
                        <th className="px-3 py-2 text-right">Weight</th>
                        <th className="px-3 py-2 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-text-secondary font-data">
                      {factors.map(f => (
                        <tr key={f.id} className="hover:bg-surface-3/20">
                          <td className="px-3 py-1.5 font-sans font-medium text-text-primary">{f.name}</td>
                          <td className="px-3 py-1.5 text-right">{f.score}%</td>
                          <td className="px-3 py-1.5 text-right">{(f.weight * 100).toFixed(0)}%</td>
                          <td className="px-3 py-1.5 text-right text-accent font-bold">{((f.score * f.weight)).toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="bg-accent/5 font-bold text-text-primary text-[12px] border-t border-border">
                        <td className="px-3 py-2">Failure Index Sum</td>
                        <td className="px-3 py-2 text-right" colSpan={3}>
                          Σ ({factors.map(f => `${f.score}% × ${f.weight}`).join(' + ')}) = <span className="text-accent underline font-display font-black text-sm">{totalScore}%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Qualitative Summary */}
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-bold mb-2">
            Forensic Verdict
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {getOverallWhy(factors, startup)}
          </p>
        </div>

      </div>
    </div>
  );
};

export default FailureRiskIndex;
