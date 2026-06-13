
const whatsappService = require('../services/whatsappService');
const qwenService = require('../services/qwenService');
const imageService = require('../services/imageService');
const firebaseService = require('../services/firebaseService');
const sessionStore = require('../utils/sessionStore');
const catalogService = require('../services/catalogService');
const notificationService = require('../services/notificationService');

async function handleIncomingMessage(message, from) {
  try {
    // User lookup
    const busmoUser = await firebaseService.getUserByPhone(from);
    if (!busmoUser) {
      await whatsappService.sendMessage(from, `👋 Sorry, we couldn't find your Busmo account.\n\nSign up at https://www.busmo.app to get started!`);
      return;
    }
    const firstName = (busmoUser.name || '').split(' ')[0] || 'there';
    const isSeller = busmoUser.role === 'seller';

    // IMAGE: Only sellers can add products
    if (message.type === 'image') {
      if (!isSeller) {
        await whatsappService.sendMessage(from, `🛑 Only sellers can add products. Visit https://www.busmo.app to become a seller.`);
        return;
      }
      await whatsappService.sendMessage(from, '📸 Got your image! Analysing it now...');
      const mediaUrl = await whatsappService.downloadMedia(message.image.id);
      const caption = message.image.caption || '';
      const parsed = await qwenService.parseProductFromImage(mediaUrl, caption);
      const quality = await imageService.checkQuality(mediaUrl);
      let finalImageUrl = mediaUrl;
      let imageSource = 'user-uploaded';
      if (!quality.isGood || parsed.confidence < 70) {
        const betterImage = await imageService.findBetterImage(parsed.search_query);
        if (betterImage) finalImageUrl = betterImage;
        imageSource = 'auto-enhanced';
      }
      sessionStore.setSession(from, {
        name: parsed.product_name,
        price: parsed.price,
        imageUrl: finalImageUrl,
        imageSource
      });
      await whatsappService.sendMessage(from, `✅ Here's your product summary:\n\n📦 Product: ${parsed.product_name}\n💰 Price: ₦${parsed.price}\n🖼️ Image: ${imageSource}\n\nReply *YES* to add this to Busmo\nOr send a clearer photo to use your own image`);
      return;
    }

    // TEXT
    if (message.type === 'text') {
      const text = message.text.body.trim();
      const lower = text.toLowerCase();

      // Greetings/menu
      if (/^(hi|hello|hey|start|help|menu)$/i.test(lower)) {
        await whatsappService.sendMessage(from, `👋 Hi ${firstName}! Welcome to Busmo.\n\nYou can:\n- Add a product (send a photo with price)\n- Record a sale ("Sold 2 shoes for 10000")\n- Get a report ("Show today's sales")\n- Browse products ("shop", "search <item>")\n\nType "menu" anytime for help.`);
        await whatsappService.sendMenu(from);
        return;
      }

      // YES/NO for product confirmation
      if ((/^(yes|y)$/i).test(lower) && sessionStore.hasSession(from)) {
        const session = sessionStore.getSession(from);
        await firebaseService.addProduct(session, from);
        // AI-generated confirmation
        const confirmation = await qwenService.generateProductConfirmation(session);
        await whatsappService.sendMessage(from, confirmation);
        sessionStore.clearSession(from);
        return;
      }
      if ((/^(no)$/i).test(lower)) {
        await whatsappService.sendMessage(from, "📷 No problem! Send a clearer photo and I'll use that instead.");
        sessionStore.clearSession(from);
        return;
      }

      // Order confirmation/rejection (for sellers)
      if (isSeller && /^confirm\s+(\w+)/i.test(lower)) {
        const orderId = lower.match(/^confirm\s+(\w+)/i)[1];
        await firebaseService.updateOrderStatus(orderId, 'confirmed');
        await whatsappService.sendMessage(from, `✅ Order ${orderId} confirmed!`);
        return;
      }
      if (isSeller && /^reject\s+(\w+)/i.test(lower)) {
        const orderId = lower.match(/^reject\s+(\w+)/i)[1];
        await firebaseService.updateOrderStatus(orderId, 'rejected');
        await whatsappService.sendMessage(from, `❌ Order ${orderId} rejected.`);
        return;
      }

      // Customer browse/catalog
      const handled = await catalogService.handleCustomerBrowse(text, from);
      if (handled) return;

      // Qwen intent parsing
      const parsed = await qwenService.parseIntent(text);
      if (parsed.intent === 'add_product') {
        await whatsappService.sendMessage(from, '📦 Sure! Send me a photo of the product with the price in the caption.');
      } else if (parsed.intent === 'record_sale') {
        // AI-generated sale confirmation
        const confirmation = await qwenService.generateSaleConfirmation(parsed.data);
        await firebaseService.recordSale(parsed.data, from);
        await whatsappService.sendMessage(from, confirmation);
      } else if (parsed.intent === 'report') {
        const report = await firebaseService.getReport(parsed.data.period, from);
        await whatsappService.sendMessage(from, report);
      } else {
        await whatsappService.sendMenu(from);
      }
    }
  } catch (err) {
    console.error('Message handler error:', err);
    await whatsappService.sendMessage(from, 'Sorry, something went wrong. Please try again. 🙏');
  }
}

module.exports = { handleIncomingMessage };
