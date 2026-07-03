const express = require('express');
const { PrismaClient } = require('@prisma/client');
const founderIntelService = require('../services/founderIntelligence');
const ragService = require('../services/rag');
const prisma = new PrismaClient();
const router = express.Router();

// ----------------------------
// AI Mentor / Co-Founder Endpoints
// ----------------------------
router.get('/mentor/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await prisma.aiMentorSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.post('/mentor/sessions', async (req, res) => {
  try {
    const { userId, title, type = 'mentor' } = req.body;
    const newSession = await prisma.aiMentorSession.create({
      data: {
        userId,
        title,
        type
      }
    });
    res.json({ session: newSession });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/mentor/messages', async (req, res) => {
  try {
    const { userId, content, sessionId, companyId } = req.body;
    const userMessage = await prisma.aiChatMessage.create({
      data: {
        userId,
        content,
        sessionId,
        role: 'user'
      }
    });

    // Get RAG context
    let ragContext = '';
    let sourcesUsed = [];
    if (companyId) {
      const searchResults = await ragService.hybridSearch(content, { companyId });
      sourcesUsed = searchResults.map(chunk => chunk.company?.name || 'Unknown');
      ragContext = searchResults.map(chunk =>
        `Context from ${chunk.company?.name}: ${chunk.content}`
      ).join('\n');
    }

    // Call LLM
    const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.7
    });
    const systemPrompt = `
      You are an experienced startup founder/mentor who has started and sold multiple companies.
      When answering, provide practical, specific advice, not vague generalities.
      Use the provided context (if any) to back up your claims.
      Always cite sources from the context if you use them.
      Keep responses concise and impactful.
    `;

    const llmResult = await model.invoke([
      ['system', systemPrompt],
      ['human', `${content}\n\nContext:\n${ragContext}`]
    ]);

    // Create assistant message
    const assistantMessage = await prisma.aiChatMessage.create({
      data: {
        userId,
        sessionId,
        content: llmResult.content,
        role: 'assistant',
        sourcesUsed: sourcesUsed.length > 0 ? sourcesUsed : null
      }
    });

    res.json({
      userMessage,
      assistantMessage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ----------------------------
// Investor Readiness Score
// ----------------------------
router.get('/investor-readiness/:companyId', async (req, res) => {
  try {
    const score = await founderIntelService.generateInvestorReadinessScore(req.params.companyId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate readiness' });
  }
});

// ----------------------------
// Market Validation Engine
// ----------------------------
router.post('/market-validation', async (req, res) => {
  try {
    const { query, industry, market } = req.body;
    const validation = await founderIntelService.analyzeMarketValidation(query, industry, market);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze market' });
  }
});

// ----------------------------
// Competitor Monitoring
// ----------------------------
router.get('/competitors/:companyId', async (req, res) => {
  try {
    const competitors = await founderIntelService.monitorCompetitors(req.params.companyId);
    res.json(competitors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get competitors' });
  }
});

// ----------------------------
// Startup Health Dashboard
// ----------------------------
router.get('/health/:companyId', async (req, res) => {
  try {
    const data = await founderIntelService.getStartupHealthData(req.params.companyId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get health data' });
  }
});

// ----------------------------
// Risk Prediction Engine
// ----------------------------
router.get('/risks/:companyId', async (req, res) => {
  try {
    const data = await founderIntelService.predictRisks(req.params.companyId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to predict risks' });
  }
});

// ----------------------------
// Weekly Reports
// ----------------------------
router.post('/weekly-report', async (req, res) => {
  try {
    const { userId, companyId } = req.body;
    const report = await founderIntelService.generateWeeklyReport(userId, companyId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/weekly-reports/:userId', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// ----------------------------
// Benchmarking
// ----------------------------
router.get('/benchmark/:companyId', async (req, res) => {
  try {
    const data = await founderIntelService.benchmarkStartup(req.params.companyId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to benchmark startup' });
  }
});

// ----------------------------
// Collections, Saved Research, Notifications
// ----------------------------
router.get('/collections/:userId', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.params.userId, isArchived: false },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get collections' });
  }
});

router.post('/collections', async (req, res) => {
  try {
    const { userId, name, description, color } = req.body;
    const collection = await prisma.collection.create({
      data: {
        userId,
        name,
        description,
        color
      }
    });
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

router.get('/notifications/:userId', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.notificationId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// ----------------------------
// Decision & "What If" Simulations
// ----------------------------
router.post('/simulations/decision', async (req, res) => {
  try {
    const { userId, title, description, context, outcome } = req.body;
    const simulation = await prisma.decisionSimulation.create({
      data: { userId, title, description, context, outcome }
    });
    res.json(simulation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save simulation' });
  }
});

router.post('/simulations/what-if', async (req, res) => {
  try {
    const { userId, title, description, scenario, results } = req.body;
    const simulation = await prisma.whatIfSimulation.create({
      data: { userId, title, description, scenario, results }
    });
    res.json(simulation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save simulation' });
  }
});

router.get('/simulations/:userId', async (req, res) => {
  try {
    const [decisions, whatIfs] = await Promise.all([
      prisma.decisionSimulation.findMany({
        where: { userId: req.params.userId, isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.whatIfSimulation.findMany({
        where: { userId: req.params.userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    res.json({ decisions, whatIfs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get simulations' });
  }
});

// ----------------------------
// Founder Timeline
// ----------------------------
router.get('/timeline/:userId', async (req, res) => {
  try {
    const events = await prisma.founderTimelineEvent.findMany({
      where: { userId: req.params.userId },
      orderBy: { eventDate: 'desc' }
    });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

router.post('/timeline', async (req, res) => {
  try {
    const { userId, title, eventDate, type, description } = req.body;
    const newEvent = await prisma.founderTimelineEvent.create({
      data: {
        userId, title, eventDate: new Date(eventDate), type, description
      }
    });
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timeline event' });
  }
});

// ----------------------------
// Learning Paths
// ----------------------------
router.get('/learning-paths', async (req, res) => {
  try {
    const paths = await prisma.learningPath.findMany({
      include: { items: true },
      orderBy: { isPinned: 'desc' }
    });
    res.json({ paths });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get paths' });
  }
});

router.get('/learning-paths/:userId/my', async (req, res) => {
  try {
    const myItems = await prisma.learningPathItem.findMany({
      where: { userId: req.params.userId },
      include: { path: true },
      orderBy: { order: 'asc' }
    });
    res.json({ items: myItems });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get my learning path' });
  }
});

router.put('/learning-paths/:itemId/complete', async (req, res) => {
  try {
    await prisma.learningPathItem.update({
      where: { id: req.params.itemId },
      data: { isCompleted: true, completedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark complete' });
  }
});

module.exports = router;
