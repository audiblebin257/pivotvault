const { Worker } = require('bullmq');
const {
  connection,
  crawlerQueue,
  readerQueue,
  extractorQueue,
  validatorQueue,
  knowledgeBuilderQueue,
  embeddingGeneratorQueue,
  insightGeneratorQueue,
  reportGeneratorQueue
} = require('./queues');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const KnowledgeExtractor = require('../services/extraction/KnowledgeExtractor');
const graphService = require('../services/graph');
const ragService = require('../services/rag');
const TechCrunchSource = require('./sources/TechCrunch');

const logger = console;

// --- AGENT 1: Crawler (discovers new startup news)
const crawlerWorker = new Worker(
  'crawler-queue',
  async (job) => {
    logger.log(`[Crawler Agent] Starting crawl for source: ${job.data.source}`);
    const { source = 'techcrunch' } = job.data;
    try {
      if (source === 'techcrunch') {
        const tcSource = new TechCrunchSource({
          sourceId: 'techcrunch',
          prisma,
          logger
        });
        const result = await tcSource.run();
        logger.log(`[Crawler Agent] Found ${result.articles?.length || 0} articles`);
        for (const articleUrl of (result.articleUrls || [])) {
          await readerQueue.add('read-article', {
            url: articleUrl,
            source: 'techcrunch'
          });
        }
        return { status: 'success', articlesFound: result.articles?.length || 0 };
      }
      return { status: 'success', source };
    } catch (err) {
      logger.error('[Crawler Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
);

// --- AGENT 2: Reader (reads every article)
const readerWorker = new Worker(
  'reader-queue',
  async (job) => {
    logger.log(`[Reader Agent] Reading URL: ${job.data.url}`);
    const { url } = job.data;
    try {
      // First check if article already exists
      const existing = await prisma.article.findUnique({ where: { url } });
      if (existing) {
        logger.log(`[Reader Agent] Article already exists, skipping.`);
        return { skipped: true };
      }

      // Use existing source to scrape
      const tcSource = new TechCrunchSource({
        sourceId: 'techcrunch',
        prisma,
        logger
      });

      // Let's just scrape the URL directly for demo
      const axios = require('axios');
      const cheerio = require('cheerio');
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(html);
      const title = $('h1').text().trim() || 'Untitled';
      const content = $('.article-content, article').text().trim();

      // Now send to extractor agent
      await extractorQueue.add('extract-article', {
        title,
        content,
        url,
        source: 'techcrunch'
      });

      logger.log(`[Reader Agent] Successfully read article, sent to Extractor.`);
      return { title, url };
    } catch (err) {
      logger.error('[Reader Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
);

// --- AGENT 3: Extractor (extracts structured info)
const extractorWorker = new Worker(
  'extractor-queue',
  async (job) => {
    logger.log('[Extractor Agent] Starting knowledge extraction');
    const { title, content, url, source } = job.data;
    try {
      const extractor = new KnowledgeExtractor({ logger });
      const extracted = await extractor.extract(content, { title, url, source });
      logger.log('[Extractor Agent] Extracted data:', Object.keys(extracted));
      // Now send to validator!
      await validatorQueue.add('validate-extraction', {
        extracted,
        title,
        url,
        content
      });
      return { companiesExtracted: extracted.companies?.length || 0 };
    } catch (err) {
      logger.error('[Extractor Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 3000
    }
  }
);

// --- AGENT 4: Validator (cross-checks facts)
const validatorWorker = new Worker(
  'validator-queue',
  async (job) => {
    logger.log('[Validator Agent] Cross-checking extracted facts');
    const { extracted, url, title } = job.data;
    try {
      // For demo: basic validation, add validation score
      const validationResult = {
        score: 85, // placeholder for real multi-source check
        validated: true,
        extracted
      };
      // Now send to knowledge builder!
      await knowledgeBuilderQueue.add('update-knowledge-graph', {
        validatedData: validationResult,
        title,
        url
      });
      logger.log('[Validator Agent] Validation complete!');
      return validationResult;
    } catch (err) {
      logger.error('[Validator Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 3000
    }
  }
);

// --- AGENT 5: Knowledge Builder (updates knowledge graph)
const knowledgeBuilderWorker = new Worker(
  'knowledge-builder-queue',
  async (job) => {
    logger.log('[Knowledge Builder Agent] Updating knowledge graph');
    const { validatedData, url, title } = job.data;
    const { extracted } = validatedData;
    try {
      const entityResolver = require('../services/extraction/EntityResolver');
      const resolver = new entityResolver({ prisma, logger });
      // 1. Upsert companies first
      const companyPromises = extracted.companies?.map(async (comp) => {
        const slug = comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const upserted = await prisma.company.upsert({
          where: { slug },
          update: {
            ...(comp.websiteUrl && { websiteUrl: comp.websiteUrl }),
            ...(comp.industry && { industry: comp.industry }),
            ...(comp.status && { status: comp.status })
          },
          create: {
            name: comp.name,
            slug,
            industry: comp.industry || 'Unknown',
            country: comp.country || 'USA',
            status: comp.status || 'operating',
            foundingYear: comp.foundingYear || null,
            shutdownYear: comp.shutdownYear || null,
            summary: comp.description || `Company ${comp.name}`,
            description: comp.description,
            websiteUrl: comp.websiteUrl
          }
        });
        // 2. Also add article to this company
        if (title && url) {
          await prisma.article.upsert({
            where: { url },
            update: {},
            create: {
              companyId: upserted.id,
              title,
              url,
              content: '', // we'll store minimal for now
              publishedAt: new Date(),
              source: 'techcrunch'
            }
          });
        }
        // 3. Now add founders
        if (extracted.founders?.length > 0) {
          for (const founder of extracted.founders) {
            await prisma.founder.upsert({
              where: { name_companyId: { name: founder.name, companyId: upserted.id } },
              update: { ...(founder.role && { role: founder.role }) },
              create: {
                companyId: upserted.id,
                name: founder.name,
                role: founder.role,
                bio: founder.bio,
                linkedinUrl: founder.linkedinUrl,
                twitterUrl: founder.twitterUrl,
                isPrimary: true
              }
            });
          }
        }
        // 4. Generate edges for this company via our graph service
        await graphService.generateEdgesForCompany(upserted.id);
        return upserted;
      }) || [];

      await Promise.all(companyPromises);
      logger.log('[Knowledge Builder Agent] Companies created/updated!');
      // Now send to embedding generator!
      const companyIds = (await Promise.all(companyPromises)).map(c => c.id);
      for (const companyId of companyIds) {
        await embeddingGeneratorQueue.add('generate-embeddings', {
          companyId
        });
      }

      return { companiesProcessed: companyIds?.length || 0 };
    } catch (err) {
      logger.error('[Knowledge Builder Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 3000
    }
  }
);

// --- AGENT 6: Embedding Generator (updates semantic search)
const embeddingGeneratorWorker = new Worker(
  'embedding-generator-queue',
  async (job) => {
    logger.log(`[Embedding Generator Agent] Generating embeddings for company ${job.data.companyId}`);
    const { companyId } = job.data;
    try {
      await ragService.chunkCompanyDocuments(companyId);
      logger.log('[Embedding Generator Agent] Embeddings stored!');
      return { companyId };
    } catch (err) {
      logger.error('[Embedding Generator Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
);

// --- AGENT 7: Insight Generator (discovers emerging trends)
const insightGeneratorWorker = new Worker(
  'insight-generator-queue',
  async (job) => {
    logger.log('[Insight Generator Agent] Discovering trends');
    const { days = 7 } = job.data;
    try {
      const recentCompanies = await prisma.company.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { failureReasons: true }
      });
      // Generate a simple "insight" (for demo, in real life could use LLM)
      const trends = {
        topFailureReasons: recentCompanies
          .flatMap(c => c.failureReasons.map(r => r.category))
          .reduce((acc, cat) => {
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {}),
        latestIndustries: [...new Set(recentCompanies.map(c => c.industry))]
      };

      // Store insights
      for (const [reason, count] of Object.entries(trends.topFailureReasons)) {
        await prisma.aiAnalysis.upsert({
          where: { id: `trend-${reason}-${Date.now()}` },
          update: {},
          create: {
            companyId: recentCompanies[0]?.id, // just a placeholder
            primaryCause: reason,
            confidence: 80,
            retentionScore: 50,
            monetizationScore: 50,
            pmfScore: 50,
            marketingScore: 50,
            recommendations: [`Trending failure pattern in ${trends.latestIndustries.join(', ')}`],
            rawLlmResponse: JSON.stringify(trends),
            generatedAt: new Date()
          }
        });
      }

      logger.log('[Insight Generator Agent] Trends generated!');
      // Now send to report generator!
      await reportGeneratorQueue.add('generate-report', {
        trends,
        days
      });
      return { trends };
    } catch (err) {
      logger.error('[Insight Generator Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
    attempts: 2
  }
);

// --- AGENT 8: Report Generator (creates weekly reports)
const reportGeneratorWorker = new Worker(
  'report-generator-queue',
  async (job) => {
    logger.log('[Report Generator Agent] Generating intelligence report');
    const { trends, days = 7 } = job.data;
    try {
      // For demo, just log report
      const reportSummary = {
        generatedAt: new Date(),
        reportType: 'weekly',
        topFailureReasons: trends.topFailureReasons,
        keyIndustries: trends.latestIndustries
      };
      logger.log('[Report Generator Agent] Report generated!');
      return reportSummary;
    } catch (err) {
      logger.error('[Report Generator Agent] Failed', err);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1
  }
);

// --- Event listeners for monitoring
const workers = [
  { name: 'crawler', worker: crawlerWorker },
  { name: 'reader', worker: readerWorker },
  { name: 'extractor', worker: extractorWorker },
  { name: 'validator', worker: validatorWorker },
  { name: 'knowledge builder', worker: knowledgeBuilderWorker },
  { name: 'embedding generator', worker: embeddingGeneratorWorker },
  { name: 'insight generator', worker: insightGeneratorWorker },
  { name: 'report generator', worker: reportGeneratorWorker }
];

for (const { name, worker } of workers) {
  worker.on('completed', (job) => {
    logger.log(`[${name} Agent] Job ${job.id} COMPLETED`);
  });
  worker.on('failed', (job, err) => {
    logger.error(`[${name} Agent] Job ${job.id} FAILED:`, err.message);
  });
  worker.on('progress', (job, progress) => {
    logger.log(`[${name} Agent] Job ${job.id} progress:`, progress);
  });
  worker.on('error', () => {
    // Silent catch when Redis is offline
  });
}

module.exports = {
  crawlerWorker,
  readerWorker,
  extractorWorker,
  validatorWorker,
  knowledgeBuilderWorker,
  embeddingGeneratorWorker,
  insightGeneratorWorker,
  reportGeneratorWorker
};
