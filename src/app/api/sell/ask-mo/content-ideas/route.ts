import { NextRequest, NextResponse } from 'next/server';

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

const CONTENT_IDEAS_SYSTEM_PROMPT = `
You are MO — the AI commerce assistant inside Busmo, Africa's business operating system.
You help merchants create compelling marketing content for their products.

For the given product, generate a set of marketing content ideas in JSON format.
Return ONLY valid JSON wrapped in \`\`\`content_ideas\n ... \n\`\`\` — no other text.

The JSON must have this structure:
{
  "socialCaptions": [
    { "platform": "Instagram", "caption": "...", "hashtags": "#tag1 #tag2 #tag3" },
    { "platform": "Twitter/X", "caption": "..." },
    { "platform": "Facebook", "caption": "..." }
  ],
  "adCopy": [
    { "headline": "...", "body": "...", "cta": "..." }
  ],
  "emailMarketing": {
    "subject": "...",
    "previewText": "...",
    "body": "..."
  },
  "seoDescription": "...",
  "shortDescription": "...",
  "keySellingPoints": ["point1", "point2", "point3"],
  "marketingAngle": "..."
}

Guidelines:
- Write for the African market (Nigeria, Ghana, Kenya, South Africa, etc.)
- Use compelling, action-oriented language that drives sales
- Social captions should be 1-3 sentences + hashtags (for Instagram include 5-8 relevant hashtags)
- Ad copy should have a clear hook, benefit, and call-to-action
- The email body should be 3-5 short paragraphs
- SEO description should be 150-160 characters
- Keep everything specific to the actual product data provided — never generic
- If the product has specific features, benefits, or audience, highlight them
- Write in fluent, natural English with occasional Nigerian/West African flavour where appropriate
`;

async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  message: string,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
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

  if (data.error) throw new Error(data.error.message ?? 'Unknown Gemini error');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callWithFallback(
  apiKey: string,
  systemPrompt: string,
  message: string,
): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of MODELS) {
    try {
      return await callGemini(apiKey, modelName, systemPrompt, message);
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
    const { product, instruction } = body as {
      product: Record<string, unknown>;
      instruction?: string;
    };

    if (!product?.displayName) {
      return NextResponse.json({ error: 'Product displayName is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'your-google-ai-api-key') {
      return NextResponse.json(
        { error: 'AI service not configured', details: 'GOOGLE_GENAI_API_KEY is missing.' },
        { status: 503 }
      );
    }

    const productContext = [
      `Product Name: ${product.displayName}`,
      `Description: ${product.description || 'Not provided'}`,
      `Price: ${product.price ?? 'Not set'}`,
      `Category: ${product.category || 'Not set'}`,
      `Product Type: ${product.productType || 'Not set'}`,
      `Tags: ${(product.tags as string[] || []).join(', ') || 'None'}`,
      product.digitalSubtype ? `Digital Subtype: ${product.digitalSubtype}` : null,
    ].filter(Boolean).join('\n');

    const userMessage = instruction
      ? `PRODUCT DATA:\n${productContext}\n\nREFINEMENT INSTRUCTION:\n${instruction}`
      : `Generate marketing content ideas for this product:\n${productContext}`;

    const raw = await callWithFallback(apiKey, CONTENT_IDEAS_SYSTEM_PROMPT, userMessage);

    const match = raw.match(/```content_ideas\n([\s\S]+?)\n```/);
    let contentIdeas: Record<string, unknown> | null = null;

    if (match) {
      try { contentIdeas = JSON.parse(match[1]); }
      catch { /* fall through to re-generation attempt */ }
    }

    if (!contentIdeas) {
      // Try parsing entire response as JSON
      try { contentIdeas = JSON.parse(raw); }
      catch { /* return null */ }
    }

    return NextResponse.json({ contentIdeas });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      {
        error: isKeyError ? 'AI service configuration error' : 'Failed to generate content ideas',
        details: msg,
      },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
