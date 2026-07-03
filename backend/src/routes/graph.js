const express = require('express');
const GraphService = require('../services/graph');

const router = express.Router();

// 1. Get graph data (for D3 visualization)
router.get('/data', async (req, res, next) => {
  try {
    const { companyId, limit = 100 } = req.query;
    const graphData = await GraphService.getGraphData({
      companyId,
      limit: Math.min(parseInt(limit) || 100, 500),
    });
    res.json(graphData);
  } catch (err) {
    next(err);
  }
});

// 2. Generate edges for a company
router.post('/edges/generate', async (req, res, next) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });
    const count = await GraphService.generateEdgesForCompany(companyId);
    res.json({ success: true, edgesCreated: count });
  } catch (err) {
    next(err);
  }
});

// 3. Regenerate ALL edges (admin use only)
router.post('/edges/regenerate-all', async (req, res, next) => {
  try {
    const total = await GraphService.regenerateAllEdges();
    res.json({ success: true, totalEdges: total });
  } catch (err) {
    next(err);
  }
});

// 4. Find shortest path between two companies
router.get('/shortest-path', async (req, res, next) => {
  try {
    const { fromCompanyId, toCompanyId, maxDepth = 3 } = req.query;
    if (!fromCompanyId || !toCompanyId) {
      return res.status(400).json({ error: 'Both fromCompanyId and toCompanyId are required' });
    }
    const path = await GraphService.findShortestPath(
      fromCompanyId,
      toCompanyId,
      parseInt(maxDepth)
    );
    res.json({ path, exists: path !== null });
  } catch (err) {
    next(err);
  }
});

// 5. Find similar companies
router.get('/similar/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { limit = 10 } = req.query;
    const similar = await GraphService.findSimilarCompanies(
      companyId,
      Math.min(parseInt(limit) || 10, 50)
    );
    res.json({ companies: similar });
  } catch (err) {
    next(err);
  }
});

// 6. Find related failures
router.get('/related-failures/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { limit = 10 } = req.query;
    const failures = await GraphService.findRelatedFailures(
      companyId,
      Math.min(parseInt(limit) || 10, 50)
    );
    res.json({ companies: failures });
  } catch (err) {
    next(err);
  }
});

// 7. Communities (simple: industry-based)
router.get('/communities', async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const communities = await prisma.company.groupBy({
      by: ['industry'],
      _count: { id: true },
      having: { _count: { id: { gte: 2 } } },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({ communities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
