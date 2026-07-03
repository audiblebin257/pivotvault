const BaseImporter = require('../../services/etl/base');
const axios = require('axios');
const cheerio = require('cheerio');
const striptags = require('striptags');
const _ = require('lodash');
const { DuplicateDetectionService } = require('../../services/duplicateDetection');
const { KnowledgeExtractor } = require('../../services/extraction');

class BaseSource extends BaseImporter {
  constructor({ sourceId, prisma, logger = console }) {
    super({ sourceId, prisma, logger });
    this.duplicateService = new DuplicateDetectionService(prisma, logger);
    this.knowledgeExtractor = new KnowledgeExtractor({ logger });
    this.source = null;
  }

  // To be overridden by subclasses
  async fetch() {
    throw new Error('fetch() must be implemented');
  }

  // Clean HTML
  cleanHTML(html) {
    const $ = cheerio.load(html);
    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, footer, header').remove();
    // Extract main content
    const articleSelectors = ['article', '.post-content', '.entry-content', '.content', '#main-content', 'main'];
    let content = '';
    for (const selector of articleSelectors) {
      const el = $(selector).first();
      if (el.length) {
        content = el.html() || '';
        break;
      }
    }
    // If no main content found, just get body
    if (!content) content = $('body').html() || '';
    // Clean content
    const cleaned = striptags(content, [], '\n').trim();
    // Remove multiple newlines and whitespace
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // Extract text
  extractText(rawData) {
    if (typeof rawData === 'string') return rawData;
    if (rawData.html) return this.cleanHTML(rawData.html);
    if (rawData.content) return rawData.content;
    return '';
  }

  // Extract structured data from text using AI
  async extractStructuredData(text, context = {}) {
    return await this.knowledgeExtractor.extract(text, context);
  }

  async validate(record) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      confidence: 0.8
    };
  }

  async transform(rawData) {
    // Transform raw data into standardized format
    const articles = Array.isArray(rawData) ? rawData : [rawData];
    return Promise.all(articles.map(async (article) => {
      const text = this.extractText(article);
      const structured = await this.extractStructuredData(text, article);
      return {
        ...article,
        text,
        structured
      };
    }));
  }

  async store(validatedRecord) {
    // Store extracted data into database
    this.logger.log('Storing validated record:', validatedRecord);
    return null;
  }
}

module.exports = BaseSource;
