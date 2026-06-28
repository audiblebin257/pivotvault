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
    <div className="relative min-h-screen bg-[#0a0a0f] text-text-primary overflow-x-hidden font-sans selection:bg-accent selection:text-accent-contrast">
      
      {/* Background Gradients & Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(var(--color-accent),0.05),transparent_60%)] pointer-events-none -z-10" />

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
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Skull className="w-5 h-5 text-accent" />
            <span className="font-data font-bold tracking-tight text-text-primary text-sm uppercase">PV <span className="font-display lowercase tracking-normal text-xs text-text-secondary">PivotVault</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#demo" className="hover:text-text-primary transition-colors">Demo</a>
            <Link to="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
            <Link to="/confessions" className="hover:text-text-primary transition-colors">Confessions</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link to="/explore" className="pv-btn-primary text-xs py-2 px-4 h-auto rounded-button font-bold flex items-center gap-1.5 transition-all">
              Enter vault <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="demo" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-data font-bold text-accent tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              4,200+ postmortems indexed
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight leading-[1.1] text-text-primary">
              Learn from <span className="text-accent">failure</span> before writing code.
            </h1>
            
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
              PivotVault decrypts historical startup postmortems, indexes growth hurdles, and scans business models to stress-test your unit economics.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/explore" className="pv-btn-primary px-6 py-3 h-auto font-bold text-xs rounded-button">
                Start Exploring
              </Link>
              <a href="#features" className="px-6 py-3 border border-white/10 hover:border-white/20 bg-transparent text-text-primary font-bold text-xs rounded-button transition-colors">
                View Features
              </a>
            </div>

            {/* Divider & Stat Row */}
            <div className="h-px bg-white/5 my-8" />
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="font-data text-xl sm:text-2xl font-bold text-text-primary">4,200+</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Postmortems</div>
              </div>
              <div>
                <div className="font-data text-xl sm:text-2xl font-bold text-[#e85d3a]">₹145Cr+</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Capital Lost</div>
              </div>
              <div>
                <div className="font-data text-xl sm:text-2xl font-bold text-[#3b82f6]">450+</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">AI Scan Patterns</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Browser-Style Demo */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-white/5 bg-[#111118]/40 backdrop-blur-[12px] overflow-hidden shadow-2xl">
              
              {/* Fake Browser Toolbar */}
              <div className="px-4 py-3 bg-[#111118]/80 border-b border-white/5 flex items-center justify-between gap-4">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef5252]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e8ae36]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34c77b]" />
                </div>
                <div className="flex-1 max-w-sm bg-[#0a0a0f] border border-white/5 rounded-md px-3 py-1 text-[10px] font-data text-text-muted text-center truncate">
                  pivotvault.com/intel/interactive-dashboard
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Demo Tabs */}
              <div className="flex border-b border-white/5 bg-[#111118]/30">
                {['explorer', 'scanner', 'heatmap'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-[10px] sm:text-xs font-semibold tracking-wider uppercase border-r border-white/5 last:border-r-0 transition-colors ${
                      activeTab === tab ? 'bg-[#0a0a0f] text-accent' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab === 'explorer' && 'Failure Explorer'}
                    {tab === 'scanner' && 'Risk Scanner'}
                    {tab === 'heatmap' && 'Sector Map'}
                  </button>
                ))}
              </div>

              {/* Interactive Dashboard Content */}
              <div className="p-6 bg-[#0a0a0f]/90 min-h-[280px] flex flex-col justify-between">
                
                {/* 1. Explorer Tab */}
                {activeTab === 'explorer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Startup</span>
                      <span>Category</span>
                      <span>Status</span>
                    </div>
                    {[
                      { name: 'Juicero', industry: 'Consumer Hardware', reason: 'Unit Economics', status: 'Failed' },
                      { name: 'WeWork', industry: 'Real Estate', reason: 'Cash Burn', status: 'Failed' },
                      { name: 'Theranos', industry: 'Health Tech', reason: 'Product Fraud', status: 'Failed' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span className="font-bold text-text-primary">{item.name}</span>
                        </div>
                        <span className="text-text-secondary text-[11px]">{item.industry} — <strong className="text-[#e85d3a]/80 font-normal">{item.reason}</strong></span>
                        <span className="text-[10px] font-data font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{item.status}</span>
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
                          <div className="space-y-1">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Sector</label>
                            <select
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              className="w-full bg-[#111118]/80 border border-white/5 rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none"
                            >
                              <option value="Grocery & Delivery">Grocery & Delivery</option>
                              <option value="FinTech">FinTech</option>
                              <option value="SaaS">SaaS / B2B</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Burn Rate</label>
                            <select
                              value={burn}
                              onChange={(e) => setBurn(e.target.value)}
                              className="w-full bg-[#111118]/80 border border-white/5 rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none"
                            >
                              <option value="Low">Low</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isScanning}
                          className="w-full py-2 bg-accent text-accent-contrast font-bold text-xs rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isScanning ? 'Analyzing Growth Hurdles...' : 'Scan Business Model'}
                        </button>
                      </form>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-semibold text-text-secondary uppercase">Risk Assessment</span>
                          <button onClick={() => setScanResult(null)} className="text-[10px] text-accent font-semibold hover:underline uppercase tracking-wider">
                            Reset Scanner
                          </button>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center shrink-0">
                            <span className="font-data text-lg font-bold text-accent">{scanResult.score}%</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary">
                              {scanResult.score > 70 ? '⚠️ High Structural Risk' : '✅ Low/Moderate Risk'}
                            </div>
                            <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{scanResult.warning}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 3. Heatmap Tab */}
                {activeTab === 'heatmap' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      <span>Sector</span>
                      <span>Failure Rate</span>
                    </div>
                    {[
                      { name: 'Grocery & Delivery', rate: 84, color: 'bg-red-500' },
                      { name: 'FinTech', rate: 71, color: 'bg-orange-500' },
                      { name: 'Consumer Hardware', rate: 69, color: 'bg-yellow-500' },
                      { name: 'SaaS / B2B', rate: 32, color: 'bg-emerald-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-text-primary">{item.name}</span>
                          <span className="font-data text-text-secondary">{item.rate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulation Notice Footer */}
                <div className="text-[9px] font-data text-text-muted tracking-wide mt-4 border-t border-white/5 pt-3">
                  // SIMULATION ENGINE v1.4.0 — LIVE INTEL FEED
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Social Proof Strip */}
      <section className="border-y border-white/5 bg-[#111118]/20 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <span className="text-[10px] font-data font-bold text-text-muted uppercase tracking-widest">
            Used by founders at
          </span>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-xs sm:text-sm font-display font-semibold text-text-muted">
            <span className="hover:text-text-secondary transition-colors">Y Combinator</span>
            <span className="hover:text-text-secondary transition-colors">Techstars</span>
            <span className="hover:text-text-secondary transition-colors">Sequoia Capital</span>
            <span className="hover:text-text-secondary transition-colors">Vercel</span>
            <span className="hover:text-text-secondary transition-colors">Stripe</span>
          </div>
        </div>
      </section>

      {/* 4. Infinite Auto-Scrolling Ticker */}
      <section className="py-16 overflow-hidden relative border-b border-white/5">
        
        {/* Mask/Fade overlays for ticker */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        <div className="animate-ticker gap-6">
          {/* Double array to create seamless loop */}
          {[...tickerCards, ...tickerCards].map((card, idx) => (
            <div
              key={idx}
              className="w-64 rounded-xl border border-white/5 bg-[#111118]/40 p-5 shrink-0 flex flex-col justify-between h-36"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-text-primary text-sm">{card.name}</h3>
                  <span className="text-[9px] font-data font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {card.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">{card.category}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] font-data text-text-muted border-t border-white/5 pt-2">
                <span>Raised</span>
                <span className="text-[#e85d3a]">{card.raised}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <span className="font-data text-xs text-accent tracking-[0.25em] font-semibold uppercase">
            FEATURES MATRIX
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-text-primary">
            Engineered to avoid failure.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
            Our platform provides full diagnostic capabilities built specifically to test growth logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/5 bg-[#111118]/20 p-8 flex flex-col justify-between h-72 transition-colors hover:bg-[#111118]/40"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-data font-bold uppercase px-2 py-0.5 rounded border border-white/5 bg-white/5 text-text-muted">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-text-primary text-base mb-2">{feat.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Testimonials Grid */}
      <section className="py-24 border-t border-white/5 bg-[#111118]/10 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="font-data text-xs text-accent tracking-[0.25em] font-semibold uppercase">
              FOUNDER TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-text-primary">
              Trusted by operators.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/5 bg-[#111118]/30 p-8 flex flex-col justify-between"
              >
                <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent font-data">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-xs">{t.name}</h4>
                    <span className="text-[10px] text-text-muted mt-0.5 block">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Centered CTA Section */}
      <section className="py-28 px-4 max-w-4xl mx-auto relative">
        
        {/* Glow effect behind heading */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="rounded-2xl border border-white/5 bg-[#111118]/20 p-10 sm:p-12 text-center space-y-8 backdrop-blur-[12px]">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-text-primary leading-tight">
            Stress-test your idea before scaling.
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
            Join 12,000+ founders receiving our weekly failure analytics report and diagnostic checkups.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 bg-[#0a0a0f] border border-white/5 rounded-button px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="pv-btn-primary py-3 px-6 h-auto rounded-button font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Get Failure Intel
            </button>
          </form>
          
          <div className="text-[10px] text-text-muted">
            No spam. Unsubscribe at any time. Verified datasets only.
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs text-text-muted font-semibold">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-accent" />
            <span className="font-data font-bold tracking-tight text-text-primary uppercase">PV <span className="font-display lowercase tracking-normal text-text-secondary">PivotVault</span></span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
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
