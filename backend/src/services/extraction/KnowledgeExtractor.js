const { z } = require('zod');
const _ = require('lodash');

// Define schema for extracted data
const ExtractedDataSchema = z.object({
  companies: z.array(z.object({
    name: z.string().min(1),
    websiteUrl: z.string().url().optional(),
    industry: z.string().optional(),
    country: z.string().optional(),
    status: z.enum(['failed', 'acquired', 'pivoted', 'operating', 'public']).optional(),
    foundingYear: z.number().int().min(1900).max(2100).optional(),
    shutdownYear: z.number().int().min(1900).max(2100).optional(),
    description: z.string().optional()
  })),
  founders: z.array(z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    twitterUrl: z.string().url().optional(),
    bio: z.string().optional()
  })),
  fundingRounds: z.array(z.object({
    roundType: z.string(),
    amountUsd: z.number().int().optional(),
    amountInr: z.number().int().optional(),
    date: z.string().optional(),
    leadInvestor: z.string().optional(),
    investors: z.array(z.string()).optional()
  })),
  timeline: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.enum(['idea', 'prototype', 'launch', 'growth', 'decline', 'shutdown', 'acquisition', 'pivot']).optional()
  })),
  products: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  failureReasons: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severityScore: z.number().int().min(0).max(100).optional(),
    isPrimary: z.boolean().optional()
  })),
  lessons: z.array(z.object({
    title: z.string(),
    content: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional()
  })),
  quotes: z.array(z.object({
    text: z.string(),
    author: z.string().optional()
  })),
  keyDecisions: z.array(z.string()),
  warningSigns: z.array(z.string()),
  financialIssues: z.array(z.string()),
  marketIssues: z.array(z.string()),
  leadershipIssues: z.array(z.string())
});

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
    temperature: 0.2,
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

async function callAI(prompt) {
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'your-groq-api-key-here';

  // Try Groq first (faster, no quota issues on free tier)
  if (hasGroq) {
    try {
      console.log('Trying Groq for knowledge extraction...');
      return await callGroq(prompt);
    } catch (err) {
      console.warn('Groq extraction failed:', err.message);
    }
  }

  // Fall back to Gemini
  if (hasGemini) {
    try {
      console.log('Trying Gemini for knowledge extraction...');
      return await callGemini(prompt);
    } catch (err) {
      console.warn('Gemini extraction failed:', err.message);
    }
  }

  // Both failed - return empty placeholder
  console.error('All AI providers failed for extraction. Returning empty data.');
  return {
    companies: [],
    founders: [],
    fundingRounds: [],
    timeline: [],
    failureReasons: [],
    lessons: [],
    keyDecisions: [],
    warningSigns: [],
    financialIssues: [],
    marketIssues: [],
    leadershipIssues: []
  };
}

class KnowledgeExtractor {
  constructor({ llm = null, logger = console }) {
    this.llm = llm;
    this.logger = logger;
  }

  // Extract structured data from text
  async extract(text, context = {}) {
    try {
      this.logger.log('Extracting knowledge from text...');

      // Build extraction prompt
      const prompt = `SYSTEM: You are a precision startup intelligence extractor. Extract structured data from the provided article text. Return ONLY valid JSON matching the exact schema below — no prose, no markdown, no explanation, no backticks. Do NOT invent data. If a field has no information, return an empty array or omit optional fields.

SCHEMA:
{
  "companies": [
    {
      "name": "string (required)",
      "websiteUrl": "string (optional, https://...)",
      "industry": "string (optional, e.g., 'SaaS', 'E-commerce')",
      "country": "string (optional, e.g., 'USA', 'India')",
      "status": "enum (optional, one of: 'failed', 'acquired', 'pivoted', 'operating', 'public')",
      "foundingYear": "integer (optional, 1900-2100)",
      "shutdownYear": "integer (optional, 1900-2100)",
      "description": "string (optional, one-sentence summary)"
    }
  ],
  "founders": [
    {
      "name": "string (required)",
      "role": "string (optional, e.g., 'CEO')",
      "linkedinUrl": "string (optional)",
      "twitterUrl": "string (optional)",
      "bio": "string (optional)"
    }
  ],
  "fundingRounds": [
    {
      "roundType": "string (e.g., 'Seed', 'Series A')",
      "amountUsd": "integer (optional, in USD)",
      "amountInr": "integer (optional, in INR)",
      "date": "string (optional, ISO date or just year)",
      "leadInvestor": "string (optional)",
      "investors": ["string (optional, list of investor names)"]
    }
  ],
  "timeline": [
    {
      "date": "string (required, ISO date or year)",
      "title": "string (required)",
      "description": "string (required)",
      "category": "enum (optional, one of: 'idea', 'prototype', 'launch', 'growth', 'decline', 'shutdown', 'acquisition', 'pivot')"
    }
  ],
  "products": ["string (optional, list of product names)"],
  "competitors": ["string (optional, list of competitor names)"],
  "failureReasons": [
    {
      "category": "string (required, e.g., 'cac', 'pmf', 'retention')",
      "description": "string (required)",
      "severityScore": "integer (optional, 0-100)",
      "isPrimary": "boolean (optional)"
    }
  ],
  "lessons": [
    {
      "title": "string (required)",
      "content": "string (required)",
      "priority": "enum (optional, one of: 'high', 'medium', 'low')"
    }
  ],
  "quotes": [
    {
      "text": "string (required)",
      "author": "string (optional)"
    }
  ],
  "keyDecisions": ["string (required, list of key decisions the company made)"],
  "warningSigns": ["string (required, list of early warning signs that appeared)"],
  "financialIssues": ["string (optional, list of financial issues)"],
  "marketIssues": ["string (optional, list of market issues)"],
  "leadershipIssues": ["string (optional, list of leadership issues)"]
}

CONTEXT (optional metadata):
${JSON.stringify(context, null, 2)}

ARTICLE TEXT TO EXTRACT FROM:
${text}

Return ONLY valid JSON matching the schema EXACTLY.`;

      // Call AI for extraction
      const rawData = await callAI(prompt);

      // Validate with schema
      const validated = ExtractedDataSchema.parse(rawData);
      return validated;
    } catch (err) {
      this.logger.error('Failed to extract knowledge:', err);
      throw err;
    }
  }
}

module.exports = KnowledgeExtractor;
