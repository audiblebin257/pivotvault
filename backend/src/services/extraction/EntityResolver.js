const _ = require('lodash');
const { DuplicateDetectionService } = require('../duplicateDetection');

class EntityResolver {
  constructor({ prisma, logger = console }) {
    this.prisma = prisma;
    this.logger = logger;
    this.duplicateService = new DuplicateDetectionService(prisma, logger);
  }

  // Normalize company name
  normalizeCompanyName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '').trim();
  }

  // Resolve a company from extracted data, or create new
  async resolveCompany(extractedCompany) {
    this.logger.log('Resolving company:', extractedCompany);
    // First, try to find by name or website
    const normalizedName = this.normalizeCompanyName(extractedCompany.name);

    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [
          { name: { equals: extractedCompany.name, mode: 'insensitive' },
          { websiteUrl: extractedCompany.websiteUrl },
          { alternativeNames: { has: normalizedName }
        ]
      }
    });

    if (existing) {
      this.logger.log('Found existing company:', existing.id);
      return {
        isNew: false, entity: existing, confidence: 0.95 };
    }

    // Create new
    const newCompany = await this.prisma.company.create({
      data: {
        ...extractedCompany,
        slug: this.duplicateService.toSlug(extractedCompany.name)
      }
    });
    return { isNew: true, entity: newCompany, confidence: 0.8 };
  }
}

module.exports = EntityResolver;
