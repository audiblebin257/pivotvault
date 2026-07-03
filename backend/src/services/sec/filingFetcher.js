/**
 * Filing fetcher
 * -----------------------------------------------------------------------------
 * Reads a company's official submissions history from
 *   https://data.sec.gov/submissions/CIK##########.json
 * filters to the Phase-1 form set (10-K, 10-Q, 8-K, S-1, DEF 14A, 20-F),
 * and stores METADATA ONLY (latest filings first) into `sec_filings` +
 * `sec_documents`. Document bodies are fetched later, on demand, by the
 * parser/extractors.
 *
 * Incremental by design: filings already present (by accession number) are
 * skipped, and the submissions request itself is an ETag-conditional GET so an
 * unchanged company returns 304 and costs almost nothing.
 */

const { PrismaClient } = require('@prisma/client');
const { sharedClient, SEC_WWW } = require('./secClient');
const { formToEnum, accessionNoDashes, padCik, SUPPORTED_FORMS } = require('./util');

const prisma = new PrismaClient();

class FilingFetcher {
  constructor({ client = sharedClient, logger = console } = {}) {
    this.client = client;
    this.logger = logger;
  }

  /** Build the absolute URL of a filing's primary document. */
  _primaryDocUrl(cik, accession, primaryDocument) {
    if (!primaryDocument) return null;
    const folder = accessionNoDashes(accession);
    return `${SEC_WWW}/Archives/edgar/data/${Number(cik)}/${folder}/${primaryDocument}`;
  }

  /**
   * Zip the column-oriented `filings.recent` arrays into row objects for the
   * supported forms only, newest first (SEC already returns newest first).
   */
  _extractSupportedRows(recent) {
    if (!recent || !Array.isArray(recent.accessionNumber)) return [];
    const n = recent.accessionNumber.length;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const form = recent.form[i];
      if (!SUPPORTED_FORMS.includes(String(form).replace('/A', '').trim())) continue;
      rows.push({
        accessionNumber: recent.accessionNumber[i],
        form,
        filingType: formToEnum(form),
        filingDate: recent.filingDate?.[i] || null,
        reportDate: recent.reportDate?.[i] || null,
        primaryDocument: recent.primaryDocument?.[i] || null,
        primaryDocType: recent.primaryDocDescription?.[i] || null,
        sizeBytes: recent.size?.[i] || null,
        isXBRL: recent.isXBRL?.[i] === 1 || recent.isInlineXBRL?.[i] === 1,
      });
    }
    return rows;
  }

  /** Derive a coarse fiscal year/period label from a report date + form. */
  _fiscalInfo(reportDate, filingType) {
    if (!reportDate) return { fiscalYear: null, fiscalPeriod: null };
    const d = new Date(reportDate);
    const fiscalYear = Number.isNaN(d.getTime()) ? null : d.getUTCFullYear();
    let fiscalPeriod = null;
    if (filingType === 'TEN_K' || filingType === 'TWENTY_F') fiscalPeriod = 'FY';
    else if (filingType === 'TEN_Q') fiscalPeriod = `Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
    return { fiscalYear, fiscalPeriod };
  }

  /**
   * Sync one company's filings metadata.
   * @param {object} secCompany a persisted SecCompany row (needs id + cik)
   * @param {object} [opts]
   * @param {number} [opts.limitPerType] cap stored filings per form (0 = all)
   * @returns {Promise<{ cik, fetched, inserted, skipped, notModified, byType }>}
   */
  async syncCompanyFilings(secCompany, opts = {}) {
    const { limitPerType = 0 } = opts;
    const cik10 = padCik(secCompany.cik);
    const stats = { cik: cik10, fetched: 0, inserted: 0, skipped: 0, notModified: false, byType: {} };

    const { data, meta } = await this.client.getSubmissions(cik10);

    // Conditional GET said "unchanged" and we have no body → nothing to do.
    if (meta?.status === 304 || !data) {
      stats.notModified = true;
      await prisma.secCompany.update({
        where: { id: secCompany.id },
        data: { lastSynced: new Date() },
      });
      this.logger.log?.(`[SEC:filings] CIK ${cik10} unchanged (304)`);
      return stats;
    }

    // Refresh the SecCompany profile from the authoritative submissions doc.
    const business = data.addresses?.business;
    const businessAddress = business
      ? [business.street1, business.street2, business.city, business.stateOrCountry, business.zipCode]
          .filter(Boolean)
          .join(', ')
      : undefined;

    await prisma.secCompany.update({
      where: { id: secCompany.id },
      data: {
        name: data.name || secCompany.name,
        tickers: Array.isArray(data.tickers) && data.tickers.length ? data.tickers : secCompany.tickers,
        ...(businessAddress ? { businessAddress } : {}),
        ...(data.phone ? { phone: String(data.phone).slice(0, 50) } : {}),
        etag: meta?.etag || secCompany.etag,
        lastModifiedDate: meta?.lastModified ? new Date(meta.lastModified) : secCompany.lastModifiedDate,
        lastSynced: new Date(),
      },
    });

    let rows = this._extractSupportedRows(data.filings?.recent);
    stats.fetched = rows.length;

    // Optional per-type cap (keeps demo syncs small); rows are newest-first.
    if (limitPerType > 0) {
      const counts = {};
      rows = rows.filter((r) => {
        counts[r.filingType] = (counts[r.filingType] || 0) + 1;
        return counts[r.filingType] <= limitPerType;
      });
    }

    // Which accession numbers do we already have? (incremental skip)
    const accessions = rows.map((r) => r.accessionNumber);
    const existing = await prisma.secFiling.findMany({
      where: { accessionNumber: { in: accessions } },
      select: { accessionNumber: true },
    });
    const existingSet = new Set(existing.map((e) => e.accessionNumber));

    for (const row of rows) {
      stats.byType[row.filingType] = (stats.byType[row.filingType] || 0) + 1;
      if (existingSet.has(row.accessionNumber)) {
        stats.skipped++;
        continue;
      }
      const url = this._primaryDocUrl(cik10, row.accessionNumber, row.primaryDocument);
      const { fiscalYear, fiscalPeriod } = this._fiscalInfo(row.reportDate, row.filingType);

      try {
        const filing = await prisma.secFiling.create({
          data: {
            secCompanyId: secCompany.id,
            accessionNumber: row.accessionNumber,
            filingType: row.filingType,
            filingDate: row.filingDate ? new Date(row.filingDate) : null,
            reportDate: row.reportDate ? new Date(row.reportDate) : null,
            fiscalYear,
            fiscalPeriod,
            url: url || `${SEC_WWW}/Archives/edgar/data/${Number(cik10)}/${accessionNoDashes(row.accessionNumber)}/`,
            primaryDocument: row.primaryDocument,
            primaryDocumentType: row.primaryDocType ? String(row.primaryDocType).slice(0, 50) : row.form,
            sizeBytes: row.sizeBytes ? BigInt(row.sizeBytes) : null,
            status: 'pending', // metadata only; body not yet fetched
          },
        });

        // Register the primary document's metadata (no content yet).
        if (url) {
          await prisma.secDocument.create({
            data: {
              secFilingId: filing.id,
              sequence: 1,
              fileName: row.primaryDocument,
              description: row.primaryDocType || row.form,
              type: row.form,
              url,
              sizeBytes: row.sizeBytes ? BigInt(row.sizeBytes) : null,
            },
          });
        }
        stats.inserted++;
      } catch (err) {
        // Unique-constraint races or bad rows shouldn't abort the whole sync.
        this.logger.warn?.(`[SEC:filings] skip ${row.accessionNumber}: ${err.message}`);
        stats.skipped++;
      }
    }

    this.logger.log?.(
      `[SEC:filings] CIK ${cik10}: fetched=${stats.fetched} inserted=${stats.inserted} skipped=${stats.skipped}`
    );
    return stats;
  }

  /** Convenience: list stored filings for a company, newest first. */
  async listFilings(secCompanyId, { type, limit = 50 } = {}) {
    return prisma.secFiling.findMany({
      where: { secCompanyId, ...(type ? { filingType: type } : {}) },
      orderBy: { filingDate: 'desc' },
      take: limit,
    });
  }
}

const sharedFetcher = new FilingFetcher();

module.exports = { FilingFetcher, sharedFetcher };
