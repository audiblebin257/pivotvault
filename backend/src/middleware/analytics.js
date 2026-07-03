const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to track API requests
const trackApiRequests = async (req, res, next) => {
  const start = Date.now();

  // Hook into response to track after it's sent
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - start;
    const statusCode = res.statusCode;

    // Extract user IP (handle proxies like Nginx)
    let ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      req.ip ||
      null;

    // Extract user ID from auth (you'll need to implement this properly)
    const userId = null; // TODO: Replace with actual user ID from req.user if you have auth

    // Log the API request asynchronously (don't block the response)
    (async () => {
      try {
        await prisma.apiRequest.create({
          data: {
            userId,
            method: req.method,
            path: req.path,
            statusCode,
            responseTimeMs: responseTime,
            userAgent: req.headers['user-agent'],
            ipAddress,
            requestBody:
              req.method !== 'GET' && req.body
                ? JSON.parse(JSON.stringify(req.body))
                : null,
            errorMessage: statusCode >= 400 ? (typeof body === 'string' ? body : body?.error) : null,
          },
        });
      } catch (err) {
        console.error('Failed to track API request:', err);
      }
    })();

    originalSend.call(this, body);
  };

  next();
};

// Helper function to track an analytics event
const trackEvent = async (eventData) => {
  try {
    await prisma.analyticsEvent.create({
      data: eventData,
    });
  } catch (err) {
    console.error('Failed to track event:', err);
  }
};

module.exports = {
  trackApiRequests,
  trackEvent,
};
