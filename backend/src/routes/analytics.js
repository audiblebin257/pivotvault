const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard analytics summary
router.get('/dashboard', async (req, res) => {
  try {
    // Get total counts
    const [
      totalCompanies,
      totalUsers,
      totalApiRequests,
      totalChunks,
      totalGraphEdges,
      recentRequests,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.apiRequest.count(),
      prisma.documentChunk.count(),
      prisma.graphEdge.count(),
      prisma.apiRequest.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate avg response time for last 1000 requests
    const avgResponseTime = await prisma.apiRequest.aggregate({
      take: 1000,
      _avg: { responseTimeMs: true },
      orderBy: { createdAt: 'desc' },
    });

    // Top 10 endpoints by requests
    const topEndpoints = await prisma.apiRequest.groupBy({
      by: ['method', 'path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    });

    // Summary by status code
    const statusCodeBreakdown = await prisma.apiRequest.groupBy({
      by: ['statusCode'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    res.json({
      summary: {
        totalCompanies,
        totalUsers,
        totalApiRequests,
        totalDocumentChunks: totalChunks,
        totalGraphEdges,
        avgResponseTime: avgResponseTime._avg.responseTimeMs || 0,
      },
      recentRequests,
      topEndpoints,
      statusCodeBreakdown,
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics dashboard' });
  }
});

// Get analytics events
router.get('/events', async (req, res) => {
  try {
    const { eventType, limit = 100 } = req.query;
    const filter = eventType ? { eventType } : {};
    const events = await prisma.analyticsEvent.findMany({
      where: filter,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ events });
  } catch (err) {
    console.error('Analytics events error:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Track a custom analytics event
router.post('/events', async (req, res) => {
  try {
    const { userId, eventType, eventName, properties, ipAddress, userAgent } = req.body;
    if (!eventType || !eventName) {
      return res.status(400).json({ error: 'eventType and eventName are required' });
    }
    const newEvent = await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventName,
        properties: properties || {},
        ipAddress,
        userAgent,
      },
    });
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Create analytics event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;
