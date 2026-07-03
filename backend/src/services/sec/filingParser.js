/**
 * Filing parser
 * -----------------------------------------------------------------------------
 * On-demand (NOT part of the metadata sync): downloads a filing's primary
 * document, strips it to clean text, and splits it into the standard EDGAR
 * "Item N." sections. The financial and risk extractors consume the output.
 *
 * Downloaded content is cached back onto the `sec_documents` row and the parent
 * `sec_filings.status` is advanced to `complete`, so a document is fetched at
 * most once.
 */

const { PrismaClient } = require('@prisma/client');
const cheerio = require('cheerio');
const striptags = require('striptags');
const { sharedClient } = require('./secClient');

const prisma = new PrismaClient();

// Common 10-K / 10-Q / 20-F item headers we care about, in document order.
const ITEM_PATTERNS = [
  { key: 'business', re: /item\s*1\.?\s+business/i },
  { key: 'riskFactors', re: /item\s*1a\.?\s+risk\s+factors/i },
  { key: 'unresolvedComments', re: /item\s*1b\.?\s+unresolved/i },
  { key: 'properties', re: /item\s*2\.?\s+properties/i },
  { key: 'legal', re: /item\s*3\.?\s+legal\s+proceedings/i },
  { key: 'mdna', re: /item\s*7\.?\s+management.?s\s+discussion/i },
  { key: 'marketRisks', re: /item\s*7a\.?\s+qualitative\s+and\s+quantitative\s+disclosures\s+about\s+market\s+risk/i },
  { key: 'financialStatements', re: /item\s*8\.?\s+financial\s+statements/i },
];

class FilingParser {
  constructor({ client = sharedClient, logger = console } = {}) {
    this.client = client;
    this.logger = logger;
  }

  /** Strip an EDGAR HTML document down to normalized plain text. */
  htmlToText(html) {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('script, style, noscript, table').remove(); // tables are XBRL-noise for prose
    const body = $('body').length ? $('body').html() : html;
    return striptags(body || '', [], '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  /**
   * Download + persist the primary document body for a filing (idempotent).
   * @returns {Promise<{ text, sizeBytes, cached }>}
   */
  async fetchPrimaryDocument(filing) {
    const doc = await prisma.secDocument.findFirst({
      where: { secFilingId: filing.id },
      orderBy: { sequence: 'asc' },
    });
    if (!doc || !doc.url) {
      throw new Error(`No primary document URL for filing ${filing.accessionNumber}`);
    }

    // Already fetched? Reuse stored content.
    if (doc.content) {
      return { text: this.htmlToText(doc.content), sizeBytes: doc.sizeBytes, cached: true };
    }

    await prisma.secFiling.update({ where: { id: filing.id }, data: { status: 'processing' } });

    const { content, sizeBytes, etag } = await this.client.getDocument(doc.url);
    const text = this.htmlToText(content);

    await prisma.secDocument.update({
      where: { id: doc.id },
      data: {
        content, // stored raw as fallback per schema intent
        contentType: 'text/html',
        sizeBytes: sizeBytes ? BigInt(sizeBytes) : doc.sizeBytes,
        etag: etag || doc.etag,
        lastFetchedAt: new Date(),
      },
    });
    await prisma.secFiling.update({ where: { id: filing.id }, data: { status: 'complete' } });

    return { text, sizeBytes, cached: false };
  }

  /**
   * Split filing text into named sections by locating item headers.
   * Returns a map { sectionKey: text }.
   */
  sectionize(text) {
    if (!text) return {};
    const found = [];
    for (const { key, re } of ITEM_PATTERNS) {
      const m = re.exec(text);
      if (m) found.push({ key, index: m.index });
    }
    found.sort((a, b) => a.index - b.index);

    const sections = {};
    for (let i = 0; i < found.length; i++) {
      const start = found[i].index;
      const end = i + 1 < found.length ? found[i + 1].index : text.length;
      sections[found[i].key] = text.slice(start, end).trim();
    }
    return sections;
  }

  /** Fetch + section a filing in one call. */
  async parse(filing) {
    const { text, cached } = await this.fetchPrimaryDocument(filing);
    return { text, sections: this.sectionize(text), cached };
  }
}

const sharedParser = new FilingParser();

module.exports = { FilingParser, sharedParser, ITEM_PATTERNS };
