import React from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, ArrowRight, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import Logo from '../components/Logo';

const formatINR = (val) => {
  if (!val) return 'Undisclosed';
  const num = Number(val);
  if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)}B`;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const CompareStartups = () => {
  const [startups, setStartups] = React.useState([]);
  const [leftSlug, setLeftSlug] = React.useState('');
  const [rightSlug, setRightSlug] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStartups = async () => {
      try {
        const { data } = await api.get('/startups?limit=100&sort=name&order=asc');
        const rows = data.data || [];
        setStartups(rows);
        setLeftSlug(rows[0]?.slug || '');
        setRightSlug(rows[1]?.slug || rows[0]?.slug || '');
      } finally {
        setLoading(false);
      }
    };
    loadStartups();
  }, []);

  const left = startups.find((s) => s.slug === leftSlug);
  const right = startups.find((s) => s.slug === rightSlug);
  const metrics = [
    ['Industry', left?.industry, right?.industry],
    ['Outcome', left?.status, right?.status],
    ['Founded', left?.foundingYear, right?.foundingYear],
    ['Shutdown', left?.shutdownYear || 'N/A', right?.shutdownYear || 'N/A'],
    ['Lifetime', left?.lifetimeMonths ? `${left.lifetimeMonths} months` : 'N/A', right?.lifetimeMonths ? `${right.lifetimeMonths} months` : 'N/A'],
    ['Funding', formatINR(left?.fundingInr), formatINR(right?.fundingInr)],
    ['Peak users', left?.peakUsers?.toLocaleString() || 'N/A', right?.peakUsers?.toLocaleString() || 'N/A'],
    ['Primary failure', left?.topFailureReason?.replace(/_/g, ' ') || 'N/A', right?.topFailureReason?.replace(/_/g, ' ') || 'N/A'],
  ];

  return (
    <div className="pv-content-container py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
          <GitCompare className="w-4 h-4" />
          Comparative Postmortems
        </div>
        <h1 className="text-4xl font-display font-extrabold">Compare Startups</h1>
        <p className="text-text-secondary mt-2 max-w-xl mx-auto">Put two failures side-by-side and spot the pattern differences quickly.</p>
      </div>

      {loading ? (
        <div className="h-96 pv-card animate-pulse" />
      ) : startups.length === 0 ? (
        <div className="pv-card p-10 text-center max-w-xl mx-auto">
          <GitCompare className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">No failures to compare</h2>
          <p className="text-text-secondary text-sm mb-6">We couldn't load any startup data. Please check the network status or refresh the page.</p>
        </div>
      ) : (
        <div className="pv-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
            <div className="p-5 bg-bg/30 hidden md:block" />
            <div className="p-5 border-b md:border-b-0 md:border-l border-border">
              <div className="relative">
                <select 
                  value={leftSlug} 
                  onChange={(e) => setLeftSlug(e.target.value)} 
                  className="w-full bg-surface-2 border border-border rounded-lg pl-3 pr-10 py-3 focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  {startups.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="p-5 md:border-l border-border">
              <div className="relative">
                <select 
                  value={rightSlug} 
                  onChange={(e) => setRightSlug(e.target.value)} 
                  className="w-full bg-surface-2 border border-border rounded-lg pl-3 pr-10 py-3 focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  {startups.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>

          {left && right && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
                <div className="p-5 bg-bg/30 text-xs uppercase tracking-wider font-bold text-text-muted">Summary</div>
                <div className="p-5 md:border-l border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Logo name={left.name} domain={left.domain} size="sm" />
                    <h2 className="text-xl font-display font-bold">{left.name}</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{left.summary}</p>
                  <Link to={`/startup/${left.slug}`} className="mt-4 inline-flex items-center gap-1 text-accent text-sm font-semibold">
                    View postmortem <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="p-5 md:border-l border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Logo name={right.name} domain={right.domain} size="sm" />
                    <h2 className="text-xl font-display font-bold">{right.name}</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{right.summary}</p>
                  <Link to={`/startup/${right.slug}`} className="mt-4 inline-flex items-center gap-1 text-accent text-sm font-semibold">
                    View postmortem <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {metrics.map(([label, a, b]) => (
                <div key={label} className="grid grid-cols-1 md:grid-cols-3 border-b border-border last:border-b-0">
                  <div className="p-4 bg-bg/30 text-xs uppercase tracking-wider font-bold text-text-muted">{label}</div>
                  <div className="p-4 md:border-l border-border text-sm font-semibold capitalize">{a}</div>
                  <div className="p-4 md:border-l border-border text-sm font-semibold capitalize">{b}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompareStartups;
