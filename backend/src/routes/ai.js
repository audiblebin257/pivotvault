const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { searchWeb } = require('../services/searchService');

const prisma = new PrismaClient();
const router = express.Router();

// Rate limiter for risk scan
const riskScanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many scan requests. Please wait before trying again.', code: 'RATE_LIMITED' }
});

// Risk Scan input schema
const riskScanSchema = z.object({
  idea: z.string().min(10).max(500),
  audience: z.string().min(3).max(200),
  revenueModel: z.string().min(2).max(200),
  teamSize: z.coerce.number().int().min(1).max(100),
  industry: z.string().min(2).max(100),
});

// Simple cache in memory (in production, use Redis)
const scanCache = new Map();

function getCacheKey(input) {
  const str = `${input.idea}|${input.audience}|${input.revenueModel}|${input.teamSize}|${input.industry}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `scan:${hash}`;
}

// AI service for calling Gemini
async function callGemini(prompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(text);
}

async function callGeminiText(prompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function callGroq(prompt) {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a JSON API. Return ONLY valid JSON. No markdown. No code blocks. No explanation. No backticks.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  let content = response.choices[0].message.content;
  console.log('RAW GROQ RESPONSE (first 300 chars):', content?.slice(0, 300));

  // Strip markdown code fences if present
  content = content.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

  // Remove bad control characters that break JSON.parse
  content = content.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    // Keep valid JSON whitespace
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '';
  });

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Groq JSON parse failed:', err.message);
    console.error('Full raw content:', content);
    throw new Error(`Groq returned invalid JSON: ${err.message}`);
  }
}

// type = 'risk' | 'research' — determines which mock schema to fall back to
async function callAI(prompt, type = 'risk') {
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'your-groq-api-key-here';

  console.log("Gemini key:", hasGemini);
  console.log("Groq key:", hasGroq);

  // ── Try Groq first (faster, no quota issues on free tier) ──────────────
  if (hasGroq) {
    try {
      console.log('Trying Groq...');
      return await callGroq(prompt);
    } catch (err) {
      console.warn('Groq failed:', err.message);
    }
  }

  // ── Fall back to Gemini ─────────────────────────────────────────────────
  if (hasGemini) {
    try {
      console.log('Trying Gemini...');
      return await callGemini(prompt);
    } catch (err) {
      // If quota exceeded, log clearly and skip — no point retrying
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        console.warn('Gemini quota exceeded — skipping.');
      } else {
        console.warn('Gemini failed:', err.message);
      }
    }
  }

  // ── Both failed — return mock ───────────────────────────────────────────
  console.error('All AI providers failed. Returning mock response.');
  if (type === 'research') {
    return generateMockResearch(prompt);
  }
  return generateMockAnalysis(prompt);
}

// Fallback for /risk-scan
function generateMockAnalysis(input) {
  const riskScore = Math.floor(Math.random() * 40) + 30;
  return {
    riskScore,
    riskBreakdown: {
      customerAcquisition: Math.floor(Math.random() * 50) + 20,
      retention: Math.floor(Math.random() * 50) + 20,
      monetization: Math.floor(Math.random() * 50) + 20,
      competition: Math.floor(Math.random() * 50) + 20,
      timing: Math.floor(Math.random() * 50) + 20,
    },
    primaryRisk: 'customerAcquisition',
    similarStartups: [
      { name: 'FitAI', similarity: 87, keyLesson: 'Overbuilt features without validating demand first' },
      { name: 'GymGPT', similarity: 72, keyLesson: 'Failed to retain users after initial novelty wore off' },
    ],
    recommendations: [
      { priority: 'high', action: 'Start with a landing page MVP before building full product', rationale: 'Most failures in this space built before validating' },
      { priority: 'high', action: 'Define clear retention metrics from day one', rationale: 'Churn was the primary killer for similar startups' },
      { priority: 'medium', action: 'Consider a freemium model to reduce acquisition friction', rationale: 'Similar startups struggled with paid acquisition costs' },
    ],
    suggestedPivots: [
      { type: 'Service Pivot', description: 'Transition from a direct-to-consumer app to a B2B SaaS for gym owners.', historicalExample: 'Mindbody successfully pivoted from a basic directory to a full management suite.' },
      { type: 'Platform Pivot', description: 'Focus on a browser extension rather than a mobile app to meet users where they already work.', historicalExample: 'Grammarly pivoted from a standalone site to an omni-present extension.' }
    ]
  };
}

// Fallback for /research
function generateMockResearch(query) {
  return {
    aiSummary: `Analysis for: "${query}". AI services are currently unavailable. Please check that your Gemini or Groq API keys are configured correctly in Railway environment variables.`,
    sources: [],
    timeline: [],
    relatedStartups: [],
    keyLessons: [
      {
        lesson: 'AI service unavailable',
        details: 'Configure a valid GEMINI_API_KEY or GROQ_API_KEY in your Railway environment variables to enable real analysis.',
      },
    ],
  };
}

// POST /api/ai/risk-scan
router.post('/risk-scan', riskScanLimiter, async (req, res, next) => {
  try {
    const input = riskScanSchema.parse(req.body);
    const { history = [] } = req.body;
    const cacheKey = getCacheKey(input);

    const cached = scanCache.get(cacheKey);
    if (cached && history.length === 0) {
      return res.json({ ...cached, cached: true });
    }

    const similarStartups = await prisma.startup.findMany({
      where: {
        OR: [
          { industry: { contains: input.industry, mode: 'insensitive' } },
          { summary: { contains: input.idea.slice(0, 30), mode: 'insensitive' } },
        ],
      },
      include: {
        failureReasons: { take: 3 },
        _count: { select: { timelineEvents: true } },
      },
      take: 10,
    });

    const historicalContext = similarStartups.map(s =>
      `${s.name} (${s.industry}, ${s.status}): ${s.summary?.slice(0, 100)}`
    ).join('\n');

    const chatHistory = history.length > 0
      ? `PREVIOUS CONVERSATION:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

`
      : '';

    const prompt = `SYSTEM: You are a startup failure analyst. Analyze this startup idea against historical failures. Return ONLY valid JSON — no prose, no markdown, no explanation.

SCHEMA: {
  "riskScore": 0-100,
  "riskBreakdown": { "customerAcquisition": 0-100, "retention": 0-100, "monetization": 0-100, "competition": 0-100, "timing": 0-100 },
  "primaryRisk": "string",
  "similarStartups": [{ "name": "string", "similarity": 0-100, "keyLesson": "string" }],
  "recommendations": [{ "priority": "high|medium|low", "action": "string", "rationale": "string" }],
  "suggestedPivots": [{ "type": "string", "description": "string", "historicalExample": "string" }]
}

HISTORICAL CONTEXT:
${historicalContext || 'No directly similar startups found in database.'}

${chatHistory}USER STARTUP:
Idea: ${input.idea}
Target Audience: ${input.audience}
Revenue Model: ${input.revenueModel}
Team Size: ${input.teamSize}
Industry: ${input.industry}`;

    const analysis = await callAI(prompt, 'risk');

    const result = {
      ...analysis,
      comparedAgainst: similarStartups.length,
      cached: false,
    };

    scanCache.set(cacheKey, result);
    setTimeout(() => scanCache.delete(cacheKey), 60 * 60 * 1000);

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: err.errors });
    }
    console.error('Risk scan error:', err);
    res.json({
      ...generateMockAnalysis(req.body),
      comparedAgainst: 0,
      cached: false,
      error: 'AI analysis unavailable, showing estimated scores',
    });
  }
});

// Research assistant schema
const researchSchema = z.object({
  query: z.string().min(3).max(500),
});

// POST /api/ai/research
router.post('/research', async (req, res, next) => {
  try {
    const input = researchSchema.parse(req.body);
    const { history = [] } = req.body;
    const query = input.query;

    // ── 1. Fetch from local DB ──────────────────────────────────────────────
    const startups = await prisma.startup.findMany({
      include: {
        failureReasons: true,
        timelineEvents: true,
      },
      take: 20,
    });

    const failedCount = await prisma.startup.count({
      where: { status: 'failed' },
    });

    const historicalContext = startups.map(s => `
Name: ${s.name}
Slug: ${s.slug}
Industry: ${s.industry}
Status: ${s.status}
Founded: ${s.foundedYear}
Closed: ${s.closedYear}
Summary: ${s.summary}

Reasons:
${s.failureReasons.map(r => r.description).join(', ')}
`).join('\n\n');

    // ── 2. Fetch live web results via Tavily ────────────────────────────────
    let webContext = '';
    let webSearchUsed = false;

    try {
      const webResults = await searchWeb(query);
      if (webResults && webResults.length > 0) {
        webContext = webResults
          .slice(0, 5) // top 5 results is enough for a prompt
          .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
          .join('\n\n');
        webSearchUsed = true;
        console.log(`Tavily returned ${webResults.length} results for query: "${query}"`);
      }
    } catch (webErr) {
      // Non-fatal — degrade gracefully to DB-only if Tavily fails
      console.warn('Tavily search failed, continuing with DB only:', webErr.message);
    }

    const chatHistory = history.length > 0
      ? `PREVIOUS CONVERSATION:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

`
      : '';

    // ── 3. Build prompt ─────────────────────────────────────────────────────
    const prompt = `SYSTEM: You are an expert startup failure analyst. Analyze the user's research query using the historical startup failure database AND the latest web information provided below. Return ONLY valid JSON matching this schema:
{
  "aiSummary": "A detailed 2-3 paragraph analysis matching the query, detailing the mistakes, comparisons, and structural patterns. Support markdown formatting in the text (like **bolding** and bullets).",
  "sources": ["slug-of-startup-1", "slug-of-startup-2"],
  "timeline": [
    { "year": "YYYY", "event": "Title of event", "startup": "Startup Name" }
  ],
  "relatedStartups": [
    { "name": "Startup Name", "slug": "slug", "industry": "Industry", "status": "failed", "summary": "Short summary" }
  ],
  "keyLessons": [
    { "lesson": "A core lesson", "details": "Elaborate on how to avoid it." }
  ]
}

Rules:
- Prioritise the startup failure DATABASE for slug references, timelines, and relatedStartups.
- Use WEB RESULTS to add current context, recent news, and up-to-date trends.
- Never invent statistics.
- Never invent startups that are not in the database or web results.
- If information is unavailable, say so clearly in aiSummary.
- Return ONLY valid JSON.
- Do not wrap JSON in markdown.
- Do not explain outside the JSON object.

DATABASE STATS:
Total startups: ${startups.length}
Failed startups: ${failedCount}

HISTORICAL DATABASE CONTEXT:
${historicalContext || 'No startups found in database.'}

LATEST WEB INFORMATION:
${webContext || 'No web results available.'}

${chatHistory}USER QUERY: ${query}`;

    // ── 4. Call AI ──────────────────────────────────────────────────────────
    const result = await callAI(prompt, 'research');

    res.json({
      ...result,
      _meta: {
        webSearchUsed,
        dbStartupsUsed: startups.length,
      },
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        error: 'AI quota exceeded',
        message: 'Please try again later',
      });
    }

    console.error('Research assistant error:', err);

    return res.status(500).json({
      error: 'Research assistant unavailable',
      details: err.message,
    });
  }
});

// POST /api/ai/playbook
router.post('/playbook', async (req, res) => {
  try {
    const { idea, industry, stage, history = [] } = req.body;

    if (!idea) return res.status(400).json({ error: 'Idea is required' });

    let webContext = '';
    try {
      const webResults = await searchWeb(`${idea} startup risks failure patterns ${industry}`);
      webContext = webResults.slice(0, 5).map(r => `${r.title}: ${r.content}`).join('\n\n');
    } catch (err) {
      console.warn('Tavily failed for playbook:', err.message);
    }

    const chatHistory = history.length > 0
      ? `PREVIOUS CONVERSATION:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

`
      : '';

    const prompt = `SYSTEM: You are a startup advisor. Return ONLY valid JSON, no markdown, no explanation.

Startup Idea: ${idea}
Industry: ${industry}
Stage: ${stage || 'idea'}

WEB RESEARCH:
${webContext || 'No web data available.'}

${chatHistory}Return this exact JSON schema:
{
  "summary": "2-3 sentence overview of the key challenge for this startup",
  "checklist": ["actionable item 1", "actionable item 2", "actionable item 3", "actionable item 4", "actionable item 5"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

    const result = await callAI(prompt, 'research');
    res.json(result);

  } catch (err) {
    console.error('Playbook error:', err);
    res.json({
      summary: `Founder playbook for your ${industry} startup idea.`,
      checklist: ['Validate demand with 20 interviews', 'Build a landing page MVP', 'Measure retention from day one', 'Define your revenue model early', 'Set a 90-day runway milestone'],
      risks: ['Weak product-market fit', 'High customer acquisition cost', 'Premature scaling'],
      nextSteps: ['Launch a landing page this week', 'Get first 10 paying users', 'Talk to 5 churned users']
    });
  }
});

// Founder personality tones per startup slug
const founderPersonalities = {
  'vine': 'reflective, regretful, honest — you built something beautiful but gave up too soon',
  'theranos': 'defensive but increasingly honest — you believed in the vision but lost your way',
  'quibi': 'ambitious but frustrated — you had resources but misread the market completely',
  'yik-yak': 'candid and self-critical — you created something viral but could not control it',
  'webvan': 'visionary but humbled — you were right about the future but wrong about the timing',
  'default': 'honest, reflective, and candid — you learned hard lessons and want others to avoid your mistakes',
};

// POST /api/ai/autopsy
router.post('/autopsy', async (req, res, next) => {
  try {
    const { deckContent, industry, history = [] } = req.body;

    if (!deckContent) {
      return res.status(400).json({ error: 'Pitch deck content is required' });
    }

    // 1. Fetch failure patterns from DB
    const historicalFailures = await prisma.startup.findMany({
      where: { industry: { contains: industry || '', mode: 'insensitive' } },
      include: { failureReasons: true },
      take: 10
    });

    const failureContext = historicalFailures.map(s => 
      `${s.name}: ${s.failureReasons.map(r => r.description).join(', ')}`
    ).join('\n');

    const chatHistory = history.length > 0
      ? `PREVIOUS CONVERSATION:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

`
      : '';

    // 2. Analyze deck with AI
    const prompt = `SYSTEM: You are a "Pitch Deck Pathologist". Your job is to perform an "Autopsy" on a startup's pitch deck content.
Compare the deck content against historical failure patterns in the ${industry || 'relevant'} industry.
Look for red flags, unrealistic projections, or "dead-end" strategies that have killed startups before.

PITCH DECK CONTENT:
${deckContent}

HISTORICAL FAILURE CONTEXT:
${failureContext}

${chatHistory}Return ONLY valid JSON with this schema:
{
  "overallRisk": "Low|Medium|High|Lethal",
  "lethalWeaknesses": [
    { "slide": "string (e.g. Market Size)", "issue": "string", "historicalPrecedent": "string (e.g. Startup X failed here because...)" }
  ],
  "structuralRedFlags": ["string"],
  "pathologistVerdict": "A 2-3 sentence candid assessment of whether this startup will survive or join the vault.",
  "executiveSummary": "A concise 3-4 paragraph executive summary of the entire analysis, highlighting key strengths and critical risks.",
  "strengths": [{"title": "string", "description": "string"}],
  "weaknesses": [{"title": "string", "description": "string"}],
  "marketRisks": [{"title": "string", "description": "string"}],
  "productRisks": [{"title": "string", "description": "string"}],
  "gtmRisks": [{"title": "string", "description": "string"}],
  "financialRisks": [{"title": "string", "description": "string"}],
  "pmfAnalysis": "A detailed 2-3 paragraph analysis of product-market fit signals and gaps.",
  "investorConcerns": [{"title": "string", "description": "string"}],
  "competitiveAnalysis": "A 2-3 paragraph analysis of the competitive landscape and how this startup stacks up.",
  "recommendedImprovements": [{"title": "string", "description": "string"}],
  "actionPlan": [{"phase": "string (e.g. Week 1-2)", "tasks": ["string"]}]
}`;

    let analysis;

try {
  analysis = await callAI(prompt, 'autopsy');
} catch (err) {
  console.error('Autopsy AI failed:', err);

  analysis = {
    overallRisk: 'High',
    lethalWeaknesses: [
      {
        slide: 'AI Service',
        issue: 'Analysis service temporarily unavailable',
        historicalPrecedent: 'AI provider quota exceeded'
      }
    ],
    structuralRedFlags: [
      'Could not run full AI analysis'
    ],
    pathologistVerdict: 'AI providers are temporarily unavailable. Showing fallback analysis.',
    executiveSummary: 'This is a fallback executive summary while AI services are unavailable.',
    strengths: [{title: 'Deck Structure', description: 'Deck is well-organized.'}],
    weaknesses: [{title: 'Validation', description: 'Lack of customer validation evidence.'}],
    marketRisks: [{title: 'Competition', description: 'Highly competitive market.'}],
    productRisks: [{title: 'MVP Scope', description: 'Scope may be too large.'}],
    gtmRisks: [{title: 'Customer Acquisition', description: 'No clear CAC strategy.'}],
    financialRisks: [{title: 'Projections', description: 'Unrealistic financial projections.'}],
    pmfAnalysis: 'No clear product-market fit signals found in deck.',
    investorConcerns: [{title: 'Traction', description: 'Lack of user traction data.'}],
    competitiveAnalysis: 'Competitive landscape analysis is missing from the deck.',
    recommendedImprovements: [{title: 'Add Validation', description: 'Add customer interview data.'}],
    actionPlan: [{phase: 'Week 1-2', tasks: ['Conduct 10 customer interviews']}]
  };
}

res.json(analysis);

} catch (err) {
  console.error('Autopsy route error:', err);

  res.status(500).json({
    error: 'Failed to perform autopsy'
  });
}
});

// POST /api/ai/ghost-chat
router.post('/ghost-chat', async (req, res, next) => {

  try {
    const { slug, message, history = [] } = req.body;

    if (!slug || !message) {
      return res.status(400).json({ error: 'Slug and message are required' });
    }

    // 1. Fetch startup from DB
    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        failureReasons: true,
        timelineEvents: {
          orderBy: { eventDate: 'asc' },
        },
      },
    });

    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // 2. Build context strings
    const failureStr = startup.failureReasons
      .map(r => `[${r.category}] ${r.description} (severity: ${r.severityScore}/10)`)
      .join('\n');

    const timelineStr = startup.timelineEvents
      .map(e => `${e.eventDate.toISOString().slice(0, 7)} — ${e.stage.toUpperCase()}: ${e.title}. ${e.description}`)
      .join('\n');

    const chatHistory = history
      .map(h => `${h.role === 'user' ? 'Visitor' : 'Founder'}: ${h.content}`)
      .join('\n');

    const tone = founderPersonalities[slug] || founderPersonalities['default'];

    // 3. Build prompt — returns plain text, not JSON
    const prompt = `You are the ghost of the founder of ${startup.name}, a ${startup.industry} startup that ${startup.status === 'failed' ? 'failed' : startup.status} after ${startup.lifetimeMonths || '?'} months.

Your tone is: ${tone}

About your startup:
${startup.summary}

${startup.founderStory ? `Your personal story:\n${startup.founderStory}\n` : ''}

Why you failed:
${failureStr || 'Reasons not fully documented.'}

Key timeline events:
${timelineStr || 'Timeline not available.'}

Rules:
- Speak in first person as the founder, from beyond the startup's grave.
- Reference specific events, mistakes, and numbers from the data above when relevant.
- Be radically honest. No PR spin. You are dead — there is nothing left to protect.
- Keep responses to 3-5 sentences max. Be punchy and memorable.
- If you don't know something, admit it honestly.
- Never break character.

${chatHistory ? `Previous conversation:\n${chatHistory}\n` : ''}
Visitor: ${message}
Founder:`;

    // 4. Call AI — use text endpoint, not JSON
    let reply = '';

    const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
    const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'your-groq-api-key-here';

    if (hasGroq) {
      try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a startup founder ghost. Respond only as the founder. Plain text, no JSON, no markdown.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200,
        });
        reply = response.choices[0].message.content.trim();
      } catch (err) {
        console.warn('Groq failed for ghost-chat:', err.message);
      }
    }

    if (!reply && hasGemini) {
      try {
        reply = await callGeminiText(prompt);
      } catch (err) {
        console.warn('Gemini failed for ghost-chat:', err.message);
      }
    }

    if (!reply) {
      reply = `We built something we believed in. But belief without validation is just expensive wishful thinking. I wish I had talked to more customers before writing a single line of code.`;
    }

    res.json({ content: reply });

  } catch (err) {
    console.error('Ghost chat error:', err);
    res.status(500).json({ error: 'Failed to reach the founder\'s ghost', content: 'The connection to the afterlife is weak right now. Try again.' });
  }
});

// POST /api/ai/compare-competitors
router.post('/compare-competitors', async (req, res, next) => {
  try {
    const { idea, industry } = req.body;

    if (!idea) {
      return res.status(400).json({ error: 'Idea is required' });
    }

    const searchQuery = `Top active companies and startups in ${industry} doing ${idea.slice(0, 100)}`;
    let webContext = '';
    try {
      const webResults = await searchWeb(searchQuery);
      webContext = webResults
        .slice(0, 5)
        .map((r, i) => `[${i + 1}] ${r.title}: ${r.content}`)
        .join('\n\n');
    } catch (err) {
      console.warn('Tavily search failed for competitors:', err.message);
    }

    const prompt = `SYSTEM: You are a market intelligence analyst. 
Compare the user's startup idea against the live competitors found on the web.
Identify why these competitors are currently winning (their moats) and where the user's idea might fall into a "failure trap" if they don't differentiate.

USER IDEA: ${idea}
INDUSTRY: ${industry}

LIVE WEB CONTEXT:
${webContext || `No specific live web data found. Use your general knowledge of the ${industry} market.`}

Return ONLY valid JSON with this schema:
{
  "competitors": [{ "name": "string", "moat": "string", "threatLevel": "high|medium|low" }],
  "gapAnalysis": "A detailed 1-2 paragraph analysis of the market gap or lack thereof.",
  "survivalStrategy": "A specific strategic recommendation to survive against these incumbents."
}`;

    const analysis = await callAI(prompt, 'research');
    res.json(analysis);

  } catch (err) {
    console.error('Competitor comparison error:', err);
    res.status(500).json({
      error: 'Failed to analyze competitors',
      competitors: [
        { name: 'Incumbent X', moat: 'Established brand and high switching costs.', threatLevel: 'high' },
        { name: 'Startup Y', moat: 'Niche focus and rapid feature iteration.', threatLevel: 'medium' }
      ],
      gapAnalysis: 'The market is crowded. Your primary challenge is overcoming the network effects of established players.',
      survivalStrategy: 'Focus on a hyper-specific unserved segment before attempting to scale.'
    });
  }
});

module.exports = router;