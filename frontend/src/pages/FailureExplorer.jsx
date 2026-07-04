import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, ArrowUpDown, ChevronDown, AlertTriangle, Sparkles } from 'lucide-react';
import StartupCard from '../components/StartupCard';
import SearchInput from '../components/ui/SearchInput';
import api from '../lib/api';

const PAGE_SIZE = 24;

const FailureExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [startups, setStartups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const sentinelRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);

  const query = searchParams.get('q') || '';
  const industry = searchParams.get('industry') || '';
  const status = searchParams.get('status') || '';
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  // A stable key of all filter params EXCEPT the page cursor, so we reset the
  // list only when the actual filters/search change (not on pagination).
  const filterKey = React.useMemo(() => {
    const entries = Object.fromEntries(searchParams);
    delete entries.page;
    return new URLSearchParams(entries).toString();
  }, [searchParams]);

  const hasMore = startups.length < total;

  // Reset + load the first page whenever the filters/search change.
  React.useEffect(() => {
    let cancelled = false;
    setPage(1);
    (async () => {
      setLoading(true);
      try {
        const params = { ...Object.fromEntries(searchParams), page: 1, limit: PAGE_SIZE };
        const response = await api.get('/startups', { params });
        if (cancelled) return;
        
        const data = response.data.data || [];
        const totalCount = response.data.total || 0;
        
        setStartups(data);
        setTotal(totalCount);

        // Auto-redirect if 0 results and we have an initial query from URL
        if (totalCount === 0 && query.trim() && isInitialLoadRef.current) {
          const slug = query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          navigate(`/startup/${slug}`);
        }
        isInitialLoadRef.current = false;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Append subsequent pages for infinite scroll.
  React.useEffect(() => {
    if (page === 1) return;
    let cancelled = false;
    (async () => {
      setLoadingMore(true);
      try {
        const params = { ...Object.fromEntries(searchParams), page, limit: PAGE_SIZE };
        const response = await api.get('/startups', { params });
        if (cancelled) return;
        setStartups((prev) => [...prev, ...(response.data.data || [])]);
        setTotal(response.data.total || 0);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Fetch error:', err);
      } finally {
        if (!cancelled) setLoadingMore(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // IntersectionObserver drives the infinite scroll by advancing the page.
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Phase 10: when a searched company isn't in the archive, kick off the live
  // import pipeline and hand off to the postmortem page (which polls the
  // enrichment job and renders the full dynamic postmortem when ready).
  const analyzeAndImport = async (name) => {
    const q = String(name || '').trim();
    if (!q) return;
    setAnalyzing(true);
    const fallbackSlug = q.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      const res = await api.get('/companies/search', { params: { q } });
      const data = res.data || {};
      const slug = data.slug || data.profile?.company?.slug || fallbackSlug;
      navigate(`/startup/${slug}`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Import failed:', err);
      navigate(`/startup/${fallbackSlug}`);
    }
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setShowMobileFilters(false);
  };

  const industries = [
    'Consumer Hardware', 'Media / Entertainment', 'Health Tech', 'E-Commerce', 
    'Grocery Delivery', 'Entertainment', 'Marketplace', 'Home Services', 
    'Wearables', 'Social Media', 'Music Streaming', 'Logistics'
  ];

  const failureCategories = [
    { key: 'pmf', label: 'No PMF' },
    { key: 'unit_economics', label: 'Unit Economics' },
    { key: 'cashflow', label: 'Cash Burn' },
    { key: 'competition', label: 'Competition' },
    { key: 'legal', label: 'Legal & Regulatory' },
    { key: 'product', label: 'Product Quality' },
    { key: 'timing', label: 'Poor Timing' }
  ];

  const sidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          Filters
        </h3>
        {Object.keys(Object.fromEntries(searchParams)).length > 0 && (
          <button 
            onClick={clearAllFilters}
            className="text-sm text-accent hover:underline font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Industry Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Industry</label>
        <select 
          className="pv-field"
          value={industry}
          onChange={(e) => handleFilterChange('industry', e.target.value)}
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Status</label>
        <select 
          className="pv-field"
          value={status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="failed">Failed / Liquidated</option>
          <option value="acquired">Acquired / Asset Sale</option>
          <option value="pivoted">Pivoted / Rebranded</option>
          <option value="zombie">Zombie State</option>
        </select>
      </div>

      {/* Failure Mode Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Failure Mode</label>
        <select 
          className="pv-field"
          value={category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Modes</option>
          {failureCategories.map((cat) => (
            <option key={cat.key} value={cat.key}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Country Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Country</label>
        <select 
          className="pv-field"
          value={country}
          onChange={(e) => handleFilterChange('country', e.target.value)}
        >
          <option value="">All Countries</option>
          <option value="USA">USA</option>
          <option value="India">India</option>
          <option value="Europe">Europe</option>
        </select>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Sort By</label>
        <div className="grid grid-cols-2 gap-2">
          <select 
            className="pv-field"
            value={sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="name">Name</option>
            <option value="funding">Capital Raised</option>
            <option value="lifetime">Lifespan</option>
            <option value="users">Peak Users</option>
          </select>
          <select 
            className="pv-field"
            value={order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="pv-content-container py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="text-label uppercase text-text-muted mb-1">Explorer</div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-6">Failure Archive</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              placeholder="Search startup name, industry, or key lessons..."
              className="flex-1"
              value={query}
              onChange={(e) => handleFilterChange('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const trimmed = query.trim();
                  if (!trimmed) return;
                  if (total === 0) {
                    const slug = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    navigate(`/startup/${slug}`);
                  }
                }
              }}
            />
            <button
              onClick={() => setShowMobileFilters(true)}
              className="sm:hidden pv-btn-secondary flex items-center justify-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="pv-card p-6 sticky top-24">
              {sidebarContent}
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between text-sm text-text-secondary">
              <div>
                Showing <span className="font-semibold text-text-primary">{startups.length}</span> of <span className="font-semibold text-text-primary">{total}</span> results
              </div>
              {Object.keys(Object.fromEntries(searchParams)).length > 0 && (
                <button 
                  onClick={clearAllFilters}
                  className="text-accent hover:underline font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="pv-card p-6 h-full flex flex-col animate-pulse">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border" />
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-2" />
                        <div className="w-16 h-5 rounded-md bg-surface-2" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <div className="w-3/4 h-6 rounded bg-surface-2 mb-2" />
                      <div className="w-1/3 h-4 rounded bg-surface-2 mb-4" />
                      <div className="space-y-2 mb-6">
                        <div className="w-full h-3.5 rounded bg-surface-2" />
                        <div className="w-full h-3.5 rounded bg-surface-2" />
                        <div className="w-5/6 h-3.5 rounded bg-surface-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/80 bg-surface-2/40 px-3 rounded-md mb-4">
                        <div>
                          <div className="w-16 h-3 rounded bg-surface-2 mb-1.5" />
                          <div className="w-20 h-4 rounded bg-surface-2" />
                        </div>
                        <div>
                          <div className="w-16 h-3 rounded bg-surface-2 mb-1.5" />
                          <div className="w-12 h-4 rounded bg-surface-2" />
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="w-32 h-4 rounded bg-surface-2" />
                      <div className="w-4 h-4 rounded bg-surface-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : startups.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {startups.map((startup) => (
                    <StartupCard key={startup.id} {...startup} />
                  ))}
                </div>

                {/* Infinite scroll sentinel + loading indicator */}
                {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
                {loadingMore && (
                  <div className="flex justify-center py-8" role="status" aria-live="polite">
                    <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && total > PAGE_SIZE && (
                  <div className="text-center text-xs text-text-muted py-8">
                    You've reached the end — {total} companies in the archive.
                  </div>
                )}
              </>
            ) : (
              <div className="pv-card p-12 text-center">
                {analyzing ? (
                  <div role="status" aria-live="polite" className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-5" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Analyzing company…</h3>
                    <p className="text-text-secondary text-sm max-w-md mx-auto">
                      Importing SEC filings, running AI extraction, and building a full postmortem for
                      <span className="font-semibold text-text-primary"> “{query}”</span>. This takes about 30–60 seconds.
                    </p>
                  </div>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No results found</h3>
                    <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
                      {query
                        ? "This company isn't in the archive yet — we can import it live from SEC EDGAR and generate a full intelligence report."
                        : 'No startups match your current filters. Try adjusting your search or clearing filters.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {query && (
                        <button
                          type="button"
                          onClick={() => analyzeAndImport(query)}
                          className="pv-btn-primary inline-flex items-center justify-center gap-2"
                          aria-label={`Analyze and import ${query}`}
                        >
                          <Sparkles className="w-4 h-4" />
                          Analyze &amp; Import “{query}”
                        </button>
                      )}
                      <button type="button" onClick={clearAllFilters} className="pv-btn-secondary">
                        Clear all filters
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="relative w-full max-w-md bg-bg border-l border-border h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <h2 className="font-semibold text-text-primary">Filters</h2>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {sidebarContent}
            <div className="mt-8 pt-4 border-t border-border flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 pv-btn-secondary"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 pv-btn-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailureExplorer;
