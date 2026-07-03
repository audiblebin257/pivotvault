const express = require('express');
const ragService = require('../services/rag');
const router = express.Router();

// 1. CHUNK & EMBED COMPANY DOCS
router.post('/chunk-company', async (req, res, next) => {
  try {
    const { companyId } = req.body;
    const result = await ragService.chunkCompanyDocuments(companyId);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Chunk company error:', err);
    res.status(500).json({ error: 'Failed to chunk documents' });
  }
});

// 2. HYBRID SEARCH
router.get('/search', async (req, res, next) => {
  try {
    const { query, companyId, limit, chunkTypes } = req.query;
    const chunks = await ragService.hybridSearch(query, {
      companyId,
      limit: parseInt(limit) || 10,
      chunkTypes: chunkTypes ? chunkTypes.split(',') : null
    });
    res.json({ chunks });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 3. RAG QUESTION ANSWERING
router.post('/ask', async (req, res, next) => {
  try {
    const { query, companyId } = req.body;
    const result = await ragService.generateRAGAnswer(query, {
      companyId
    });
    res.json(result);
  } catch (err) {
    console.error('RAG error:', err);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

module.exports = router;
