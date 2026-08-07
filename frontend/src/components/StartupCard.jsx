import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShieldAlert, ArrowRight, Eye, BookOpen, Calendar, Database } from 'lucide-react';
import { clsx } from 'clsx';
import BookmarkButton from './BookmarkButton';
import Logo from './Logo';

const StartupCard = React.memo(({ 
  startup,
  layout = 'default', // 'default' | 'compact' | 'featured'
  hasBookmark,
  // Optional living-database intel panel (health score, source, completeness)
  intel,
  // Individual props for backward compatibility
  name: _name, 
  slug: _slug, 
  status: _status, 
  industry: _industry, 
  fundingInr: _fundingInr, 
  peakUsers: _peakUsers, 
  lifetimeMonths: _lifetimeMonths, 
  summary: _summary, 
  topFailureReason: _topFailureReason, 
  foundingYear: _foundingYear, 
  shutdownYear: _shutdownYear,
  domain: _domain,
  views,
}) => {
  // Normalize input
  const data = startup || {
    name: _name,
    slug: _slug,
    status: _status,
    industry: _industry,
    fundingInr: _fundingInr,
    peakUsers: _peakUsers,
    lifetimeMonths: _lifetimeMonths,
    summary: _summary,
    topFailureReason: _topFailureReason,
    foundingYear: _foundingYear,
    shutdownYear: _shutdownYear,
    domain: _domain,
    views,
  };

  const {
    name = 'Unnamed Startup',
    slug = '',
    status = 'failed',
    industry = 'Unknown',
    fundingInr,
    peakUsers,
    lifetimeMonths,
    summary = 'No summary available.',
    topFailureReason,
    foundingYear,
    shutdownYear,
    domain,
    views: rawViews,
  } = data;

  const formatINR = (val) => {
    if (!val) return 'Undisclosed';
    const num = Number(val);
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)}B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatViews = (v) => {
    if (!v && v !== 0) return Math.floor(Math.random() * 9000 + 1200);
    const n = Number(v);
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
    return n.toString();
  };

  const getFailureScore = (reason) => {
    if (!reason) return 72;
    const r = reason.toLowerCase();
    if (r.includes('fraud') || r.includes('ethics')) return 99;
    if (r.includes('pmf') || r.includes('product-market')) return 95;
    if (r.includes('unit_economics') || r.includes('economics')) return 92;
    if (r.includes('cashflow') || r.includes('burn') || r.includes('cac')) return 88;
    if (r.includes('competition')) return 85;
    if (r.includes('legal') || r.includes('regulation')) return 82;
    if (r.includes('timing')) return 78;
    return 74;
  };

  const failureScore = getFailureScore(topFailureReason);

  const statusColors = {
    failed: 'bg-danger/10 text-danger border-danger/20',
    acquired: 'bg-success/10 text-success border-success/20',
    pivoted: 'bg-warning/10 text-warning border-warning/20',
    zombie: 'bg-surface-3 text-text-secondary border-border',
  };

  const cleanReason = topFailureReason
    ? topFailureReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Market Friction';

  const cardViews = formatViews(rawViews);

  // =============== DEFAULT LAYOUT ===============
  if (layout === 'default') {
    return (
      <Link to={`/startup/${slug}`} className="group block h-full">
        <div className="pv-card-interactive p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <Logo name={name} domain={domain} size="md" className="shrink-0" />
            <div className="flex flex-col items-end gap-2">
              <BookmarkButton slug={slug} />
              <span className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-bold uppercase border',
                statusColors[status] || statusColors.failed
              )}>
                {status}
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-display font-bold mb-1 text-text-primary group-hover:text-accent transition-colors">{name}</h3>
            <p className="text-sm text-text-muted mb-3">{industry}</p>
            <p className="text-sm text-text-secondary line-clamp-3 mb-4 leading-relaxed">{summary}</p>
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-border bg-surface-2/50 px-3 rounded-md mb-4">
              <div>
                <div className="text-xs uppercase text-text-muted mb-1 font-medium">Capital Raised</div>
                <div className="flex items-center gap-1 text-sm font-semibold text-text-primary font-data">
                  {formatINR(fundingInr)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-text-muted mb-1 font-medium">Failure Score</div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-danger font-data">
                  <ShieldAlert className="w-4 h-4" />
                  {failureScore}%
                </div>
              </div>
            </div>

            {/* Living-database intel panel (only when provided) */}
            {intel && (
              <div className="mb-4 space-y-2.5 rounded-md border border-border/60 bg-surface-2/40 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Health Score</span>
                  <span className={`font-data text-xs font-bold ${intel.healthScore >= 70 ? 'text-success' : intel.healthScore >= 50 ? 'text-accent' : 'text-danger'}`}>
                    {intel.healthScore}/100
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
                  <div
                    className={`h-full rounded-full transition-all ${intel.healthScore >= 70 ? 'bg-success' : intel.healthScore >= 50 ? 'bg-accent' : 'bg-danger'}`}
                    style={{ width: `${intel.healthScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  {intel.dataSource ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                      <Database className="w-2.5 h-2.5" />
                      {intel.dataSource}
                    </span>
                  ) : <span />}
                  <span className="text-[10px] font-medium text-text-muted">
                    {intel.stage && <>{intel.stage} · </>}Data {intel.dataCompleteness}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-text-muted">
              Root cause: <span className="text-danger font-medium">{cleanReason}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    );
  }

  // =============== COMPACT LAYOUT ===============
  if (layout === 'compact') {
    return (
      <Link to={`/startup/${slug}`} className="group block h-full">
        <div className="pv-card-interactive p-5 h-full flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <Logo name={name} domain={domain} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-display font-bold text-text-primary truncate group-hover:text-accent transition-colors">{name}</h3>
                <span className={clsx(
                  'shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                  statusColors[status] || statusColors.failed
                )}>
                  {status}
                </span>
              </div>
              <div className="text-xs text-text-muted truncate">{industry}</div>
            </div>
            <BookmarkButton slug={slug} />
          </div>

          <p className="text-[13px] text-text-secondary line-clamp-2 mb-4 leading-relaxed">
            {summary}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="py-2 px-1.5 rounded-lg bg-surface-2/60">
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Raised</div>
              <div className="text-[13px] font-bold text-text-primary font-data">{formatINR(fundingInr).replace('₹', '')}</div>
            </div>
            <div className="py-2 px-1.5 rounded-lg bg-surface-2/60">
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Life</div>
              <div className="text-[13px] font-bold text-text-primary font-data">{lifetimeMonths || '—'}<span className="text-[10px] text-text-muted ml-0.5">mo</span></div>
            </div>
            <div className="py-2 px-1.5 rounded-lg bg-danger/10">
              <div className="text-[9px] font-bold uppercase tracking-wider text-danger mb-0.5">Score</div>
              <div className="text-[13px] font-bold text-danger font-data">{failureScore}%</div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Eye className="w-3.5 h-3.5" />
              <span>{cardViews}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              Read postmortem
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // =============== FEATURED LAYOUT ===============
  return (
    <Link to={`/startup/${slug}`} className="group block h-full">
      <div className="pv-card-interactive p-6 md:p-7 h-full flex flex-col relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-70" />

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Logo name={name} domain={domain} size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors">{name}</h3>
                <span className={clsx(
                  'shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                  statusColors[status] || statusColors.failed
                )}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {industry}
                </span>
                {(foundingYear || shutdownYear) && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {foundingYear || '—'} — {shutdownYear || 'Active'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <BookmarkButton slug={slug} />
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Eye className="w-3.5 h-3.5" />
              <span>{cardViews}</span>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="flex-1 flex flex-col mb-5">
          <div className="pv-eyebrow text-accent mb-2.5 flex items-center gap-1.5">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: 'rgb(var(--color-accent))' }} />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: 'rgb(var(--color-accent))' }} />
            </span>
            AI Postmortem
          </div>
          <p className="text-[14.5px] md:text-[15px] text-text-secondary leading-relaxed line-clamp-4 md:line-clamp-3">
            {summary}
          </p>
        </div>

        {/* Failure reason banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/[0.07] border border-danger/15 mb-5">
          <div className="mt-0.5">
            <ShieldAlert className="w-5 h-5 text-danger shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-danger mb-1">Primary Failure Mode</div>
            <div className="text-[14px] font-semibold text-text-primary leading-tight">{cleanReason}</div>
          </div>
          <div className="shrink-0 flex flex-col items-end">
            <div className="text-2xl font-display font-bold leading-none text-danger">{failureScore}<span className="text-sm">%</span></div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1">Risk Index</div>
          </div>
        </div>

        {/* Stats + CTA footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/70">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Total Raised</div>
              <div className="flex items-center gap-1 text-[15px] font-bold text-text-primary font-data">
                <DollarSign className="w-4 h-4 text-accent" />
                {formatINR(fundingInr)}
              </div>
            </div>
            {peakUsers && (
              <div className="hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Peak Users</div>
                <div className="text-[15px] font-bold text-text-primary font-data">{Number(peakUsers) >= 1000000 ? `${(peakUsers/1000000).toFixed(1)}M` : `${(peakUsers/1000).toFixed(1)}K`}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Lifetime</div>
              <div className="text-[15px] font-bold text-text-primary font-data">{lifetimeMonths || '—'} <span className="text-[11px] text-text-muted font-medium">months</span></div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent shrink-0 ml-4">
            Read Full Case Study
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
});

export default StartupCard;
