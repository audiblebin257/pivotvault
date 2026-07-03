/** Demo SEC financial dashboard payload when backend is unavailable. */

const mkSeries = (base, growth, years = 5) =>
  years.map((y, i) => ({
    label: String(y),
    fiscalYear: y,
    value: Math.round(base * Math.pow(1 + growth, i)),
    unit: 'USD',
  }));

const mkBurn = (years, amounts) =>
  years.map((y, i) => ({
    label: String(y),
    fiscalYear: y,
    value: -amounts[i],
    burnRate: amounts[i],
    operatingLoss: amounts[i],
  }));

function companyPayload({ cik, name, tickers, revenueBase, growth, burnAmounts, debtBase, health }) {
  const years = [2020, 2021, 2022, 2023, 2024];
  const revenue = mkSeries(revenueBase, growth);
  const profit = revenue.map((r, i) => ({
    ...r,
    value: Math.round(r.value * (health > 70 ? 0.22 - i * 0.01 : -0.08 - i * 0.02)),
  }));
  const assets = revenue.map((r) => ({ ...r, value: Math.round(r.value * 1.8) }));
  const liabilities = revenue.map((r) => ({ ...r, value: Math.round(r.value * 0.9) }));
  const debt = mkSeries(debtBase, 0.04, 5);
  const latestRev = revenue[revenue.length - 1].value;
  const latestNi = profit[profit.length - 1].value;

  return {
    company: {
      id: `demo-${cik}`,
      cik,
      name,
      tickers,
      lastSynced: new Date().toISOString(),
      counts: { filings: 42, financials: 120, riskFactors: 28 },
    },
    dataVersion: `demo-${cik}-v1`,
    trends: {
      revenue,
      profit,
      cashBurn: mkBurn(years, burnAmounts),
      debt,
      assets,
      liabilities,
    },
    ratios: {
      profitMargin: latestNi / latestRev,
      grossMargin: 0.42,
      operatingMargin: 0.18,
      debtToAssets: debt[4].value / assets[4].value,
      debtToEquity: 0.85,
      liabilitiesToAssets: liabilities[4].value / assets[4].value,
      returnOnAssets: 0.12,
      returnOnEquity: 0.24,
      cashToDebt: 1.4,
      expenseRatio: 0.78,
    },
    keyMetrics: {
      revenue: latestRev,
      netIncome: latestNi,
      cash: Math.round(latestRev * 0.35),
      debt: debt[4].value,
      assets: assets[4].value,
      liabilities: liabilities[4].value,
      employees: 160000,
      overallHealthScore: health,
      financialHealthScore: health - 5,
      fundingRiskScore: 100 - health,
      profitMargin: latestNi / latestRev,
      debtToAssets: debt[4].value / assets[4].value,
    },
    riskFactors: {
      total: 28,
      categories: [
        {
          category: 'market',
          count: 8,
          items: [
            { title: 'Competitive pressure', excerpt: 'Intense competition may erode margins and market share.' },
            { title: 'Macroeconomic conditions', excerpt: 'Recession or inflation could reduce demand.' },
          ],
        },
        {
          category: 'regulatory',
          count: 5,
          items: [{ title: 'Regulatory changes', excerpt: 'New regulations may increase compliance costs.' }],
        },
      ],
      topRisks: [
        { title: 'Competition & pricing', category: 'market', excerpt: 'Aggressive pricing from competitors.' },
        { title: 'Supply chain', category: 'operational', excerpt: 'Disruptions could delay product launches.' },
      ],
    },
    intelligence: {
      executiveSummary: `${name} shows ${health >= 70 ? 'solid' : 'mixed'} fundamentals with revenue growth and disclosed risks typical of large-cap filers. Data sourced from SEC EDGAR (demo mode).`,
      scores: {
        overall: health,
        financial: health - 5,
        business: health + 2,
        operational: 55,
        market: 48,
        leadership: 72,
        funding: 100 - health,
      },
      generatedAt: new Date().toISOString(),
    },
    timeline: years.flatMap((y) => [
      {
        id: `${cik}-10k-${y}`,
        date: `${y}-11-01`,
        type: 'TEN_K',
        label: '10-K',
        fiscalYear: y,
        isMajor: true,
        url: 'https://www.sec.gov/',
        accessionNumber: `000${cik}-${y}-10k`,
      },
      {
        id: `${cik}-10q-${y}`,
        date: `${y}-08-01`,
        type: 'TEN_Q',
        label: '10-Q',
        fiscalYear: y,
        fiscalPeriod: 'Q3',
        isMajor: true,
        url: 'https://www.sec.gov/',
        accessionNumber: `000${cik}-${y}-10q`,
      },
    ]),
    majorEvents: [
      {
        date: '2024-02-02',
        type: 'annual_report',
        title: '10-K FY2024',
        description: 'Annual report filed with SEC',
        severity: 'medium',
        url: 'https://www.sec.gov/',
      },
      {
        date: '2023-11-03',
        type: 'material_event',
        title: '8-K Material Event',
        description: 'Leadership transition disclosed',
        severity: 'high',
        url: 'https://www.sec.gov/',
      },
    ],
    founderInsights: [
      {
        tone: latestNi >= 0 ? 'positive' : 'warning',
        text: latestNi >= 0
          ? `Profitable on $${latestRev.toLocaleString()} revenue — margin discipline visible in filings.`
          : `Net losses in recent periods — founders should stress-test runway scenarios.`,
      },
      {
        tone: 'neutral',
        text: 'Review Item 1A risk factors before fundraising or strategic pivots.',
      },
    ],
  };
}

export const mockSecLookupResults = [
  { cik: '0000320193', name: 'Apple Inc.', tickers: ['AAPL'] },
  { cik: '0000789019', name: 'Microsoft Corporation', tickers: ['MSFT'] },
  { cik: '0001652044', name: 'Alphabet Inc.', tickers: ['GOOGL', 'GOOG'] },
  { cik: '0001018724', name: 'Amazon.com, Inc.', tickers: ['AMZN'] },
];

export function getMockSecDashboard(identifiers = ['AAPL', 'MSFT']) {
  const catalog = {
    '0000320193': companyPayload({
      cik: '0000320193',
      name: 'Apple Inc.',
      tickers: ['AAPL'],
      revenueBase: 274_000_000_000,
      growth: 0.06,
      burnAmounts: [0, 0, 0, 0, 0],
      debtBase: 98_000_000_000,
      health: 82,
    }),
    AAPL: null,
    '0000789019': companyPayload({
      cik: '0000789019',
      name: 'Microsoft Corporation',
      tickers: ['MSFT'],
      revenueBase: 168_000_000_000,
      growth: 0.12,
      burnAmounts: [0, 0, 0, 0, 0],
      debtBase: 59_000_000_000,
      health: 88,
    }),
    MSFT: null,
    '0001652044': companyPayload({
      cik: '0001652044',
      name: 'Alphabet Inc.',
      tickers: ['GOOGL'],
      revenueBase: 182_000_000_000,
      growth: 0.09,
      burnAmounts: [2e9, 3e9, 4e9, 5e9, 6e9],
      debtBase: 28_000_000_000,
      health: 79,
    }),
  };

  catalog.AAPL = catalog['0000320193'];
  catalog.MSFT = catalog['0000789019'];

  const ids = identifiers.length ? identifiers : ['AAPL', 'MSFT'];
  const companies = ids
    .map((id) => catalog[id] || catalog[id.toUpperCase()] || catalog[`0000${id}`])
    .filter(Boolean);

  return {
    companies: companies.length
      ? companies
      : [catalog['0000320193'], catalog['0000789019']],
    meta: {
      generatedAt: new Date().toISOString(),
      count: companies.length || 2,
      dataVersion: 'demo-sec-dashboard',
      demo: true,
    },
  };
}

export function mockSecLookup(query) {
  const q = query.toLowerCase();
  return mockSecLookupResults.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.tickers.some((t) => t.toLowerCase().includes(q)) ||
      c.cik.includes(q)
  );
}
