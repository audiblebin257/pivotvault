const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 100, 2000);
  }
});

connection.on('error', () => {
  // Silent catch when Redis is unavailable locally
});

// Define all agent queues
const crawlerQueue = new Queue('crawler-queue', { connection });
const readerQueue = new Queue('reader-queue', { connection });
const extractorQueue = new Queue('extractor-queue', { connection });
const validatorQueue = new Queue('validator-queue', { connection });
const knowledgeBuilderQueue = new Queue('knowledge-builder-queue', { connection });
const embeddingGeneratorQueue = new Queue('embedding-generator-queue', { connection });
const insightGeneratorQueue = new Queue('insight-generator-queue', { connection });
const reportGeneratorQueue = new Queue('report-generator-queue', { connection });

// Helper queues
const ingestionQueue = new Queue('ingestion-queue', { connection });
const retryQueue = new Queue('retry-queue', { connection });
const syncQueue = new Queue('sync-queue', { connection });

module.exports = {
  connection,
  // Agent queues
  crawlerQueue,
  readerQueue,
  extractorQueue,
  validatorQueue,
  knowledgeBuilderQueue,
  embeddingGeneratorQueue,
  insightGeneratorQueue,
  reportGeneratorQueue,
  // Helpers
  ingestionQueue,
  retryQueue,
  syncQueue
};
