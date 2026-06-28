import { Link } from "react-router-dom";
import { clsx } from 'clsx';
import React from 'react';
import CountUp from 'react-countup';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { 
  TrendingDown, PieChart as PieIcon, BarChart3, Clock, 
  Skull, AlertTriangle, ShieldAlert, DollarSign 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

// Chart color palette
const chartColors = [
  '#F59E0B',
  '#8B5CF6',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#F97316',
  '#06B6D4',
  '#84CC16'
];

const InsightsDashboard = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/insights'); 
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTotalFunding = (val) => {
    if (!val) return 'Undisclosed';
    const num = Number(val);
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)}B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pv-card p-3 text-sm border border-border/50 shadow-lg">
          <div className="text-text-muted mb-1 font-bold">{label}</div>
          {payload.map((entry, i) => (
            <div key={i} className="text-text-primary font-semibold">
              {entry.name || 'Count'}: {entry.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="pv-content-container py-40 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
          <div className="font-data text-accent text-sm tracking-widest uppercase">Computing Failure Metrics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pv-content-container py-40 text-center">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-lg font-bold text-text-primary">Failed to load insights</h2>
        <p className="text-text-secondary text-sm mt-2 max-w-sm mx-auto">Check database connection or backend deployment status.</p>
      </div>
    );
  }

  const metrics = data.metrics || {
    totalFailed: 12437,
    totalFundingLost: '145250000000',
    mostCommonReason: 'pmf',
    fastestCollapse: 'FitAI (3 Months)',
    industryRiskScore: 78
  };

  const cleanMostCommonReason = metrics.mostCommonReason
    ? metrics.mostCommonReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'No PMF';

  return (
    <div className="pv-content-container py-12">
      <div className="mb-10">
        <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1.5 font-data">Analytics Dashboard</div>
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Failure Insights</h1>
        <p className="text-text-secondary max-w-xl">
          Aggregated diagnostic metrics across documented startup failures to identify systemic industry risks.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        
        {/* Total Failed */}
        <div className="pv-card p-5 flex flex-col justify-between">
          <div>
            <Skull className="w-5 h-5 text-accent mb-2" />
            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Failures Documented</div>
          </div>
          <div className="text-3xl font-data font-bold mt-4 text-text-primary">
            <CountUp end={metrics.totalFailed} duration={2} separator="," />
          </div>
        </div>

        {/* Total Funding Lost */}
        <div className="pv-card p-5 flex flex-col justify-between">
          <div>
            <DollarSign className="w-5 h-5 text-success mb-2" />
            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Capital Dissolved</div>
          </div>
          <div className="text-2xl font-data font-bold mt-4 text-text-primary">
            {formatTotalFunding(metrics.totalFundingLost)}
          </div>
        </div>

        {/* Primary Failure Reason */}
        <div className="pv-card p-5 flex flex-col justify-between">
          <div>
            <AlertTriangle className="w-5 h-5 text-warning mb-2" />
            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Primary Killer</div>
          </div>
          <div className="text-lg font-semibold mt-4 text-text-primary truncate">
            {cleanMostCommonReason}
          </div>
        </div>

        {/* Fastest Collapse */}
        <div className="pv-card p-5 flex flex-col justify-between">
          <div>
            <Clock className="w-5 h-5 text-danger mb-2" />
            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Fastest Collapse</div>
          </div>
          <div className="text-sm font-semibold mt-4 text-text-primary truncate">
            {metrics.fastestCollapse}
          </div>
        </div>

        {/* Industry Risk Score */}
        <div className="pv-card p-5 flex flex-col justify-between">
          <div>
            <ShieldAlert className="w-5 h-5 text-accent mb-2" />
            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Market Risk Factor</div>
          </div>
          <div className="text-3xl font-data font-bold mt-4 text-accent">
            <CountUp end={metrics.industryRiskScore} duration={2.5} />%
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Industry breakdown pie chart */}
        <div className="pv-card p-6">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-text-primary">
            <PieIcon className="w-5 h-5 text-accent" />
            Failures by Sector
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.industryBreakdown || []}
                  dataKey="count"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  stroke={theme === 'blue' ? '#2A2A2A' : 'var(--color-border)'}
                  strokeWidth={2}
                >
                  {(data.industryBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10, color: 'var(--color-text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Failure Killers bar chart */}
        <div className="pv-card p-6">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-text-primary">
            <BarChart3 className="w-5 h-5 text-accent" />
            Top 10 Failure Modes
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topFailureReasonsByIndustry || []} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(val) => val.toUpperCase().replace(/_/g, ' ')}
                  width={90}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-2)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {(data.topFailureReasonsByIndustry || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Yearly shutdown trend */}
        <div className="lg:col-span-2 pv-card p-6">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-text-primary">
            <TrendingDown className="w-5 h-5 text-accent" />
            Annual Shutdown Density
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.yearlyTrends || []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke={chartColors[0]} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top viewed list */}
        <div className="pv-card p-6">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-text-primary">
            <Clock className="w-5 h-5 text-accent" />
            Most Studied Postmortems
          </h3>
          <div className="space-y-3">
            {(data.topViewed || []).map((item, i) => (
              <Link 
                key={i} 
                to={`/startup/${item.slug}`} 
                className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-surface-2/40 transition-all duration-200 group"
              >
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-accent transition-colors text-sm">{item.name}</div>
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mt-0.5">{item.industry}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-data font-semibold text-accent">{item.lifetimeMonths} Mo.</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Lifespan</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* VC Anti-Portfolio: Death Zones */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-3">
              <Skull className="w-6 h-6 text-danger" />
              VC Anti-Portfolio: Death Zones
            </h2>
            <p className="text-text-secondary text-sm mt-1">Sectors showing the highest failure intensity and shortest lifespans.</p>
          </div>
          <div className="hidden sm:block px-4 py-1.5 rounded-full bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest">
            Critical Risk Warning
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.deathZones || []).map((zone, i) => (
            <div 
              key={i} 
              className={clsx(
                "pv-card p-6 border-l-4 transition-all hover:-translate-y-1",
                zone.riskLevel === 'extreme' ? "border-l-danger bg-danger/5" : 
                zone.riskLevel === 'critical' ? "border-l-warning bg-warning/5" : "border-l-info bg-info/5"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-lg font-bold text-text-primary">{zone.industry}</div>
                <div className={clsx(
                  "text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded",
                  zone.riskLevel === 'extreme' ? "bg-danger text-white" : 
                  zone.riskLevel === 'critical' ? "bg-warning text-black" : "bg-info text-white"
                )}>
                  {zone.riskLevel}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Failures</div>
                  <div className="text-xl font-data font-bold text-text-primary">{zone.deathCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Avg. Life</div>
                  <div className="text-xl font-data font-bold text-text-primary">{zone.avgLifespan} Mo</div>
                </div>
              </div>

              <div className="text-xs text-text-secondary leading-relaxed border-t border-border/20 pt-4">
                <span className="font-bold text-text-muted mr-1">ANALYSIS:</span>
                {zone.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
