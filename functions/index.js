const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.helloWorld = onRequest((req, res) => {
  logger.info("Hello function called", { structuredData: true });
  res.send("Functions are working 🚀");
});
