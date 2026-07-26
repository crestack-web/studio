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
3. EDIT DIGITAL PRODUCTS — modify any product you previously created (change title, chapters, price, description, add/remove sections)
4. GENERAL HELP — product descriptions, collection ideas, pricing advice, marketing tips

HOW TO RESPOND:
- Keep responses short and conversational (2-4 sentences max)
- When the user asks to change something, confirm what you're changing and return the storeUpdate
- When the user wants to create a product, gather the key details (name, price, type) then return the newProduct
- When the user wants to tweak/edit a product they already created, return the edit_product block with ALL the updated content
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
  "description": "Compelling product description (2-3 sentences that sell the value)",
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
      {
        "heading": "Chapter Title",
        "body": "Full chapter content with multiple paragraphs. Use line breaks between paragraphs. Include actionable steps, real examples, and detailed explanations. Each chapter must be 500-1000 words with practical value."
      }
    ],
    "author": "Store Name or Author Name"
  }
}
\`\`\`

When the user wants to EDIT/UPDATE an existing product, append this at the END of your message:

\`\`\`edit_product
{
  "productId": "the-product-id-from-the-preview",
  "displayName": "Updated Product Name or null to keep current",
  "description": "Updated description or null to keep current",
  "price": 5000 or null to keep current,
  "category": "updated-category or null to keep current",
  "tags": ["updated", "tags"] or null to keep current,
  "pdfContent": {
    "title": "Updated PDF Title",
    "subtitle": "Updated subtitle",
    "chapters": [
      {
        "heading": "Chapter Title",
        "body": "FULL updated chapter content. Include the entire chapter text, not just the changes."
      }
    ],
    "author": "Author Name"
  }
}
\`\`\`

RULES FOR new_product:
- price must be a positive number (no currency symbol)
- digitalSubtype must be one of: ebook, template, course, ticket
- pdfContent is REQUIRED for digital products — this is the actual product the customer pays for
- Generate 5-8 chapters of SUBSTANTIAL, SELLABLE content
- Each chapter MUST be 500-1000 words — real educational value, not surface-level fluff
- Every chapter MUST include: actionable steps, real-world examples, specific tips, and practical advice
- Use line breaks (\\n) to separate paragraphs within each chapter body
- The content should feel like a premium paid product — the reader should get real value
- Include specific numbers, frameworks, checklists, and actionable takeaways
- tags should be 2-5 relevant search terms
- description should be compelling marketing copy, not just "An ebook about X"

CONTENT QUALITY RULES FOR EBOOKS:
- Chapter 1 should be an introduction with context and why this matters
- Middle chapters should teach specific skills/methods with step-by-step instructions
- Include bullet points, numbered lists, and frameworks (use \\n for line breaks)
- Include real examples relevant to the African/Nigerian market where applicable
- Final chapter should be a summary with action items and next steps
- Write as if charging ₦5,000+ for this content — it must deliver real value

RULES FOR edit_product:
- Always include the productId of the product being edited
- Set fields to null if the user doesn't want to change them
- If editing pdfContent, include the COMPLETE updated pdfContent with ALL chapters
- After editing, the PDF will be regenerated automatically

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
          maxOutputTokens: 8192,
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

// ── Enhanced PDF Generation ─────────────────────────────────────────────────

const ACCENT = rgb(0.39, 0.4, 0.95);   // #6366F1
const DARK = rgb(0.1, 0.1, 0.1);
const BODY_COLOR = rgb(0.15, 0.15, 0.15);
const MUTED = rgb(0.45, 0.45, 0.45);
const LIGHT_LINE = rgb(0.85, 0.85, 0.85);

async function generatePdf(
  title: string,
  subtitle: string | null,
  chapters: { heading: string; body: string }[],
  author: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 72;
  const LINE_H = 16;
  const CW = PAGE_W - 2 * MARGIN;
  let pageNum = 0;

  function addPage() {
    pageNum++;
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    // Page number (skip cover)
    if (pageNum > 1) {
      p.drawText(String(pageNum), {
        x: PAGE_W / 2 - 5,
        y: 36,
        size: 10,
        font,
        color: MUTED,
      });
      // Top accent line
      p.drawLine({ start: { x: MARGIN, y: PAGE_H - 50 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 50 }, thickness: 1, color: LIGHT_LINE });
    }
    return p;
  }

  function wrap(text: string, size: number, maxW: number, useFont = font): string[] {
    const lines: string[] = [];
    for (const rawLine of text.split('\n')) {
      if (rawLine.trim() === '') { lines.push(''); continue; }
      const words = rawLine.split(' ');
      let cur = '';
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (useFont.widthOfTextAtSize(test, size) > maxW && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      }
      if (cur) lines.push(cur);
    }
    return lines;
  }

  function drawBullets(body: string, startY: number, useFont: typeof font, size: number, maxW: number): number {
    let y = startY;
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { y -= size * 0.4; continue; }
      const isBullet = /^[-•*]\s/.test(trimmed);
      const isNumbered = /^\d+[.)]\s/.test(trimmed);
      const isSubHeading = /^#{1,3}\s/.test(trimmed);

      let displayText = trimmed;
      let indent = 0;
      let lineFont = font;
      let lineSize = size;
      let lineColor = BODY_COLOR;

      if (isSubHeading) {
        displayText = trimmed.replace(/^#{1,3}\s/, '');
        lineFont = boldFont;
        lineSize = size + 2;
        lineColor = DARK;
        y -= 4;
      } else if (isBullet) {
        displayText = '  \u2022  ' + trimmed.replace(/^[-•*]\s/, '');
        indent = 12;
      } else if (isNumbered) {
        displayText = '  ' + trimmed;
        indent = 12;
      }

      const wrappedLines = wrap(displayText, lineSize, maxW - indent, lineFont);
      for (const wl of wrappedLines) {
        if (y < MARGIN + 40) {
          return y; // signal page break needed
        }
        page.drawText(wl, {
          x: MARGIN + indent,
          y,
          size: lineSize,
          color: lineColor,
          maxWidth: maxW - indent,
        });
        y -= lineSize + 4;
      }
      y += 2;
    }
    return y;
  }

  // ── Cover page ──
  let page = addPage();

  // Accent bar at top
  page.drawRectangle({
    x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8,
    color: ACCENT,
  });

  // Large accent circle decoration
  page.drawCircle({
    x: PAGE_W - 100, y: PAGE_H - 200, size: 80,
    color: rgb(0.93, 0.93, 1),
  });

  let y = PAGE_H / 2 + 80;

  // Title
  const titleLines = wrap(title, 36, CW, boldFont);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 36, font: boldFont, color: DARK, maxWidth: CW });
    y -= 44;
  }

  if (subtitle) {
    y -= 10;
    const subLines = wrap(subtitle, 16, CW, italicFont);
    for (const line of subLines) {
      page.drawText(line, { x: MARGIN, y, size: 16, font: italicFont, color: MUTED, maxWidth: CW });
      y -= 22;
    }
  }

  // Divider line
  y -= 20;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + 60, y },
    thickness: 3, color: ACCENT,
  });

  y -= 30;
  page.drawText(author, { x: MARGIN, y, size: 14, font, color: MUTED });

  y -= 20;
  const chapterCount = chapters.length;
  const wordEst = chapters.reduce((sum, ch) => sum + ch.body.split(/\s+/).length, 0);
  page.drawText(`${chapterCount} chapters  \u2022  ${wordEst.toLocaleString()}+ words  \u2022  Actionable guide`, {
    x: MARGIN, y, size: 11, font: italicFont, color: MUTED,
  });

  y -= 60;
  page.drawText('Powered by Busmo \u2014 Africa\u2019s Business Operating System', {
    x: MARGIN, y, size: 9, font, color: rgb(0.7, 0.7, 0.7),
  });

  // ── Table of Contents ──
  page = addPage();
  y = PAGE_H - MARGIN - 20;

  page.drawText('Table of Contents', {
    x: MARGIN, y, size: 22, font: boldFont, color: DARK,
  });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
    thickness: 1.5, color: ACCENT,
  });
  y -= 24;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const num = `0${i + 1}`.slice(-2);
    page.drawText(`${num}`, {
      x: MARGIN, y, size: 14, font: boldFont, color: ACCENT,
    });
    const chLines = wrap(ch.heading, 13, CW - 50);
    for (const line of chLines) {
      page.drawText(line, {
        x: MARGIN + 36, y, size: 13, font: boldFont, color: DARK, maxWidth: CW - 50,
      });
      y -= 18;
    }
    y += 4;
    // Dotted line effect
    page.drawLine({
      start: { x: MARGIN + 36, y: y + 10 }, end: { x: PAGE_W - MARGIN, y: y + 10 },
      thickness: 0.5, color: LIGHT_LINE,
    });
    y -= 8;
  }

  // ── Chapters ──
  for (let ci = 0; ci < chapters.length; ci++) {
    const chapter = chapters[ci];
    page = addPage();
    y = PAGE_H - MARGIN - 20;

    // Chapter number accent
    page.drawText(`CHAPTER ${ci + 1}`, {
      x: MARGIN, y, size: 11, font: boldFont, color: ACCENT,
    });
    y -= 18;

    // Chapter heading
    const headLines = wrap(chapter.heading, 22, CW, boldFont);
    for (const line of headLines) {
      page.drawText(line, {
        x: MARGIN, y, size: 22, font: boldFont, color: DARK, maxWidth: CW,
      });
      y -= 30;
    }

    // Divider
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y }, end: { x: MARGIN + 40, y },
      thickness: 2, color: ACCENT,
    });
    y -= 16;

    // Body content with smart formatting
    const bodyLines = chapter.body.split('\n');
    for (const line of bodyLines) {
      const trimmed = line.trim();
      if (!trimmed) { y -= 8; continue; }

      const isBullet = /^[-\u2022*]\s/.test(trimmed);
      const isNumbered = /^\d+[.)]\s/.test(trimmed);
      const isSubHead = /^#{1,3}\s/.test(trimmed);

      let displayText = trimmed;
      let indent = 0;
      let lineFont = font;
      let lineSize = 12;
      let lineColor = BODY_COLOR;

      if (isSubHead) {
        displayText = trimmed.replace(/^#{1,3}\s/, '');
        lineFont = boldFont;
        lineSize = 14;
        lineColor = DARK;
        y -= 6;
      } else if (isBullet) {
        displayText = '\u2022  ' + trimmed.replace(/^[-\u2022*]\s/, '');
        indent = 10;
      } else if (isNumbered) {
        displayText = trimmed;
        indent = 10;
      }

      const wLines = wrap(displayText, lineSize, CW - indent, lineFont);
      for (const wl of wLines) {
        if (y < MARGIN + 40) {
          page = addPage();
          y = PAGE_H - MARGIN - 20;
        }
        page.drawText(wl, {
          x: MARGIN + indent,
          y,
          size: lineSize,
          color: lineColor,
          maxWidth: CW - indent,
        });
        y -= lineSize + 4;
      }
      y += 2;
    }
  }

  // ── Final page: About Busmo ──
  page = addPage();
  y = PAGE_H / 2 + 40;
  page.drawText('Thank you for reading!', {
    x: MARGIN, y, size: 24, font: boldFont, color: DARK, maxWidth: CW,
  });
  y -= 30;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + 60, y },
    thickness: 3, color: ACCENT,
  });
  y -= 30;
  const thanksLines = wrap(
    'This guide was created with Busmo \u2014 Africa\u2019s business operating system. Busmo helps merchants manage their stores, create digital products, and grow their business online.',
    12, CW
  );
  for (const line of thanksLines) {
    page.drawText(line, { x: MARGIN, y, size: 12, font, color: MUTED, maxWidth: CW });
    y -= 18;
  }
  y -= 16;
  page.drawText('Start your store today at busmo.app', {
    x: MARGIN, y, size: 12, font: boldFont, color: ACCENT,
  });

  return pdfDoc.save();
}

// ── Action Block Parser ──────────────────────────────────────────────────────

function parseActionBlocks(raw: string): {
  answer: string;
  storeUpdate: Record<string, unknown> | null;
  newProduct: Record<string, unknown> | null;
  editProduct: Record<string, unknown> | null;
} {
  let storeUpdate: Record<string, unknown> | null = null;
  let newProduct: Record<string, unknown> | null = null;
  let editProduct: Record<string, unknown> | null = null;

  const storeMatch = raw.match(/```store_update\n([\s\S]+?)\n```/);
  if (storeMatch) {
    try { storeUpdate = JSON.parse(storeMatch[1]); }
    catch (e) { console.error('[AskMo] Malformed store_update:', e instanceof Error ? e.message : ''); }
  }

  const productMatch = raw.match(/```new_product\n([\s\S]+?)\n```/);
  if (productMatch) {
    try { newProduct = JSON.parse(productMatch[1]); }
    catch (e) {
      console.error('[AskMo] Malformed new_product:', e instanceof Error ? e.message : '');
      console.error('[AskMo] Raw:', productMatch[1].slice(0, 500));
    }
  }

  const editMatch = raw.match(/```edit_product\n([\s\S]+?)\n```/);
  if (editMatch) {
    try { editProduct = JSON.parse(editMatch[1]); }
    catch (e) {
      console.error('[AskMo] Malformed edit_product:', e instanceof Error ? e.message : '');
    }
  }

  const answer = raw
    .replace(/```store_update[\s\S]+?```/g, '')
    .replace(/```new_product[\s\S]+?```/g, '')
    .replace(/```edit_product[\s\S]+?```/g, '')
    .trim();

  return { answer, storeUpdate, newProduct, editProduct };
}

// ── Helper: generate + upload PDF ────────────────────────────────────────────

async function generateAndUploadPdf(
  businessId: string,
  pdfContent: { title: string; subtitle?: string; chapters: { heading: string; body: string }[]; author?: string },
  storeConfig: Record<string, unknown> | null,
): Promise<{ url: string; fileName: string } | null> {
  try {
    const storage = getAdminStorage();
    const pdfBytes = await generatePdf(
      pdfContent.title,
      pdfContent.subtitle ?? null,
      pdfContent.chapters,
      pdfContent.author ?? (storeConfig?.storeName as string) ?? 'Busmo Merchant',
    );
    const ts = Date.now();
    const safeName = (pdfContent.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    const fileName = `${safeName}.pdf`;
    const storagePath = `digitalProducts/${businessId}/${ts}_${fileName}`;
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    await file.save(pdfBytes, { contentType: 'application/pdf', metadata: { contentType: 'application/pdf' } });
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 365 * 24 * 60 * 60 * 1000 });
    return { url: signedUrl, fileName };
  } catch (e) {
    console.error('[AskMo] PDF generation failed:', e instanceof Error ? e.message : '');
    return null;
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

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

    // Load current products for context (include pdfContent for editing)
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
          const hasPdf = data.pdfContent ? ' [HAS PDF CONTENT - can be edited]' : '';
          return `${data.displayName ?? 'Unknown'} (ID: ${d.id}, ₦${data.price ?? 0}, ${data.productType ?? 'physical'})${hasPdf}`;
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
    const { answer, storeUpdate, newProduct, editProduct } = parseActionBlocks(raw);

    // ── Handle new product creation ──
    let createdProduct: Record<string, unknown> | null = null;
    if (newProduct && businessId) {
      try {
        const db = getAdminDb();
        const productData = newProduct as Record<string, unknown>;
        const pdfContent = productData.pdfContent as {
          title: string;
          subtitle?: string;
          chapters: { heading: string; body: string }[];
          author?: string;
        } | undefined;

        let digitalFileUrl: string | null = null;
        let digitalFileName: string | null = null;

        if (pdfContent?.chapters?.length) {
          const uploaded = await generateAndUploadPdf(businessId, pdfContent, storeConfig);
          if (uploaded) { digitalFileUrl = uploaded.url; digitalFileName = uploaded.fileName; }
        }

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
          pdfContent: pdfContent ?? null, // Store for future editing
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
          editProduct: null,
          error: errMsg,
        });
      }
    }

    // ── Handle product editing ──
    let editedProduct: Record<string, unknown> | null = null;
    if (editProduct && businessId) {
      try {
        const db = getAdminDb();
        const editData = editProduct as Record<string, unknown>;
        const productId = editData.productId as string;

        if (!productId) {
          return NextResponse.json({
            answer: 'I need the product ID to edit it. Could you tell me which product you want to change?',
            storeUpdate: null,
            newProduct: null,
            editProduct: null,
          });
        }

        const productRef = db
          .collection('businesses').doc(businessId)
          .collection('storeProducts').doc(productId);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
          return NextResponse.json({
            answer: `Product not found (ID: ${productId}). It may have been deleted.`,
            storeUpdate: null,
            newProduct: null,
            editProduct: null,
          });
        }

        const existing = productSnap.data()!;
        const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

        // Merge simple fields
        if (editData.displayName) updates.displayName = editData.displayName;
        if (editData.description) updates.description = editData.description;
        if (editData.price) updates.price = editData.price;
        if (editData.category) updates.category = editData.category;
        if (editData.tags) updates.tags = editData.tags;

        // Regenerate PDF if pdfContent provided
        const newPdfContent = editData.pdfContent as {
          title: string;
          subtitle?: string;
          chapters: { heading: string; body: string }[];
          author?: string;
        } | undefined;

        if (newPdfContent?.chapters?.length) {
          updates.pdfContent = newPdfContent;
          const uploaded = await generateAndUploadPdf(businessId, newPdfContent, storeConfig);
          if (uploaded) {
            updates.digitalFileUrl = uploaded.url;
            updates.digitalFileName = uploaded.fileName;
          }
        }

        await productRef.update(updates);
        const updatedSnap = await productRef.get();
        editedProduct = { id: productId, ...updatedSnap.data() };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          answer: `There was an error updating the product: ${errMsg}. Please try again.`,
          storeUpdate: null,
          newProduct: null,
          editProduct: null,
          error: errMsg,
        });
      }
    }

    return NextResponse.json({
      answer,
      storeUpdate,
      newProduct: createdProduct,
      editProduct: editedProduct,
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
