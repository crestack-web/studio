const axios = require('axios');
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function sendMessage(to, text) {
  try {
    await axios.post(`${BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
  } catch (err) {
    console.error('WhatsApp sendMessage error:', err);
  }
}

async function sendImageMessage(to, imageUrl, caption) {
  try {
    await axios.post(`${BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption }
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
  } catch (err) {
    console.error('WhatsApp sendImageMessage error:', err);
  }
}

async function downloadMedia(mediaId) {
  try {
    const res = await axios.get(`${BASE_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
    return res.data.url;
  } catch (err) {
    console.error('WhatsApp downloadMedia error:', err);
    throw new Error('Could not download media');
  }
}

async function sendMenu(to) {
  const text = `👋 Welcome to Busmo Assistant!\n\nHere's what I can do for you:\n\n📦 *Add Product*\nSend a photo with the price as caption\nExample: [photo] "Bag of rice ₦5000"\n\n💰 *Record a Sale*\nExample: "Sold 3 bags of rice for 15000"\n\n📊 *Get Sales Report*\nExample: "Show today's sales"\nExample: "This week summary"\n\nJust message naturally — I understand pidgin too! 😄`;
  await sendMessage(to, text);
}

module.exports = { sendMessage, sendImageMessage, downloadMedia, sendMenu };
