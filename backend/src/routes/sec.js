/**
 * SEC EDGAR API routes
 * -----------------------------------------------------------------------------
 * Thin HTTP surface over the SEC service. All data originates from official
 * SEC EDGAR endpoints.
 *
 *   GET  /api/sec/lookup?q=Apple            resolve name|ticker|CIK
 *   POST /api/sec/sync/:identifier          resolve + sync filings (+ financials)
 *   GET  /api/sec/companies/:cik            stored SEC company + counts
 *   GET  /api/sec/companies/:cik/filings    stored filings (metadata)
 *   GET  /api/sec/companies/:cik/financials stored financials
 *   GET  /api/sec/companies/:cik/risks      stored risk factors
 *   GET  /api/sec/companies/:cik/intelligence stored filing intelligence JSON
 *   POST /api/sec/companies/:cik/intelligence/extract generate filing intelligence
 *   POST /api/sec/companies/:cik/search-index index SEC filings for semantic search
 *   GET  /api/sec/search?q=liquidity semantic SEC filing search
 *   POST /api/sec/ask evidence-only SEC filing Q&A
 *   GET  /api/sec/filings/:filingId/intelligence stored intelligence for one filing
 *   POST /api/sec/filings/:filingId/intelligence generate intelligence for one filing
 *   POST /api/sec/filings/:filingId/search-index index one SEC filing for search
 *   POST /api/sec/enrich/:companyId         enrich an existing PivotVault company
 */

const express = require('express');
const { secService, util } = require('../services/sec');

const router = express.Router();

/** Serialize Prisma results safely (BigInt -> string). */
function toJSON(data) {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

/** Resolve a :cik/:identifier param to a stored SecCompany (404 if none). */
async function loadCompany(ident) {
  return secService.getCompany(ident);
}

// GET /api/sec/dashboard?ciks=0000320193,0000789019  (or ?compare=AAPL,MSFT)
router.get('/dashboard', async (req, res, next) => {
  try {
    const raw =
      req.query.ciks ||
      req.query.compare ||
      req.query.cik ||
      req.query.q ||
      '';
    const identifiers = String(raw)
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!identifiers.length) {
      return res.status(400).json({
        error: 'Provide at least one company via ciks, compare, or cik query param',
        code: 'BAD_REQUEST',
      });
    }
    const dashboard = await secService.getDashboard(identifiers);
    res.json(toJSON(dashboard));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/lookup?q=...
router.get('/lookup', async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing query param "q"', code: 'BAD_REQUEST' });
    const result = await secService.resolve(q);
    if (!result) return res.status(404).json({ error: 'No SEC company matched', code: 'NOT_FOUND' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/sync/:identifier  body: { financials?, risk?, intelligence?, rag?, limitPerType? }
router.post('/sync/:identifier', async (req, res, next) => {
  try {
    const {
      financials = true,
      risk = false,
      intelligence = true,
      intelligenceLimit = 0,
      rag = true,
      ragLimit = 0,
      limitPerType = 0,
    } = req.body || {};
    const run = await secService.syncCompany(req.params.identifier, {
      financials,
      risk,
      intelligence,
      intelligenceLimit,
      rag,
      ragLimit,
      limitPerType,
    });
    if (run.errors?.length && !run.resolved) {
      return res.status(404).json(toJSON(run));
    }
    res.json(toJSON(run));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/search?q=...&cik=...&sectionKeys=riskFactors,mdna&limit=10
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim();
    if (!q) return res.status(400).json({ error: 'Missing query param "q"', code: 'BAD_REQUEST' });
    let secCompanyId = req.query.secCompanyId || null;
    if (!secCompanyId && req.query.cik) {
      const company = await loadCompany(req.query.cik);
      if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
      secCompanyId = company.id;
    }
    const results = await secService.searchFilings(q, {
      secCompanyId,
      sectionKeys: req.query.sectionKeys ? String(req.query.sectionKeys).split(',').map((s) => s.trim()).filter(Boolean) : null,
      limit: Math.min(Number(req.query.limit) || 10, 50),
    });
    res.json(toJSON({ query: q, results }));
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/ask  body: { query, cik?, secCompanyId?, sectionKeys?, limit? }
router.post('/ask', async (req, res, next) => {
  try {
    const q = String(req.body?.query || '').trim();
    if (!q) return res.status(400).json({ error: 'Missing body field "query"', code: 'BAD_REQUEST' });
    let secCompanyId = req.body?.secCompanyId || null;
    if (!secCompanyId && req.body?.cik) {
      const company = await loadCompany(req.body.cik);
      if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
      secCompanyId = company.id;
    }
    const answer = await secService.answerFromFilings(q, {
      secCompanyId,
      sectionKeys: Array.isArray(req.body?.sectionKeys) ? req.body.sectionKeys : null,
      limit: Math.min(Number(req.body?.limit) || 8, 50),
    });
    res.json(toJSON(answer));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/filings/:filingId/intelligence
router.get('/filings/:filingId/intelligence', async (req, res, next) => {
  try {
    const intelligence = await secService.getFilingIntelligence(req.params.filingId);
    if (!intelligence) return res.status(404).json({ error: 'SEC filing not found', code: 'NOT_FOUND' });
    res.json(toJSON(intelligence));
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/filings/:filingId/intelligence
router.post('/filings/:filingId/intelligence', async (req, res, next) => {
  try {
    const intelligence = await secService.extractFilingIntelligence(req.params.filingId);
    res.json(toJSON(intelligence));
  } catch (err) {
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
});

// POST /api/sec/filings/:filingId/search-index
router.post('/filings/:filingId/search-index', async (req, res, next) => {
  try {
    const result = await secService.indexFilingForSearch(req.params.filingId);
    res.json(toJSON(result));
  } catch (err) {
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
});

// GET /api/sec/companies/:cik
router.get('/companies/:cik', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    res.json(toJSON(company));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/companies/:cik/filings?type=TEN_K&limit=50
router.get('/companies/:cik/filings', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const type = req.query.type ? String(req.query.type).toUpperCase() : undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filings = await secService.getFilings(company.id, { type, limit });
    res.json(toJSON(filings));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/companies/:cik/financials?metricKey=revenue
router.get('/companies/:cik/financials', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const financials = await secService.getFinancials(company.id, {
      metricKey: req.query.metricKey,
      limit: Math.min(Number(req.query.limit) || 200, 1000),
    });
    res.json(toJSON(financials));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/companies/:cik/risks?category=cybersecurity
router.get('/companies/:cik/risks', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const risks = await secService.getRiskFactors(company.id, {
      category: req.query.category,
      limit: Math.min(Number(req.query.limit) || 200, 500),
    });
    res.json(toJSON(risks));
  } catch (err) {
    next(err);
  }
});

// GET /api/sec/companies/:cik/intelligence?limit=20
router.get('/companies/:cik/intelligence', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const intelligence = await secService.getCompanyIntelligence(company.id, {
      limit: Math.min(Number(req.query.limit) || 20, 100),
    });
    res.json(toJSON(intelligence));
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/companies/:cik/intelligence/extract  body: { limit? }
router.post('/companies/:cik/intelligence/extract', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const result = await secService.extractCompanyIntelligence(company.id, {
      limit: Math.min(Number(req.body?.limit) || 0, 100),
    });
    const intelligence = await secService.getCompanyIntelligence(company.id, {
      limit: Math.min(Number(req.body?.limit) || 20, 100),
    });
    res.json(toJSON({ result, intelligence }));
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/companies/:cik/search-index  body: { limit?, filingTypes? }
router.post('/companies/:cik/search-index', async (req, res, next) => {
  try {
    const company = await loadCompany(req.params.cik);
    if (!company) return res.status(404).json({ error: 'SEC company not found', code: 'NOT_FOUND' });
    const result = await secService.indexCompanyFilingsForSearch(company.id, {
      limit: Math.min(Number(req.body?.limit) || 0, 100),
      filingTypes: Array.isArray(req.body?.filingTypes) ? req.body.filingTypes : null,
    });
    res.json(toJSON(result));
  } catch (err) {
    next(err);
  }
});

// POST /api/sec/enrich/:companyId  body: { identifier?, financials?, risk?, intelligence?, rag? }
router.post('/enrich/:companyId', async (req, res, next) => {
  try {
    const { identifier, financials = true, risk = false, intelligence = true, rag = true } = req.body || {};
    const run = await secService.enrichCompany(req.params.companyId, { identifier, financials, risk, intelligence, rag });
    res.json(toJSON(run));
  } catch (err) {
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
});

module.exports = router;
