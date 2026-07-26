import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

const SELL_MO_SYSTEM_PROMPT = `
You are MO — the AI commerce assistant inside Busmo, Africa's business operating system.
You are helping a merchant manage and grow their online store through conversation.

WHO YOU ARE:
- A strategic commerce partner — you know branding, pricing, product strategy, and the African market
- Direct, specific, action-oriented — never generic or robotic
- You think like a store owner who wants to sell more

WHAT YOU CAN DO:
1. EDIT THE STORE — name, colors, tagline, collections, policy, theme, FAQ
2. CREATE DIGITAL PRODUCTS — ebooks, templates, courses, tickets — with title, description, price, category, tags
3. GENERAL HELP — product descriptions, collection ideas, pricing advice, marketing tips

HOW TO RESPOND:
- Keep responses short and conversational (2-4 sentences max)
- When the user asks to change something, confirm what you're changing and return the storeUpdate
- When the user wants to create a product, gather the key details (name, price, type) then return the newProduct
- Never repeat questions they already answered
- No filler words: never say "Great!", "Fantastic!", "Happy to help!"
- Speak like a sharp business partner, not a chatbot

RESPONSE FORMAT:
Always respond in plain text for the "answer" field.
When appropriate, also return structured JSON blocks for actions.

CRITICAL — JSON ACTION BLOCKS:
When the user wants to EDIT their store, append this at the END of your message:

\`\`\`store_update
{
  "storeName": "new name or null",
  "storeSlug": "new-slug-or-null",
  "primaryColor": "#hex-or-null",
  "secondaryColor": "#hex-or-null",
  "tagline": "new tagline or null",
  "storePolicy": "new policy or null",
  "businessCategory": "category-or-null",
  "theme": "luxe|glow|market|creator-or-null"
}
\`\`\`

When the user wants to CREATE a digital product, append this at the END of your message:

\`\`\`new_product
{
  "displayName": "Product Name",
  "description": "Compelling product description (2-3 sentences)",
  "price": 5000,
  "currency": "NGN",
  "productType": "digital",
  "digitalSubtype": "ebook|template|course|ticket",
  "category": "one of: fashion|beauty|food|electronics|home|health|services|general|digital",
  "tags": ["tag1", "tag2"],
  "pdfContent": {
    "title": "PDF Document Title",
    "subtitle": "Optional subtitle",
    "chapters": [
      { "heading": "Chapter 1 Title", "body": "Chapter content text..." },
      { "heading": "Chapter 2 Title", "body": "Chapter content text..." }
    ],
    "author": "Store Name or Author Name"
  }
}
\`\`\`

RULES FOR new_product:
- price must be a positive number (no currency symbol)
- digitalSubtype must be one of: ebook, template, course, ticket
- pdfContent is REQUIRED for digital products — generate meaningful content (at least 3 chapters with real body text)
- The PDF content should be educational/informational — real value that customers would pay for
- Each chapter body should be 2-4 substantial paragraphs
- tags should be 2-5 relevant search terms
- description should be compelling marketing copy, not just "An ebook about X"

RULES FOR store_update:
- Only include fields the user wants to change
- Set unchanged fields to null
- storeSlug must be lowercase-hyphen format, max 30 chars
- primaryColor/secondaryColor must be valid hex (#RRGGBB)

THEME GUIDE:
- luxe: fashion, clothing, accessories, premium/luxury
- glow: beauty, cosmetics, skincare, wellness
- market: food, grocery, home, lifestyle, general retail
- creator: digital products, courses, services, ebooks, tech

CATEGORIES: fashion, beauty, food, electronics, home, health, services, general, digital
`;

async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
): Promise<string> {
  const contents = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.parts[0]?.text ?? '' }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
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
          maxOutputTokens: 4096,
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

  if (data.error) throw new Error(data.error.message ?? 'Unknown Gemini error');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callWithFallback(
  apiKey: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of MODELS) {
    try {
      return await callGemini(apiKey, modelName, systemPrompt, history, message);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError;
}

async function generatePdf(
  title: string,
  subtitle: string | null,
  chapters: { heading: string; body: string }[],
  author: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 72;
  const LINE_HEIGHT = 16;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

  function addPage() {
    return pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Title page
  let page = addPage();
  let y = PAGE_HEIGHT / 2 + 60;
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 32,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: CONTENT_WIDTH,
  });
  if (subtitle) {
    y -= 40;
    page.drawText(subtitle, {
      x: MARGIN,
      y,
      size: 18,
      font,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: CONTENT_WIDTH,
    });
  }
  y -= 80;
  page.drawText(`by ${author}`, {
    x: MARGIN,
    y,
    size: 14,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  page.drawText('Generated with Busmo — Africa\'s Business Operating System', {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Chapters
  for (const chapter of chapters) {
    page = addPage();
    y = PAGE_HEIGHT - MARGIN;

    // Chapter heading
    const headingLines = wrapText(chapter.heading, 20, CONTENT_WIDTH);
    for (const line of headingLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 20,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: CONTENT_WIDTH,
      });
      y -= 28;
    }
    y -= 10;

    // Chapter body paragraphs
    const paragraphs = chapter.body.split('\n').filter(p => p.trim());
    for (const para of paragraphs) {
      const paraLines = wrapText(para, 12, CONTENT_WIDTH);
      for (const line of paraLines) {
        if (y < MARGIN + 20) {
          page = addPage();
          y = PAGE_HEIGHT - MARGIN;
        }
        page.drawText(line, {
          x: MARGIN,
          y,
          size: 12,
          font,
          color: rgb(0.15, 0.15, 0.15),
          maxWidth: CONTENT_WIDTH,
        });
        y -= LINE_HEIGHT;
      }
      y -= 12;
    }
  }

  return pdfDoc.save();
}

function parseActionBlocks(raw: string): {
  answer: string;
  storeUpdate: Record<string, unknown> | null;
  newProduct: Record<string, unknown> | null;
} {
  let storeUpdate: Record<string, unknown> | null = null;
  let newProduct: Record<string, unknown> | null = null;

  const storeMatch = raw.match(/```store_update\n([\s\S]+?)\n```/);
  if (storeMatch) {
    try {
      storeUpdate = JSON.parse(storeMatch[1]);
    } catch (parseErr) {
      console.error('[AskMo] Malformed store_update JSON:', parseErr instanceof Error ? parseErr.message : parseErr);
    }
  }

  const productMatch = raw.match(/```new_product\n([\s\S]+?)\n```/);
  if (productMatch) {
    try {
      newProduct = JSON.parse(productMatch[1]);
    } catch (parseErr) {
      console.error('[AskMo] Malformed new_product JSON:', parseErr instanceof Error ? parseErr.message : parseErr);
      console.error('[AskMo] Raw product block:', productMatch[1].slice(0, 500));
    }
  }

  const answer = raw
    .replace(/```store_update[\s\S]+?```/g, '')
    .replace(/```new_product[\s\S]+?```/g, '')
    .trim();

  return { answer, storeUpdate, newProduct };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, businessId, storeConfig, conversationHistory = [] } = body as {
      message: string;
      businessId: string;
      storeConfig: Record<string, unknown> | null;
      conversationHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'your-google-ai-api-key') {
      return NextResponse.json(
        { error: 'AI service not configured', details: 'GOOGLE_GENAI_API_KEY is missing.' },
        { status: 503 }
      );
    }

    // Build store context for the AI
    let storeContext = '';
    if (storeConfig) {
      const cfg = storeConfig as Record<string, string | number | boolean | null>;
      storeContext = `
CURRENT STORE CONFIG:
- Name: ${cfg.storeName ?? 'Not set'}
- Slug: ${cfg.storeSlug ?? 'Not set'}
- Tagline: ${cfg.tagline ?? 'Not set'}
- Category: ${cfg.businessCategory ?? 'Not set'}
- Theme: ${cfg.theme ?? 'Not set'}
- Primary Color: ${cfg.primaryColor ?? 'Not set'}
- Secondary Color: ${cfg.secondaryColor ?? 'Not set'}
- Currency: ${cfg.currency ?? 'NGN'}
- Status: ${cfg.status ?? 'draft'}
`;
    }

    // Load current products for context
    let productContext = '';
    try {
      const db = getAdminDb();
      const snap = await db
        .collection('businesses').doc(businessId)
        .collection('storeProducts')
        .where('available', '==', true)
        .limit(20).get();
      if (!snap.empty) {
        const items = snap.docs.map(d => {
          const data = d.data();
          return `${data.displayName ?? 'Unknown'} (₦${data.price ?? 0}, ${data.productType ?? 'physical'})`;
        });
        productContext = `\n\nEXISTING PRODUCTS (${items.length}):\n${items.join('\n')}`;
      }
    } catch { /* non-fatal */ }

    // Load collections
    let collectionContext = '';
    try {
      const db = getAdminDb();
      const snap = await db
        .collection('businesses').doc(businessId)
        .collection('storeCollections')
        .limit(10).get();
      if (!snap.empty) {
        const names = snap.docs.map(d => d.data().title ?? 'Untitled');
        collectionContext = `\n\nEXISTING COLLECTIONS: ${names.join(', ')}`;
      }
    } catch { /* non-fatal */ }

    const fullPrompt = SELL_MO_SYSTEM_PROMPT + storeContext + productContext + collectionContext;

    const raw = await callWithFallback(apiKey, fullPrompt, conversationHistory, message);
    const { answer, storeUpdate, newProduct } = parseActionBlocks(raw);

    // Handle product creation with PDF generation
    let createdProduct: Record<string, unknown> | null = null;
    if (newProduct && businessId) {
      try {
        const db = getAdminDb();
        const storage = getAdminStorage();
        const productData = newProduct as Record<string, unknown>;
        const pdfContent = productData.pdfContent as {
          title: string;
          subtitle?: string;
          chapters: { heading: string; body: string }[];
          author?: string;
        } | undefined;

        let digitalFileUrl: string | null = null;
        let digitalFileName: string | null = null;

        // Generate PDF if pdfContent is provided
        if (pdfContent?.chapters?.length) {
          try {
            const pdfBytes = await generatePdf(
              pdfContent.title,
              pdfContent.subtitle ?? null,
              pdfContent.chapters,
              pdfContent.author ?? (storeConfig?.storeName as string) ?? 'Busmo Merchant',
            );

            const timestamp = Date.now();
            const safeName = (pdfContent.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
            digitalFileName = `${safeName}.pdf`;
            const storagePath = `digitalProducts/${businessId}/${timestamp}_${digitalFileName}`;

            const bucket = storage.bucket();
            const file = bucket.file(storagePath);
            await file.save(pdfBytes, {
              contentType: 'application/pdf',
              metadata: { contentType: 'application/pdf' },
            });

            // Get a signed download URL
            const [signedUrl] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
            });
            digitalFileUrl = signedUrl;
          } catch (pdfErr) {
            console.error('[AskMo] PDF generation/upload failed:', pdfErr instanceof Error ? pdfErr.message : pdfErr);
            // Product will still be created without the PDF file
          }
        }

        // Build product payload
        const payload: Record<string, unknown> = {
          displayName: productData.displayName,
          description: productData.description ?? '',
          price: productData.price,
          productType: 'digital',
          digitalSubtype: productData.digitalSubtype ?? 'ebook',
          category: productData.category ?? 'general',
          tags: productData.tags ?? [],
          images: [],
          collectionIds: [],
          stock: 9999,
          sku: null,
          available: true,
          featured: false,
          digitalFileUrl,
          digitalFileName,
          deliveryNote: null,
          compareAtPrice: null,
          lowStockThreshold: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = await db
          .collection('businesses').doc(businessId)
          .collection('storeProducts')
          .add(payload);

        await docRef.update({ productId: docRef.id });

        createdProduct = { id: docRef.id, ...payload };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          answer: `I created the product details, but there was an error saving it: ${errMsg}. You can try again or create it manually from the Products page.`,
          storeUpdate: null,
          newProduct: null,
          error: errMsg,
        });
      }
    }

    return NextResponse.json({
      answer,
      storeUpdate,
      newProduct: createdProduct,
    });
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
