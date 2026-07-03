/**
 * Company lookup & resolution
 * -----------------------------------------------------------------------------
 * Resolves any of { company name, ticker, CIK } to ONE canonical SEC company,
 * using the official SEC ticker directory (company_tickers.json).
 *
 *   "Apple"        -> Apple Inc.  (fuzzy name match)
 *   "AAPL"         -> Apple Inc.  (exact ticker)
 *   "0000320193"   -> Apple Inc.  (CIK)
 *
 * All three collapse onto CIK 0000320193. Resolution can optionally persist /
 * upsert the resolved entity into `sec_companies` and link it to an existing
 * PivotVault Company row when a confident name match exists.
 */

const { PrismaClient } = require('@prisma/client');
const { sharedClient } = require('./secClient');
const {
  padCik,
  similarity,
  looksLikeCik,
  looksLikeTicker,
  normalizeName,
} = require('./util');

const prisma = new PrismaClient();

const FUZZY_THRESHOLD = 0.6;

class CompanyLookup {
  constructor({ client = sharedClient, logger = console } = {}) {
    this.client = client;
    this.logger = logger;
    /**
     * Lazily-built directory index:
     *   byCik:    Map<cik10, entry>
     *   byTicker: Map<TICKER, entry>
     *   list:     entry[]   (for fuzzy scans)
     * entry = { cik: '0000320193', tickers: ['AAPL'], name: 'Apple Inc.' }
     */
    this._index = null;
  }

  /** Build (once) and return the in-memory ticker directory index. */
  async _getIndex() {
    if (this._index) return this._index;
    const raw = await this.client.getCompanyTickers();
    const byCik = new Map();
    const byTicker = new Map();

    // company_tickers.json is an object keyed by row number.
    for (const key of Object.keys(raw)) {
      const row = raw[key];
      if (!row || row.cik_str === undefined) continue;
      const cik = padCik(row.cik_str);
      const ticker = (row.ticker || '').toUpperCase();
      const name = row.title || '';

      let entry = byCik.get(cik);
      if (!entry) {
        entry = { cik, tickers: [], name };
        byCik.set(cik, entry);
      }
      if (ticker && !entry.tickers.includes(ticker)) {
        entry.tickers.push(ticker);
        byTicker.set(ticker, entry);
      }
    }

    this._index = { byCik, byTicker, list: [...byCik.values()] };
    this.logger.log?.(`[SEC:lookup] directory indexed: ${byCik.size} companies, ${byTicker.size} tickers`);
    return this._index;
  }

  /**
   * Resolve an identifier to a single canonical company (no DB write).
   * @param {string} identifier name | ticker | CIK
   * @returns {Promise<{ cik, tickers, name, matchType, score, candidates? }|null>}
   */
  async resolve(identifier) {
    if (!identifier || !String(identifier).trim()) return null;
    const input = String(identifier).trim();
    const { byCik, byTicker, list } = await this._getIndex();

    // 1. CIK (all digits) — exact.
    if (looksLikeCik(input)) {
      const cik = padCik(input);
      const entry = byCik.get(cik);
      if (entry) return { ...entry, matchType: 'cik', score: 1 };
      // A valid-looking CIK not in the ticker file may still be a real filer
      // (private/foreign filers without tickers). Accept it verbatim.
      return { cik, tickers: [], name: null, matchType: 'cik', score: 0.9 };
    }

    // 2. Ticker — exact (case-insensitive).
    if (looksLikeTicker(input)) {
      const entry = byTicker.get(input.toUpperCase());
      if (entry) return { ...entry, matchType: 'ticker', score: 1 };
    }

    // 3. Name — fuzzy scan.
    const scored = list
      .map((e) => ({ entry: e, score: similarity(input, e.name) }))
      .filter((s) => s.score >= FUZZY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!scored.length) return null;

    const best = scored[0];
    return {
      ...best.entry,
      matchType: 'name',
      score: Number(best.score.toFixed(3)),
      candidates: scored.slice(1).map((s) => ({
        cik: s.entry.cik,
        name: s.entry.name,
        tickers: s.entry.tickers,
        score: Number(s.score.toFixed(3)),
      })),
    };
  }

  /**
   * Resolve AND upsert into sec_companies. Optionally link to an existing
   * PivotVault Company by confident name match.
   * @returns {Promise<{ secCompany, resolution }|null>}
   */
  async resolveAndStore(identifier, { linkCompany = true } = {}) {
    const resolution = await this.resolve(identifier);
    if (!resolution) {
      this.logger.warn?.(`[SEC:lookup] no match for "${identifier}"`);
      return null;
    }

    let companyId = null;
    if (linkCompany && resolution.name) {
      companyId = await this._findPivotVaultCompanyId(resolution.name);
    }

    const secCompany = await prisma.secCompany.upsert({
      where: { cik: resolution.cik },
      update: {
        tickers: resolution.tickers,
        ...(resolution.name ? { name: resolution.name } : {}),
        ...(companyId ? { companyId } : {}),
      },
      create: {
        cik: resolution.cik,
        tickers: resolution.tickers,
        name: resolution.name || `CIK ${resolution.cik}`,
        companyId,
      },
    });

    return { secCompany, resolution };
  }

  /** Best-effort match of a SEC name to an existing Company row. */
  async _findPivotVaultCompanyId(secName) {
    const norm = normalizeName(secName);
    if (!norm) return null;
    // Cheap prefilter: candidates sharing the first significant token.
    const firstToken = norm.split(' ')[0];
    if (!firstToken) return null;
    const candidates = await prisma.company.findMany({
      where: { name: { contains: firstToken, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 25,
    });
    let best = null;
    for (const c of candidates) {
      const score = similarity(secName, c.name);
      if (score >= 0.8 && (!best || score > best.score)) best = { id: c.id, score };
    }
    return best?.id || null;
  }
}

const sharedLookup = new CompanyLookup();

module.exports = { CompanyLookup, sharedLookup, FUZZY_THRESHOLD };
