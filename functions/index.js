const functions = require("firebase-functions");

exports.helloWorld = functions.https.onRequest((req, res) => {
  functions.logger.info("Hello logs!");
  res.send("Functions are working 🚀");
});
