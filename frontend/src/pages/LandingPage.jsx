import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, ArrowRight, TrendingUp, BarChart3, Database, ShieldAlert } from 'lucide-react';
import StartupCard from '../components/StartupCard';
import LiveIntelPulse from '../components/LiveIntelPulse';
import SearchInput from '../components/ui/SearchInput';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const LandingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [featured, setFeatured] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/startups?limit=4`);
        setFeatured(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e, type) => {
    e?.preventDefault();
    if (!search.trim()) return;
    if (type === 'ai') {
      navigate(`/assistant?q=${encodeURIComponent(search)}`);
    } else {
      navigate(`/explore?q=${encodeURIComponent(search)}`);
    }
  };

  const samplePrompts = [
    "Why did WeWork fail?",
    "Show fintech failures after Series B.",
    "Find startups that burned cash too fast.",
    "Compare Juicero and Theranos."
  ];

  const trendingPatterns = [
    { category: 'pmf', label: 'No Product-Market Fit', share: '38%', color: 'text-danger', desc: 'Building products that have zero validated market demand or utility.' },
    { category: 'unit_economics', label: 'Broken Unit Economics', share: '24%', color: 'text-warning', desc: 'Logistics, delivery, or operational costs exceeding customer price points.' },
    { category: 'cashflow', label: 'Fatal Cash Burn', share: '18%', color: 'text-accent', desc: 'Scaling operations and marketing spend before contribution-positive.' },
    { category: 'competition', label: 'Incumbent Displacement', share: '12%', color: 'text-info', desc: 'Outcompeted by larger tech companies entering the niche with default placement.' }
  ];

  const industryHeatmap = [
    { name: 'Grocery & Delivery', risk: 'Critical', rate: '84%', color: 'text-danger' },
    { name: 'FinTech', risk: 'High', rate: '71%', color: 'text-danger' },
    { name: 'Consumer Hardware', risk: 'High', rate: '69%', color: 'text-warning' },
    { name: 'Social Media', risk: 'Medium', rate: '58%', color: 'text-warning' },
    { name: 'EdTech', risk: 'Medium', rate: '52%', color: 'text-warning' },
    { name: 'SaaS / B2B', risk: 'Low', rate: '32%', color: 'text-success' }
  ];

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="pv-content-container">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-semibold">Startup Intelligence Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-tight mb-4">
              Learn from startup failures.
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mb-8">
              Explore documented postmortems, analyze failure patterns, and make data-driven decisions.
            </p>

            {/* Search Bar */}
          <div className="max-w-2xl mb-8">
            <form onSubmit={(e) => handleSearch(e, 'explore')} className="flex gap-3">
              <SearchInput
                placeholder="Search startup name, industry, or failure reason..."
                className="flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-2 text-accent-contrast font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Explore
              </button>
              <button
                type="button"
                onClick={(e) => handleSearch(e, 'ai')}
                className="border border-border bg-surface-2 hover:bg-surface-3 text-text-primary font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI
              </button>
            </form>
          </div>

            {/* Sample Prompts */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-text-muted">Try:</span>
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearch(prompt);
                    navigate(`/assistant?q=${encodeURIComponent(prompt)}`);
                  }}
                  className="text-sm text-text-secondary bg-surface border border-border hover:border-accent hover:text-accent px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LiveIntelPulse />

      {/* Featured Failures */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="pv-content-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-text-primary">Featured Postmortems</h2>
              <p className="text-text-secondary mt-1">Curated collection of startup failures to learn from</p>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-accent hover:text-accent-2 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 pv-card animate-pulse bg-surface-2" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((startup) => (
                <StartupCard key={startup.id} {...startup} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Failure Patterns */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-surface/30">
        <div className="pv-content-container">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-text-primary">Failure Patterns</h2>
            <p className="text-text-secondary mt-1">Most common reasons startups fail</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingPatterns.map((pattern, idx) => (
              <Link to={`/explore?q=${pattern.category}`} key={idx} className="group">
                <div className="pv-card-interactive p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl font-display font-bold font-data">{pattern.share}</span>
                    <AlertTriangle className="w-5 h-5 text-text-muted" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors">{pattern.label}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{pattern.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Risk Heatmap */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="pv-content-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div>
              <h2 className="text-2xl font-display font-bold text-text-primary">Industry Risk Heatmap</h2>
              <p className="text-text-secondary mt-2 leading-relaxed">
                Failure rates aggregated across key sectors.
              </p>
              <div className="mt-6">
                <Link to="/insights" className="inline-flex items-center gap-2 pv-btn-secondary">
                  <BarChart3 className="w-4 h-4" />
                  View Insights
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {industryHeatmap.map((ind, i) => (
                <div key={i} className="pv-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{ind.name}</h3>
                      <div className="text-xs text-text-muted mt-1">Failure Rate</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${ind.color}`}>
                        {ind.risk}
                      </span>
                      <div className="text-xl font-data font-bold text-text-primary mt-1">{ind.rate}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-surface/50">
        <div className="pv-content-container">
          <div className="pv-card p-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Ready to avoid the same mistakes?</h2>
              <p className="text-text-secondary mb-6">
                Test your business model against our database of failures.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/scan" className="pv-btn-primary">
                  <ShieldAlert className="w-4 h-4" />
                  Scan Idea for Risk
                </Link>
                <Link to="/explore" className="pv-btn-secondary">
                  Search Archive
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
