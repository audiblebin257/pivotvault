/**
 * On-demand company search / import / cache API (PivotVault V2).
 *
 *   GET  /api/companies/search?q=Tesla     search DB → auto-import if missing
 *   POST /api/companies/import             body: { identifier }
 *   GET  /api/companies/status/:id         import job status + progress
 *   POST /api/companies/refresh/:id        refresh SEC data + embeddings
 */

const express = require('express');
const companyImport = require('../services/companyImport');

const router = express.Router();

function toJSON(data) {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

// GET /api/companies/search?q=Tesla
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || req.query.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing query param "q"', code: 'BAD_REQUEST' });
    }
    const result = await companyImport.search(String(q).trim());
    res.json(toJSON(result));
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/import  body: { identifier, query? }
router.post('/import', async (req, res, next) => {
  try {
    const identifier = req.body?.identifier || req.body?.query || req.body?.q;
    if (!identifier) {
      return res.status(400).json({ error: 'Missing body field "identifier"', code: 'BAD_REQUEST' });
    }
    const result = await companyImport.importCompany(String(identifier).trim());
    res.json(toJSON(result));
  } catch (err) {
    if (/not found|invalid/i.test(err.message)) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
});

// GET /api/companies/status/:id
router.get('/status/:id', async (req, res, next) => {
  try {
    const status = await companyImport.getStatus(req.params.id);
    if (!status) return res.status(404).json({ error: 'Import job not found', code: 'NOT_FOUND' });
    res.json(toJSON(status));
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/refresh/:id
router.post('/refresh/:id', async (req, res, next) => {
  try {
    const status = await companyImport.refreshCompany(req.params.id);
    res.json(toJSON(status));
  } catch (err) {
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
});

module.exports = router;
