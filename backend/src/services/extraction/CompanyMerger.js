class CompanyMerger {
  constructor({ prisma, logger = console }) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async mergeCompanies(primaryId, duplicateId) {
    this.logger.log('Merging company', duplicateId, 'into', primaryId);
    throw new Error('Not implemented');
  }
}

module.exports = CompanyMerger;
