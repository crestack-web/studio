const functions = require('firebase-functions');
const logger = functions.logger;

// Example HTTP function
exports.api = functions.https.onRequest((req, res) => {
  logger.info('Request received', { path: req.path, method: req.method });
  res.send('Hello from Firebase Functions!');
});
