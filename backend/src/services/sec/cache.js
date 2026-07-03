/**
 * SEC EDGAR local cache
 * -----------------------------------------------------------------------------
 * A small in-memory cache with two responsibilities:
 *   1. TTL cache of response bodies keyed by URL, so repeated reads inside a
 *      sync window never hit SEC twice.
 *   2. ETag / Last-Modified store, so conditional requests (If-None-Match /
 *      If-Modified-Since) let SEC answer 304 instead of resending payloads.
 *
 * This intentionally has no external dependency (Redis is available in the
 * project via ioredis, but SEC syncs are low-volume and a single-process
 * Map keeps the module runnable without a Redis instance). The public shape
 * is async so a Redis-backed implementation can be dropped in later without
 * touching callers.
 */

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ENTRIES = 500;

class SecCache {
  constructor({ ttlMs = DEFAULT_TTL_MS, maxEntries = MAX_ENTRIES } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    /** @type {Map<string, { body: any, expiresAt: number }>} */
    this.bodies = new Map();
    /** @type {Map<string, { etag?: string, lastModified?: string }>} */
    this.validators = new Map();
    this.stats = { hits: 0, misses: 0, revalidations: 0 };
  }

  _evictIfNeeded() {
    if (this.bodies.size <= this.maxEntries) return;
    // Map preserves insertion order → drop the oldest entry (simple LRU-ish).
    const oldestKey = this.bodies.keys().next().value;
    if (oldestKey !== undefined) this.bodies.delete(oldestKey);
  }

  /** Return a cached body if present and unexpired, else null. */
  async getBody(url) {
    const entry = this.bodies.get(url);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.bodies.delete(url);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.body;
  }

  /** Store a body under a URL with an optional per-entry TTL override. */
  async setBody(url, body, ttlMs = this.ttlMs) {
    this.bodies.set(url, { body, expiresAt: Date.now() + ttlMs });
    this._evictIfNeeded();
  }

  /** The stored ETag / Last-Modified for conditional requests, if any. */
  async getValidators(url) {
    return this.validators.get(url) || null;
  }

  /** Persist ETag / Last-Modified returned by SEC for future revalidation. */
  async setValidators(url, { etag, lastModified } = {}) {
    if (!etag && !lastModified) return;
    const existing = this.validators.get(url) || {};
    this.validators.set(url, {
      etag: etag || existing.etag,
      lastModified: lastModified || existing.lastModified,
    });
  }

  /** Called when a 304 confirms the cached body is still fresh. */
  async touch(url, ttlMs = this.ttlMs) {
    this.stats.revalidations++;
    const entry = this.bodies.get(url);
    if (entry) entry.expiresAt = Date.now() + ttlMs;
  }

  getStats() {
    return { ...this.stats, size: this.bodies.size };
  }

  clear() {
    this.bodies.clear();
    this.validators.clear();
  }
}

// Shared singleton — one cache per process is what we want.
const sharedCache = new SecCache();

module.exports = { SecCache, sharedCache };
