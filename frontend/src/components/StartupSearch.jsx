import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import SearchInput from './ui/SearchInput';

export default function StartupSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/startups?search=${encodeURIComponent(query)}`);
        setResults(data.startups || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (slug) => {
    setQuery('');
    setResults([]);
    navigate(`/startup/${slug}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      const exactMatch = results.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase() || s.slug === trimmed.toLowerCase()
      );
      if (exactMatch) {
        handleSelect(exactMatch.slug);
      } else if (results.length > 0) {
        handleSelect(results[0].slug);
      } else {
        const slug = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        handleSelect(slug);
      }
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <SearchInput
        placeholder="Search startups..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {(results.length > 0 || (query.trim() && !loading)) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-elevated">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.slug)}
              className="w-full text-left px-4 py-3 text-sm text-text-primary transition-colors hover:bg-surface-2"
            >
              {s.name}
              <span className="text-xs text-text-muted ml-2">({s.industry})</span>
            </button>
          ))}
          {query.trim() && (
            <button
              onClick={() => handleSelect(query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              className="w-full text-left px-4 py-3 text-sm text-accent hover:bg-surface-2 border-t border-border flex items-center gap-2 font-medium"
            >
              <span>✨</span>
              <span>Search web &amp; generate report for "{query}"</span>
            </button>
          )}
        </div>
      )}
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
