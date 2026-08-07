require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const startupRoutes = require('./routes/startups');
const aiRoutes = require('./routes/ai');
const graphRoutes = require('./routes/graph');
const confessionRoutes = require('./routes/confessions');
const insightsRoutes = require('./routes/insights');
const authRoutes = require('./routes/auth');
const bookmarkRoutes = require('./routes/bookmarks');
const intelligenceReportRoutes = require('./routes/intelligenceReport');
const monitoringRoutes = require('./routes/monitoring');
const ragRoutes = require('./routes/rag');
const founderIntelligenceRoutes = require('./routes/founderIntelligence');
const analyticsRoutes = require('./routes/analytics');
const secRoutes = require('./routes/sec');
const companiesRoutes = require('./routes/companies');
const { registerWeeklyRefresh } = require('./services/companyImport/scheduler');
const { trackApiRequests } = require('./middleware/analytics');
const { startSchedulers } = require('./pipeline/scheduler');
const { secService } = require('./services/sec');
// Import all workers to start them
require('./pipeline/workers');

const prisma = new PrismaClient();
const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes("vercel.app") ||
      origin.includes("web.app") ||
      origin.includes("firebaseapp.com") ||
      origin === "https://pivotvault.netlify.app" ||
      origin === "http://localhost:5173"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(trackApiRequests);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' }
});
app.use('/api/', globalLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/founder', founderIntelligenceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/ai', intelligenceReportRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/sec', secRoutes);
app.use('/api/companies', companiesRoutes);
// app.use('/api/rss', rssRoutes);
// app.use('/api/feedback', feedbackRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, async () => {
  console.log(`PivotVault API running on port ${PORT}`);
  // Start the agent schedulers
  startSchedulers();
  // Start the SEC EDGAR incremental sync (daily 02:30 UTC by default)
  if (process.env.SEC_SYNC_ENABLED !== 'false') {
    secService.startScheduler(process.env.SEC_SYNC_CRON || '30 2 * * *');
  }
  registerWeeklyRefresh(process.env.COMPANY_REFRESH_CRON || '0 4 * * 0');
});

module.exports = app;
