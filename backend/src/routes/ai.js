const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

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
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

async function callGroq(prompt) {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content);
}

async function callAI(prompt) {
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      return await callGemini(prompt);
    }
  } catch (err) {
    console.warn('Gemini failed, trying Groq fallback:', err.message);
  }
  try {
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here') {
      return await callGroq(prompt);
    }
  } catch (err) {
    console.warn('Groq also failed:', err.message);
  }
  // Fallback: return mock analysis when no API keys configured
  return generateMockAnalysis(prompt);
}

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
      { priority: 'high', action: `Start with a landing page MVP for ${input.audience} before building full product`, rationale: 'Most failures in this space built before validating' },
      { priority: 'high', action: 'Define clear retention metrics from day one', rationale: 'Churn was the primary killer for similar startups' },
      { priority: 'medium', action: 'Consider a freemium model to reduce acquisition friction', rationale: 'Similar startups struggled with paid acquisition costs' },
    ],
  };
}

// POST /api/ai/risk-scan
router.post('/risk-scan', riskScanLimiter, async (req, res, next) => {
  try {
    const input = riskScanSchema.parse(req.body);
    const cacheKey = getCacheKey(input);

    // Check cache
    const cached = scanCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Find similar startups from DB for context
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

    const prompt = `SYSTEM: You are a startup failure analyst. Analyze this startup idea against historical failures. Return ONLY valid JSON — no prose, no markdown, no explanation.

SCHEMA: {
  "riskScore": 0-100,
  "riskBreakdown": { "customerAcquisition": 0-100, "retention": 0-100, "monetization": 0-100, "competition": 0-100, "timing": 0-100 },
  "primaryRisk": "string",
  "similarStartups": [{ "name": "string", "similarity": 0-100, "keyLesson": "string" }],
  "recommendations": [{ "priority": "high|medium|low", "action": "string", "rationale": "string" }]
}

HISTORICAL CONTEXT:
${historicalContext || 'No directly similar startups found in database.'}

USER STARTUP:
Idea: ${input.idea}
Target Audience: ${input.audience}
Revenue Model: ${input.revenueModel}
Team Size: ${input.teamSize}
Industry: ${input.industry}`;

    const analysis = await callAI(prompt);

    const result = {
      ...analysis,
      comparedAgainst: similarStartups.length,
      cached: false,
    };

    // Cache for 1 hour
    scanCache.set(cacheKey, result);
    setTimeout(() => scanCache.delete(cacheKey), 60 * 60 * 1000);

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: err.errors });
    }
    console.error('Risk scan error:', err);
    // Return mock fallback on error
    const mockResult = {
      ...generateMockAnalysis(req.body),
      comparedAgainst: 0,
      cached: false,
      error: 'AI analysis unavailable, showing estimated scores',
    };
    res.json(mockResult);
  }
});

// Research assistant schema
const researchSchema = z.object({
  query: z.string().min(3).max(500),
});

// Mock generator for AI Research Assistant queries
function generateMockResearch(query) {
  const q = query.toLowerCase();
  
  if (q.includes('compare') || q.includes('quibi') || q.includes('byju')) {
    return {
      aiSummary: `Analyzing the comparison between **Quibi** and **Byju's** reveals two of the most high-profile capital-efficiency crises in startup history. Both startups suffered from massive pre-validation capital infusions, but their operational failures differed significantly.\n\n**Quibi** raised $1.75B on an unvalidated thesis of premium 10-minute mobile-only streaming. They launched during the COVID-19 lockdown (when commuters stayed home) and blocked user screen sharing/casting, which killed organic virality. They burned through their funding in just 6 months and liquidated.\n\nIn contrast, **Byju's** scaled aggressively via debt-fueled global acquisitions (like Great Learning, Epic, and Aakash) during the pandemic-era edtech boom. When schools reopened and funding dried up, they faced severe governance failures, delayed audits, lawsuits from lenders, and a crushing debt burden. While Quibi was a failure of **product design and market timing**, Byju's is a failure of **governance, financial overreach, and debt management**.`,
      sources: ['quibi'],
      timeline: [
        { year: '2018', event: 'Quibi Founded', startup: 'Quibi' },
        { year: '2020', event: 'Quibi launches into lockdown & shuts down in 6 months', startup: 'Quibi' },
        { year: '2021', event: 'Byju\'s acquires Aakash for $1B, peaking valuation at $22B', startup: 'Byju\'s' },
        { year: '2023', event: 'Auditors resign, board members step down, debt default', startup: 'Byju\'s' }
      ],
      relatedStartups: [
        { name: 'Quibi', slug: 'quibi', industry: 'Media / Entertainment', status: 'failed', summary: 'Mobile-first premium streaming platform with episodes under 10 minutes, designed for on-the-go viewing.' },
        { name: 'Rdio', slug: 'rdio', industry: 'Music Streaming', status: 'failed', summary: 'Music streaming service that failed due to aggressive competition from Spotify and Pandora.' }
      ],
      keyLessons: [
        { lesson: 'Validate core product constraints early', details: 'Quibi restricted sharing and TV casting, which alienated users. Test whether design constraints aid or limit virality.' },
        { lesson: 'Avoid debt-fueled aggressive acquisition sprints', details: 'Scaling through leveraged buyouts before stabilizing organic unit economics creates existential cash flow risks.' },
        { lesson: 'Maintain strict corporate governance', details: 'Delays in financial reporting, auditor departures, and boards lacking independence destroy investor trust overnight.' }
      ]
    };
  }
  
  if (q.includes('pmf') || q.includes('product-market') || q.includes('product market') || q.includes('fit')) {
    return {
      aiSummary: `Product-Market Fit (PMF) is the primary killer of startups in our database. Startups often fail because they create sophisticated solutions for problems that do not actually exist or are not painful enough for customers to pay to solve.\n\n**Juicero** is the classic example: a $400 Wi-Fi connected press that squeezed juice packs. When Bloomberg showed that users could squeeze the juice packs just as quickly with their bare hands, the hardware's core value proposition was shattered. The startup collapsed in months.\n\nSimilarly, **Color Labs** raised $41M pre-launch for a location-based social photo app where nearby strangers shared photos. Users and journalists could not understand why they would want to share raw photos with strangers or how to even navigate the interface, leading to rapid user churn.`,
      sources: ['juicero', 'color-labs'],
      timeline: [
        { year: '2011', event: 'Color Labs launches with $41M but immediate user confusion', startup: 'Color Labs' },
        { year: '2013', event: 'Juicero founded by Doug Evans', startup: 'Juicero' },
        { year: '2017', event: 'Bloomberg squeezes Juicero bag by hand; company shuts down', startup: 'Juicero' }
      ],
      relatedStartups: [
        { name: 'Juicero', slug: 'juicero', industry: 'Consumer Hardware', status: 'failed', summary: 'Wi-Fi connected $400 juicing machine that pressed proprietary juice packets.' },
        { name: 'Color Labs', slug: 'color-labs', industry: 'Social Media', status: 'failed', summary: 'Location-based photo sharing app that raised $41M but users could not understand what it did.' }
      ],
      keyLessons: [
        { lesson: 'Build a minimum viable product (MVP) first', details: 'Do not raise large sums or build expensive custom hardware before validating that users will pay for your solution.' },
        { lesson: 'Pass the "One-Sentence Explanation" test', details: 'If your users cannot explain what your product does to their friends in one simple sentence, you do not have PMF.' },
        { lesson: 'Establish organic retention as the primary metric', details: 'Growth is meaningless if user retention is near zero. Prioritize repeat usage over initial downloads.' }
      ]
    };
  }

  if (q.includes('food') || q.includes('delivery') || q.includes('grocery') || q.includes('dine') || q.includes('restaurant')) {
    return {
      aiSummary: `Grocery and food delivery startups struggle with high operational complexity and paper-thin margins. The sector has witnessed massive collapses due to premature scaling and broken unit economics.\n\n**Webvan** signed a massive $1B contract to build 26 automated warehouses before proving their grocery delivery model in a single city. When customer adoption stalled, they were crushed by fixed logistics costs and burned through $800M before filing for bankruptcy.\n\n**Sprig** promised high-quality, hot meals delivered in under 20 minutes. They operated their own kitchens, purchased raw ingredients, and hired delivery drivers. The cost of food waste, logistics, and driver salaries exceeded what consumers were willing to pay, making the unit economics impossible.`,
      sources: ['webvan', 'sprig'],
      timeline: [
        { year: '1999', event: 'Webvan signs $1B warehouse contract and IPOs', startup: 'Webvan' },
        { year: '2001', event: 'Webvan bankrupt after burning $800M', startup: 'Webvan' },
        { year: '2013', event: 'Sprig founded with high-quality on-demand meals', startup: 'Sprig' },
        { year: '2017', event: 'Sprig shuts down after failing to achieve positive unit margins', startup: 'Sprig' }
      ],
      relatedStartups: [
        { name: 'Webvan', slug: 'webvan', industry: 'Grocery Delivery', status: 'failed', summary: 'Grocery delivery startup that built a billion-dollar logistics infrastructure before validating demand.' },
        { name: 'Sprig', slug: 'sprig', industry: 'Food Delivery', status: 'failed', summary: 'On-demand food delivery startup that operated its own kitchens and struggled with unit economics.' }
      ],
      keyLessons: [
        { lesson: 'Scale only after achieving local unit profitability', details: 'Do not expand geographically or build expensive warehouses until your contribution margin is positive in your core city.' },
        { lesson: 'Be realistic about operational complexity', details: 'Operating kitchens, fleets, and sourcing ingredients concurrently creates massive overhead. Leverage partnerships instead.' },
        { lesson: 'Address high logistics waste', details: 'On-demand delivery of hot food carries significant perishability risks. Optimize dispatch algorithms to minimize waste.' }
      ]
    };
  }

  if (q.includes('burn') || q.includes('cash') || q.includes('financial') || q.includes('economics') || q.includes('unit')) {
    return {
      aiSummary: `Startups often scale user acquisition while ignoring contribution margins, leading to mathematical impossibility. High burn rates and broken unit economics are the structural patterns driving these collapses.\n\n**MoviePass** offered unlimited movie tickets for $9.95/month. However, they paid theaters the full ticket price (~$12–15). As subscribers grew to 3 million, their monthly losses reached $40M, causing a swift collapse. \n\nSimilarly, **Beepi** operated a used-car marketplace, inspecting, detailing, and delivering vehicles. Each transaction cost them ~$3,000–5,000 to execute, but they only took a ~$1,500 margin. Scaling the volume of vehicle transactions only accelerated their cash burn until they ran out of capital.`,
      sources: ['moviepass', 'beepi', 'pets-com'],
      timeline: [
        { year: '2000', event: 'Pets.com liquidates just 268 days after IPOing', startup: 'Pets.com' },
        { year: '2017', event: 'Beepi shuts down after Series C falls through due to burn rate', startup: 'Beepi' },
        { year: '2017', event: 'MoviePass drops price to $9.95/mo, triggering massive cash burn', startup: 'MoviePass' },
        { year: '2019', event: 'MoviePass suspends service permanently after burning $70M+', startup: 'MoviePass' }
      ],
      relatedStartups: [
        { name: 'MoviePass', slug: 'moviepass', industry: 'Entertainment', status: 'failed', summary: 'Unlimited movie subscription at $9.95/month that paid theaters full price.' },
        { name: 'Beepi', slug: 'beepi', industry: 'Marketplace', status: 'failed', summary: 'Managed used car marketplace where operational costs exceeded margins.' },
        { name: 'Pets.com', slug: 'pets-com', industry: 'E-Commerce', status: 'failed', summary: 'Dot-com era online pet supply store that spent more on marketing than it earned.' }
      ],
      keyLessons: [
        { lesson: 'Scale does not fix negative transaction margins', details: 'If you lose money on every transaction, scaling your customer base only increases your burn rate. Ensure contribution margins are positive.' },
        { lesson: 'Calculate fully-loaded customer acquisition cost (CAC)', details: 'Include all delivery, inspection, and operations overheads when calculating unit economics.' },
        { lesson: 'Avoid "novelty pricing" subsidies', details: 'Offering steep discounts to boost top-line growth creates artificial demand. Test price elasticity early.' }
      ]
    };
  }

  // General Fallback
  return {
    aiSummary: `Analyzing startup failure data for research query: "${query}" highlights that most startup failures are driven by a combination of **poor timing**, **toxic team dynamics**, **regulatory hurdles**, and **fatal cash burn**.\n\nFor instance, **Theranos** collapsed due to severe fraud and ethical violations after fabricating a finger-prick blood-testing technology that never worked. In the consumer space, **Yik Yak** and **Secret** grew to millions of users but collapsed due to their failure to manage toxic community behavior (bullying and harassment) which eventually destroyed user retention and invited heavy legal scrutiny.`,
    sources: ['theranos', 'yik-yak', 'secret-app'],
    timeline: [
      { year: '2015', event: 'WSJ exposes Theranos fraud', startup: 'Theranos' },
      { year: '2015', event: 'Secret app shuts down voluntarily due to bullying', startup: 'Secret' },
      { year: '2017', event: 'Yik Yak sold for $1M after raising $73M', startup: 'Yik Yak' }
    ],
    relatedStartups: [
      { name: 'Theranos', slug: 'theranos', industry: 'Health Tech', status: 'failed', summary: 'Blood testing startup claiming to run hundreds of tests from a few drops of blood.' },
      { name: 'Yik Yak', slug: 'yik-yak', industry: 'Social Media', status: 'failed', summary: 'Location-based anonymous social network popular on college campuses.' },
      { name: 'Secret', slug: 'secret-app', industry: 'Social Media', status: 'failed', summary: 'Anonymous secret-sharing social app.' }
    ],
    keyLessons: [
      { lesson: 'Corporate integrity and compliance are vital', details: 'Do not compromise on legal and clinical validation, especially in highly regulated sectors like healthcare.' },
      { lesson: 'Design community moderation into your growth model', details: 'Anonymous platforms require strict moderation guardrails from day one to prevent toxicity loops.' },
      { lesson: 'Preserve cash reserves for market pivots', details: 'Ensure you have runway to adjust your value proposition if early adoption stagnates.' }
    ]
  };
}

// POST /api/ai/research
router.post('/research', async (req, res, next) => {
  try {
    const input = researchSchema.parse(req.body);
    const query = input.query;

    // Try to find matching startups from DB for context
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
        ...words.map(word => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { summary: { contains: word, mode: 'insensitive' } },
            { industry: { contains: word, mode: 'insensitive' } },
          ]
        }))
      ]
    };

    const matchedStartups = await prisma.startup.findMany({
      where,
      include: {
        failureReasons: true,
      },
      take: 6,
    });

    const historicalContext = matchedStartups.map(s => {
      const reasons = s.failureReasons.map(r => `[${r.category}]: ${r.description}`).join('; ');
      return `Name: ${s.name}\nSlug: ${s.slug}\nIndustry: ${s.industry}\nSummary: ${s.summary}\nFailure reasons: ${reasons}`;
    }).join('\n\n');

    const prompt = `SYSTEM: You are an expert startup failure analyst. Analyze the user's research query: "${query}" using the historical context of startup failures in the database. You must return ONLY valid JSON matching this schema:
    {
      "aiSummary": "A detailed 2-3 paragraph analysis matching the query, detailing the mistakes, comparisons, and structural patterns. Support markdown formatting in the text (like **bolding** and bullets).",
      "sources": ["slug-of-startup-1", "slug-of-startup-2"], // MUST be real slugs of matching startups in the context list, or empty if none match
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

    HISTORICAL CONTEXT FROM DATABASE:
    ${historicalContext || 'No directly matching startups found. Use general startup failure patterns.'}`;

    // Call AI
    let result;
    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
        result = await callGemini(prompt);
      } else {
        result = generateMockResearch(query);
      }
    } catch (err) {
      console.warn('AI query failed, falling back to mock research:', err.message);
      result = generateMockResearch(query);
    }

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: err.errors });
    }
    console.error('Research assistant error:', err);
    res.json(generateMockResearch(req.body.query || ''));
  }
});

module.exports = router;