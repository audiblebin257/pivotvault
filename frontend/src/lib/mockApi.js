// Mock API data for hackathon demo mode
export const mockStartups = [
  {
    id: 1,
    slug: 'juicero',
    name: 'Juicero',
    industry: 'Consumer Hardware',
    status: 'failed',
    summary: 'A $400 Wi-Fi enabled juicer that squeezed pre-packaged juice bags.',
    foundingYear: 2013,
    shutdownYear: 2017,
    lifetimeMonths: 48,
    fundingInr: 10300000000,
    peakUsers: 100000,
    topFailureReason: 'unit_economics',
    domain: 'juicero.com'
  },
  {
    id: 2,
    slug: 'theranos',
    name: 'Theranos',
    industry: 'Health Tech',
    status: 'failed',
    summary: 'Claimed to revolutionize blood testing with a single drop of blood.',
    foundingYear: 2003,
    shutdownYear: 2018,
    lifetimeMonths: 180,
    fundingInr: 70000000000,
    peakUsers: 500000,
    topFailureReason: 'product',
    domain: 'theranos.com'
  },
  {
    id: 3,
    slug: 'wework',
    name: 'WeWork',
    industry: 'Real Estate',
    status: 'failed',
    summary: 'Co-working space company that collapsed after failed IPO.',
    foundingYear: 2010,
    shutdownYear: 2019,
    lifetimeMonths: 108,
    fundingInr: 90000000000,
    peakUsers: 600000,
    topFailureReason: 'cashflow',
    domain: 'wework.com'
  },
  {
    id: 4,
    slug: 'quibi',
    name: 'Quibi',
    industry: 'Media / Entertainment',
    status: 'failed',
    summary: 'Short-form video platform that shut down 6 months after launch.',
    foundingYear: 2018,
    shutdownYear: 2020,
    lifetimeMonths: 24,
    fundingInr: 14000000000,
    peakUsers: 500000,
    topFailureReason: 'pmf',
    domain: 'quibi.com'
  }
];

export const mockRiskScan = {
  riskScore: 72,
  riskBreakdown: {
    customerAcquisition: 65,
    retention: 70,
    monetization: 60,
    competition: 80,
    timing: 75
  },
  recommendations: [
    { priority: 'high', action: 'Validate PMF aggressively', rationale: 'Most failures here stem from lack of product-market fit.' },
    { priority: 'medium', action: 'Fix unit economics early', rationale: 'Don\'t scale before proving profitable per user.' }
  ],
  suggestedPivots: [
    { type: 'Market', description: 'Target a more specific niche with higher willingness to pay.', historicalExample: 'Slack pivoted from gaming to enterprise comms.' },
    { type: 'Product', description: 'Simplify features to core value proposition only.', historicalExample: 'Instagram dropped all features except photo filters.' }
  ]
};

export const mockAiResponse = {
  aiSummary: "Based on historical data, startups in this space often fail due to premature scaling and lack of product-market fit. Key lessons: validate demand before scaling, keep burn rate low, and focus on retention.",
  timeline: [
    { year: 2015, startup: 'Juicero', event: 'Launched with $120M funding' },
    { year: 2017, startup: 'Juicero', event: 'Shut down after unit economics failed' }
  ],
  keyLessons: [
    { lesson: 'Validate PMF first', details: 'Don\'t spend millions on production before proving customers want your product.' },
    { lesson: 'Watch burn rate', details: 'High fixed costs can sink you fast if revenue doesn\'t match.' }
  ],
  sources: ['juicero', 'theranos'],
  relatedStartups: mockStartups.slice(0, 2)
};

export const mockPlaybook = {
  summary: "Your idea has potential but needs rigorous validation. Focus on these key areas first.",
  checklist: [
    "Interview 50 target customers",
    "Build a minimal viable product",
    "Validate willingness to pay",
    "Track retention metrics"
  ],
  risks: ["No PMF", "Unit Economics", "Competition"],
  nextSteps: [
    "Define your ideal customer profile",
    "Create a landing page to test demand",
    "Set up analytics from day one"
  ]
};

export const mockPitchDeckAutopsy = {
  overallRisk: 'High',
  pathologistVerdict: 'Your deck shows several red flags common to failed startups.',
  executiveSummary: 'Focus on product-market fit before scaling operations.',
  strengths: [
    { title: 'Clear Problem Statement', description: 'You\'ve defined the problem well.' },
    { title: 'Strong Team', description: 'Your team has relevant experience.' }
  ],
  weaknesses: [
    { title: 'Unrealistic Market Size', description: 'Your TAM calculation seems inflated.' },
    { title: 'No Clear Differentiation', description: 'It\'s not obvious how you stand out.' }
  ],
  marketRisks: [
    { title: 'Competition', description: 'Incumbents could easily copy this.' }
  ],
  productRisks: [
    { title: 'Complexity', description: 'Too many features for MVP.' }
  ],
  gtmRisks: [
    { title: 'Customer Acquisition', description: 'CAC seems too high.' }
  ],
  financialRisks: [
    { title: 'Burn Rate', description: 'You\'ll run out of cash in 12 months.' }
  ],
  pmfAnalysis: 'You haven\'t proven product-market fit yet. Focus on that first.',
  investorConcerns: [
    { title: 'Unit Economics', description: 'Need to show path to profitability.' },
    { title: 'Churn', description: 'Retention numbers are missing.' }
  ],
  competitiveAnalysis: 'The space is crowded but there might be a niche.',
  recommendedImprovements: [
    { title: 'Simplify MVP', description: 'Cut features to the core value prop.' },
    { title: 'Validate Pricing', description: 'Talk to customers about willingness to pay.' }
  ],
  actionPlan: [
    { phase: 'Month 1-2', tasks: ['Customer interviews', 'Landing page', 'Waitlist'] },
    { phase: 'Month 3-4', tasks: ['Build MVP', 'Beta test', 'Iterate'] }
  ],
  lethalWeaknesses: [
    { slide: 'Go-to-Market', issue: 'No clear user acquisition strategy', historicalPrecedent: 'Similar to Quibi\'s vague GTM plan.' },
    { slide: 'Financials', issue: 'Unrealistic revenue projections', historicalPrecedent: 'WeWork\'s inflated numbers.' }
  ],
  structuralRedFlags: ['Team', 'Market', 'Product']
};
