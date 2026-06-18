const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use Google GenAI instead of Qwen
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

/**
 * Parse user intent from text message using Google GenAI
 * Handles: add_product, record_sale, report, unknown
 */
async function parseIntent(textMessage) {
  try {
    const systemPrompt = `You are a business assistant for Busmo, an African marketplace app.
Parse the user message and return ONLY valid JSON with no extra text, markdown, or explanation:
{
  "intent": "add_product" | "record_sale" | "report" | "unknown",
  "data": {
    "name": "product name if mentioned or null",
    "price": price as number if mentioned or null,
    "quantity": quantity as number if mentioned or null,
    "period": "today" | "this_week" | "this_month" or null
  }
}

Rules:
- Handle pidgin English e.g. "sell am", "e cost", "I don sell"
- Handle shorthand: "15k" = 15000, "2.5k" = 2500, "500 bob" = 500
- Handle mixed languages (English + local languages)
- If unsure, return intent: "unknown"`;

    const prompt = `${systemPrompt}\n\nUser message: ${textMessage}`;
    const response = await model.generateContent(prompt);
    const content = response.response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const json = JSON.parse(jsonStr);
    
    console.log('✅ Google GenAI Intent Parsed:', json);
    return json;
  } catch (err) {
    console.error('❌ Google GenAI intent parsing error:', err.message);
    return { intent: 'unknown', data: {} };
  }
}

/**
 * Parse product details from image using Google GenAI Vision
 */
async function parseProductFromImage(imageUrl, caption) {
  try {
    const systemPrompt = `You are a product image analyst for Busmo, an African marketplace app.
Analyse the image and return ONLY valid JSON with no extra text, markdown, or explanation:
{
  "product_name": "clear descriptive product name in English",
  "price": price as number extracted from caption or null,
  "image_quality": "good" | "poor",
  "confidence": number between 0 and 100,
  "search_query": "simple English search term for Pexels to find a clean product photo e.g. 'fresh tomatoes' or 'leather handbag'"
}

Rules:
- image_quality is "poor" if image is blurry, dark, very small, or unclear
- Extract price from caption — handle formats: 500, ₦500, 5k, 2,000, $10
- confidence is how sure you are about the product name (0-100)
- search_query should be simple and in English for best Pexels results`;

    // Use Google GenAI Vision for image analysis
    const prompt = `${systemPrompt}\n\nCaption from seller: "${caption}". Analyse this product image and extract product details.`;
    
    // Fetch image and convert to base64
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data).toString('base64');
    
    const response = await visionModel.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      },
      prompt
    ]);

    const content = response.response.text().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const json = JSON.parse(jsonStr);
    
    console.log('✅ Google GenAI Vision Product Parsed:', json);
    return json;
  } catch (err) {
    console.error('❌ Google GenAI Vision image analysis error:', err.message);
    return {
      product_name: null,
      price: null,
      image_quality: 'poor',
      confidence: 0,
      search_query: ''
    };
  }
}

/**
 * Generate sale confirmation message with Google GenAI
 */
async function generateSaleConfirmation(saleData) {
  try {
    const prompt = `Generate a friendly, encouraging sale confirmation message for an African business owner.
Sale details:
- Product: ${saleData.name || 'Item'}
- Quantity: ${saleData.quantity || 1}
- Total: ₦${saleData.price || 0}

Return ONLY the confirmation message (2-3 sentences max). Make it celebratory and motivational!`;

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (err) {
    // Fallback to simple confirmation
    return `✅ Sale Recorded!\n\n📦 Product: ${saleData.name || 'Item'}\n🔢 Quantity: ${saleData.quantity || 1}\n💰 Amount: ₦${saleData.price || 0}\n\nKeep it up! 💪`;
  }
}

/**
 * Generate product addition confirmation with Google GenAI
 */
async function generateProductConfirmation(productData) {
  try {
    const prompt = `Generate a friendly, encouraging product listing confirmation for an African seller.
Product details:
- Name: ${productData.name || 'Product'}
- Price: ₦${productData.price || 0}
- Image: ${productData.imageSource || 'uploaded'}

Return ONLY the confirmation message (2-3 sentences max). Make it exciting!`;

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (err) {
    // Fallback to simple confirmation
    return `🎉 Product is now live on Busmo marketplace!\n\n📦 ${productData.name || 'Product'}\n💰 ₦${productData.price || 0}\n\nBuyers can now discover and purchase your product! 🚀`;
  }
}

module.exports = {
  parseIntent,
  parseProductFromImage,
  generateSaleConfirmation,
  generateProductConfirmation
};
