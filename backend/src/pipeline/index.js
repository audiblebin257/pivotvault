require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const logger = console;

const prisma = new PrismaClient();

const { connection, syncQueue, ingestionQueue } = require('./queues');
const { ingestionWorker, embeddingWorker, retryWorker } = require('./workers');
const { startSchedulers } = require('./scheduler');

logger.log('Starting PivotVault Pipeline...');

async function startPipeline() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.log('✅ Connected to database');
    
    // Start workers
    logger.log('🚀 Starting ingestion worker...');
    await ingestionWorker.waitUntilReady();
    
    logger.log('🚀 Starting embedding worker...');
    await embeddingWorker.waitUntilReady();

    logger.log('🚀 Starting retry worker...');
    await retryWorker.waitUntilReady();
    
    // Start schedulers
    startSchedulers();
    logger.log('✅ Schedulers started!');

    // Add test job to ingestion queue
    await ingestionQueue.add('pipeline-test', {
      sourceId: 'techcrunch',
      sourceType: 'techcrunch'
    }, { jobId: 'pipeline-test' });

    logger.log('✅ Pipeline started successfully!');
  } catch (err) {
    logger.error('❌ Failed to start pipeline:', err);
    process.exit(1);
  }
}

startPipeline();
