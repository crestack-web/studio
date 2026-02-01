const functions = require('firebase-functions');

// Logger for debug/info messages
const logger = functions.logger;

// Example HTTP function
exports.api = functions.https.onRequest((req, res) => {
  logger.info('Request received', { path: req.path, method: req.method });

  // Example response
  res.send('Hello from Firebase Functions!');
});

// You can add more functions below, e.g. Firestore triggers
// exports.myFunction = functions.firestore.document('collection/{docId}').onCreate((snap, context) => {
//   logger.info('New document added', { id: context.params.docId });
// });
