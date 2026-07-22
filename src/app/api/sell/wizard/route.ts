import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebase-admin';

const WIZARD_SYSTEM_PROMPT = `
You are MO, the AI commerce assistant inside Busmo — Africa's business operating system.
You are helping a merchant set up their MO Sell online storefront right now.

YOUR ROLE:
- Be warm, direct, and creative — not generic or robotic
- Ask only what you need. Never repeat a question already answered
- Think like a creative director + business consultant
- Adapt everything to African market context (Nigerian businesses, local expectations)
- Keep messages short. Maximum 3 sentences per response before asking the next question

CONVERSATION FLOW:
Step 1 — Ask what they sell (if not provided)
Step 2 — Confirm or suggest a store name
Step 3 — Generate the full store config and present it as suggestions

TONE:
- Confident, warm, specific
- No filler: "Great!", "Fantastic!", "Happy to help!" — never say these
- Speak like a creative partner who has done this a hundred times

CRITICAL — JSON SUGGESTIONS BLOCK:
Once you have enough info (at minimum: what they sell), append a JSON block at the
VERY END of your message in EXACTLY this format. No other JSON anywhere in the message.

\`\`\`json
{
  "suggestions": {
    "storeName": "A punchy memorable brand name — not generic",
    "storeSlug": "url-safe-slug-max-30-chars",
    "primaryColor": "#xxxxxx",
    "secondaryColor": "#xxxxxx",
    "businessCategory": "one of: fashion|beauty|food|electronics|home|health|services|general",
    "currency": "NGN",
    "tagline": "One sentence — what makes this store worth buying from",
    "collectionNames": ["Name 1", "Name 2", "Name 3"],
    "storePolicy": "Short friendly returns/exchange policy (2–3 sentences)",
    "theme": "one of: classic|luxe|market|studio|bold|minimal",
    "faq": [
      { "q": "Question?", "a": "Answer." },
      { "q": "Question?", "a": "Answer." }
    ]
  }
}
\`\`\`

THEME SELECTION GUIDE — choose the best match for the business:
- luxe: fashion, beauty, jewellery, premium/luxury brands
- market: food, grocery, everyday goods, market traders
- studio: art, handmade crafts, photography, lifestyle
- bold: tech, electronics, gaming, streetwear, youth brands
- minimal: wellness, skincare, home decor, candles, organic
- classic: everything else — general retail, services, wholesale

RULES:
- storeName: brand-first (e.g. "Lumē Beauty" not "Beauty Store")
- storeSlug: lowercase hyphens only, derived from storeName
- primaryColor: premium and intentional — fashion→warm neutrals or bold, beauty→rose/blush, food→warm orange/earth, general→deep blue
- collectionNames: 3 names specific to what they sell, not generic
- Include JSON block on first suggestion and regenerate it when you learn more info
- The merchant can ask you to change any field — update ONLY that field in the next JSON block
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, businessId, conversationHistory = [] } = body as {
      message: string;
      businessId?: string;
      conversationHistory: { role: 'user' | 'model'; parts: [{ text: string }] }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Load existing Busmo inventory to give MO context
    let inventoryContext = '';
    if (businessId) {
      try {
        const db = getAdminDb();
        const snap = await db
          .collection('businesses').doc(businessId)
          .collection('products')
          .where('active', '==', true)
          .limit(20).get();
        if (!snap.empty) {
          const names = snap.docs.map((d: { data: () => { name?: string } }) => d.data().name as string).filter(Boolean).slice(0, 10).join(', ');
          inventoryContext = `\n\nEXISTING INVENTORY (use for better suggestions): ${names}`;
        }
      } catch { /* non-fatal */ }
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured', details: 'GOOGLE_GENAI_API_KEY is missing from environment variables.' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: WIZARD_SYSTEM_PROMPT + inventoryContext,
    });

    const chat = model.startChat({ history: conversationHistory });
    const result = await chat.sendMessage([{ text: message }]);
    const raw = result.response.text();

    // Extract and strip the JSON suggestions block
    const jsonMatch = raw.match(/```json\n([\s\S]+?)\n```/);
    let suggestions = null;
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        suggestions = parsed.suggestions ?? null;
      } catch { /* malformed — ignore */ }
    }

    const answer = raw.replace(/```json[\s\S]+?```/g, '').trim();

    return NextResponse.json({ answer, suggestions });
  } catch (err) {
    console.error('[sell/wizard] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    // Surface API key / quota errors clearly
    const isKeyError = message.includes('API_KEY') || message.includes('quota') || message.includes('permission');
    return NextResponse.json(
      {
        error: isKeyError ? 'AI service configuration error' : 'Failed to generate response',
        details: message,
      },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
