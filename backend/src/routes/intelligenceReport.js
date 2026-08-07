const express = require('express');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const aiHelpers = require('./ai');

const prisma = new PrismaClient();
const router = express.Router();

const {
  callAI,
  callGeminiText,
  getSimilarStartupsFromDB,
  buildFallbackBrief,
} = aiHelpers;

// ---------------------------------------------------------------------------
// UNIFIED FOUNDER INTELLIGENCE REPORT
// Merges Risk Scan + Founder Playbook + Pitch Deck Autopsy into ONE report that
// can be generated for a startup, a startup idea, or a pitch deck.
// ---------------------------------------------------------------------------

const HEALTH_CATEGORIES = [
  'Market',
  'Product',
  'Team',
  'Business Model',
  'Execution',
  'Competition',
  'Funding Risk',
  'Scalability',
];

const clampScore = (v) => Math.max(8, Math.min(96, Math.round(v)));
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

const riskLabelFor = (score) => {
  if (score <= 34) return 'critical';
  if (score <= 55) return 'high';
  if (score <= 75) return 'moderate';
  return 'low';
};

// Category rationale used by the deterministic fallback (kept grounded in the
// failure vectors observed among comparable ventures in the database).
function buildCategoryWhy(name, hits, similar, isDeck) {
  const examples = similar.slice(0, 3).map((s) => s.name).join(', ');
  const ref = examples ? ` (see ${examples})` : '';
  switch (name) {
    case 'Market':
      return `PMF failures appear in ${hits.pmf} comparable ventures${ref} — score reflects unproven demand and positioning risk.`;
    case 'Product':
      return `Product/retention weaknesses drove ${hits.product} comparable failures${ref}; the score penalises unvalidated retention and scope creep.`;
    case 'Team':
      return `Leadership and governance failures surfaced in ${hits.legal} comparable cases${ref}; smaller teams add fragility.`;
    case 'Business Model':
      return `Unit-economics collapses (${hits.economics} comparable cases${ref}) are the single largest killer — this score is weighted most heavily.`;
    case 'Execution':
      return `Execution risk compounds product and economics problems; the score reflects delivery discipline implied by similar ventures.`;
    case 'Competition':
      return `${hits.competition} comparable ventures were displaced by incumbents${ref} — score falls as competitive pressure rises.`;
    case 'Funding Risk':
      return `Cash-burn failures (${hits.burn} cases${ref}) set the runway baseline; burn discipline drives this score.`;
    case 'Scalability':
      return `Margin and repeatability failures (${hits.economics + hits.burn} cases${ref}) cap how far the model can scale.`;
    default:
      return 'Derived from comparable failure patterns in the database.';
  }
}

// Deterministic, evidence-backed report used when no AI provider is available.
async function generateSmartIntelligenceReportFallback(input = {}, extra = {}) {
  const { industry = '', similarStartupsFromRoute = [] } = extra;
  const similar = similarStartupsFromRoute.length
    ? similarStartupsFromRoute
    : await getSimilarStartupsFromDB('', industry, 10);

  const isDeck = !!(input && input.deckContent);
  const subject = isDeck ? 'your pitch deck' : (input?.idea || 'your startup idea');
  const companyName = input?.companyName;

  // Count failure-vector hits among comparable ventures.
  const hits = { pmf: 0, economics: 0, burn: 0, competition: 0, product: 0, timing: 0, legal: 0 };
  const lessonSet = [];
  similar.forEach((s) => {
    (s.failureReasons || []).forEach((r) => {
      const cat = (r.category || '').toLowerCase();
      if (/pmf|product-market/.test(cat)) hits.pmf += 1;
      if (/unit_economics|pricing|monetization|cac|ltv/.test(cat)) hits.economics += 1;
      if (/cashflow|burn|runway|capital/.test(cat)) hits.burn += 1;
      if (/competition/.test(cat)) hits.competition += 1;
      if (/product|retention|platform_risk/.test(cat)) hits.product += 1;
      if (/timing|early|premature/.test(cat)) hits.timing += 1;
      if (/legal|regulat|compliance/.test(cat)) hits.legal += 1;
      if (r.description && lessonSet.length < 5) lessonSet.push(r.description.slice(0, 160));
    });
  });

  const base = 74;
  const raw = {
    Market: base - hits.pmf * 6 - hits.competition * 3,
    Product: base - hits.product * 6 - hits.timing * 3,
    Team: base - hits.legal * 4 + (input?.teamSize && Number(input.teamSize) > 2 ? 3 : 0),
    'Business Model': base - hits.economics * 8,
    Execution: base - hits.product * 4 - hits.economics * 3 - (isDeck ? 2 : 0),
    Competition: base - hits.competition * 8,
    'Funding Risk': base - hits.burn * 6,
    Scalability: base - hits.economics * 5 - hits.burn * 3,
  };

  const categories = HEALTH_CATEGORIES.map((name) => ({
    name,
    score: clampScore(raw[name]),
    why: buildCategoryWhy(name, hits, similar, isDeck),
  }));
  const overall = clampScore(avg(categories.map((c) => c.score)));
  const riskLevel = riskLabelFor(overall);
  const trend = overall >= 68 ? 'improving' : overall >= 50 ? 'stable' : 'declining';

  const evidenceFor = (label) =>
    similar
      .filter((s) => (s.failureReasons || []).some((r) => new RegExp(label, 'i').test((r.category || '').toLowerCase())))
      .map((s) => s.name)
      .slice(0, 3);

  const buildRisk = (title, type, count, impact, why, fix) => {
    const examples = evidenceFor(title.toLowerCase().split(' ')[0]);
    return {
      title,
      type: type === 'critical' && count >= 1 ? 'critical' : 'major',
      probability: clampScore(42 + count * 11),
      impact,
      whyItMatters: why,
      evidence: count
        ? `${count} comparable venture(s) in the database failed on this vector.`
        : 'Flagged from general startup-failure data.',
      historicalExamples: examples.length ? examples : ['Juicero', 'Pets.com', 'Webvan'],
      suggestedFix: fix,
    };
  };

  const failureAnalysis = [
    buildRisk('Product-Market Fit', 'critical', hits.pmf, 'high',
      'Without proven demand, every other investment is at risk — PMF is the #1 killer of startups.',
      'Validate with 25+ customer interviews and a paid pilot before scaling spend.'),
    buildRisk('Unit Economics', 'critical', hits.economics, 'high',
      'If LTV/CAC < 1 or gross margin is negative at small scale, growth only enlarges the loss.',
      'Model your unit economics in a spreadsheet; set LTV/CAC > 3 and a 24-month payback before raising.'),
    buildRisk('Cash Burn & Runway', 'critical', hits.burn, 'high',
      'Runway is the ultimate constraint — failures usually happen when cash runs out, not when the idea dies.',
      'Track monthly burn; keep 18+ months of runway and define a hard kill-criterion for the next round.'),
    buildRisk('Competition', 'major', hits.competition, 'medium',
      'Incumbents with distribution moats can outspend you before you find your wedge.',
      'Pick a narrow beachhead segment and a wedge incumbents cannot easily copy.'),
    buildRisk('Retention & Execution', 'major', hits.product, 'medium',
      'Acquisition without retention is a leaky bucket — churn compounds silently.',
      'Instrument cohort retention from day one; fix churn before spending on growth.'),
  ];

  const playbook = {
    immediateActions: [
      'Run 15 customer interviews this week using the Mom-Test methodology',
      'Write a one-page narrative of the problem, the job-to-be-done, and the current workaround',
      'Model first-order unit economics in a spreadsheet (price, CAC, LTV, gross margin)',
    ],
    plan30Day: [
      'Ship a concierge/MVP to 10 design partners',
      'Instrument activation + week-4 retention',
      'Land a LOI or deposit from 3 would-be customers',
    ],
    plan90Day: [
      'Reach 100 engaged users and prove a repeatable acquisition channel',
      'Hit LTV/CAC > 3 or define the path to it',
      'Decide go/no-go on the full product build',
    ],
    plan12Month: [
      'Grow to $10K+ MRR or 1K+ deeply engaged users',
      'Hire your first 3 senior hires (engineering, GTM, design)',
      'Raise a seed round backed by retention + unit-economics data',
    ],
    hiring: [
      'Hire a founding engineer before a product manager',
      'First sales hire should be a founder-led discovery role, not a quota closer',
      'Avoid expensive senior execs until the model is proven',
    ],
    productPriorities: [
      'Single feature that nails the core job-to-be-done',
      'Remove features that add scope but not retention',
      'Invest in onboarding — activation beats acquisition',
    ],
    gtmStrategy: [
      'Dominate one beachhead segment before expanding',
      'Founder-led outbound and content are the cheapest early channels',
      'Charge from day one — willingness to pay is the strongest validation',
    ],
    fundraisingAdvice: [
      'Raise only what you need for 18 months of runway',
      'Lead with retention and unit-economics data, not vision',
      'Beware of valuation inflation that forces premature scaling',
    ],
    kpis: [
      'Activation rate',
      'Week-4 cohort retention',
      'LTV/CAC ratio',
      'Monthly burn & runway',
      'Net revenue retention',
    ],
  };

  // Pitch analysis: when a deck is provided, score presence of key sections.
  const deckText = (input?.deckContent || '').toLowerCase();
  const has = (kw) => deckText.includes(kw);
  const missingSlides = [];
  if (!isDeck || !has('problem')) missingSlides.push('Problem');
  if (!isDeck || (!has('market') && !has('tam'))) missingSlides.push('Market Size (TAM/SAM/SOM)');
  if (!isDeck || !has('competition')) missingSlides.push('Competition / Moat');
  if (!isDeck || (!has('business model') && !has('revenue') && !has('pricing'))) missingSlides.push('Business Model');
  if (!isDeck || (!has('traction') && !has('mrr') && !has('users'))) missingSlides.push('Traction');
  if (!isDeck || !has('team')) missingSlides.push('Team');
  if (!isDeck || (!has('milestone') && !has('roadmap'))) missingSlides.push('Milestones / Roadmap');
  if (!isDeck || !has('use of funds')) missingSlides.push('Use of Funds');

  const investorQuestions = [
    'What is your LTV:CAC and payback period today?',
    'What is week-4 cohort retention?',
    'Who is your wedge customer and why now?',
    'What is the single biggest risk and your plan for it?',
    'What does the competitive moat look like in 3 years?',
  ];

  const pitchAnalysis = {
    storytelling: isDeck
      ? `The deck contains ${input.deckContent.split(/\s+/).filter(Boolean).length} words across ${deckText.split('\n').filter((l) => l.trim()).length} lines; it ${has('vision') || has('mission') ? 'leads with vision' : 'lacks a clear narrative hook'}.`
      : 'Build a narrative arc: the problem, the moment of insight, the wedge, and the milestone-driven vision.',
    market: isDeck
      ? (has('market') || has('tam'))
        ? 'A market sizing slide is present — sharpen it with bottoms-up demand, not just TAM.'
        : 'No explicit market sizing detected.'
      : 'Size the market bottom-up (price x buyers x penetration), not top-down TAM alone.',
    competition: isDeck
      ? has('competition')
        ? 'Competition is acknowledged — strengthen it with a defensible moat narrative.'
        : 'No competitive slide detected — investors assume you have none.'
      : 'Map incumbents and their moats; define your wedge explicitly.',
    financials: isDeck
      ? (has('revenue') || has('financial') || has('mrr'))
        ? 'Financial projections are present — anchor them to unit economics.'
        : 'No financials detected — add a simple 3-year model with assumptions.'
      : 'Prepare a 3-year P&L with explicit assumption drivers.',
    traction: isDeck
      ? (has('traction') || has('mrr') || has('users'))
        ? 'Traction signals detected — lead with cohort data.'
        : 'No traction shown — lead with the strongest demand evidence you have.'
      : 'Collect demand evidence (interviews, deposits, LOIs) before the raise.',
    design: isDeck
      ? `${input.deckContent.length > 1200 ? 'Substantial content' : 'Thin content'} — keep slides under 12 and one idea per slide.`
      : 'Keep the deck under 12 slides; one idea per slide; no walls of text.',
    investorReadiness: isDeck
      ? `Missing ${missingSlides.length} recommended section(s); deck length suggests ${input.deckContent.length > 2000 ? 'late-stage' : 'early-stage'} readiness.`
      : 'You are investor-ready when you can answer the 5 hard questions below from data.',
    missingSlides: missingSlides.slice(0, 6),
    investorQuestions,
    investmentScore: isDeck ? clampScore(70 - missingSlides.length * 8) : overall,
  };

  // Timeline: use DB events when available (startup mode), else a projected
  // validation roadmap (idea/deck mode).
  const timeline = (extra.timeline && extra.timeline.length
    ? extra.timeline
    : [
        { id: 't1', date: 'Week 1', title: 'Idea Stress-Test', description: 'Interview 15+ target customers; map the workaround.', stage: 'founding' },
        { id: 't2', date: 'Month 1', title: 'Concierge MVP', description: 'Deliver the service manually to 10 design partners.', stage: 'funding' },
        { id: 't3', date: 'Month 3', title: 'First Traction', description: 'Prove activation + week-4 retention above 30%.', stage: 'growth' },
        { id: 't4', date: 'Month 6', title: 'Unit Economics Lock', description: 'Hit LTV/CAC > 3 and a viable gross margin.', stage: 'major_decisions' },
        { id: 't5', date: 'Month 9', title: 'Beachhead Domination', description: 'Own one segment before expanding; begin the seed raise.', stage: 'warning_signs' },
        { id: 't6', date: 'Month 12', title: 'Scale or Pivot Gate', description: 'Reassess fit, retention and burn; decide scale vs. pivot.', stage: 'collapse' },
      ]);

  const riskTableRows = categories.map((c) => ({ factor: c.name, score: c.score, note: c.why.slice(0, 90) }));

  const consultantBrief = buildFallbackBrief({
    title: 'Founder Intelligence Report',
    summary: `${companyName ? `${companyName}: ` : ''}Overall health ${overall}/100 (${riskLevel} risk, trend ${trend}), benchmarked against ${similar.length} comparable ventures. The dominant exposure is ${failureAnalysis[0].title.toLowerCase()} with ${failureAnalysis[0].probability}% estimated probability.`,
    rootCauses: failureAnalysis.slice(0, 4).map((r) => `${r.title}: ${r.whyItMatters}`),
    failurePattern: riskLevel === 'low'
      ? 'Validation-stage venture with manageable risk'
      : `${riskLevel === 'critical' ? 'Critical' : riskLevel === 'high' ? 'High' : 'Moderate'}-risk early venture`,
    lessons: lessonSet.length ? lessonSet : ['Validate demand before building', 'Lock unit economics before scaling', 'Keep runway above 18 months'],
    founderAdvice: playbook.immediateActions.concat(playbook.fundraisingAdvice.slice(0, 2)),
    riskScore: overall,
    riskLabel: riskLevel,
    riskFactors: riskTableRows,
    realExamples: similar.slice(0, 6).map((s) => `**${s.name}** (${s.industry || '—'}, ${s.status || '—'}): ${s.failureReasons?.[0]?.description?.slice(0, 110) || s.summary?.slice(0, 110)}`),
    actionPlan: [
      { phase: 'Now', action: '15 customer interviews + unit-economics model', outcome: 'Demand + math validated' },
      { phase: 'Month 1', action: 'Concierge MVP with 10 design partners', outcome: 'Retention signal' },
      { phase: 'Month 3', action: 'Prove activation + week-4 retention > 30%', outcome: 'Investable traction' },
    ],
    sources: similar.slice(0, 8).map((s) => `${s.name} (internal failure database)`),
  });

  return {
    executiveSummary: {
      verdict: `${companyName || 'This venture'} scores ${overall}/100 — ${riskLevel} risk with a ${trend} trajectory.`,
      summary: `Benchmarked against ${similar.length} comparable ventures, ${subject} shows its strongest exposure in ${failureAnalysis[0].title.toLowerCase()} (${failureAnalysis[0].probability}% estimated probability) and its second in ${failureAnalysis[1].title.toLowerCase()}. ${overall >= 68 ? 'The fundamentals are promising, but disciplined validation is still required.' : overall >= 50 ? 'The concept has merit, yet several failure vectors must be addressed before scaling.' : 'The current shape carries serious structural risk — address the top risks before committing capital.'}`,
      strengths: categories.filter((c) => c.score >= 65).map((c) => `${c.name} (${c.score}/100)`),
      weaknesses: categories.filter((c) => c.score < 55).map((c) => `${c.name} (${c.score}/100)`),
    },
    healthScore: { overall, trend, riskLevel, categories },
    failureAnalysis,
    playbook,
    pitchAnalysis,
    timeline,
    consultantBrief,
  };
}

// Fallback for the timeline event chat when no AI provider is available.
function generateSmartEventChatFallback(startup, event = {}, message) {
  const failureReason = startup.failureReasons?.[0];
  const title = event.title || 'this event';
  return `Looking at the ${title} moment for ${startup.name} (${startup.industry || 'unknown industry'}, ${startup.status || 'status unknown'}): this event sits inside a sequence that ended in ${startup.status || 'failure'}. ${failureReason ? `The pattern most directly tied to it is ${failureReason.category}: ${failureReason.description}` : 'The records point to a mix of market and execution pressures.'} If I could flag one thing about ${title}, it would be the compounding effect — each decision narrowed the room to manoeuvre until the company ran out of options.`;
}

// Rate limiter — these endpoints are LLM-backed, so cap per-user burst traffic.
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many report requests. Please wait before trying again.', code: 'RATE_LIMITED' }
});
const eventChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many chat requests. Please wait before trying again.', code: 'RATE_LIMITED' }
});

// POST /api/ai/intelligence-report
router.post('/intelligence-report', reportLimiter, async (req, res, next) => {
  try {
    const { mode = 'idea', history = [], followUpQuestion } = req.body;
    let input;
    let extra = { industry: req.body?.industry || 'SaaS' };

    if (mode === 'startup') {
      const slug = String(req.body.slug || '').trim();
      const name = String(req.body.startupName || req.body.name || '').trim();
      if (!slug && !name) {
        return res.status(400).json({ error: 'Provide a startup slug or name for startup mode.' });
      }
      const startup = await prisma.company.findFirst({
        where: slug ? { slug } : { name: { contains: name, mode: 'insensitive' } },
        include: { failureReasons: true, timelineEvents: { orderBy: { eventDate: 'asc' } } },
      });
      if (!startup) {
        return res.status(404).json({
          error: `\u201C${name || slug}\u201D isn't in the intelligence database yet. Search the archive or use Idea mode instead.`,
          code: 'COMPANY_NOT_FOUND',
        });
      }
      input = {
        companyName: startup.name,
        industry: startup.industry || '',
        summary: startup.summary || startup.description || '',
        status: startup.status || '',
        funding: startup.fundingInr || null,
        foundedYear: startup.foundedYear || null,
        idea: startup.summary || `${startup.name} (${startup.industry || 'unknown industry'})`,
      };
      extra = {
        industry: startup.industry || '',
        similarStartupsFromRoute: await getSimilarStartupsFromDB(startup.name, startup.industry, 10),
        timeline: (startup.timelineEvents || []).map((e) => ({
          id: e.id ? String(e.id) : `e-${e.title.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
          date: e.eventDate ? e.eventDate.toISOString().slice(0, 10) : '',
          title: e.title,
          description: e.description || '',
          stage: e.stage || 'major_decisions',
        })),
        failureContext: (startup.failureReasons || [])
          .map((r) => `[${r.category}] ${r.description}`)
          .join('\n'),
      };
    } else if (mode === 'deck') {
      const deckContent = String(req.body.deckContent || '').trim();
      if (!deckContent) {
        return res.status(400).json({ error: 'Pitch deck content is required for deck mode.' });
      }
      input = { deckContent, industry: req.body.industry || 'SaaS' };
    } else {
      input = {
        idea: String(req.body.idea || '').trim(),
        audience: String(req.body.audience || '').trim(),
        revenueModel: String(req.body.revenueModel || '').trim(),
        teamSize: req.body.teamSize ? Number(req.body.teamSize) : null,
        industry: String(req.body.industry || 'SaaS').trim(),
      };
      if (!input.idea || input.idea.length < 10) {
        return res.status(400).json({ error: 'Describe your startup idea (at least 10 characters) for idea mode.' });
      }
    }

    const chatHistory = history.length
      ? `PREVIOUS CONVERSATION:\n${history.map((h) => `${h.role}: ${h.content}`).join('\n')}\n\n`
      : '';

    const prompt = `SYSTEM: You are a senior founder-intelligence analyst operating at McKinsey + Y Combinator + Harvard Business Review caliber. Produce ONE comprehensive Founder Intelligence Report for the input below, merging risk analysis, a founder playbook, and a pitch-deck review. Be specific, evidence-backed, and never generic. Return ONLY valid JSON — no prose outside the JSON, no markdown fences.

MODE: ${mode}
INPUT:
${mode === 'deck' ? `Pitch deck content:\n${input.deckContent}\nIndustry: ${input.industry}` : `Idea: ${input.idea || input.summary || ''}${input.audience ? `\nAudience: ${input.audience}` : ''}${input.revenueModel ? `\nRevenue Model: ${input.revenueModel}` : ''}${input.teamSize ? `\nTeam Size: ${input.teamSize}` : ''}\nIndustry: ${input.industry}${input.companyName ? `\nCompany: ${input.companyName} (${input.status || 'status unknown'})` : ''}`}

HISTORICAL CONTEXT (comparable ventures in the failure database):
${(extra.similarStartupsFromRoute || []).map((s) => `${s.name} (${s.industry}, ${s.status}): ${s.failureReasons?.map((r) => r.description).join('; ') || s.summary?.slice(0, 120)}`).join('\n') || 'None found.'}
${extra.failureContext ? `\nTHIS COMPANY'S FAILURE REASONS:\n${extra.failureContext}` : ''}

SCHEMA (return exactly this shape):
{
  "executiveSummary": { "verdict": "string", "summary": "one paragraph", "strengths": ["string"], "weaknesses": ["string"] },
  "healthScore": {
    "overall": 0-100,
    "trend": "improving|stable|declining",
    "riskLevel": "low|moderate|high|critical",
    "categories": [{ "name": "Market|Product|Team|Business Model|Execution|Competition|Funding Risk|Scalability", "score": 0-100, "why": "string explaining exactly why this score was given" }]
  },
  "failureAnalysis": [{ "title": "string", "type": "major|critical", "probability": 0-100, "impact": "low|medium|high", "whyItMatters": "string", "evidence": "string", "historicalExamples": ["string"], "suggestedFix": "string" }],
  "playbook": { "immediateActions": ["string"], "plan30Day": ["string"], "plan90Day": ["string"], "plan12Month": ["string"], "hiring": ["string"], "productPriorities": ["string"], "gtmStrategy": ["string"], "fundraisingAdvice": ["string"], "kpis": ["string"] },
  "pitchAnalysis": { "storytelling": "string", "market": "string", "competition": "string", "financials": "string", "traction": "string", "design": "string", "investorReadiness": "string", "missingSlides": ["string"], "investorQuestions": ["string"], "investmentScore": 0-100 },
  "timeline": [{ "id": "string", "date": "string", "title": "string", "description": "string", "stage": "founding|funding|growth|major_decisions|warning_signs|collapse|aftermath" }],
  "consultantBrief": "markdown string — see below"
}

Rules:
- healthScore.categories must contain EXACTLY 8 entries with those names.
- In startup mode, build the timeline from the historical context (or reproduce the company's real timeline when provided). In idea/deck mode, generate a projected validation roadmap.
- Every failureAnalysis entry must include whyItMatters, evidence, historicalExamples and suggestedFix.
- Never invent statistics. If data is missing, say so.
- consultantBrief: a dense markdown report with "##" sections, bullets, and at least one comparison table: Summary, Root Cause Analysis, Failure Pattern, Risk Score, Real Examples, Action Plan, Sources.
${chatHistory}${followUpQuestion ? `\nCURRENT FOLLOW-UP QUESTION (answer it directly while returning the same JSON schema, updated to address it):\n${followUpQuestion}` : ''}`;

    const result = await callAI(
      prompt,
      'report',
      mode === 'deck' ? input.deckContent : (input.idea || input.summary || ''),
      extra
    );

    res.json({ mode, _meta: { benchmarked: (extra.similarStartupsFromRoute || []).length }, ...result });
  } catch (err) {
    console.error('Intelligence report error:', err);
    const fallback = await generateSmartIntelligenceReportFallback(
      { ...req.body, companyName: req.body?.companyName || req.body?.startupName || req.body?.name || '' },
      { industry: req.body?.industry }
    );
    res.json({ mode: req.body?.mode || 'idea', _meta: { fallback: true }, ...fallback });
  }
});

// POST /api/ai/event-chat — answers ONLY about the selected timeline event,
// grounded in the startup's timeline, failure data, and (when available) RAG.
router.post('/event-chat', eventChatLimiter, async (req, res, next) => {
  try {
    const { slug, event = {}, message, history = [] } = req.body;
    if (!slug || !message) {
      return res.status(400).json({ error: 'Slug and message are required' });
    }

    const startup = await prisma.company.findUnique({
      where: { slug },
      include: {
        failureReasons: true,
        timelineEvents: { orderBy: { eventDate: 'asc' } },
      },
    });
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // Optional RAG over the company's indexed documents (SEC filings etc.).
    let ragContext = '';
    let ragUsed = false;
    try {
      const ragService = require('../services/rag');
      const results = await ragService.hybridSearch(
        `${event.title || ''} ${event.description || ''} ${message}`,
        { companyId: startup.id }
      );
      const chunks = (results || []).slice(0, 4).map((c) => c.content).filter(Boolean);
      if (chunks.length) {
        ragContext = chunks.join('\n');
        ragUsed = true;
      }
    } catch (e) {
      // RAG unavailable — fall back to database-only context.
    }

    const timelineStr = (startup.timelineEvents || [])
      .map((e) => `${e.eventDate ? e.eventDate.toISOString().slice(0, 10) : '—'} | ${(e.stage || '').toUpperCase()} | ${e.title}. ${e.description || ''}`)
      .join('\n');
    const failureStr = (startup.failureReasons || [])
      .map((r) => `[${r.category}] ${r.description}`)
      .join('\n');
    const chatHistory = history
      .map((h) => `${h.role === 'user' ? 'Visitor' : 'Analyst'}: ${h.content}`)
      .join('\n');

    const prompt = `You are the PivotVault Timeline Analyst embedded in an interactive startup timeline. You may ONLY answer questions about the SELECTED EVENT below — never about the company in general and never generic startup advice, except when the visitor explicitly asks for a comparison (e.g. "compare with WeWork").

COMPANY: ${startup.name} (${startup.industry || 'unknown industry'}, ${startup.status || 'status unknown'})
SELECTED EVENT:
Date: ${event.date || '—'}
Title: ${event.title || '—'}
Description: ${event.description || '—'}

FULL TIMELINE (context for the event's place in the story):
${timelineStr || 'No timeline recorded.'}

FAILURE REASONS:
${failureStr || 'Not documented.'}

${ragContext ? `DOCUMENT EVIDENCE (from the company's own filings/documents):\n${ragContext}\n` : ''}
${chatHistory ? `PREVIOUS CONVERSATION:\n${chatHistory}\n` : ''}
RULES:
- Answer in 3-6 punchy sentences. Be specific to the event; cite evidence when you use it.
- If the question is about a different event, gently redirect to the selected event.
- If you don't know, admit it plainly.
- Never break character as the Timeline Analyst.

VISITOR: ${message}
ANALYST:`;

    let reply = '';
    const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'your-groq-api-key-here';
    const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';

    if (hasGroq) {
      try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a concise startup timeline analyst. Plain text, no JSON, no markdown.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 350,
        });
        reply = response.choices[0].message.content.trim();
      } catch (err) {
        console.warn('Groq failed for event-chat:', err.message);
      }
    }
    if (!reply && hasGemini) {
      try {
        reply = await callGeminiText(prompt);
      } catch (err) {
        console.warn('Gemini failed for event-chat:', err.message);
      }
    }
    if (!reply) {
      reply = generateSmartEventChatFallback(startup, event, message);
    }

    res.json({ content: reply, eventTitle: event.title || null, ragUsed });
  } catch (err) {
    console.error('Event chat error:', err);
    res.json({ content: 'The timeline analyst is momentarily unavailable. The selected event is best understood in the context of the events around it — try asking about the event before or after it.', ragUsed: false });
  }
});

module.exports = router;
