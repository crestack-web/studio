/**
 * MO WhatsApp Sales Agent V1 — grounded product answers via Mistral.
 * Server-only. Does not place orders or claim payments.
 */
import 'server-only';
import { getMistralClient, DEFAULT_MODEL } from '@/ai/mistral';
import {
  getBusinessProductContext,
  searchProducts,
} from '@/lib/services/whatsapp/product-search';
import { getBusinessProfile } from '@/lib/services/whatsapp/conversation-store';

export type SalesHistoryMessage = { role: 'user' | 'assistant'; content: string };

const SALES_SYSTEM = `You are MO, a friendly WhatsApp sales assistant for a real Nigerian/African business on Busmo.

PERSONALITY:
- Warm, natural, concise (WhatsApp style — short paragraphs, not essays)
- Helpful salesperson: ask size/colour/location follow-ups when useful
- Persuasive without pressure; never lie
- Understand Nigerian English / Pidgin lightly when the customer uses it

HARD RULES (anti-hallucination):
- ONLY use product names, prices, and stock from the PRODUCT CATALOG provided below.
- If a product is not in the catalog, say you do not currently list it — do NOT invent it.
- Never invent prices, stock counts, discounts, delivery fees, or order/payment status.
- Never claim an order was placed or payment received (those features are not enabled yet).
- If the customer wants to buy, collect interest (size, quantity, delivery area) and say a team member can complete the order — do not invent order IDs.

GOAL: Help the customer find the right product and move toward a sale using real catalog data.`;

export async function generateSalesReply(params: {
  businessId: string;
  customerMessage: string;
  history: SalesHistoryMessage[];
}): Promise<string> {
  const { businessId, customerMessage, history } = params;

  console.log(
    JSON.stringify({
      event: 'mo_started',
      businessId,
      messageLen: customerMessage.length,
      historyLen: history.length,
    })
  );

  const [profile, catalog, searchHits] = await Promise.all([
    getBusinessProfile(businessId),
    getBusinessProductContext(businessId, 40),
    searchProducts(businessId, customerMessage, { limit: 6 }),
  ]);

  const searchBlock =
    searchHits.length > 0
      ? `SEARCH HITS for the latest message:\n${searchHits
          .map(
            (h) =>
              `- ${h.name}: ${profile.currency} ${h.price} | ${h.availability} (stock=${h.stock_level})`
          )
          .join('\n')}`
      : 'SEARCH HITS: none matched the query terms (still use full catalog if relevant).';

  const system = [
    SALES_SYSTEM,
    '',
    `BUSINESS: ${profile.name}`,
    profile.description ? `About: ${profile.description}` : '',
    profile.location ? `Location: ${profile.location}` : '',
    profile.category ? `Category: ${profile.category}` : '',
    `Currency: ${profile.currency}`,
    '',
    catalog,
    '',
    searchBlock,
  ]
    .filter(Boolean)
    .join('\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: system },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: customerMessage },
  ];

  if (!process.env.MISTRAL_API_KEY) {
    console.error(JSON.stringify({ event: 'mo_completed', error: 'MISTRAL_API_KEY missing' }));
    return 'Thanks for your message. Our sales assistant is temporarily unavailable — please try again shortly.';
  }

  try {
    const mistral = getMistralClient();
    const result = await mistral.chat.complete({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.4,
      maxTokens: 400,
    });

    const content = result.choices?.[0]?.message?.content;
    const text =
      typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map((p: any) => (p?.type === 'text' ? p.text : '')).join('')
          : '';

    const reply = (text || '').trim() || 'Thanks for your message — how can I help you today?';
    console.log(
      JSON.stringify({
        event: 'mo_completed',
        businessId,
        replyLen: reply.length,
      })
    );
    return reply.slice(0, 3500);
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'mo_completed',
        error: e?.message || 'mo failed',
      })
    );
    return 'Sorry, I had trouble answering just now. Please send your question again in a moment.';
  }
}
