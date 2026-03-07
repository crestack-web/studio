/**
 * Qwen3.5 AI Service
 * Handles all AI interactions via Alibaba Cloud DashScope API
 */

import axios, { AxiosError } from 'axios';

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponse {
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// DashScope API Configuration
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1';
const MODEL = process.env.QWEN_MODEL || 'qwen-max';

if (!DASHSCOPE_API_KEY) {
  console.warn('DASHSCOPE_API_KEY not configured. AI features will be limited.');
}

/**
 * Call Qwen3.5 API with proper error handling
 */
async function callQwen(messages: QwenMessage[], jsonMode = false): Promise<string> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  try {
    const systemPrompt = jsonMode 
      ? 'You are a helpful assistant. ALWAYS respond with valid JSON only. No markdown, no explanations.'
      : 'You are MO, a helpful AI assistant for African businesses. Respond in the same language as the user.';

    const allMessages: QwenMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await axios.post<QwenResponse>(
      `${DASHSCOPE_BASE_URL}/services/aigc/text-generation/generation`,
      {
        model: MODEL,
        input: {
          messages: allMessages
        },
        parameters: {
          result_format: 'message',
          max_tokens: parseInt(process.env.QWEN_MAX_TOKENS || '2000'),
          temperature: parseFloat(process.env.QWEN_TEMPERATURE || '0.7'),
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    // Log token usage for cost tracking
    console.log('Qwen token usage:', response.data.usage);

    return response.data.output.text;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Qwen API Error:', error.response?.data || error.message);
      throw new Error(`AI service unavailable: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse sale intent from natural language
 * @param text - User's message (e.g., "Sold 2 bags of rice for 5000 naira")
 * @param language - Language code (en, yo, ig, ha, sw, etc.)
 * @returns Structured sale data
 */
export async function parseSaleIntent(
  text: string,
  language: string = 'en'
): Promise<{
  products: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod?: 'cash' | 'transfer' | 'pos';
  customerName?: string;
  notes?: string;
}> {
  const prompt = `
You are a sales data extractor for African businesses. Extract sale information from this text:

"${text}"

Language: ${language}

Return JSON with this exact structure:
{
  "products": [
    {"name": "product name", "quantity": 2, "price": 1000}
  ],
  "total": 2000,
  "paymentMethod": "cash|transfer|pos" (optional),
  "customerName": "name" (optional),
  "notes": "any notes" (optional)
}

If information is missing, use null or reasonable estimates based on context.
Currency should be in NGN (Nigerian Naira) unless specified otherwise.
`;

  const response = await callQwen([
    { role: 'user', content: prompt }
  ], true);

  try {
    // Clean response and parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse sale intent JSON:', error);
    throw new Error('Failed to extract sale information');
  }
}

/**
 * Analyze product image and extract attributes
 * @param imageUrl - URL of product image from Firebase Storage
 * @param name - Product name (optional)
 * @param price - Product price (optional)
 * @returns Product attributes
 */
export async function analyzeProduct(
  imageUrl: string,
  name?: string,
  price?: number
): Promise<{
  name: string;
  description: string;
  category: string;
  suggestedPrice: number;
  attributes: Record<string, string>;
}> {
  const prompt = `
You are a product analysis expert for African retail businesses. Analyze this product image and information.

Image URL: ${imageUrl}
${name ? `Product Name: ${name}` : ''}
${price ? `Price: ₦${price}` : ''}

Return JSON with this exact structure:
{
  "name": "clear product name",
  "description": "brief description in 1-2 sentences",
  "category": "one of: Grains, Beverages, Snacks, Household, Personal Care, Electronics, Clothing, Other",
  "suggestedPrice": 1000,
  "attributes": {
    "brand": "brand name or 'Generic'",
    "size": "e.g., 50kg, 5L, etc.",
    "color": "if applicable",
    "material": "if applicable"
  }
}

Consider local African market context for pricing and categorization.
`;

  const response = await callQwen([
    { role: 'user', content: prompt }
  ], true);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse product analysis JSON:', error);
    throw new Error('Failed to analyze product');
  }
}

/**
 * Answer business questions using RAG (Retrieval Augmented Generation)
 * @param question - User's business question
 * @param businessData - Context from Firestore (sales, products, metrics)
 * @returns AI-powered business insight
 */
export async function answerBusinessQuestion(
  question: string,
  businessData: {
    totalSales?: number;
    totalRevenue?: number;
    topProducts?: Array<{ name: string; revenue: number }>;
    recentSales?: number;
    period?: string;
  }
): Promise<{
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
}> {
  const contextStr = JSON.stringify(businessData, null, 2);

  const prompt = `
You are MO, a business AI assistant for African SMBs. Answer this question using the provided business data.

QUESTION: "${question}"

BUSINESS DATA:
${contextStr}

Return JSON with this exact structure:
{
  "answer": "clear, helpful answer in the same language as the question",
  "confidence": "high|medium|low",
  "suggestions": ["actionable suggestion 1", "suggestion 2", "suggestion 3"]
}

Guidelines:
- If data is insufficient, say so honestly and suggest what to track
- Provide actionable, culturally-relevant advice for African businesses
- Use simple language, avoid jargon
- If question is in Pidgin, Yoruba, Igbo, Hausa, or Swahili, respond in same language
`;

  const response = await callQwen([
    { role: 'user', content: prompt }
  ], true);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse business answer JSON:', error);
    throw new Error('Failed to generate business insight');
  }
}

/**
 * Detect language from text (simple heuristic)
 */
export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  
  // Common words in African languages
  if (/\b(omo|ewa|ose|jare|abeg)\b/.test(lower)) return 'yo'; // Yoruba
  if (/\b(nda|kedu|ogechi|nnoo)\b/.test(lower)) return 'ig'; // Igbo
  if (/\b(sannu|yau|kara|gida)\b/.test(lower)) return 'ha'; // Hausa
  if (/\b(habari|asante|nzuri|pole)\b/.test(lower)) return 'sw'; // Swahili
  if (/\b(abeg|how far|wahala|chop)\b/.test(lower)) return 'pcm'; // Pidgin
  
  return 'en'; // Default to English
}
