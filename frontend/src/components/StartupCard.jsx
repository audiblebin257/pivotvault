import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShieldAlert, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import BookmarkButton from './BookmarkButton';
import Logo from './Logo';

const StartupCard = ({ 
  name, 
  slug, 
  status, 
  industry, 
  fundingInr, 
  peakUsers, 
  lifetimeMonths, 
  summary, 
  topFailureReason, 
  foundingYear, 
  shutdownYear,
  domain
}) => {
  const truncateSummary = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
    // Remove trailing punctuation
    truncated = truncated.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()—\s]+$/, '');
    return truncated + '...';
  };

  const formatINR = (val) => {
    if (!val) return 'Undisclosed';
    const num = Number(val);
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(1)}B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
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

  return (
    <Link to={`/startup/${slug}`} className="group block h-full">
      <div className="pv-card-interactive p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Logo 
            name={name} 
            domain={domain} 
            size="md"
            className="shrink-0"
          />
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

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-xl font-display font-bold mb-1 text-text-primary group-hover:text-accent transition-colors">{name}</h3>
          <p className="text-sm text-text-muted mb-3">{industry}</p>
          
          <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
            {truncateSummary(summary, 120)}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 py-3 border-y border-border bg-surface-2/50 px-3 rounded-md mb-4">
            <div>
              <div className="text-xs uppercase text-text-muted mb-1 font-medium">Capital Raised</div>
              <div className="flex items-center gap-1 text-sm font-semibold text-text-primary font-data">
                <DollarSign className="w-4 h-4 text-accent" />
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm text-text-muted">
            Root cause: <span className="text-danger font-medium">{cleanReason}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
};

export default StartupCard;
