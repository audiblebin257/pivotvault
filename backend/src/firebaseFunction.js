const { onRequest } = require('firebase-functions/v2/https');
const app = require('./index');

// Export Express app as Firebase Cloud Function named 'api'
exports.api = onRequest(
  {
    cors: true,
    region: 'us-central1',
    maxInstances: 10
  },
  app
);
