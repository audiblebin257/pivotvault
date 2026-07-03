class RelationshipBuilder {
  constructor({ prisma, logger = console }) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async buildFromExtraction(companyId, extractedData) {
    this.logger.log('Building relationships for company', companyId);
    throw new Error('Not implemented');
  }
}

module.exports = RelationshipBuilder;
