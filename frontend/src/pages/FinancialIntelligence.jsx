import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Landmark, Wallet, AlertTriangle,
  Download, RefreshCw, GitCompare, Search, Clock, Activity, Shield,
  FileText, Sparkles, X, Plus, BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';

const COMPARE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899'];
const POLL_MS = 45000;

const formatUsd = (val) => {
  if (val == null || Number.isNaN(Number(val))) return '—';
  const n = Number(val);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
};

const formatPct = (val) => {
  if (val == null || Number.isNaN(Number(val))) return '—';
  return `${(Number(val) * 100).toFixed(1)}%`;
};

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pv-card p-3 text-sm border border-border/50 shadow-lg">
      <div className="text-text-muted mb-1 font-bold">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="text-text-primary font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </div>
      ))}
    </div>
  );
};

function mergeTrendData(companies, trendKey) {
  const labels = new Set();
  companies.forEach((c) => {
    (c.trends?.[trendKey] || []).forEach((p) => labels.add(p.label));
  });
  return [...labels].map((label) => {
    const row = { label };
    companies.forEach((c, i) => {
      const point = (c.trends?.[trendKey] || []).find((p) => p.label === label);
      row[c.company.cik] = point?.value ?? null;
      row[`name_${i}`] = c.company.name;
    });
    return row;
  });
}

function exportJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(companies) {
  const rows = [['Company', 'CIK', 'Metric', 'Period', 'Value']];
  companies.forEach((c) => {
    Object.entries(c.trends || {}).forEach(([metric, series]) => {
      (series || []).forEach((p) => {
        rows.push([c.company.name, c.company.cik, metric, p.label, p.value ?? '']);
      });
    });
  });
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pivotvault-sec-financials.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const MetricCard = ({ icon: Icon, label, value, sub, tone = 'default' }) => (
  <div className="pv-card p-5 flex flex-col justify-between">
    <div>
      <Icon className={clsx(
        'w-5 h-5 mb-2',
        tone === 'positive' && 'text-success',
        tone === 'warning' && 'text-warning',
        tone === 'danger' && 'text-danger',
        tone === 'default' && 'text-accent',
      )} />
      <div className="text-xs uppercase tracking-widest text-text-muted font-bold">{label}</div>
    </div>
    <div className="text-2xl font-data font-bold mt-3 text-text-primary">{value}</div>
    {sub && <div className="text-xs text-text-secondary mt-1">{sub}</div>}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 text-accent mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-widest font-data">{title}</span>
    </div>
    {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
  </div>
);

const FinancialIntelligence = () => {
  const { theme } = useTheme();
  const [dashboard, setDashboard] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState([
    { cik: '0000320193', name: 'Apple Inc.', tickers: ['AAPL'] },
    { cik: '0000789019', name: 'Microsoft Corporation', tickers: ['MSFT'] },
  ]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const dataVersionRef = React.useRef('');

  const gridStroke = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const axisColor = 'rgb(var(--color-text-muted))';

  const fetchDashboard = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const ciks = selected.map((c) => c.cik).join(',');
      const { data } = await api.get(`/sec/dashboard?ciks=${encodeURIComponent(ciks)}`);
      if (data?.companies?.length) {
        setDashboard(data);
        dataVersionRef.current = data.meta?.dataVersion || '';
      } else {
        setError('No SEC data found. Sync companies via POST /api/sec/sync/:identifier first.');
        setDashboard(null);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setError('Unable to load financial intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selected]);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  React.useEffect(() => {
    const timer = setInterval(async () => {
      if (!selected.length) return;
      try {
        const ciks = selected.map((c) => c.cik).join(',');
        const { data } = await api.get(`/sec/dashboard?ciks=${encodeURIComponent(ciks)}`);
        if (data?.meta?.dataVersion && data.meta.dataVersion !== dataVersionRef.current) {
          setDashboard(data);
          dataVersionRef.current = data.meta.dataVersion;
        }
      } catch {
        /* silent poll */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [selected]);

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/sec/lookup?q=${encodeURIComponent(searchQuery.trim())}`);
        let results = [];
        if (Array.isArray(data?.matches)) {
          results = data.matches;
        } else if (data?.cik) {
          results = [{ cik: data.cik, name: data.name || data.cik, tickers: data.tickers || [] }];
          if (Array.isArray(data.candidates)) {
            results = results.concat(
              data.candidates.map((c) => ({
                cik: c.cik,
                name: c.name,
                tickers: c.tickers || [],
              }))
            );
          }
        }
        setSearchResults(results);
        setSearchOpen(results.length > 0);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addCompany = (company) => {
    if (selected.some((c) => c.cik === company.cik)) return;
    if (selected.length >= 4) return;
    setSelected((prev) => [...prev, company]);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const removeCompany = (cik) => {
    if (selected.length <= 1) return;
    setSelected((prev) => prev.filter((c) => c.cik !== cik));
  };

  const companies = dashboard?.companies || [];
  const primary = companies[0];

  const revenueData = mergeTrendData(companies, 'revenue');
  const profitData = mergeTrendData(companies, 'profit');
  const debtData = mergeTrendData(companies, 'debt');
  const assetsData = mergeTrendData(companies, 'assets');
  const liabilitiesData = mergeTrendData(companies, 'liabilities');
  const burnData = mergeTrendData(companies, 'cashBurn');

  const ratioRows = companies.map((c) => ({
    name: c.company.tickers?.[0] || c.company.name.slice(0, 8),
    'Profit Margin': (c.ratios?.profitMargin ?? 0) * 100,
    'Debt/Assets': (c.ratios?.debtToAssets ?? 0) * 100,
    'ROA': (c.ratios?.returnOnAssets ?? 0) * 100,
    'ROE': (c.ratios?.returnOnEquity ?? 0) * 100,
  }));

  if (loading) {
    return (
      <div className="pv-content-container py-40 text-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
          <div className="font-data text-accent text-sm tracking-widest uppercase">Loading SEC Financial Intelligence…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-content-container py-10 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
        <div>
          <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1.5 font-data">PivotVault V2</div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Financial Intelligence</h1>
          <p className="text-text-secondary max-w-2xl">
            SEC EDGAR–backed revenue, burn, balance sheet, and risk signals — built for founders benchmarking public comps and investors doing diligence.
          </p>
          {dashboard?.meta?.demo && (
            <p className="text-xs text-warning mt-2 font-semibold">Demo mode — sample SEC-shaped data (sync real companies for live filings).</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="pv-btn-primary inline-flex items-center gap-2 text-sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            className="pv-btn-icon border border-border"
            onClick={() => exportCsv(companies)}
            aria-label="Export CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            type="button"
            className="pv-btn-icon border border-border"
            onClick={() => exportJson(dashboard, 'pivotvault-sec-dashboard.json')}
            aria-label="Export JSON"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Company picker + compare */}
      <div className="pv-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-4 h-4 text-accent" />
          <h2 className="font-bold text-text-primary">Compare Companies</h2>
          <span className="text-xs text-text-muted">Up to 4 public filers</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((c, i) => (
            <span
              key={c.cik}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-2 text-sm"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: COMPARE_COLORS[i] }} />
              <span className="font-semibold">{c.tickers?.[0] || c.name}</span>
              {selected.length > 1 && (
                <button type="button" onClick={() => removeCompany(c.cik)} aria-label={`Remove ${c.name}`}>
                  <X className="w-3.5 h-3.5 text-text-muted hover:text-danger" />
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticker or company (e.g. AAPL, Tesla)…"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            aria-label="Search SEC companies"
          />
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface shadow-elevated overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.cik}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-surface-2 flex items-center justify-between gap-2"
                  onClick={() => addCompany({ cik: r.cik, name: r.name, tickers: r.tickers || [] })}
                >
                  <span>{r.name}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    {r.tickers?.[0]} <Plus className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && !companies.length && (
        <div className="pv-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <p className="text-text-primary font-semibold">{error}</p>
        </div>
      )}

      {primary && (
        <>
          {/* Key metrics */}
          <SectionHeader icon={Sparkles} title="Key Metrics" subtitle="Latest period from SEC XBRL + filing intelligence" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <MetricCard icon={DollarSign} label="Revenue" value={formatUsd(primary.keyMetrics?.revenue)} />
            <MetricCard
              icon={primary.keyMetrics?.netIncome >= 0 ? TrendingUp : TrendingDown}
              label="Net Income"
              value={formatUsd(primary.keyMetrics?.netIncome)}
              tone={primary.keyMetrics?.netIncome >= 0 ? 'positive' : 'warning'}
            />
            <MetricCard icon={Wallet} label="Cash" value={formatUsd(primary.keyMetrics?.cash)} />
            <MetricCard icon={Landmark} label="Debt" value={formatUsd(primary.keyMetrics?.debt)} tone="warning" />
            <MetricCard icon={Activity} label="Assets" value={formatUsd(primary.keyMetrics?.assets)} />
            <MetricCard icon={Shield} label="Health Score" value={primary.keyMetrics?.overallHealthScore ?? '—'} sub="/ 100" />
          </div>

          {/* Founder insights */}
          {primary.founderInsights?.length > 0 && (
            <div className="pv-card p-5 mb-10 border-l-4 border-accent">
              <div className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Founder & Investor Brief</div>
              <ul className="space-y-2">
                {primary.founderInsights.map((item, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className={clsx(
                      'shrink-0 w-1.5 h-1.5 rounded-full mt-2',
                      item.tone === 'positive' && 'bg-success',
                      item.tone === 'warning' && 'bg-warning',
                      item.tone === 'neutral' && 'bg-accent',
                    )} />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Revenue & Profit trends */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="pv-card p-6">
              <SectionHeader icon={TrendingUp} title="Revenue Trend" subtitle="Reported revenue from SEC XBRL" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Area
                        key={c.company.cik}
                        type="monotone"
                        dataKey={c.company.cik}
                        name={c.company.tickers?.[0] || c.company.name}
                        stroke={COMPARE_COLORS[i]}
                        fill={COMPARE_COLORS[i]}
                        fillOpacity={0.15}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="pv-card p-6">
              <SectionHeader icon={TrendingDown} title="Profit Trend" subtitle="Net income / loss by period" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Line
                        key={c.company.cik}
                        type="monotone"
                        dataKey={c.company.cik}
                        name={c.company.tickers?.[0] || c.company.name}
                        stroke={COMPARE_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cash burn, debt, assets, liabilities */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="pv-card p-6">
              <SectionHeader icon={Activity} title="Cash Burn" subtitle="Period-over-period cash change & operating loss proxy" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={burnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Bar key={c.company.cik} dataKey={c.company.cik} name={c.company.tickers?.[0] || c.company.name} fill={COMPARE_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="pv-card p-6">
              <SectionHeader icon={Landmark} title="Debt" subtitle="Borrowings & debt obligations" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={debtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Line key={c.company.cik} type="monotone" dataKey={c.company.cik} name={c.company.tickers?.[0] || c.company.name} stroke={COMPARE_COLORS[i]} strokeWidth={2} dot={false} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="pv-card p-6">
              <SectionHeader icon={Wallet} title="Assets" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={assetsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Area key={c.company.cik} type="monotone" dataKey={c.company.cik} name={c.company.tickers?.[0] || c.company.name} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.12} connectNulls />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="pv-card p-6">
              <SectionHeader icon={AlertTriangle} title="Liabilities" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liabilitiesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: axisColor, fontSize: 10 }} width={72} />
                    <Tooltip content={<ChartTooltip formatter={formatUsd} />} />
                    <Legend />
                    {companies.map((c, i) => (
                      <Area key={c.company.cik} type="monotone" dataKey={c.company.cik} name={c.company.tickers?.[0] || c.company.name} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.12} connectNulls />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Financial ratios + health radar */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="pv-card p-6">
              <SectionHeader icon={BarChart3} title="Financial Ratios" subtitle="Computed from latest SEC facts" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                      <th className="py-2 pr-4">Ratio</th>
                      {companies.map((c) => (
                        <th key={c.company.cik} className="py-2 px-2 font-data">{c.company.tickers?.[0] || 'Co'}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Profit Margin', 'profitMargin'],
                      ['Gross Margin', 'grossMargin'],
                      ['Operating Margin', 'operatingMargin'],
                      ['Debt / Assets', 'debtToAssets'],
                      ['Debt / Equity', 'debtToEquity'],
                      ['ROA', 'returnOnAssets'],
                      ['ROE', 'returnOnEquity'],
                      ['Cash / Debt', 'cashToDebt'],
                    ].map(([label, key]) => (
                      <tr key={key} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 text-text-secondary">{label}</td>
                        {companies.map((c) => (
                          <td key={c.company.cik} className="py-2.5 px-2 font-data font-semibold">{formatPct(c.ratios?.[key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pv-card p-6">
              <SectionHeader icon={Shield} title="Health Scores" subtitle="PivotVault filing intelligence (deterministic)" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ratioRows}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: axisColor, fontSize: 9 }} />
                    <Radar name="Profit Margin %" dataKey="Profit Margin" stroke={COMPARE_COLORS[0]} fill={COMPARE_COLORS[0]} fillOpacity={0.2} />
                    <Radar name="ROE %" dataKey="ROE" stroke={COMPARE_COLORS[1]} fill={COMPARE_COLORS[1]} fillOpacity={0.2} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {primary.intelligence?.scores && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {Object.entries(primary.intelligence.scores).map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg bg-surface-2">
                      <div className="text-lg font-data font-bold text-text-primary">{v ?? '—'}</div>
                      <div className="text-[10px] uppercase tracking-wider text-text-muted">{k}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Risk factors */}
          <div className="pv-card p-6 mb-10">
            <SectionHeader icon={AlertTriangle} title="Risk Factors" subtitle="Item 1A excerpts from latest 10-K / 10-Q" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {companies.map((c) => (
                <div key={c.company.cik}>
                  <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: COMPARE_COLORS[companies.indexOf(c)] }} />
                    {c.company.name}
                    <span className="text-xs text-text-muted font-normal">({c.riskFactors?.total || 0} disclosed)</span>
                  </h3>
                  <div className="space-y-3">
                    {(c.riskFactors?.topRisks || []).slice(0, 4).map((r, i) => (
                      <div key={i} className="p-3 rounded-lg bg-surface-2 border border-border/50">
                        <div className="text-xs font-bold text-accent uppercase mb-1">{r.category || 'Risk'}</div>
                        <div className="text-sm font-semibold text-text-primary">{r.title || 'Risk factor'}</div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{r.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline + Major events */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="pv-card p-6">
              <SectionHeader icon={Clock} title="Filing Timeline" subtitle="Auto-updates when new SEC filings are synced" />
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(primary.timeline || []).slice(0, 12).map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className={clsx(
                      'shrink-0 w-2 h-2 rounded-full mt-2',
                      item.isMajor ? 'bg-accent' : 'bg-border',
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-data text-text-muted">{item.date?.slice?.(0, 10) || item.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-2 border border-border font-bold">{item.label || item.type}</span>
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate block">
                          {item.accessionNumber || 'View filing'}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pv-card p-6">
              <SectionHeader icon={FileText} title="Major Events" subtitle="8-K, S-1, annual reports & legal disclosures" />
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(primary.majorEvents || []).map((ev, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/60 bg-surface-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary">{ev.title}</span>
                      <span className={clsx(
                        'text-[10px] uppercase font-bold px-2 py-0.5 rounded',
                        ev.severity === 'high' && 'bg-danger/10 text-danger',
                        ev.severity === 'medium' && 'bg-warning/10 text-warning',
                      )}>
                        {ev.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{ev.description}</p>
                    <div className="text-[10px] text-text-muted mt-1 font-data">{ev.date?.slice?.(0, 10)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-text-muted text-center">
            Data sourced from official SEC EDGAR filings. Charts refresh every {POLL_MS / 1000}s when new filings are imported.
            Last updated: {dashboard?.meta?.generatedAt ? new Date(dashboard.meta.generatedAt).toLocaleString() : '—'}
          </p>
        </>
      )}
    </div>
  );
};

export default FinancialIntelligence;
