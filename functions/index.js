const functions = require("firebase-functions");

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("BizAssistant backend is live 🚀");
});
