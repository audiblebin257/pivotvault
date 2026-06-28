import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull, Search, Zap, BarChart2, MessageSquare, Sparkles,
  ArrowRight, ShieldAlert, Check, HelpCircle, Sliders, Database, Brain, Ghost, AlertTriangle
} from 'lucide-react';
import api from '../lib/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explorer');

  // Scanner Simulator State
  const [industry, setIndustry] = useState('Grocery & Delivery');
  const [funding, setFunding] = useState('Series A');
  const [burn, setBurn] = useState('High');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleSimulateScan = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      let score = 55;
      let warning = "Moderate operational risk detected.";
      if (industry === 'Grocery & Delivery' && burn === 'High') {
        score = 87;
        warning = "Critical failure warning: unsustainable logistics CAC margins & cash burn rates.";
      } else if (industry === 'FinTech') {
        score = 74;
        warning = "High regulatory friction and high market penetration risk.";
      } else if (burn === 'High') {
        score = 81;
        warning = "High risk: burn rate exceeds standard safe runway metrics by 1.8x.";
      } else if (industry === 'SaaS') {
        score = 38;
        warning = "Low structural risk. Focus on product value validation.";
      }
      setScanResult({ score, warning });
    }, 1000);
  };

  // Autoscroll Ticker Data
  const tickerCards = [
    { name: 'Juicero', category: 'Unit Economics', raised: '₹10.3Cr', status: 'Failed' },
    { name: 'Theranos', category: 'Product / Fraud', raised: '₹70.0Cr', status: 'Failed' },
    { name: 'WeWork', category: 'Cash Burn', raised: '₹90.0Cr', status: 'Failed' },
    { name: 'Quibi', category: 'No PMF', raised: '₹14.0Cr', status: 'Failed' },
    { name: 'Webvan', category: 'Unit Economics', raised: '₹60.0Cr', status: 'Failed' },
    { name: 'MoviePass', category: 'Unit Economics', raised: '₹65.0Cr', status: 'Failed' },
    { name: 'Fast', category: 'Premature Scaling', raised: '₹10.2Cr', status: 'Failed' },
    { name: 'Vine', category: 'Incumbent Competition', raised: 'Undisclosed', status: 'Failed' },
  ];

  // Features Data
  const features = [
    {
      title: 'Postmortem Case Studies',
      desc: 'Access our catalog of over 4,200 indexed postmortems covering funding, launch, decline, and shutdown vectors.',
      badge: 'Free',
      icon: Database
    },
    {
      title: 'AI Investigator Chat',
      desc: 'Summon historical founder ghosts using advanced language models to chat directly about what went wrong.',
      badge: 'Operator',
      icon: Ghost
    },
    {
      title: 'Risk Scanner Simulator',
      desc: 'Input your business model, pricing structure, and burn rates to scan for fatal failure patterns.',
      badge: 'Operator',
      icon: Zap
    },
    {
      title: 'Pitch Deck Autopsy',
      desc: 'Submit your deck slides to check for TAM inflation, feature overload, and unsustainable GTM assumptions.',
      badge: 'Vault',
      icon: AlertTriangle
    },
    {
      title: 'Competitor Benchmarks',
      desc: 'Compare key scaling metrics directly against matching historical cases to detect warning signals.',
      badge: 'Operator',
      icon: BarChart2
    },
    {
      title: 'Risk API & Custom Models',
      desc: 'Export structured postmortem data and integrate live risk scanning APIs directly into your custom pipelines.',
      badge: 'Vault',
      icon: Sparkles
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      initials: 'SR',
      name: 'Siddharth Rao',
      role: 'Hardware Founder',
      quote: 'This tool saved us from spending $1.2M on a hardware concept with unscalable unit economics. A must-use.'
    },
    {
      initials: 'AL',
      name: 'Aishwarya Lakshmi',
      role: 'FinTech CEO',
      quote: 'We ran our deck through the Pitch Deck Autopsy. The red flags it raised helped us pivot before raising our Seed.'
    },
    {
      initials: 'MB',
      name: 'Marcus Butler',
      role: 'General Partner',
      quote: 'PivotVault is the best warning system for premature scaling. Obsessive focus on core failure vectors.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-bg text-text-primary overflow-x-hidden font-sans selection:bg-accent selection:text-accent-contrast">
      
      {/* Background Gradients & Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--color-border),0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--color-border),0.12)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(var(--color-accent),0.06),transparent_60%)] pointer-events-none -z-10" />

      {/* Inline Styles for Ticker */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Skull className="w-6 h-6 text-accent" />
            <span className="font-display font-extrabold tracking-tight text-text-primary text-lg">PivotVault</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#demo" className="hover:text-text-primary transition-colors">Demo</a>
            <Link to="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
            <Link to="/confessions" className="hover:text-text-primary transition-colors">Confessions</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 border border-border hover:border-border-strong text-text-primary font-bold text-sm rounded-button transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="pv-btn-primary text-sm py-2 px-5 h-auto rounded-button font-bold transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="demo" className="py-24 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-surface-2/60 text-xs font-data font-bold text-accent tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              4,200+ postmortems indexed
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-display font-extrabold tracking-tight leading-[1.08] text-text-primary">
              Learn from <span className="text-accent">failure</span> before writing code.
            </h1>
            
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-lg">
              PivotVault decrypts historical startup postmortems, indexes growth hurdles, and scans business models to stress-test your unit economics.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/explore" className="pv-btn-primary px-8 py-3.5 h-auto font-bold text-sm rounded-button">
                Start Exploring
              </Link>
              <a href="#features" className="px-8 py-3.5 border border-border hover:border-border-strong bg-transparent text-text-primary font-bold text-sm rounded-button transition-colors">
                View Features
              </a>
            </div>

            {/* Divider & Stat Row */}
            <div className="h-px bg-border my-8" />
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="font-data text-2xl sm:text-3xl font-bold text-text-primary">4,200+</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Postmortems</div>
              </div>
              <div>
                <div className="font-data text-2xl sm:text-3xl font-bold text-accent">₹145Cr+</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Capital Lost</div>
              </div>
              <div>
                <div className="font-data text-2xl sm:text-3xl font-bold text-accent-2">450+</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">AI Scan Patterns</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Browser-Style Demo */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-[12px] overflow-hidden shadow-card">
              
              {/* Fake Browser Toolbar */}
              <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between gap-4">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-danger/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 max-w-sm bg-bg border border-border rounded-md px-3 py-1 text-xs font-data text-text-muted text-center truncate">
                  pivotvault.com/intel/interactive-dashboard
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Demo Tabs */}
              <div className="flex border-b border-border bg-surface-2/30">
                {['explorer', 'scanner', 'heatmap'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase border-r border-border last:border-r-0 transition-colors ${
                      activeTab === tab ? 'bg-bg text-accent' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab === 'explorer' && 'Failure Explorer'}
                    {tab === 'scanner' && 'Risk Scanner'}
                    {tab === 'heatmap' && 'Sector Map'}
                  </button>
                ))}
              </div>

              {/* Interactive Dashboard Content */}
              <div className="p-6 bg-bg/95 min-h-[300px] flex flex-col justify-between">
                
                {/* 1. Explorer Tab */}
                {activeTab === 'explorer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      <span>Startup</span>
                      <span>Category</span>
                      <span>Status</span>
                    </div>
                    {[
                      { name: 'Juicero', industry: 'Consumer Hardware', reason: 'Unit Economics', status: 'Failed' },
                      { name: 'WeWork', industry: 'Real Estate', reason: 'Cash Burn', status: 'Failed' },
                      { name: 'Theranos', industry: 'Health Tech', reason: 'Product Fraud', status: 'Failed' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <span className="font-bold text-text-primary">{item.name}</span>
                        </div>
                        <span className="text-text-secondary text-xs">{item.industry} — <strong className="text-accent-2 font-normal">{item.reason}</strong></span>
                        <span className="text-xs font-data font-bold uppercase px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20">{item.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Scanner Tab */}
                {activeTab === 'scanner' && (
                  <div className="space-y-4">
                    {!scanResult ? (
                      <form onSubmit={handleSimulateScan} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">Sector</label>
                            <select
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              className="w-full bg-surface-2 border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none"
                            >
                              <option value="Grocery & Delivery">Grocery & Delivery</option>
                              <option value="FinTech">FinTech</option>
                              <option value="SaaS">SaaS / B2B</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">Burn Rate</label>
                            <select
                              value={burn}
                              onChange={(e) => setBurn(e.target.value)}
                              className="w-full bg-surface-2 border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none"
                            >
                              <option value="Low">Low</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isScanning}
                          className="w-full py-2.5 bg-accent text-accent-contrast font-bold text-sm rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:bg-accent-2"
                        >
                          {isScanning ? 'Analyzing Growth Hurdles...' : 'Scan Business Model'}
                        </button>
                      </form>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="text-sm font-semibold text-text-secondary uppercase">Risk Assessment</span>
                          <button onClick={() => setScanResult(null)} className="text-xs text-accent font-semibold hover:underline uppercase tracking-wider">
                            Reset Scanner
                          </button>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-18 h-18 rounded-full border-4 border-border flex items-center justify-center shrink-0">
                            <span className="font-data text-xl font-bold text-accent">{scanResult.score}%</span>
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${scanResult.score > 70 ? 'text-danger' : 'text-success'}`}>
                              {scanResult.score > 70 ? '⚠️ High Structural Risk' : '✅ Low/Moderate Risk'}
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed mt-1">{scanResult.warning}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 3. Heatmap Tab */}
                {activeTab === 'heatmap' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      <span>Sector</span>
                      <span>Failure Rate</span>
                    </div>
                    {[
                      { name: 'Grocery & Delivery', rate: 84, color: 'bg-danger' },
                      { name: 'FinTech', rate: 71, color: 'bg-warning' },
                      { name: 'Consumer Hardware', rate: 69, color: 'bg-warning/80' },
                      { name: 'SaaS / B2B', rate: 32, color: 'bg-success' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-text-primary">{item.name}</span>
                          <span className="font-data text-text-secondary">{item.rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulation Notice Footer */}
                <div className="text-[11px] font-data text-text-muted tracking-wide mt-4 border-t border-border pt-3">
                  // SIMULATION ENGINE v1.4.0 — LIVE INTEL FEED
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Social Proof Strip */}
      <section className="border-y border-border bg-surface-2/30 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <span className="text-xs font-data font-bold text-text-muted uppercase tracking-widest">
            Used by founders at
          </span>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-sm sm:text-base font-display font-semibold text-text-muted">
            <span className="hover:text-text-secondary transition-colors">Y Combinator</span>
            <span className="hover:text-text-secondary transition-colors">Techstars</span>
            <span className="hover:text-text-secondary transition-colors">Sequoia Capital</span>
            <span className="hover:text-text-secondary transition-colors">Vercel</span>
            <span className="hover:text-text-secondary transition-colors">Stripe</span>
          </div>
        </div>
      </section>

      {/* 4. Infinite Auto-Scrolling Ticker */}
      <section className="py-20 overflow-hidden relative border-b border-border">
        
        {/* Mask/Fade overlays for ticker */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

        <div className="animate-ticker gap-6">
          {/* Double array to create seamless loop */}
          {[...tickerCards, ...tickerCards].map((card, idx) => (
            <div
              key={idx}
              className="w-72 rounded-card border border-border bg-surface/50 p-6 shrink-0 flex flex-col justify-between h-40 hover:border-accent/30"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-text-primary text-base">{card.name}</h3>
                  <span className="text-xs font-data font-bold uppercase px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20">
                    {card.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{card.category}</p>
              </div>
              <div className="flex justify-between items-center text-xs font-data text-text-muted border-t border-border pt-2">
                <span>Raised</span>
                <span className="text-accent">{card.raised}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-28 px-4 max-w-6xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <span className="font-data text-sm text-accent tracking-[0.25em] font-semibold uppercase">
            FEATURES MATRIX
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-text-primary">
            Engineered to avoid failure.
          </h2>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Our platform provides full diagnostic capabilities built specifically to test growth logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-card border border-border bg-surface/50 p-8 flex flex-col justify-between h-80 transition-colors hover:bg-surface-2/40"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-data font-bold uppercase px-2.5 py-0.5 rounded border border-border bg-surface-2 text-text-muted">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">{feat.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Testimonials Grid */}
      <section className="py-28 border-t border-border bg-surface-2/10 px-4">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <span className="font-data text-sm text-accent tracking-[0.25em] font-semibold uppercase">
              FOUNDER TESTIMONIALS
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-text-primary">
              Trusted by operators.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-card border border-border bg-surface/50 p-8 flex flex-col justify-between"
              >
                <p className="text-sm sm:text-base text-text-secondary italic leading-relaxed mb-8">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent font-data">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">{t.name}</h4>
                    <span className="text-xs text-text-muted mt-0.5 block">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Centered CTA Section */}
      <section className="py-32 px-4 max-w-4xl mx-auto relative">
        
        {/* Glow effect behind heading */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="rounded-card border border-border bg-surface/50 p-12 sm:p-16 text-center space-y-10 backdrop-blur-[12px]">
          <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-text-primary leading-tight">
            Stress-test your idea before scaling.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Join 12,000+ founders receiving our weekly failure analytics report and diagnostic checkups.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 bg-bg border border-border rounded-button px-5 py-4 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="pv-btn-primary py-4 px-8 h-auto rounded-button font-bold text-sm transition-colors shrink-0 cursor-pointer"
            >
              Get Failure Intel
            </button>
          </form>
          
          <div className="text-xs text-text-muted">
            No spam. Unsubscribe at any time. Verified datasets only.
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-border py-10 bg-bg">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-text-muted font-semibold">
          <div className="flex items-center gap-2.5">
            <Skull className="w-5 h-5 text-accent" />
            <span className="font-display font-extrabold tracking-tight text-text-primary">PivotVault</span>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <a href="#features" className="hover:text-text-secondary transition-colors">Features</a>
            <Link to="/pricing" className="hover:text-text-secondary transition-colors">Pricing</Link>
            <Link to="/confessions" className="hover:text-text-secondary transition-colors">Confessions</Link>
            <a href="https://github.com/SarthakPatil18/pivotvault" className="hover:text-text-secondary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
