/**
 * Risk factor extractor
 * -----------------------------------------------------------------------------
 * On-demand: parses a filing (10-K / 10-Q / 20-F), isolates the "Item 1A. Risk
 * Factors" section, splits it into individual risk factors, applies a
 * keyword-based category heuristic, and stores them in `sec_risk_factors`.
 *
 * This is deterministic keyword tagging (no LLM) so it runs cheaply during
 * enrichment; a future provider could swap in an LLM classifier behind the
 * same interface.
 */

const { PrismaClient } = require('@prisma/client');
const { sharedParser } = require('./filingParser');

const prisma = new PrismaClient();

// Forms that actually contain a Risk Factors section.
const RISK_FORMS = new Set(['TEN_K', 'TEN_Q', 'TWENTY_F', 'S_1']);

// Category heuristics — first matching bucket wins (order = priority).
const CATEGORY_RULES = [
  { category: 'cybersecurity', re: /\b(cyber|data breach|hack|malware|ransomware|information security|privacy)\b/i },
  { category: 'regulatory', re: /\b(regulat|compliance|law|legislation|government|sanction|tax|antitrust)\b/i },
  { category: 'legal', re: /\b(litigation|lawsuit|intellectual property|patent|infringement|claims?)\b/i },
  { category: 'financial', re: /\b(liquidity|debt|capital|revenue|impairment|goodwill|credit|indebtedness|dilution)\b/i },
  { category: 'competition', re: /\b(competit|market share|pricing pressure|substitute)\b/i },
  { category: 'supply_chain', re: /\b(supply chain|supplier|manufactur|inventory|component|raw material)\b/i },
  { category: 'personnel', re: /\b(key personnel|employees|talent|retain|labor|management team)\b/i },
  { category: 'macroeconomic', re: /\b(economic|inflation|interest rate|recession|currency|foreign exchange|geopolitic|pandemic)\b/i },
  { category: 'operational', re: /\b(operation|disruption|system|infrastructure|scale|execution|product)\b/i },
];

class RiskExtractor {
  constructor({ parser = sharedParser, logger = console } = {}) {
    this.parser = parser;
    this.logger = logger;
  }

  categorize(text) {
    for (const { category, re } of CATEGORY_RULES) {
      if (re.test(text)) return category;
    }
    return 'other';
  }

  /**
   * Split the Risk Factors section into discrete factors. EDGAR filings mark
   * each factor with a short bolded heading; in plain text those survive as
   * short lines. We segment on blank-line groups and merge stray short lines
   * into the following paragraph as a title.
   */
  splitRiskFactors(sectionText) {
    if (!sectionText) return [];
    // Drop the "Item 1A. Risk Factors" header line itself.
    const body = sectionText.replace(/^\s*item\s*1a\.?\s+risk\s+factors\.?/i, '').trim();
    const paras = body
      .split(/\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const factors = [];
    let pendingTitle = null;
    for (const para of paras) {
      const isHeading = para.length < 160 && !/[.]$/.test(para) && /[A-Za-z]/.test(para);
      if (isHeading && para.split(' ').length <= 22) {
        // Could be a factor heading; remember it for the next real paragraph.
        if (pendingTitle) {
          // Two headings in a row → the previous one was actually a short factor.
          factors.push({ title: pendingTitle, content: pendingTitle });
        }
        pendingTitle = para;
        continue;
      }
      if (para.length < 40) continue; // noise (page numbers, fragments)
      factors.push({ title: pendingTitle, content: pendingTitle ? `${pendingTitle} ${para}` : para });
      pendingTitle = null;
    }
    if (pendingTitle) factors.push({ title: pendingTitle, content: pendingTitle });
    return factors;
  }

  /**
   * Extract & store risk factors for a single filing.
   * @param {object} filing persisted SecFiling (needs id, secCompanyId, filingType)
   * @returns {Promise<{ inserted, skipped, total, reason? }>}
   */
  async extractForFiling(filing) {
    const stats = { inserted: 0, skipped: 0, total: 0 };
    if (!RISK_FORMS.has(filing.filingType)) {
      return { ...stats, reason: `no risk section in ${filing.filingType}` };
    }

    // Idempotency: if we already have risk factors for this filing, bail.
    const existingCount = await prisma.secRiskFactor.count({ where: { secFilingId: filing.id } });
    if (existingCount > 0) {
      return { ...stats, skipped: existingCount, reason: 'already extracted' };
    }

    const { sections } = await this.parser.parse(filing);
    const riskSection = sections.riskFactors;
    if (!riskSection || riskSection.length < 200) {
      return { ...stats, reason: 'risk factors section not found' };
    }

    let factors = this.splitRiskFactors(riskSection);
    // Guard against runaway segmentation; keep the most substantive first ~150.
    factors = factors.filter((f) => f.content && f.content.length >= 40).slice(0, 150);
    stats.total = factors.length;
    if (!factors.length) return { ...stats, reason: 'no factors parsed' };

    const rows = factors.map((f, i) => ({
      secCompanyId: filing.secCompanyId,
      secFilingId: filing.id,
      title: f.title ? f.title.slice(0, 500) : null,
      content: f.content.slice(0, 20000),
      riskCategory: this.categorize(f.content),
      confidence: 0.6, // heuristic tagging
      orderIndex: i,
    }));

    const res = await prisma.secRiskFactor.createMany({ data: rows });
    stats.inserted = res.count;
    this.logger.log?.(
      `[SEC:risk] filing ${filing.accessionNumber}: extracted ${stats.inserted} risk factors`
    );
    return stats;
  }

  /** Extract risk factors from the latest risk-bearing filing of a company. */
  async extractLatestForCompany(secCompanyId) {
    const filing = await prisma.secFiling.findFirst({
      where: { secCompanyId, filingType: { in: [...RISK_FORMS] } },
      orderBy: { filingDate: 'desc' },
    });
    if (!filing) return { inserted: 0, skipped: 0, total: 0, reason: 'no risk-bearing filing' };
    return this.extractForFiling(filing);
  }
}

const sharedRiskExtractor = new RiskExtractor();

module.exports = { RiskExtractor, sharedRiskExtractor, CATEGORY_RULES };
