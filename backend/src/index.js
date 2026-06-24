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
const quizRoutes = require('./routes/quiz');
// const rssRoutes = require('./routes/rss');
// const feedbackRoutes = require('./routes/feedback');

const prisma = new PrismaClient();
const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://pivotvault.netlify.app"
    "https://pivotvault.vercel.app"
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

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
app.use('/api/confessions', confessionRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/quiz', quizRoutes);
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
app.listen(PORT, () => {
  console.log(`PivotVault API running on port ${PORT}`);
});

module.exports = app;
