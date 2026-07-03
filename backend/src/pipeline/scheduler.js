const cron = require('node-cron');
const {
  crawlerQueue,
  insightGeneratorQueue,
  reportGeneratorQueue
} = require('./queues');
const logger = console;

function startSchedulers() {
  logger.log('[Scheduler] Starting...');

  // --- SCHEDULE 1: Crawl for new articles every hour
  // cron.schedule('0 * * * *', async () => {
  // For development, let's just schedule every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.log('[Scheduler] Triggering Crawler Agent...');
    await crawlerQueue.add('crawl-techcrunch', {
      source: 'techcrunch'
    });
  });

  // --- SCHEDULE 2: Generate insights weekly
  cron.schedule('0 3 * * 0', async () => { // 3 AM UTC every Sunday
    logger.log('[Scheduler] Triggering Insight Generator...');
    await insightGeneratorQueue.add('generate-insights', {
      days: 7
    });
  });

  // --- SCHEDULE 3: Generate weekly report right after insights
  // (though Insight Generator already triggers it, nice to have backup)
  cron.schedule('0 4 * * 0', async () => {
    logger.log('[Scheduler] Triggering Report Generator...');
    await reportGeneratorQueue.add('generate-weekly-report', {
      days: 7
    });
  });

  logger.log('[Scheduler] All agents scheduled successfully!');
}

module.exports = {
  startSchedulers
};
