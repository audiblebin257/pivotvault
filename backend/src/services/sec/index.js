/**
 * SEC EDGAR integration — public entry point
 * -----------------------------------------------------------------------------
 * A modular, official-API-only integration that enriches PivotVault company
 * profiles with SEC filing data. All external access goes through the SEC
 * EDGAR APIs and datasets (no scraping of arbitrary sites).
 *
 * Layers:
 *   secClient + cache ....... rate-limited, ETag-aware HTTP core
 *   companyLookup ........... name/ticker/CIK -> canonical SEC company
 *   filingFetcher ........... submissions -> filing metadata (incremental)
 *   filingParser ............ on-demand document fetch + sectioning
 *   financialExtractor ...... XBRL company facts -> financials
 *   riskExtractor ........... Item 1A risk factors -> risk rows
 *   filingIntelligence ...... filing facts + citations -> PivotVault insights
 *   secRag .................. filing chunks + pgvector semantic search
 *   scheduler ............... orchestration + incremental sync + logging
 *
 * The `SecService` facade below is what routes/workers should use.
 */

const { PrismaClient } = require('@prisma/client');
const { SecClient, sharedClient } = require('./secClient');
const { SecCache, sharedCache } = require('./cache');
const { CompanyLookup, sharedLookup } = require('./companyLookup');
const { FilingFetcher, sharedFetcher } = require('./filingFetcher');
const { FilingParser, sharedParser } = require('./filingParser');
const { FinancialExtractor, sharedFinancialExtractor } = require('./financialExtractor');
const { RiskExtractor, sharedRiskExtractor } = require('./riskExtractor');
const {
  FilingIntelligenceExtractor,
  sharedFilingIntelligenceExtractor,
} = require('./filingIntelligenceExtractor');
const { SecRagService, sharedSecRagService } = require('./secRagService');
const { SecScheduler, sharedScheduler } = require('./scheduler');
const { getDashboard } = require('./dashboardService');
const util = require('./util');

const prisma = new PrismaClient();

class SecService {
  constructor(deps = {}) {
    this.lookup = deps.lookup || sharedLookup;
    this.fetcher = deps.fetcher || sharedFetcher;
    this.parser = deps.parser || sharedParser;
    this.financialExtractor = deps.financialExtractor || sharedFinancialExtractor;
    this.riskExtractor = deps.riskExtractor || sharedRiskExtractor;
    this.filingIntelligenceExtractor = deps.filingIntelligenceExtractor || sharedFilingIntelligenceExtractor;
    this.secRagService = deps.secRagService || sharedSecRagService;
    this.scheduler = deps.scheduler || sharedScheduler;
    this.logger = deps.logger || console;
  }

  /** Resolve an identifier without writing anything. */
  resolve(identifier) {
    return this.lookup.resolve(identifier);
  }

  /** Resolve + upsert + full sync pipeline for a company. */
  syncCompany(identifier, opts) {
    return this.scheduler.syncCompany(identifier, opts);
  }

  /** Incremental sync across all tracked companies. */
  syncAll(opts) {
    return this.scheduler.syncAll(opts);
  }

  /**
   * Enrich an existing PivotVault Company: resolve by its name, sync, and link
   * the resulting SecCompany back to the Company row.
   * @param {string} companyId PivotVault Company id
   */
  async enrichCompany(companyId, opts = {}) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error(`Company ${companyId} not found`);

    const identifier = opts.identifier || company.name;
    const run = await this.scheduler.syncCompany(identifier, opts);
    if (run.resolved?.cik) {
      await prisma.secCompany.updateMany({
        where: { cik: run.resolved.cik },
        data: { companyId },
      });
    }
    return run;
  }

  /** Read stored SEC data for a company (by CIK or SecCompany id). */
  async getCompany(cikOrId) {
    const where = util.looksLikeCik(cikOrId)
      ? { cik: util.padCik(cikOrId) }
      : { id: String(cikOrId) };
    return prisma.secCompany.findFirst({
      where,
      include: {
        _count: { select: { filings: true, financials: true, riskFactors: true } },
      },
    });
  }

  async getFilings(secCompanyId, filters) {
    return this.fetcher.listFilings(secCompanyId, filters);
  }

  async getFinancials(secCompanyId, { metricKey, limit = 200 } = {}) {
    return prisma.secFinancial.findMany({
      where: { secCompanyId, ...(metricKey ? { metricKey } : {}) },
      orderBy: [{ fiscalYear: 'desc' }, { periodEnd: 'desc' }],
      take: limit,
    });
  }

  async getRiskFactors(secCompanyId, { category, limit = 200 } = {}) {
    return prisma.secRiskFactor.findMany({
      where: { secCompanyId, ...(category ? { riskCategory: category } : {}) },
      orderBy: { orderIndex: 'asc' },
      take: limit,
    });
  }

  async extractFilingIntelligence(filingId) {
    const filing = await prisma.secFiling.findUnique({ where: { id: filingId } });
    if (!filing) throw new Error(`SEC filing ${filingId} not found`);
    await this.filingIntelligenceExtractor.extractForFiling(filing);
    return this.filingIntelligenceExtractor.getFilingIntelligence(filing.id);
  }

  async extractCompanyIntelligence(secCompanyId, opts = {}) {
    return this.filingIntelligenceExtractor.extractForCompany(secCompanyId, opts);
  }

  async getFilingIntelligence(filingId) {
    return this.filingIntelligenceExtractor.getFilingIntelligence(filingId);
  }

  async getCompanyIntelligence(secCompanyId, { limit = 20 } = {}) {
    const filings = await prisma.secFiling.findMany({
      where: { secCompanyId },
      orderBy: { filingDate: 'desc' },
      take: limit,
      select: { id: true },
    });
    const results = [];
    for (const filing of filings) {
      const item = await this.filingIntelligenceExtractor.getFilingIntelligence(filing.id);
      if (item?.insights || Object.values(item?.fields || {}).some(Boolean)) {
        results.push(item);
      }
    }
    return results;
  }

  async indexFilingForSearch(filingId) {
    const filing = await prisma.secFiling.findUnique({ where: { id: filingId } });
    if (!filing) throw new Error(`SEC filing ${filingId} not found`);
    return this.secRagService.indexFiling(filing);
  }

  async indexCompanyFilingsForSearch(secCompanyId, opts = {}) {
    return this.secRagService.indexCompany(secCompanyId, opts);
  }

  async searchFilings(query, opts = {}) {
    return this.secRagService.search(query, opts);
  }

  async answerFromFilings(query, opts = {}) {
    return this.secRagService.answer(query, opts);
  }

  /** Aggregated financial intelligence dashboard for one or more companies. */
  getDashboard(identifiers) {
    return getDashboard(identifiers);
  }

  /** Register the recurring incremental sync cron. */
  startScheduler(expr, opts) {
    return this.scheduler.registerCron(expr, opts);
  }
}

const secService = new SecService();

module.exports = {
  // Facade (preferred)
  SecService,
  secService,
  // Classes (for custom wiring / testing)
  SecClient,
  SecCache,
  CompanyLookup,
  FilingFetcher,
  FilingParser,
  FinancialExtractor,
  RiskExtractor,
  FilingIntelligenceExtractor,
  SecRagService,
  SecScheduler,
  // Shared singletons
  sharedClient,
  sharedCache,
  sharedLookup,
  sharedFetcher,
  sharedParser,
  sharedFinancialExtractor,
  sharedRiskExtractor,
  sharedFilingIntelligenceExtractor,
  sharedSecRagService,
  sharedScheduler,
  // Helpers
  util,
};
