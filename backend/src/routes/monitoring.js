const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { connection, ingestionQueue, syncQueue, embeddingQueue, retryQueue } = require('../pipeline/queues');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/monitoring - get pipeline metrics
router.get('/', async (req, res) => {
  try {
    const [companiesCount, articlesCount, failuresCount, duplicatesCount, importRecords] = await Promise.all([
      prisma.company.count(),
      prisma.article.count(),
      prisma.importRecord.count({ where: { status: 'failed' } }),
      prisma.companyDuplicate.count(),
      prisma.importRecord.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const queueCounts = {
      ingestion: (await ingestionQueue.getJobCounts()).waiting,
      sync: (await syncQueue.getJobCounts()).waiting,
      embedding: (await embeddingQueue.getJobCounts()).waiting,
      retry: (await retryQueue.getJobCounts()).waiting
    };

    res.json({
      companiesCount,
      articlesCount,
      failuresCount,
      duplicatesCount,
      queueCounts,
      importRecords
    });
  } catch (err) {
    console.error('Failed to get monitoring data:', err);
    res.status(500).json({ error: 'Failed to get monitoring data' });
  }
});

// GET /api/monitoring/trigger/sync/:sourceType - trigger manual sync
router.post('/trigger/sync/:sourceType', async (req, res) => {
  try {
    const { sourceType } = req.params;
    const job = await ingestionQueue.add(
      `manual-sync-${sourceType}`,
      {
        sourceId: `manual-${sourceType}`,
        sourceType
      }
    );

    res.json({
      success: true,
      jobId: job.id
    });
  } catch (err) {
    console.error('Failed to trigger sync:', err);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

module.exports = router;
