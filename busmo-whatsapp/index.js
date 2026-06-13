
require('dotenv').config();
const express = require('express');
const { handleIncomingMessage } = require('./handlers/messageHandler');
const { paystackWebhookHandler } = require('./services/paystackWebhook');
const { startScheduler } = require('./services/schedulerService');

const app = express();
app.use(express.json());

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from;
    if (message && from) {
      console.log(`📩 Message from ${from}:`, message.type);
      await handleIncomingMessage(message, from);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.sendStatus(200);
  }
});

app.post('/paystack/webhook', paystackWebhookHandler);
app.get('/', (req, res) => res.json({ status: '🚀 Busmo Bot Running!' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Busmo WhatsApp Bot running on port ${PORT}`);
  startScheduler();
});

module.exports = app;
