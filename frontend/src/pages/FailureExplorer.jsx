import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, ArrowUpDown, ChevronDown, AlertTriangle } from 'lucide-react';
import StartupCard from '../components/StartupCard';
import SearchInput from '../components/ui/SearchInput';
import api from '../lib/api';

const FailureExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [startups, setStartups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const query = searchParams.get('q') || '';
  const industry = searchParams.get('industry') || '';
  const status = searchParams.get('status') || '';
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  React.useEffect(() => {
    const fetchStartups = async () => {
      setLoading(true);
      try {
        const response = await api.get('/startups', {
          params: Object.fromEntries(searchParams)
        });
        setStartups(response.data.data);
        setTotal(response.data.total);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, [searchParams]);

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
        <div className="relative">
          <select 
            className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
            value={industry}
            onChange={(e) => handleFilterChange('industry', e.target.value)}
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Status</label>
        <div className="relative">
          <select 
            className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
            value={status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="failed">Failed / Liquidated</option>
            <option value="acquired">Acquired / Asset Sale</option>
            <option value="pivoted">Pivoted / Rebranded</option>
            <option value="zombie">Zombie State</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Failure Mode Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Failure Mode</label>
        <div className="relative">
          <select 
            className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
            value={category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Modes</option>
            {failureCategories.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Country Filter */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Country</label>
        <div className="relative">
          <select 
            className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
            value={country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
          >
            <option value="">All Countries</option>
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="Europe">Europe</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-label uppercase text-text-secondary">Sort By</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <select 
              className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="name">Name</option>
              <option value="funding">Capital Raised</option>
              <option value="lifetime">Lifespan</option>
              <option value="users">Peak Users</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              className="w-full bg-surface-2 border border-border rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-accent text-text-primary appearance-none hover:border-border-strong hover:bg-surface-3 transition-colors cursor-pointer"
              value={order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
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
            />
            <button
              onClick={() => setShowMobileFilters(true)}
              className="sm:hidden flex items-center justify-center gap-2 bg-surface border border-border px-4 py-3 rounded-md text-text-primary font-medium hover:bg-surface-2"
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
                  <div key={i} className="h-72 pv-card animate-pulse bg-surface-2" />
                ))}
              </div>
            ) : startups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {startups.map((startup) => (
                  <StartupCard key={startup.id} {...startup} />
                ))}
              </div>
            ) : (
              <div className="pv-card p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No results found</h3>
                <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
                  {query ? "No startups match your search, but we can generate an AI analysis!" : "No startups match your current filters. Try adjusting your search or clearing filters."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {query && (
                    <button
                      onClick={() => {
                        const slug = query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        window.location.href = `/startup/${slug}`;
                      }}
                      className="pv-btn-primary"
                    >
                      Generate Intelligence Report
                    </button>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="pv-btn-secondary"
                  >
                    Clear all filters
                  </button>
                </div>
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
