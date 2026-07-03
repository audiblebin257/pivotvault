const BaseSource = require('./BaseSource');
const axios = require('axios');

class TechCrunchSource extends BaseSource {
  constructor({ sourceId, prisma, logger = console }) {
    super({ sourceId, prisma, logger });
  }

  async fetch() {
    this.logger.log('Fetching from TechCrunch...');

    const url = 'https://techcrunch.com/wp-json/wp/v2/posts?per_page=10';
    const response = await axios.get(url);

    // Map to standardized format
    return response.data.map(post => ({
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      url: post.link,
      publishedAt: post.date_gmt,
      author: post.yoast_head_json?.author || '',
      summary: post.excerpt?.rendered || ''
    }));
  }

  async detectDuplicate(record) {
    if (!record.url) return { isDuplicate: false, confidence: 0 };
    const existing = await this.prisma.article.findFirst({
      where: { url: record.url }
    });
    return { isDuplicate: !!existing, confidence: existing ? 0.95 : 0, existingRecordId: existing?.id };
  }

  async store(validatedRecord) {
    // Store in database
    const { structured, text, ...articleData } = validatedRecord;
    const article = await this.prisma.article.upsert({
      where: { url: articleData.url },
      update: articleData,
      create: articleData,
      include: { company: true }
    });
    return article;
  }
}

module.exports = TechCrunchSource;
