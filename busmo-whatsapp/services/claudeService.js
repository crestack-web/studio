const { Anthropic } = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function parseIntent(textMessage) {
  try {
    const systemPrompt = `You are a business assistant for Busmo, an African marketplace app.\nParse the user message and return ONLY valid JSON with no extra text, markdown, or explanation:\n{\n  "intent": "add_product" | "record_sale" | "report" | "unknown",\n  "data": {\n    "name": "product name if mentioned or null",\n    "price": price as number if mentioned or null,\n    "quantity": quantity as number if mentioned or null,\n    "period": "today" | "this_week" | "this_month" or null\n  }\n}\nRules:\n- Handle pidgin English e.g. "sell am", "e cost"\n- Handle shorthand: "15k" = 15000, "2.5k" = 2500\n- Handle mixed languages\n- If unsure, return intent: "unknown"`;
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: textMessage }],
    });
    const json = JSON.parse(response.content[0].text.trim());
    return json;
  } catch (err) {
    return { intent: 'unknown', data: {} };
  }
}

async function parseProductFromImage(imageUrl, caption) {
  try {
    const systemPrompt = `You are a product image analyst for Busmo, an African marketplace app.\nAnalyse the image and return ONLY valid JSON with no extra text, markdown, or explanation:\n{\n  "product_name": "clear descriptive product name in English",\n  "price": price as number extracted from caption or null,\n  "image_quality": "good" | "poor",\n  "confidence": number between 0 and 100,\n  "search_query": "simple English search term for Pexels to find a clean product photo e.g. 'fresh tomatoes' or 'leather handbag'"\n}\nRules:\n- image_quality is "poor" if image is blurry, dark, very small, or unclear\n- Extract price from caption — handle formats: 500, ₦500, 5k, 2,000, $10\n- confidence is how sure you are about the product name (0-100)\n- search_query should be simple and in English for best Pexels results`;
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: `Caption from seller: "${caption}". Analyse this product image.` }
        ]
      }],
    });
    const json = JSON.parse(response.content[0].text.trim());
    return json;
  } catch (err) {
    return {
      product_name: null,
      price: null,
      image_quality: 'poor',
      confidence: 0,
      search_query: ''
    };
  }
}

module.exports = { parseIntent, parseProductFromImage };
