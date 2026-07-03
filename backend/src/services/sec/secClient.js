/**
 * SEC EDGAR HTTP client
 * -----------------------------------------------------------------------------
 * The single choke-point for every request to sec.gov / data.sec.gov.
 *
 * Responsibilities:
 *   - Enforce SEC's Fair Access policy: a descriptive User-Agent with contact
 *     info (required) and a hard cap of <=10 requests/second (token bucket).
 *   - Conditional GETs using ETag / Last-Modified stored in the cache so SEC
 *     can reply 304 and we never re-download unchanged filings.
 *   - Automatic retry with exponential backoff on 429/5xx and network errors.
 *   - Emit per-request metrics (downloads, bytes, retries, errors) so the
 *     scheduler can report them.
 *
 * SEC docs: https://www.sec.gov/os/webmaster-faq#developers
 */

const axios = require('axios');
const { sharedCache } = require('./cache');

const SEC_WWW = 'https://www.sec.gov';
const SEC_DATA = 'https://data.sec.gov';

// SEC requires a User-Agent that identifies the app and a contact address.
// Override via SEC_USER_AGENT in the environment for production deployments.
const DEFAULT_UA =
  process.env.SEC_USER_AGENT ||
  'PivotVault/1.0 (research; contact: admin@pivotvault.app)';

const MAX_REQUESTS_PER_SECOND = 8; // headroom under SEC's 10/s ceiling
const MAX_RETRIES = 4;

/**
 * Simple async token bucket. Refills continuously up to `rps` tokens/second.
 * Callers `await bucket.take()` before each request.
 */
class TokenBucket {
  constructor(rps) {
    this.capacity = rps;
    this.tokens = rps;
    this.refillPerMs = rps / 1000;
    this.last = Date.now();
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.last;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
      this.last = now;
    }
  }

  async take() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Wait for exactly enough time to earn one token, then retry.
    const waitMs = Math.ceil((1 - this.tokens) / this.refillPerMs);
    await new Promise((r) => setTimeout(r, waitMs));
    return this.take();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class SecClient {
  constructor({ cache = sharedCache, logger = console, userAgent = DEFAULT_UA } = {}) {
    this.cache = cache;
    this.logger = logger;
    this.userAgent = userAgent;
    this.bucket = new TokenBucket(MAX_REQUESTS_PER_SECOND);
    this.http = axios.create({
      timeout: 30000,
      // We handle non-2xx ourselves (notably 304), so accept a wide range.
      validateStatus: (s) => s >= 200 && s < 500,
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': 'gzip, deflate',
      },
    });
    // Per-process request metrics; reset with resetMetrics().
    this.metrics = { downloads: 0, notModified: 0, retries: 0, errors: 0, bytes: 0 };
  }

  resetMetrics() {
    this.metrics = { downloads: 0, notModified: 0, retries: 0, errors: 0, bytes: 0 };
  }

  getMetrics() {
    return { ...this.metrics, cache: this.cache.getStats() };
  }

  /**
   * Core conditional GET with rate limiting, caching and retry/backoff.
   *
   * @param {string} url absolute SEC url
   * @param {object} opts
   * @param {'json'|'text'} [opts.responseType='json']
   * @param {boolean} [opts.useCache=true] use TTL body cache + ETag revalidation
   * @param {number} [opts.ttlMs] override cache TTL for this url
   * @returns {Promise<{ data:any, status:number, fromCache:boolean, etag?:string, lastModified?:string }>}
   */
  async get(url, opts = {}) {
    const { responseType = 'json', useCache = true, ttlMs } = opts;

    if (useCache) {
      const cached = await this.cache.getBody(url);
      if (cached !== null) {
        return { data: cached, status: 200, fromCache: true };
      }
    }

    const conditionalHeaders = {};
    if (useCache) {
      const validators = await this.cache.getValidators(url);
      if (validators?.etag) conditionalHeaders['If-None-Match'] = validators.etag;
      if (validators?.lastModified) conditionalHeaders['If-Modified-Since'] = validators.lastModified;
    }

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.bucket.take();
      try {
        const res = await this.http.get(url, {
          responseType: responseType === 'json' ? 'json' : 'text',
          headers: conditionalHeaders,
        });

        const etag = res.headers?.etag;
        const lastModified = res.headers?.['last-modified'];

        // 304 → cached body is still valid; refresh its TTL and return it.
        if (res.status === 304) {
          this.metrics.notModified++;
          await this.cache.touch(url, ttlMs);
          const cached = useCache ? await this.cache.getBody(url) : null;
          return { data: cached, status: 304, fromCache: true, etag, lastModified };
        }

        // 429 / 403 (SEC throttles with 403 sometimes) → back off and retry.
        if (res.status === 429 || res.status === 403) {
          if (attempt < MAX_RETRIES) {
            attempt++;
            this.metrics.retries++;
            const backoff = this._backoff(attempt, res.headers?.['retry-after']);
            this.logger.warn?.(`[SEC] ${res.status} on ${url} — retry ${attempt}/${MAX_RETRIES} in ${backoff}ms`);
            await sleep(backoff);
            continue;
          }
          this.metrics.errors++;
          throw new Error(`SEC request throttled (${res.status}) after ${attempt} retries: ${url}`);
        }

        if (res.status >= 400) {
          this.metrics.errors++;
          throw new Error(`SEC request failed ${res.status}: ${url}`);
        }

        // Success.
        this.metrics.downloads++;
        const size = Number(res.headers?.['content-length']) ||
          (typeof res.data === 'string' ? Buffer.byteLength(res.data) : JSON.stringify(res.data).length);
        this.metrics.bytes += size;

        if (useCache) {
          await this.cache.setBody(url, res.data, ttlMs);
          await this.cache.setValidators(url, { etag, lastModified });
        }
        return { data: res.data, status: res.status, fromCache: false, etag, lastModified, sizeBytes: size };
      } catch (err) {
        // Network-level error (timeout, DNS, reset) → retry with backoff.
        const isNetwork = !err.response;
        if (isNetwork && attempt < MAX_RETRIES) {
          attempt++;
          this.metrics.retries++;
          const backoff = this._backoff(attempt);
          this.logger.warn?.(`[SEC] network error on ${url} (${err.code || err.message}) — retry ${attempt}/${MAX_RETRIES} in ${backoff}ms`);
          await sleep(backoff);
          continue;
        }
        this.metrics.errors++;
        throw err;
      }
    }
  }

  /** Exponential backoff with jitter; honours Retry-After when present. */
  _backoff(attempt, retryAfterHeader) {
    if (retryAfterHeader) {
      const secs = Number(retryAfterHeader);
      if (!Number.isNaN(secs)) return secs * 1000;
    }
    const base = Math.min(1000 * 2 ** (attempt - 1), 8000);
    return base + Math.floor(base * 0.25 * Math.random());
  }

  // ---- Convenience wrappers for the SEC endpoints we use -------------------

  /** Ticker/CIK/name directory (~small, cache long). */
  async getCompanyTickers() {
    const { data } = await this.get(`${SEC_WWW}/files/company_tickers.json`, {
      ttlMs: 24 * 60 * 60 * 1000, // 24h — this file changes rarely
    });
    return data;
  }

  /** Full submissions/filings history for a 10-digit CIK. */
  async getSubmissions(cik10) {
    const { data, ...meta } = await this.get(`${SEC_DATA}/submissions/CIK${cik10}.json`);
    return { data, meta };
  }

  /** XBRL "company facts" — every reported financial concept for a CIK. */
  async getCompanyFacts(cik10) {
    const { data } = await this.get(`${SEC_DATA}/api/xbrl/companyfacts/CIK${cik10}.json`);
    return data;
  }

  /** Raw filing document (HTML/txt) by absolute Archives URL. */
  async getDocument(url) {
    const { data, sizeBytes, etag } = await this.get(url, { responseType: 'text' });
    return { content: data, sizeBytes, etag };
  }

  /** Directory index (JSON) for a filing's folder in the Archives. */
  async getFilingIndex(cik, accessionNoDashes) {
    const url = `${SEC_WWW}/Archives/edgar/data/${Number(cik)}/${accessionNoDashes}/index.json`;
    const { data } = await this.get(url);
    return data;
  }
}

// Shared singleton client.
const sharedClient = new SecClient();

module.exports = { SecClient, sharedClient, SEC_WWW, SEC_DATA, DEFAULT_UA };
