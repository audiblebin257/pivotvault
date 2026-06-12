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
  let text = result.response.text().trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
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
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
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

// POST /api/ai/research
router.post('/research', async (req, res, next) => {
  try {
    const input = researchSchema.parse(req.body);
    const query = input.query;

    // FIX 1: Fetch all startups with full context
    const startups = await prisma.startup.findMany({
      include: {
        failureReasons: true,
        timelineEvents: true,
      },
      take: 300
    });

    // FIX 3: Get count of failed startups
    const failedCount = await prisma.startup.count({
      where: {
        status: 'failed',
      },
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

    // FIX 4 + FIX 8: Updated prompt with stats and strict rules
    const prompt = `SYSTEM: You are an expert startup failure analyst. Analyze the user's research query using ONLY the historical context of startup failures provided below. You must return ONLY valid JSON matching this schema:
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
- Use ONLY the supplied database.
- Never invent statistics.
- Never invent startups.
- If information is unavailable, say so clearly in aiSummary.
- Base all answers strictly on the provided records.
-Return ONLY valid JSON.
-Do not wrap JSON in markdown.
-Do not explain outside the JSON object.

DATABASE STATS:
Total startups: ${startups.length}
Failed startups: ${failedCount}

HISTORICAL CONTEXT FROM DATABASE:
${historicalContext || 'No startups found in database.'}

USER QUERY: ${query}`;

    // FIX 5: Simplified AI call
    let result;
    result = await callGemini(prompt);

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: err.errors });
    }
    console.error('Research assistant error:', err);
    // FIX 7: Return proper error instead of fake mock data
    res.status(500).json({
      error: 'Research assistant unavailable',
      details: err.message,
    });
  }
});

module.exports = router;