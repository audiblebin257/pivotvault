/**
 * SEC Financial Intelligence Dashboard aggregator.
 * Shapes stored SEC data into founder/investor-friendly dashboard payloads.
 */

const { PrismaClient } = require('@prisma/client');
const util = require('./util');

const prisma = new PrismaClient();

const TREND_KEYS = [
  'revenue',
  'net_income',
  'cash_and_equivalents',
  'debt',
  'total_assets',
  'total_liabilities',
  'expenses',
  'operating_income',
  'gross_profit',
  'stockholders_equity',
];

const MAJOR_FILING_TYPES = new Set(['TEN_K', 'TEN_Q', 'EIGHT_K', 'S_1', 'TWENTY_F']);

function num(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function periodLabel(row) {
  if (row.fiscalYear && row.fiscalPeriod) return `${row.fiscalYear} ${row.fiscalPeriod}`;
  if (row.fiscalYear) return String(row.fiscalYear);
  if (row.periodEnd) return row.periodEnd.toISOString().slice(0, 10);
  return 'Unknown';
}

function sortPeriods(a, b) {
  const ya = a.fiscalYear || 0;
  const yb = b.fiscalYear || 0;
  if (ya !== yb) return ya - yb;
  const da = a.periodEnd ? new Date(a.periodEnd).getTime() : 0;
  const db = b.periodEnd ? new Date(b.periodEnd).getTime() : 0;
  return da - db;
}

/** Collapse financial rows into one snapshot per fiscal period. */
function buildTrendSeries(financials) {
  const byPeriod = new Map();

  for (const row of financials) {
    const key = row.fiscalYear
      ? `${row.fiscalYear}|${row.fiscalPeriod || 'FY'}`
      : row.periodEnd?.toISOString().slice(0, 10) || row.id;
    if (!byPeriod.has(key)) {
      byPeriod.set(key, {
        periodKey: key,
        fiscalYear: row.fiscalYear,
        fiscalPeriod: row.fiscalPeriod,
        periodEnd: row.periodEnd,
        label: periodLabel(row),
        metrics: {},
      });
    }
    const bucket = byPeriod.get(key);
    const existing = bucket.metrics[row.metricKey];
    const value = num(row.metricValue);
    if (value == null) continue;
    if (!existing || (row.periodEnd && (!existing.periodEnd || row.periodEnd >= existing.periodEnd))) {
      bucket.metrics[row.metricKey] = {
        value,
        unit: row.unit,
        periodEnd: row.periodEnd,
      };
    }
  }

  const periods = [...byPeriod.values()].sort(sortPeriods);

  const series = {};
  for (const key of TREND_KEYS) {
    series[key] = periods
      .map((p) => ({
        label: p.label,
        fiscalYear: p.fiscalYear,
        fiscalPeriod: p.fiscalPeriod,
        periodEnd: p.periodEnd,
        value: p.metrics[key]?.value ?? null,
        unit: p.metrics[key]?.unit ?? null,
      }))
      .filter((p) => p.value != null);
  }

  const cashBurn = [];
  const cashSeries = series.cash_and_equivalents || [];
  for (let i = 1; i < cashSeries.length; i += 1) {
    const prev = cashSeries[i - 1];
    const curr = cashSeries[i];
    const delta = curr.value - prev.value;
    cashBurn.push({
      label: curr.label,
      fiscalYear: curr.fiscalYear,
      periodEnd: curr.periodEnd,
      value: delta,
      burnRate: delta < 0 ? Math.abs(delta) : 0,
      runwayQuarters: null,
    });
  }

  // Operating burn proxy when cash series is sparse
  for (const p of periods) {
    const rev = p.metrics.revenue?.value;
    const exp = p.metrics.expenses?.value;
    const ni = p.metrics.net_income?.value;
    if (rev != null && exp != null && !cashBurn.find((b) => b.label === p.label)) {
      cashBurn.push({
        label: p.label,
        fiscalYear: p.fiscalYear,
        periodEnd: p.periodEnd,
        value: rev - exp,
        burnRate: exp > rev ? exp - rev : 0,
        operatingLoss: ni != null && ni < 0 ? Math.abs(ni) : exp > rev ? exp - rev : 0,
      });
    }
  }
  cashBurn.sort((a, b) => sortPeriods(
    { fiscalYear: a.fiscalYear, periodEnd: a.periodEnd },
    { fiscalYear: b.fiscalYear, periodEnd: b.periodEnd }
  ));

  return { periods, series, cashBurn };
}

function latestMetrics(periods) {
  if (!periods.length) return {};
  const latest = periods[periods.length - 1];
  const out = {};
  for (const [key, meta] of Object.entries(latest.metrics)) {
    out[key] = { value: meta.value, unit: meta.unit };
  }
  return out;
}

function computeRatios(metrics) {
  const rev = metrics.revenue?.value;
  const ni = metrics.net_income?.value;
  const assets = metrics.total_assets?.value;
  const liabilities = metrics.total_liabilities?.value;
  const debt = metrics.debt?.value;
  const equity = metrics.stockholders_equity?.value;
  const gp = metrics.gross_profit?.value;
  const oi = metrics.operating_income?.value;
  const cash = metrics.cash_and_equivalents?.value;
  const exp = metrics.expenses?.value;

  const ratio = (numerator, denominator) => {
    if (numerator == null || denominator == null || denominator === 0) return null;
    return Number((numerator / denominator).toFixed(4));
  };

  return {
    profitMargin: ratio(ni, rev),
    grossMargin: ratio(gp, rev),
    operatingMargin: ratio(oi, rev),
    debtToAssets: ratio(debt ?? liabilities, assets),
    debtToEquity: ratio(debt, equity),
    liabilitiesToAssets: ratio(liabilities, assets),
    returnOnAssets: ratio(ni, assets),
    returnOnEquity: ratio(ni, equity),
    cashToDebt: ratio(cash, debt),
    expenseRatio: ratio(exp, rev),
  };
}

function summarizeRisks(risks) {
  const byCategory = {};
  for (const risk of risks) {
    const cat = risk.riskCategory || 'general';
    if (!byCategory[cat]) {
      byCategory[cat] = { category: cat, count: 0, items: [] };
    }
    byCategory[cat].count += 1;
    if (byCategory[cat].items.length < 5) {
      byCategory[cat].items.push({
        title: risk.title,
        excerpt: risk.content?.slice(0, 280) || '',
        orderIndex: risk.orderIndex,
      });
    }
  }
  return {
    total: risks.length,
    categories: Object.values(byCategory).sort((a, b) => b.count - a.count),
    topRisks: risks.slice(0, 8).map((r) => ({
      title: r.title,
      category: r.riskCategory,
      excerpt: r.content?.slice(0, 200) || '',
    })),
  };
}

function buildTimeline(filings) {
  return filings.map((f) => ({
    id: f.id,
    date: f.filingDate,
    reportDate: f.reportDate,
    type: f.filingType,
    label: f.filingType.replace(/_/g, '-'),
    fiscalYear: f.fiscalYear,
    fiscalPeriod: f.fiscalPeriod,
    url: f.url,
    accessionNumber: f.accessionNumber,
    isMajor: MAJOR_FILING_TYPES.has(f.filingType),
  }));
}

function buildMajorEvents(filings, intelligenceRows) {
  const events = [];

  for (const f of filings) {
    if (f.filingType === 'EIGHT_K') {
      events.push({
        date: f.filingDate,
        type: 'material_event',
        title: '8-K Material Event',
        description: `Current report filed (${f.accessionNumber})`,
        url: f.url,
        severity: 'high',
      });
    }
    if (f.filingType === 'S_1') {
      events.push({
        date: f.filingDate,
        type: 'ipo',
        title: 'S-1 Registration',
        description: 'IPO / registration filing',
        url: f.url,
        severity: 'high',
      });
    }
    if (f.filingType === 'TEN_K') {
      events.push({
        date: f.filingDate,
        type: 'annual_report',
        title: `10-K${f.fiscalYear ? ` FY${f.fiscalYear}` : ''}`,
        description: 'Annual report filed with SEC',
        url: f.url,
        severity: 'medium',
      });
    }
  }

  for (const intel of intelligenceRows) {
    if (intel?.fields?.legal_proceedings?.value) {
      events.push({
        date: intel.filingDate,
        type: 'legal',
        title: 'Legal Proceedings Disclosed',
        description: intel.fields.legal_proceedings.value.slice(0, 200),
        url: intel.sourceUrl,
        severity: 'medium',
      });
    }
  }

  return events
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);
}

function buildKeyMetrics(latest, ratios, intelligence) {
  const scores = intelligence?.insights || {};
  return {
    revenue: latest.revenue?.value ?? null,
    netIncome: latest.net_income?.value ?? null,
    cash: latest.cash_and_equivalents?.value ?? null,
    debt: latest.debt?.value ?? null,
    assets: latest.total_assets?.value ?? null,
    liabilities: latest.total_liabilities?.value ?? null,
    employees: intelligence?.fields?.employees?.valueNumeric ?? intelligence?.fields?.employees?.value ?? null,
    overallHealthScore: scores.overallHealthScore ?? null,
    financialHealthScore: scores.financialHealthScore ?? null,
    fundingRiskScore: scores.fundingRiskScore ?? null,
    profitMargin: ratios.profitMargin,
    debtToAssets: ratios.debtToAssets,
  };
}

async function loadCompanyDashboard(cikOrId) {
  const where = util.looksLikeCik(cikOrId)
    ? { cik: util.padCik(cikOrId) }
    : { id: String(cikOrId) };

  const company = await prisma.secCompany.findFirst({
    where,
    include: {
      _count: { select: { filings: true, financials: true, riskFactors: true } },
    },
  });
  if (!company) return null;

  const [financials, risks, filings, latestIntelRow] = await Promise.all([
    prisma.secFinancial.findMany({
      where: { secCompanyId: company.id, metricKey: { in: TREND_KEYS } },
      orderBy: [{ fiscalYear: 'asc' }, { periodEnd: 'asc' }],
      take: 500,
    }),
    prisma.secRiskFactor.findMany({
      where: { secCompanyId: company.id },
      orderBy: { orderIndex: 'asc' },
      take: 100,
    }),
    prisma.secFiling.findMany({
      where: { secCompanyId: company.id },
      orderBy: { filingDate: 'desc' },
      take: 60,
      select: {
        id: true,
        accessionNumber: true,
        filingType: true,
        filingDate: true,
        reportDate: true,
        fiscalYear: true,
        fiscalPeriod: true,
        url: true,
      },
    }),
    prisma.secFiling.findFirst({
      where: { secCompanyId: company.id, filingType: { in: ['TEN_K', 'TEN_Q'] } },
      orderBy: { filingDate: 'desc' },
      select: { id: true },
    }),
  ]);

  let intelligence = null;
  if (latestIntelRow?.id) {
    const { sharedFilingIntelligenceExtractor } = require('./filingIntelligenceExtractor');
    intelligence = await sharedFilingIntelligenceExtractor.getFilingIntelligence(latestIntelRow.id);
  }

  const { periods, series, cashBurn } = buildTrendSeries(financials);
  const latest = latestMetrics(periods);
  const ratios = computeRatios(latest);
  const riskSummary = summarizeRisks(risks);
  const timeline = buildTimeline(filings);
  const majorEvents = buildMajorEvents(filings, intelligence ? [intelligence] : []);
  const keyMetrics = buildKeyMetrics(latest, ratios, intelligence);

  const dataVersion = [
    company.updatedAt?.toISOString(),
    company.lastSynced?.toISOString(),
    filings[0]?.filingDate?.toISOString(),
    financials.length,
  ].filter(Boolean).join('|');

  return {
    company: {
      id: company.id,
      cik: company.cik,
      name: company.name,
      tickers: company.tickers,
      lastSynced: company.lastSynced,
      counts: company._count,
    },
    dataVersion,
    trends: {
      revenue: series.revenue,
      profit: series.net_income,
      cashBurn,
      debt: series.debt,
      assets: series.total_assets,
      liabilities: series.total_liabilities,
    },
    ratios,
    keyMetrics,
    riskFactors: riskSummary,
    intelligence: intelligence?.insights
      ? {
          executiveSummary: intelligence.insights.executiveSummary,
          scores: {
            overall: intelligence.insights.overallHealthScore,
            financial: intelligence.insights.financialHealthScore,
            business: intelligence.insights.businessHealthScore,
            operational: intelligence.insights.operationalRiskScore,
            market: intelligence.insights.marketRiskScore,
            leadership: intelligence.insights.leadershipRiskScore,
            funding: intelligence.insights.fundingRiskScore,
          },
          scoreReasoning: intelligence.insights.scoreReasoning,
          generatedAt: intelligence.insights.generatedAt,
        }
      : null,
    timeline,
    majorEvents,
    founderInsights: buildFounderInsights(latest, ratios, intelligence, riskSummary),
  };
}

function buildFounderInsights(latest, ratios, intelligence, riskSummary) {
  const bullets = [];
  const rev = latest.revenue?.value;
  const ni = latest.net_income?.value;
  const cash = latest.cash_and_equivalents?.value;
  const debt = latest.debt?.value;

  if (ni != null && ni < 0) {
    bullets.push({
      tone: 'warning',
      text: `Company reported a net loss of $${Math.abs(ni).toLocaleString()} in the latest period — monitor burn and runway.`,
    });
  } else if (ni != null && ni > 0 && ratios.profitMargin != null) {
    bullets.push({
      tone: 'positive',
      text: `Profitable with ${(ratios.profitMargin * 100).toFixed(1)}% net margin on $${rev?.toLocaleString() || 'reported'} revenue.`,
    });
  }

  if (cash != null && debt != null && debt > cash * 2) {
    bullets.push({
      tone: 'warning',
      text: 'Debt exceeds 2× cash on hand — leverage may constrain strategic flexibility.',
    });
  }

  if (ratios.debtToAssets != null && ratios.debtToAssets > 0.6) {
    bullets.push({
      tone: 'warning',
      text: `Debt-to-assets ratio of ${(ratios.debtToAssets * 100).toFixed(0)}% signals elevated balance-sheet risk.`,
    });
  }

  const topRisk = riskSummary.topRisks[0];
  if (topRisk) {
    bullets.push({
      tone: 'neutral',
      text: `Primary disclosed risk: ${topRisk.title || topRisk.category || 'see risk factors'}.`,
    });
  }

  if (intelligence?.insights?.executiveSummary) {
    bullets.push({
      tone: 'neutral',
      text: intelligence.insights.executiveSummary.slice(0, 220),
    });
  }

  return bullets.slice(0, 5);
}

async function getDashboard(identifiers = []) {
  const ids = [...new Set(identifiers.filter(Boolean))];
  if (!ids.length) {
    return { companies: [], meta: { generatedAt: new Date().toISOString(), count: 0 } };
  }

  const companies = [];
  const errors = [];

  for (const ident of ids.slice(0, 4)) {
    try {
      const payload = await loadCompanyDashboard(ident);
      if (payload) companies.push(payload);
      else errors.push({ identifier: ident, error: 'SEC company not found' });
    } catch (err) {
      errors.push({ identifier: ident, error: err.message });
    }
  }

  return {
    companies,
    errors: errors.length ? errors : undefined,
    meta: {
      generatedAt: new Date().toISOString(),
      count: companies.length,
      dataVersion: companies.map((c) => `${c.company.cik}:${c.dataVersion}`).join(';'),
    },
  };
}

module.exports = {
  getDashboard,
  loadCompanyDashboard,
  buildTrendSeries,
  computeRatios,
};
