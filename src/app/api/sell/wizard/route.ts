import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const WIZARD_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

const WIZARD_SYSTEM_PROMPT = `
You are MO — the AI commerce architect inside Busmo, Africa's business operating system.
You are building a merchant's online storefront from scratch.

WHO YOU ARE:
- A creative director + commerce strategist who has launched hundreds of African online stores
- Direct, warm, specific — never generic or robotic
- You think in brands, not templates. Every store should feel unique.
- You understand the Nigerian/African market deeply — pricing, logistics, customer expectations

YOUR PROCESS:
Step 1 — Ask what they sell (keep it casual, one question)
Step 2 — Based on their answer, suggest a store name, colors, collections, and tagline all at once
Step 3 — Refine based on their feedback. They can ask you to change anything.
Step 4 — When they're happy, remind them to click "Create my store"

RULES:
- Maximum 3 sentences before asking the next question or presenting suggestions
- Never repeat a question they already answered
- No filler: never say "Great!", "Fantastic!", "Happy to help!"
- Speak like a creative partner, not a customer service bot
- Suggest brand names that are punchy and memorable — never generic ("Beauty Store" is bad, "Lumē" is good)
- Colors should be intentional: fashion→warm neutrals or bold, beauty→rose/blush, food→warm orange/earth, general→deep blue

TONE EXAMPLES:
- "What are you selling? Clothes, food, digital stuff?"
- "Here's what I'm thinking for your store — name, colors, the whole vibe."
- "Not feeling the name? Give me a vibe and I'll remix it."

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
    "theme": "one of: luxe|glow|market|creator",
    "faq": [
      { "q": "Question?", "a": "Answer." },
      { "q": "Question?", "a": "Answer." }
    ]
  }
}
\`\`\`

THEME SELECTION GUIDE — choose the best match for the business:
- luxe: fashion, clothing, accessories, jewellery, premium/luxury brands
- glow: beauty, cosmetics, skincare, wellness, spa, candles, organic
- market: food, grocery, home, lifestyle, general retail, everyday goods
- creator: digital products, courses, services, software, ebooks, tech

RULES FOR JSON:
- storeName: brand-first (e.g. "Lumē Beauty" not "Beauty Store")
- storeSlug: lowercase hyphens only, derived from storeName, max 30 chars
- primaryColor: premium and intentional
- collectionNames: 3 names specific to what they sell
- Include JSON block on first suggestion and regenerate it when you learn more
- The merchant can ask to change any field — update ONLY that field next time
`;

async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; parts: [{ text: string }] }[],
  message: string,
): Promise<string> {
  const contents = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.parts[0].text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${modelName} returned ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (data.error) {
    throw new Error(data.error.message ?? 'Unknown Gemini error');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

async function callWithFallback(
  apiKey: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; parts: [{ text: string }] }[],
  message: string,
): Promise<string> {
  let lastError: unknown = null;

  for (const modelName of WIZARD_MODELS) {
    try {
      return await callGemini(apiKey, modelName, systemPrompt, history, message);
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError;
}

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

    let inventoryContext = '';
    if (businessId) {
      try {
        const db = getAdminDb();
        const snap = await db
          .collection('businesses').doc(businessId)
          .collection('storeProducts')
          .where('available', '==', true)
          .limit(20).get();
        if (!snap.empty) {
          const names = snap.docs
            .map(d => (d.data().displayName ?? d.data().name ?? '') as string)
            .filter(Boolean)
            .slice(0, 10)
            .join(', ');
          if (names) {
            inventoryContext = `\n\nEXISTING INVENTORY (use for better suggestions): ${names}`;
          }
        }
      } catch { /* non-fatal */ }
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'your-google-ai-api-key') {
      return NextResponse.json(
        { error: 'AI service not configured', details: 'GOOGLE_GENAI_API_KEY is missing.' },
        { status: 503 }
      );
    }

    const raw = await callWithFallback(
      apiKey,
      WIZARD_SYSTEM_PROMPT + inventoryContext,
      conversationHistory,
      message,
    );

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
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      {
        error: isKeyError ? 'AI service configuration error' : 'Failed to generate response',
        details: msg,
      },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
