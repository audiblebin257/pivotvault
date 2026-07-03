/**
 * SEC sync scheduler / orchestrator
 * -----------------------------------------------------------------------------
 * Ties the module together into an incremental sync pipeline and owns the
 * run-level logging the deliverable asks for (downloads, errors, retries, sync
 * duration, files processed).
 *
 *   syncCompany(identifier)  -> resolve -> filings metadata -> [financials] -> [risk] -> [intelligence] -> [rag]
 *   syncAll()                -> incremental sync across every tracked company
 *   registerCron(expr)       -> schedule syncAll via node-cron
 *
 * Per-run stats are logged to the console AND persisted to `sec_metadata`
 * (key = "last_sync") so they're queryable after the fact.
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sharedClient } = require('./secClient');
const { sharedLookup } = require('./companyLookup');
const { sharedFetcher } = require('./filingFetcher');
const { sharedFinancialExtractor } = require('./financialExtractor');
const { sharedRiskExtractor } = require('./riskExtractor');
const { sharedFilingIntelligenceExtractor } = require('./filingIntelligenceExtractor');
const { sharedSecRagService } = require('./secRagService');

const prisma = new PrismaClient();

class SecScheduler {
  constructor({
    client = sharedClient,
    lookup = sharedLookup,
    fetcher = sharedFetcher,
    financialExtractor = sharedFinancialExtractor,
    riskExtractor = sharedRiskExtractor,
    filingIntelligenceExtractor = sharedFilingIntelligenceExtractor,
    secRagService = sharedSecRagService,
    logger = console,
  } = {}) {
    this.client = client;
    this.lookup = lookup;
    this.fetcher = fetcher;
    this.financialExtractor = financialExtractor;
    this.riskExtractor = riskExtractor;
    this.filingIntelligenceExtractor = filingIntelligenceExtractor;
    this.secRagService = secRagService;
    this.logger = logger;
    this._task = null;
    this._running = false;
  }

  /**
   * Full enrichment pipeline for one company.
   * @param {string} identifier name | ticker | CIK
   * @param {object} [opts]
   * @param {boolean} [opts.financials=true] extract XBRL financials
   * @param {boolean} [opts.risk=false]     extract risk factors (downloads a doc)
   * @param {boolean} [opts.intelligence=true] extract cited filing intelligence
   * @param {boolean} [opts.rag=true] index filing chunks for semantic search
   * @param {number}  [opts.limitPerType=0] cap filings stored per form
   */
  async syncCompany(identifier, opts = {}) {
    const {
      financials = true,
      risk = false,
      intelligence = true,
      intelligenceLimit = 0,
      rag = true,
      ragLimit = 0,
      limitPerType = 0,
    } = opts;
    const startedAt = Date.now();
    this.client.resetMetrics();

    const run = {
      identifier,
      startedAt: new Date(startedAt).toISOString(),
      resolved: null,
      filings: null,
      financials: null,
      risk: null,
      intelligence: null,
      rag: null,
      errors: [],
    };

    try {
      const resolvedRow = await this.lookup.resolveAndStore(identifier);
      if (!resolvedRow) {
        run.errors.push(`could not resolve "${identifier}"`);
        run.durationMs = Date.now() - startedAt;
        run.metrics = this.client.getMetrics();
        this.logger.warn?.(`[SEC:sync] unresolved: ${identifier}`);
        return run;
      }
      const { secCompany, resolution } = resolvedRow;
      run.resolved = { cik: secCompany.cik, name: secCompany.name, matchType: resolution.matchType, score: resolution.score };

      // 1. Filings metadata (incremental).
      run.filings = await this.fetcher.syncCompanyFilings(secCompany, { limitPerType });

      // 2. Financials from XBRL (optional).
      if (financials) {
        try {
          run.financials = await this.financialExtractor.extractForCompany(secCompany);
        } catch (err) {
          run.errors.push(`financials: ${err.message}`);
          this.logger.error?.('[SEC:sync] financials failed', err.message);
        }
      }

      // 3. Risk factors from the latest risk-bearing filing (optional).
      if (risk) {
        try {
          run.risk = await this.riskExtractor.extractLatestForCompany(secCompany.id);
        } catch (err) {
          run.errors.push(`risk: ${err.message}`);
          this.logger.error?.('[SEC:sync] risk failed', err.message);
        }
      }

      // 4. Filing intelligence with source-bound fields and scores (optional).
      if (intelligence) {
        try {
          run.intelligence = await this.filingIntelligenceExtractor.extractForCompany(secCompany.id, {
            limit: intelligenceLimit,
          });
        } catch (err) {
          run.errors.push(`intelligence: ${err.message}`);
          this.logger.error?.('[SEC:sync] intelligence failed', err.message);
        }
      }

      // 5. pgvector-backed searchable filing chunks (optional).
      if (rag) {
        try {
          run.rag = await this.secRagService.indexCompany(secCompany.id, {
            limit: ragLimit,
          });
        } catch (err) {
          run.errors.push(`rag: ${err.message}`);
          this.logger.error?.('[SEC:sync] RAG indexing failed', err.message);
        }
      }

      run.durationMs = Date.now() - startedAt;
      run.metrics = this.client.getMetrics();
      await this._persistRunStats(secCompany.id, run);
      this._logRun(run);
      return run;
    } catch (err) {
      run.errors.push(err.message);
      run.durationMs = Date.now() - startedAt;
      run.metrics = this.client.getMetrics();
      this.logger.error?.(`[SEC:sync] ${identifier} failed:`, err.message);
      return run;
    }
  }

  /**
   * Incremental sync across every tracked SEC company.
   * @param {object} [opts]
   * @param {number} [opts.limit] max companies this run
   */
  async syncAll(opts = {}) {
    if (this._running) {
      this.logger.warn?.('[SEC:sync] syncAll already running; skipping');
      return { skipped: true };
    }
    this._running = true;
    const startedAt = Date.now();
    const summary = { companies: 0, filingsInserted: 0, errors: 0, durationMs: 0 };

    try {
      const companies = await prisma.secCompany.findMany({
        orderBy: { lastSynced: 'asc' }, // stalest first
        ...(opts.limit ? { take: opts.limit } : {}),
      });
      this.logger.log?.(`[SEC:sync] syncAll over ${companies.length} companies`);

      for (const c of companies) {
        const run = await this.syncCompany(c.cik, {
          financials: opts.financials !== false,
          risk: opts.risk === true,
          intelligence: opts.intelligence !== false,
          intelligenceLimit: opts.intelligenceLimit || 0,
          rag: opts.rag !== false,
          ragLimit: opts.ragLimit || 0,
          limitPerType: opts.limitPerType || 0,
        });
        summary.companies++;
        summary.filingsInserted += run.filings?.inserted || 0;
        summary.errors += run.errors?.length || 0;
      }
    } catch (err) {
      this.logger.error?.('[SEC:sync] syncAll failed', err.message);
    } finally {
      this._running = false;
      summary.durationMs = Date.now() - startedAt;
      this.logger.log?.(
        `[SEC:sync] syncAll done: companies=${summary.companies} newFilings=${summary.filingsInserted} errors=${summary.errors} in ${summary.durationMs}ms`
      );
    }
    return summary;
  }

  /** Persist the run stats to sec_metadata (upsert on last_sync key). */
  async _persistRunStats(secCompanyId, run) {
    try {
      await prisma.secMetadata.upsert({
        where: { secCompanyId_key: { secCompanyId, key: 'last_sync' } },
        update: { value: run },
        create: { secCompanyId, key: 'last_sync', value: run },
      });
    } catch (err) {
      this.logger.warn?.(`[SEC:sync] could not persist run stats: ${err.message}`);
    }
  }

  _logRun(run) {
    const m = run.metrics || {};
    this.logger.log?.(
      `[SEC:sync] ${run.resolved?.name || run.identifier} ` +
        `filings(+${run.filings?.inserted || 0}/${run.filings?.fetched || 0}) ` +
        `financials(+${run.financials?.inserted || 0}) ` +
        `risk(+${run.risk?.inserted || 0}) ` +
        `intelligence(+${run.intelligence?.inserted || 0}/${run.intelligence?.filings || 0}) | ` +
        `rag(+${run.rag?.chunks || 0}/${run.rag?.filings || 0}) | ` +
        `downloads=${m.downloads || 0} notModified=${m.notModified || 0} retries=${m.retries || 0} errors=${m.errors || 0} ` +
        `| ${run.durationMs}ms`
    );
  }

  /**
   * Register a recurring incremental sync.
   * @param {string} [expr] cron expression (default: every day 02:30 UTC)
   */
  registerCron(expr = '30 2 * * *', opts = {}) {
    if (this._task) return this._task;
    this._task = cron.schedule(expr, async () => {
      this.logger.log?.('[SEC:scheduler] triggering incremental syncAll');
      await this.syncAll(opts);
    });
    this.logger.log?.(`[SEC:scheduler] registered SEC sync cron "${expr}"`);
    return this._task;
  }

  stopCron() {
    if (this._task) {
      this._task.stop();
      this._task = null;
    }
  }
}

const sharedScheduler = new SecScheduler();

module.exports = { SecScheduler, sharedScheduler };
