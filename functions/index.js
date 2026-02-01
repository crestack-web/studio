const functions = require("firebase-functions");

exports.helloWorld = functions.https.onRequest((req, res) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  res.status(200).send("Functions are working 🚀");
});
