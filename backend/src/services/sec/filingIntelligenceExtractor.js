/**
 * Filing Intelligence Extractor
 * -----------------------------------------------------------------------------
 * Transforms raw SEC filing text sections into structured, queryable
 * intelligence fields. Each extract carries a confidence score, source
 * attribution, and (where possible) a citation pointing back to the original
 * filing text.
 *
 * Extracted field types:
 *   employees, legal_proceedings, competition, mdna_summary,
 *   business_overview, market_risks, growth_strategy,
 *   operational_challenges, financial_risks
 *
 * This is deterministic, rule-based extraction (no LLM) so it runs cheaply
 * during the sync pipeline. Every value is bounded to text that actually
 * appears in the filing — never hallucinated.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { sharedParser } = require('./filingParser');

const prisma = new PrismaClient();

// Forms that contain the sections we care about.
const INTELLIGENCE_FORMS = new Set(['TEN_K', 'TEN_Q', 'TWENTY_F', 'S_1']);

const FINANCIAL_FIELD_MAP = {
  revenue: ['revenue'],
  expenses: ['expenses'],
  cash: ['cash_and_equivalents'],
  net_income: ['net_income'],
  debt: ['debt'],
  assets: ['total_assets'],
};

const REQUIRED_FIELD_ORDER = [
  'revenue',
  'expenses',
  'cash',
  'net_income',
  'employees',
  'debt',
  'assets',
  'risk_factors',
  'legal_proceedings',
  'competition',
  'management_discussion',
  'business_overview',
  'market_risks',
  'growth_strategy',
  'operational_challenges',
  'financial_risks',
];

// Regex-based extractors for specific fields within a section.
// Each returns { value, confidence, citation } or null.
const EXTRACTORS = {
  employees(section) {
    if (!section) return null;
    // Match patterns like "approximately 161,000 full-time employees"
    const re = /(?:approximately|about|more than|over|a total of)?\s*([\d,]+)\s*(?:full-time|part-time|total)?\s*employees/i;
    const m = re.exec(section);
    if (!m) return null;
    const raw = m[1].replace(/,/g, '');
    const num = Number(raw);
    if (Number.isNaN(num)) return null;
    const start = Math.max(0, m.index - 40);
    const end = Math.min(section.length, m.index + m[0].length + 40);
    return {
      value: String(num),
      valueNumeric: num,
      unit: 'employees',
      confidence: 0.85,
      citation: section.slice(start, end).trim(),
      pageNumber: null,
    };
  },

  legal_proceedings(section) {
    if (!section || section.length < 100) return null;
    // If the section mentions "no material" or "immaterial" proceedings,
    // that's a valid (negative) extraction.
    const noMaterial = /no\s+(?:material|pending)\s+legal\s+proceedings?|immaterial|not\s+material/i.test(section);
    if (noMaterial) {
      return {
        value: 'No material legal proceedings disclosed.',
        confidence: 0.75,
        citation: section.slice(0, 300).trim(),
      };
    }
    // Otherwise, grab the first substantial paragraph as a summary.
    const firstPara = section.split(/\n/).find((p) => p.trim().length > 80);
    if (!firstPara) return null;
    return {
      value: firstPara.trim().slice(0, 2000),
      confidence: 0.7,
      citation: firstPara.trim().slice(0, 300),
    };
  },

  competition(section) {
    if (!section || section.length < 200) return null;
    // Look for a paragraph that explicitly mentions "competition" or "competitors"
    const lines = section.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const para = lines.find((l) =>
      /\b(competition|competitors|competitive landscape|market position|industry)\b/i.test(l) && l.length > 100
    );
    if (!para) return null;
    return {
      value: para.slice(0, 3000),
      confidence: 0.65,
      citation: para.slice(0, 300),
    };
  },

  business_overview(section) {
    if (!section || section.length < 200) return null;
    // First 1-2 paragraphs after the header usually give the business overview.
    const body = section.replace(/^\s*item\s*1\.?\s+business\.?/i, '').trim();
    const paras = body.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 60);
    const summary = paras.slice(0, 2).join('\n\n');
    if (!summary) return null;
    return {
      value: summary.slice(0, 3000),
      confidence: 0.75,
      citation: summary.slice(0, 300),
    };
  },

  risk_factors(section) {
    if (!section || section.length < 200) return null;
    const body = section.replace(/^\s*item\s*1a\.?\s+risk\s+factors\.?/i, '').trim();
    const paras = body.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 100);
    const summary = paras.slice(0, 3).join('\n\n');
    if (!summary) return null;
    return {
      value: summary.slice(0, 4000),
      confidence: 0.72,
      citation: summary.slice(0, 300),
    };
  },

  management_discussion(section) {
    if (!section || section.length < 200) return null;
    // First 2-3 substantial paragraphs of MD&A usually summarize the period.
    const body = section.replace(/^\s*item\s*7\.?\s+management.*?discussion/i, '').trim();
    const paras = body.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 80);
    const summary = paras.slice(0, 3).join('\n\n');
    if (!summary) return null;
    return {
      value: summary.slice(0, 4000),
      confidence: 0.7,
      citation: summary.slice(0, 300),
    };
  },

  market_risks(section) {
    if (!section || section.length < 200) return null;
    // Item 7A is usually short; grab the whole section minus the header.
    const body = section.replace(/^\s*item\s*7a\.?\s+qualitative.*?market\s+risk/i, '').trim();
    if (body.length < 100) return null;
    return {
      value: body.slice(0, 3000),
      confidence: 0.75,
      citation: body.slice(0, 300),
    };
  },

  growth_strategy(section) {
    if (!section || section.length < 200) return null;
    // Scan for forward-looking strategy language in Item 1 or Item 7.
    const re = /\b(strategy|strategic|initiative|expansion|plan\s+to|aim\s+to|growth|invest\s+in|develop)\b/i;
    const lines = section.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 80);
    const matches = lines.filter((l) => re.test(l));
    if (!matches.length) return null;
    const summary = matches.slice(0, 3).join('\n\n');
    return {
      value: summary.slice(0, 3000),
      confidence: 0.6,
      citation: matches[0].slice(0, 300),
    };
  },

  operational_challenges(section) {
    if (!section || section.length < 200) return null;
    const re = /\b(challenge|difficult|struggle|decline|decrease|shortage|disruption|constraint|bottleneck|issue|problem|risk)\b/i;
    const lines = section.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 80);
    const matches = lines.filter((l) => re.test(l));
    if (!matches.length) return null;
    const summary = matches.slice(0, 3).join('\n\n');
    return {
      value: summary.slice(0, 3000),
      confidence: 0.55,
      citation: matches[0].slice(0, 300),
    };
  },

  financial_risks(section) {
    if (!section || section.length < 200) return null;
    const re = /\b(financial risk|liquidity|credit risk|debt|interest rate|currency risk|foreign exchange|hedge|exposure|volatility)\b/i;
    const lines = section.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 80);
    const matches = lines.filter((l) => re.test(l));
    if (!matches.length) return null;
    const summary = matches.slice(0, 3).join('\n\n');
    return {
      value: summary.slice(0, 3000),
      confidence: 0.6,
      citation: matches[0].slice(0, 300),
    };
  },
};

// Map field types to the section(s) they should be extracted from.
const FIELD_SECTION_MAP = {
  employees: ['business'],
  risk_factors: ['riskFactors'],
  legal_proceedings: ['legal'],
  competition: ['business'],
  business_overview: ['business'],
  management_discussion: ['mdna'],
  market_risks: ['marketRisks'],
  growth_strategy: ['business', 'mdna'],
  operational_challenges: ['business', 'mdna'],
  financial_risks: ['riskFactors', 'mdna'],
};

class FilingIntelligenceExtractor {
  constructor({ parser = sharedParser, logger = console } = {}) {
    this.parser = parser;
    this.logger = logger;
  }

  moneyString(row) {
    const value = row.metricValue?.toString?.() ?? String(row.metricValue);
    return `${value}${row.unit ? ` ${row.unit}` : ''}`;
  }

  buildFinancialCitation(row, filing) {
    const period = row.periodEnd ? row.periodEnd.toISOString().slice(0, 10) : 'period not specified';
    return `${row.sourceConcept || row.metricKey} reported in accession ${filing.accessionNumber} for ${period}.`;
  }

  async extractFinancialFields(filing) {
    const rows = await prisma.secFinancial.findMany({
      where: { secFilingId: filing.id },
      orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
    });
    const byMetric = new Map();
    for (const row of rows) {
      if (!byMetric.has(row.metricKey)) byMetric.set(row.metricKey, row);
    }

    const extracts = [];
    for (const [fieldType, metricKeys] of Object.entries(FINANCIAL_FIELD_MAP)) {
      const row = metricKeys.map((key) => byMetric.get(key)).find(Boolean);
      if (!row) continue;
      extracts.push({
        fieldType,
        fieldKey: row.metricKey,
        value: this.moneyString(row),
        valueNumeric: row.metricValue || null,
        unit: row.unit || null,
        confidence: 0.92,
        source: 'xbrl_companyfacts',
        citation: this.buildFinancialCitation(row, filing),
        pageNumber: null,
        sectionKey: 'xbrl',
      });
    }
    return extracts;
  }

  normalizeExtract(extract) {
    return {
      value: extract.value,
      valueNumeric: extract.valueNumeric?.toString?.() ?? extract.valueNumeric ?? null,
      unit: extract.unit || null,
      confidence: Number(extract.confidence),
      source: extract.source,
      citation: extract.citationText || null,
      pageNumber: extract.pageNumber || null,
      section: extract.sectionKey || null,
      extractedAt: extract.extractedAt || null,
    };
  }

  scoreFromRiskCounts(riskCounts, base = 80) {
    const severity = {
      financial: 8,
      liquidity: 8,
      legal: 7,
      regulatory: 7,
      competition: 6,
      operational: 6,
      personnel: 5,
      macroeconomic: 5,
      cybersecurity: 5,
      supply_chain: 5,
      other: 3,
    };
    const penalty = Object.entries(riskCounts).reduce((sum, [category, count]) => {
      return sum + Math.min(count, 5) * (severity[category] || 4);
    }, 0);
    return Math.max(5, Math.min(100, base - penalty));
  }

  async generateInsights(filing, extracts) {
    const fields = Object.fromEntries(extracts.map((extract) => [extract.fieldType, extract]));
    const riskFactors = await prisma.secRiskFactor.findMany({
      where: { secFilingId: filing.id },
      select: { riskCategory: true },
    });
    const riskCounts = riskFactors.reduce((acc, risk) => {
      const key = risk.riskCategory || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const revenue = fields.revenue?.valueNumeric ? Number(fields.revenue.valueNumeric) : null;
    const netIncome = fields.net_income?.valueNumeric ? Number(fields.net_income.valueNumeric) : null;
    const cash = fields.cash?.valueNumeric ? Number(fields.cash.valueNumeric) : null;
    const debt = fields.debt?.valueNumeric ? Number(fields.debt.valueNumeric) : null;
    const assets = fields.assets?.valueNumeric ? Number(fields.assets.valueNumeric) : null;

    let financialHealthScore = null;
    if ([revenue, netIncome, cash, debt, assets].some((v) => Number.isFinite(v))) {
      financialHealthScore = 50;
      if (Number.isFinite(netIncome)) financialHealthScore += netIncome >= 0 ? 18 : -18;
      if (Number.isFinite(revenue) && revenue > 0) financialHealthScore += 10;
      if (Number.isFinite(cash) && Number.isFinite(debt)) financialHealthScore += cash >= debt ? 12 : -12;
      if (Number.isFinite(assets) && Number.isFinite(debt)) financialHealthScore += assets >= debt * 2 ? 10 : -8;
      financialHealthScore = Math.max(5, Math.min(100, financialHealthScore));
    }

    const businessHealthScore = fields.business_overview || fields.growth_strategy ? 70 : null;
    const hasOperationalEvidence =
      fields.operational_challenges || riskCounts.operational || riskCounts.supply_chain || riskCounts.personnel;
    const hasMarketEvidence =
      fields.market_risks || fields.competition || riskCounts.competition || riskCounts.macroeconomic;
    const hasLeadershipEvidence = riskCounts.personnel;
    const hasFundingEvidence = fields.financial_risks || fields.debt || riskCounts.financial || riskCounts.liquidity;
    const operationalRiskScore = hasOperationalEvidence
      ? this.scoreFromRiskCounts(
          { operational: riskCounts.operational || 0, supply_chain: riskCounts.supply_chain || 0, personnel: riskCounts.personnel || 0 },
          78
        )
      : null;
    const marketRiskScore = hasMarketEvidence
      ? this.scoreFromRiskCounts(
          { competition: riskCounts.competition || 0, macroeconomic: riskCounts.macroeconomic || 0 },
          78
        )
      : null;
    const leadershipRiskScore = hasLeadershipEvidence
      ? this.scoreFromRiskCounts({ personnel: riskCounts.personnel || 0 }, 82)
      : null;
    const fundingRiskScore = hasFundingEvidence
      ? this.scoreFromRiskCounts(
          { financial: riskCounts.financial || 0, liquidity: riskCounts.liquidity || 0 },
          financialHealthScore ?? 72
        )
      : null;

    const scoreValues = [
      financialHealthScore,
      businessHealthScore,
      operationalRiskScore,
      marketRiskScore,
      leadershipRiskScore,
      fundingRiskScore,
    ].filter((score) => Number.isFinite(score));
    const overallHealthScore = scoreValues.length
      ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
      : null;

    const citedBits = [];
    if (fields.business_overview) citedBits.push('business overview');
    if (fields.management_discussion) citedBits.push('management discussion');
    if (fields.revenue) citedBits.push(`revenue of ${fields.revenue.value}`);
    if (fields.net_income) citedBits.push(`net income of ${fields.net_income.value}`);
    if (fields.risk_factors) citedBits.push('reported risk factors');
    const executiveSummary = citedBits.length
      ? `This filing provides source-backed intelligence on ${citedBits.join(', ')}. Scores are derived only from extracted filing facts and stored risk categories.`
      : 'No source-backed intelligence fields were extracted from this filing.';

    return {
      executiveSummary,
      financialHealthScore,
      businessHealthScore,
      operationalRiskScore,
      marketRiskScore,
      leadershipRiskScore,
      fundingRiskScore,
      overallHealthScore,
      scoreReasoning: {
        extractedFields: REQUIRED_FIELD_ORDER.filter((field) => fields[field]),
        missingFields: REQUIRED_FIELD_ORDER.filter((field) => !fields[field]),
        riskCategoryCounts: riskCounts,
        rule: 'Deterministic scoring from extracted XBRL facts and keyword-tagged SEC risk categories; missing facts are not inferred.',
      },
    };
  }

  async persistInsights(filing, extracts) {
    const intelligence = await this.generateInsights(filing, extracts);
    const existing = await prisma.secFilingIntelligence.findFirst({
      where: { secFilingId: filing.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.secFilingIntelligence.update({
        where: { id: existing.id },
        data: intelligence,
      });
    } else {
      await prisma.secFilingIntelligence.create({
        data: {
        secCompanyId: filing.secCompanyId,
        secFilingId: filing.id,
        ...intelligence,
        },
      });
    }
    return intelligence;
  }

  async getFilingIntelligence(filingId) {
    const [filing, extracts, intelligence] = await Promise.all([
      prisma.secFiling.findUnique({ where: { id: filingId } }),
      prisma.secFilingExtract.findMany({ where: { secFilingId: filingId }, orderBy: { fieldType: 'asc' } }),
      prisma.secFilingIntelligence.findFirst({ where: { secFilingId: filingId } }),
    ]);
    if (!filing) return null;

    const fieldMap = {};
    for (const field of REQUIRED_FIELD_ORDER) {
      const extract = extracts.find((row) => row.fieldType === field);
      fieldMap[field] = extract ? this.normalizeExtract(extract) : null;
    }

    return {
      filingId: filing.id,
      accessionNumber: filing.accessionNumber,
      filingType: filing.filingType,
      filingDate: filing.filingDate,
      reportDate: filing.reportDate,
      sourceUrl: filing.url,
      fields: fieldMap,
      insights: intelligence
        ? {
            executiveSummary: intelligence.executiveSummary,
            financialHealthScore: intelligence.financialHealthScore,
            businessHealthScore: intelligence.businessHealthScore,
            operationalRiskScore: intelligence.operationalRiskScore,
            marketRiskScore: intelligence.marketRiskScore,
            leadershipRiskScore: intelligence.leadershipRiskScore,
            fundingRiskScore: intelligence.fundingRiskScore,
            overallHealthScore: intelligence.overallHealthScore,
            scoreReasoning: intelligence.scoreReasoning,
            generatedAt: intelligence.generatedAt,
            updatedAt: intelligence.updatedAt,
          }
        : null,
    };
  }

  /**
   * Extract all intelligence fields from a single filing (idempotent).
   * @param {object} filing persisted SecFiling
   * @returns {Promise<{ inserted, skipped, total, byType }>}
   */
  async extractForFiling(filing) {
    const stats = { inserted: 0, skipped: 0, total: 0, byType: {} };
    if (!INTELLIGENCE_FORMS.has(filing.filingType)) {
      return { ...stats, reason: `form ${filing.filingType} not supported for intelligence extraction` };
    }

    // Parse the filing into sections.
    const { sections } = await this.parser.parse(filing);
    if (!Object.keys(sections).length) {
      return { ...stats, reason: 'no sections found' };
    }

    const existingRows = await prisma.secFilingExtract.findMany({
      where: { secFilingId: filing.id },
      select: { fieldType: true, fieldKey: true },
    });
    const existing = new Set(existingRows.map((row) => `${row.fieldType}|${row.fieldKey}`));

    const financialExtracts = await this.extractFinancialFields(filing);
    const extracted = [];
    const citationRows = [];

    for (const result of financialExtracts) {
      extracted.push(result);
    }

    for (const [fieldType, sectionKeys] of Object.entries(FIELD_SECTION_MAP)) {
      let best = null;
      // Try each mapped section; take the highest-confidence result.
      for (const key of sectionKeys) {
        const section = sections[key];
        if (!section) continue;
        const extractor = EXTRACTORS[fieldType];
        if (!extractor) continue;
        const result = extractor(section);
        if (!result) continue;
        if (!best || result.confidence > best.confidence) {
          best = { ...result, sectionKey: key };
        }
      }

      if (!best) continue;
      stats.total++;
      stats.byType[fieldType] = (stats.byType[fieldType] || 0) + 1;
      extracted.push({
        fieldType,
        fieldKey: 'default',
        value: best.value,
        valueNumeric: best.valueNumeric || null,
        unit: best.unit || null,
        confidence: best.confidence,
        source: 'sec_filing_text',
        citation: best.citation || null,
        pageNumber: best.pageNumber || null,
        sectionKey: best.sectionKey || null,
      });
    }

    const toCreate = [];
    for (const extract of extracted) {
      const fieldKey = extract.fieldKey || 'default';
      if (existing.has(`${extract.fieldType}|${fieldKey}`)) {
        stats.skipped++;
        continue;
      }
      const extractId = crypto.randomUUID();
      toCreate.push({
        id: extractId,
        secCompanyId: filing.secCompanyId,
        secFilingId: filing.id,
        fieldType: extract.fieldType,
        fieldKey,
        value: extract.value,
        valueNumeric: extract.valueNumeric || null,
        unit: extract.unit || null,
        confidence: extract.confidence,
        source: extract.source,
        citationText: extract.citation || null,
        pageNumber: extract.pageNumber || null,
        sectionKey: extract.sectionKey || null,
      });

      if (extract.citation) {
        citationRows.push({
          id: crypto.randomUUID(),
          secFilingExtractId: extractId,
          secFilingId: filing.id,
          text: extract.citation,
          pageNumber: extract.pageNumber || null,
          sectionKey: extract.sectionKey || null,
          confidence: extract.confidence,
        });
      }
    }

    if (toCreate.length) {
      await prisma.secFilingExtract.createMany({ data: toCreate, skipDuplicates: true });
      stats.inserted = toCreate.length;
    }
    if (citationRows.length) {
      await prisma.secFilingCitation.createMany({ data: citationRows, skipDuplicates: true });
    }
    const allExtracts = await prisma.secFilingExtract.findMany({ where: { secFilingId: filing.id } });
    await this.persistInsights(filing, allExtracts);

    this.logger.log?.(
      `[SEC:intelligence] filing ${filing.accessionNumber}: extracted ${stats.inserted} fields (${Object.keys(stats.byType).join(', ')})`
    );
    return stats;
  }

  /**
   * Extract intelligence from the latest supported filing for a company.
   */
  async extractLatestForCompany(secCompanyId) {
    const filing = await prisma.secFiling.findFirst({
      where: { secCompanyId, filingType: { in: [...INTELLIGENCE_FORMS] } },
      orderBy: { filingDate: 'desc' },
    });
    if (!filing) return { inserted: 0, skipped: 0, total: 0, reason: 'no supported filing' };
    return this.extractForFiling(filing);
  }

  /**
   * Extract intelligence from every supported stored filing for a company.
   */
  async extractForCompany(secCompanyId, { limit = 0 } = {}) {
    const filings = await prisma.secFiling.findMany({
      where: { secCompanyId, filingType: { in: [...INTELLIGENCE_FORMS] } },
      orderBy: { filingDate: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
    const summary = { filings: filings.length, inserted: 0, skipped: 0, errors: [] };
    for (const filing of filings) {
      try {
        const result = await this.extractForFiling(filing);
        summary.inserted += result.inserted || 0;
        summary.skipped += result.skipped || 0;
      } catch (err) {
        summary.errors.push(`${filing.accessionNumber}: ${err.message}`);
      }
    }
    return summary;
  }
}

const sharedFilingIntelligenceExtractor = new FilingIntelligenceExtractor();

module.exports = {
  FilingIntelligenceExtractor,
  sharedFilingIntelligenceExtractor,
  EXTRACTORS,
  FIELD_SECTION_MAP,
  FINANCIAL_FIELD_MAP,
  REQUIRED_FIELD_ORDER,
};
