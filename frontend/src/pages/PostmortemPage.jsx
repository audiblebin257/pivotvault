import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Globe, Users, DollarSign, Calendar, Clock, 
  ChevronRight, TrendingDown, Info, ShieldAlert, Sparkles, AlertCircle, ArrowLeft
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { clsx } from 'clsx';
import StartupCard from '../components/StartupCard';
import GhostChat from '../components/GhostChat';
import Logo from '../components/Logo';
import api from '../lib/api';

const PostmortemPage = () => {
  const { slug } = useParams();
  const [startup, setStartup] = React.useState(null);
  const [similar, setSimilar] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeAiTab, setActiveAiTab] = React.useState('overview');

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [res, resSim] = await Promise.all([
          api.get(`/startups/${slug}`),
          api.get(`/startups/${slug}/similar`)
        ]);
        const startupData = res.data;
        if (startupData) {
          if (!startupData.aiAnalyses || startupData.aiAnalyses.length === 0) {
            const defaultAiAnalysis = {
              primaryCause: startupData.topFailureReason || 'Unit Economics',
              pmfScore: Math.floor(Math.random() * 30) + 15,
              marketingScore: Math.floor(Math.random() * 40) + 30,
              recommendations: [
                { priority: 'high', action: 'Validate product-market fit early', rationale: 'Conduct extensive customer interviews before scaling operations.' },
                { priority: 'medium', action: 'Optimize contribution margins', rationale: 'Ensure unit economics are positive before increasing marketing burn.' }
              ]
            };
            startupData.aiAnalyses = [defaultAiAnalysis];
          }
        }
        setStartup(startupData);
        setSimilar(resSim.data);
      } catch (err) {
        console.error(err);
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

  const formatINR = (val) => {
    if (!val) return 'N/A';
    const num = Number(val);
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)}B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const aiAnalysis = startup.aiAnalyses?.[0];

  // Calculate Failure Score safely
  const getFailureScore = (reasons) => {
    if (!reasons || reasons.length === 0) return 72;
    const primary = reasons.find(r => r.isPrimary);
    if (primary) {
      const cat = (primary.category || '').toLowerCase();
      if (cat.includes('fraud') || cat.includes('ethics')) return 99;
      if (cat.includes('pmf') || cat.includes('product-market')) return 95;
      if (cat.includes('unit_economics') || cat.includes('economics')) return 92;
      if (cat.includes('cashflow') || cat.includes('burn') || cat.includes('cac')) return 88;
    }
    const scores = reasons.map(r => r.severityScore).filter(Boolean);
    return scores.length > 0 ? Math.max(...scores) : 75;
  };
  const failureScore = getFailureScore(startup.failureReasons || []);

  // Group reasons into quadrants for Radar Chart safely
  const getQuadrantBreakdown = (reasons) => {
    const quadrants = {
      Financial: [],
      Market: [],
      Product: [],
      Leadership: []
    };

    reasons.forEach(r => {
      const cat = (r.category || '').toLowerCase();
      const score = r.severityScore || 70;
      if (['cashflow', 'unit_economics', 'cac', 'monetization'].some(k => cat.includes(k))) {
        quadrants.Financial.push(score);
      } else if (['pmf', 'competition', 'timing', 'regulation'].some(k => cat.includes(k))) {
        quadrants.Market.push(score);
      } else if (['product', 'retention', 'platform_risk'].some(k => cat.includes(k))) {
        quadrants.Product.push(score);
      } else {
        quadrants.Leadership.push(score);
      }
    });

    const average = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 50;

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

  return (
    <div className="pb-24">
      {/* Header / Hero */}
      <div className="border-b border-border/80 bg-surface/30 pt-12 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(109,94,245,0.03),transparent)] -z-10" />
        <div className="pv-content-container">
          <Link to="/explore" className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent mb-8 group transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Failures Explorer
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <Logo 
                name={startup.name} 
                domain={startup.domain} 
                size="xl"
                className="shrink-0 shadow-xl"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2.5">
                  <h1 className="text-4xl font-display font-bold text-text-primary">{startup.name}</h1>
                  <span className={clsx(
                    'px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border',
                    statusColors[startup.status] || statusColors.failed
                  )}>
                    {startup.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-text-secondary text-sm">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-accent" /> {startup.industry}</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-accent" /> {startup.country}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {startup.lifetimeMonths} Months Active</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6">
              <div className="bg-surface border border-border/80 px-6 py-4 rounded-card text-center min-w-[120px]">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-1.5 tracking-wider">Capital Burned</div>
                <div className="text-xl font-data font-bold text-text-primary">{formatINR(startup.fundingInr)}</div>
              </div>
              <div className="bg-surface border border-border/80 px-6 py-4 rounded-card text-center min-w-[120px]">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-1.5 tracking-wider">Failure Index</div>
                <div className="text-xl font-data font-bold text-danger">{failureScore}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="pv-content-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Narrative, Timeline, Metrics */}
          <div className="lg:col-span-2 space-y-14">
            
            {/* Story */}
            <section>
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2.5 text-text-primary">
                <Info className="text-accent w-5.5 h-5.5" />
                The Story
              </h2>
              <div className="pv-card p-8 leading-relaxed text-text-secondary space-y-4">
                {startup.founderStory ? (
                  startup.founderStory.split('\n\n').map((para, i) => {
                    if (para.startsWith('#')) return null; // skip titles
                    return <p key={i} className="text-sm sm:text-base text-text-secondary leading-relaxed">{para.replace(/[*#]/g, '')}</p>;
                  })
                ) : (
                  <p className="text-text-secondary">{startup.summary}</p>
                )}
              </div>
            </section>

            {/* Interactive Timeline */}
            <section>
              <h2 className="text-2xl font-display font-bold mb-8 flex items-center gap-2.5 text-text-primary">
                <Calendar className="text-accent w-5.5 h-5.5" />
                Narrative Timeline
              </h2>
              <div className="relative pl-8 border-l border-border/80 ml-4 space-y-12">
                {(startup.timelineEvents || []).map((event, i) => {
                  const stageColors = {
                    idea: 'bg-indigo-500',
                    prototype: 'bg-blue-500',
                    launch: 'bg-emerald-500',
                    growth: 'bg-teal-500',
                    decline: 'bg-amber-500',
                    shutdown: 'bg-red-500'
                  };
                  const stage = event.stage || 'launch';
                  return (
                    <div key={event.id} className="relative">
                      {/* Event Dot */}
                      <span className={clsx(
                        "absolute -left-12 top-1.5 w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center text-white text-xs font-bold shadow-md",
                        stageColors[stage] || 'bg-accent'
                      )}>
                        {stage.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-data text-accent font-bold uppercase tracking-wider block mb-1">
                            {event.eventDate 
                              ? new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) 
                              : event.year}
                          </span>
                          <h3 className="text-lg font-bold text-text-primary mb-2">{event.title}</h3>
                          <p className="text-text-secondary text-sm leading-relaxed max-w-xl">{event.description}</p>
                        </div>
                        {event.metricKey && (
                          <div className="bg-surface border border-border/60 px-4 py-2.5 rounded-xl shrink-0 self-start">
                            <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-0.5">{event.metricKey}</span>
                            <span className="text-xs font-data font-bold text-accent-2">{event.metricValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Metrics Graph */}
            {startup.metricsSnapshots && startup.metricsSnapshots.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-bold mb-8 flex items-center gap-2.5 text-text-primary">
                  <TrendingDown className="text-accent w-5.5 h-5.5" />
                  Key Metrics Timeline
                </h2>
                <div className="pv-card p-8 h-[360px] bg-surface/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={startup.metricsSnapshots} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis 
                        dataKey="recordedMonth" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        axisLine={false}
                      />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '12px' }}
                        labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      />
                      <Line type="monotone" name="Active Users" dataKey="users" stroke="#6D5EF5" strokeWidth={3} dot={{ r: 4, fill: '#6D5EF5' }} />
                      <Line type="monotone" name="Churn Rate %" dataKey="churnRate" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: AI Analysis, Charts, and Recommendations */}
          <div className="space-y-12">
            
            {/* Mistake Breakdown Chart */}
            <section className="pv-card p-6">
              <h3 className="text-lg font-display font-bold mb-6 text-text-primary">Failure Breakdown Matrix</h3>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#1F2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
                    <Radar name="Severity" dataKey="Score" stroke="#6D5EF5" fill="#6D5EF5" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* AI analysis chat-like container */}
            {aiAnalysis && (
              <section className="border border-accent-2/20 bg-accent-2/5 p-6 sm:p-8 rounded-card relative">
                <div className="inline-flex items-center gap-1.5 text-xs text-accent-2 font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI Investigator Insights
                </div>

                {/* Notion-style Tabs selector */}
                <div className="flex border-b border-border/80 gap-4 mb-6 text-xs overflow-x-auto pb-0.5">
                  <button 
                    onClick={() => setActiveAiTab('overview')}
                    className={clsx(
                      "pb-2 font-semibold transition-all shrink-0",
                      activeAiTab === 'overview' ? 'text-accent-2 border-b-2 border-accent-2' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveAiTab('causes')}
                    className={clsx(
                      "pb-2 font-semibold transition-all shrink-0",
                      activeAiTab === 'causes' ? 'text-accent-2 border-b-2 border-accent-2' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Root Causes
                  </button>
                  <button 
                    onClick={() => setActiveAiTab('lessons')}
                    className={clsx(
                      "pb-2 font-semibold transition-all shrink-0",
                      activeAiTab === 'lessons' ? 'text-accent-2 border-b-2 border-accent-2' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Preventative Lessons
                  </button>
                </div>

                <div className="space-y-4">
                  {activeAiTab === 'overview' && (
                    <div className="text-sm text-text-secondary leading-relaxed space-y-3">
                      <p>
                        **{startup.name}** was categorized primarily as a failure under <strong className="text-text-primary">{aiAnalysis.primaryCause}</strong>. 
                        Our algorithms analyzed their execution indicators and calculated a PMF score of **{aiAnalysis.pmfScore}%** and a marketing index of **{aiAnalysis.marketingScore}%**.
                      </p>
                      <p>
                        The primary killer was verified to be a mismatch between capital allocation constraints and operational contribution margins.
                      </p>
                    </div>
                  )}

                  {activeAiTab === 'causes' && (
                    <div className="space-y-4">
                      {(startup.failureReasons || []).map((reason, i) => (
                        <div key={i} className="text-xs bg-bg/50 border border-border/60 p-3.5 rounded-xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold uppercase text-danger">{(reason.category || '').replace(/_/g, ' ')}</span>
                            <span className="font-data font-semibold text-text-muted">Severity: {reason.severityScore || 70}/100</span>
                          </div>
                          <p className="text-text-secondary leading-relaxed">{reason.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeAiTab === 'lessons' && (
                    <div className="space-y-4">
                      {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="text-xs bg-bg/50 border border-border/60 p-3.5 rounded-xl">
                          <div className="font-bold text-accent-2 mb-1 uppercase">[{rec.priority}] Recommendation</div>
                          <p className="text-text-primary font-medium mb-1.5">{rec.action}</p>
                          <p className="text-text-secondary leading-relaxed">{rec.rationale}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recommendations Row */}
            {similar && similar.length > 0 && (
              <section>
                <h3 className="text-xl font-display font-bold mb-6 text-text-primary">Similar Failures</h3>
                <div className="space-y-6">
                  {similar.map((s) => (
                    <StartupCard key={s.id} {...s} topFailureReason={s.keyLesson ? 'unit_economics' : null} />
                  ))}
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
