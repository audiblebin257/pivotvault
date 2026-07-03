/**
 * Financial extractor
 * -----------------------------------------------------------------------------
 * Pulls structured financials from the official XBRL "company facts" endpoint
 *   https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
 * and writes a curated set of concepts into `sec_financials`.
 *
 * Each XBRL datapoint carries the accession number (`accn`) of the filing it
 * came from, so every financial row is tied to a `sec_filings` row we already
 * track. Datapoints from untracked filings are ignored (Phase-1 scope).
 */

const { PrismaClient } = require('@prisma/client');
const { sharedClient } = require('./secClient');
const { padCik } = require('./util');

const prisma = new PrismaClient();

/**
 * Curated us-gaap / dei concepts -> friendly metric keys. We deliberately keep
 * this focused rather than importing every concept a filer reports.
 */
const CONCEPTS = [
  { taxonomy: 'us-gaap', concept: 'Revenues', key: 'revenue' },
  { taxonomy: 'us-gaap', concept: 'RevenueFromContractWithCustomerExcludingAssessedTax', key: 'revenue' },
  { taxonomy: 'us-gaap', concept: 'SalesRevenueNet', key: 'revenue' },
  { taxonomy: 'us-gaap', concept: 'OperatingExpenses', key: 'expenses' },
  { taxonomy: 'us-gaap', concept: 'CostsAndExpenses', key: 'expenses' },
  { taxonomy: 'us-gaap', concept: 'SellingGeneralAndAdministrativeExpense', key: 'expenses' },
  { taxonomy: 'us-gaap', concept: 'GrossProfit', key: 'gross_profit' },
  { taxonomy: 'us-gaap', concept: 'OperatingIncomeLoss', key: 'operating_income' },
  { taxonomy: 'us-gaap', concept: 'NetIncomeLoss', key: 'net_income' },
  { taxonomy: 'us-gaap', concept: 'Assets', key: 'total_assets' },
  { taxonomy: 'us-gaap', concept: 'Liabilities', key: 'total_liabilities' },
  { taxonomy: 'us-gaap', concept: 'DebtCurrent', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'ShortTermBorrowings', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'LongTermDebtCurrent', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'LongTermDebtNoncurrent', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'LongTermDebtAndFinanceLeaseObligationsCurrent', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'LongTermDebtAndFinanceLeaseObligationsNoncurrent', key: 'debt' },
  { taxonomy: 'us-gaap', concept: 'StockholdersEquity', key: 'stockholders_equity' },
  { taxonomy: 'us-gaap', concept: 'CashAndCashEquivalentsAtCarryingValue', key: 'cash_and_equivalents' },
  { taxonomy: 'us-gaap', concept: 'ResearchAndDevelopmentExpense', key: 'rnd_expense' },
  { taxonomy: 'us-gaap', concept: 'EarningsPerShareBasic', key: 'eps_basic' },
  { taxonomy: 'us-gaap', concept: 'EarningsPerShareDiluted', key: 'eps_diluted' },
];

class FinancialExtractor {
  constructor({ client = sharedClient, logger = console } = {}) {
    this.client = client;
    this.logger = logger;
  }

  /**
   * Extract & store financials for a company.
   * @param {object} secCompany persisted SecCompany (needs id + cik)
   * @returns {Promise<{ inserted, skipped, concepts, datapoints }>}
   */
  async extractForCompany(secCompany) {
    const cik10 = padCik(secCompany.cik);
    const stats = { inserted: 0, skipped: 0, concepts: 0, datapoints: 0 };

    let facts;
    try {
      facts = await this.client.getCompanyFacts(cik10);
    } catch (err) {
      // Not every filer has XBRL facts (e.g. some foreign/private filers).
      this.logger.warn?.(`[SEC:financials] no company facts for CIK ${cik10}: ${err.message}`);
      return stats;
    }
    if (!facts?.facts) return stats;

    // Map accession -> our filing id, so we can attach financials to filings.
    const filings = await prisma.secFiling.findMany({
      where: { secCompanyId: secCompany.id },
      select: { id: true, accessionNumber: true },
    });
    const filingByAccn = new Map(filings.map((f) => [f.accessionNumber, f.id]));
    if (!filingByAccn.size) {
      this.logger.warn?.(`[SEC:financials] no filings stored yet for CIK ${cik10}; run filing sync first`);
      return stats;
    }

    // Existing rows for idempotency: key = filingId|metric|periodEnd.
    const existingRows = await prisma.secFinancial.findMany({
      where: { secCompanyId: secCompany.id },
      select: { secFilingId: true, metricKey: true, periodEnd: true },
    });
    const seen = new Set(
      existingRows.map((r) => `${r.secFilingId}|${r.metricKey}|${r.periodEnd?.toISOString().slice(0, 10)}`)
    );

    const toCreate = [];
    for (const { taxonomy, concept, key } of CONCEPTS) {
      const node = facts.facts?.[taxonomy]?.[concept];
      if (!node?.units) continue;
      stats.concepts++;

      for (const unit of Object.keys(node.units)) {
        for (const dp of node.units[unit]) {
          stats.datapoints++;
          const filingId = filingByAccn.get(dp.accn);
          if (!filingId) continue; // datapoint from an untracked filing
          if (dp.val === undefined || dp.val === null) continue;

          const periodEndKey = dp.end || null;
          const dedupeKey = `${filingId}|${key}|${periodEndKey}`;
          if (seen.has(dedupeKey)) {
            stats.skipped++;
            continue;
          }
          seen.add(dedupeKey);

          toCreate.push({
            secCompanyId: secCompany.id,
            secFilingId: filingId,
            metricKey: key,
            metricValue: dp.val,
            unit,
            periodStart: dp.start ? new Date(dp.start) : null,
            periodEnd: dp.end ? new Date(dp.end) : null,
            fiscalYear: dp.fy || null,
            fiscalPeriod: dp.fp || null,
            source: 'xbrl',
            sourceConcept: `${taxonomy}:${concept}`,
          });
        }
      }
    }

    if (toCreate.length) {
      // createMany is fast and we've already de-duplicated in memory.
      const res = await prisma.secFinancial.createMany({ data: toCreate, skipDuplicates: true });
      stats.inserted = res.count;
    }

    this.logger.log?.(
      `[SEC:financials] CIK ${cik10}: concepts=${stats.concepts} datapoints=${stats.datapoints} inserted=${stats.inserted} skipped=${stats.skipped}`
    );
    return stats;
  }
}

const sharedFinancialExtractor = new FinancialExtractor();

module.exports = { FinancialExtractor, sharedFinancialExtractor, CONCEPTS };
