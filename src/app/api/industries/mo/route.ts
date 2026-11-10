import { NextRequest, NextResponse } from 'next/server';
import { getMistralClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/ai/mistral';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Industry =
  | 'hospitality'
  | 'healthcare'
  | 'education'
  | 'professional'
  | 'business';

const INDUSTRY_CONTEXT: Record<
  Industry,
  { label: string; product: string; role: string; capabilities: string[]; samplePrompts: string[] }
> = {
  hospitality: {
    label: 'Hospitality',
    product: 'Busmo Hospitality',
    role: 'hotel and property operations assistant',
    capabilities: [
      'Rooms, reservations, check-in/out',
      'Front desk occupancy and housekeeping status',
      'Guests, billing and occupancy reports',
      'Owner overview vs staff front desk',
    ],
    samplePrompts: [
      'How do I check in a guest?',
      'What does occupancy rate mean here?',
      'Where do staff work day to day?',
      'How do I set the hotel logo?',
    ],
  },
  healthcare: {
    label: 'Healthcare',
    product: 'Busmo Healthcare',
    role: 'clinic reception and operations assistant',
    capabilities: [
      'Patients and appointments',
      'Reception queue and walk-in check-in',
      'Visits and basic clinic billing',
      'Owner dashboard vs reception desk',
    ],
    samplePrompts: [
      'How do I check in a walk-in patient?',
      'What is on the reception desk?',
      'How do I add clinic branding?',
      'Explain appointments today vs waiting',
    ],
  },
  education: {
    label: 'Education',
    product: 'Busmo Education',
    role: 'school front-office assistant',
    capabilities: [
      'Students and classes',
      'Fee collection and receipts',
      'Front office desk for staff',
      'Enrollment-based pricing context',
    ],
    samplePrompts: [
      'How do I record a fee payment?',
      'Where do staff collect fees?',
      'How is pricing based on students?',
      'How do I set the school logo?',
    ],
  },
  professional: {
    label: 'Professional',
    product: 'Busmo Professional',
    role: 'project firm and agency operations assistant',
    capabilities: [
      'Clients, projects and tasks',
      'Staff workspace for open work',
      'Time, billing and team collaboration (as modules grow)',
      'Owner console vs staff workspace',
    ],
    samplePrompts: [
      'How do I add a task for staff?',
      'What is the staff workspace for?',
      'How do seats work on Professional plans?',
      'Where do I set firm branding?',
    ],
  },
  business: {
    label: 'Business',
    product: 'Busmo Business',
    role: 'SME business operations assistant',
    capabilities: [
      'Sales, stock, expenses and cash',
      'Staff portal and Ask MO',
      'Reports and profit control',
    ],
    samplePrompts: [
      'How do I record a sale?',
      'How does inventory work?',
      'Explain Busmo plans',
    ],
  },
};

function offlineReply(industry: Industry, message: string): string {
  const ctx = INDUSTRY_CONTEXT[industry] || INDUSTRY_CONTEXT.business;
  const m = message.toLowerCase();

  if (m.includes('logo') || m.includes('brand')) {
    return `In ${ctx.product}, open **Owner overview → Settings / Branding**. Set the display name and logo URL. The staff desk (${ctx.label.toLowerCase()} live desk) shows that branding immediately.`;
  }
  if (m.includes('staff') || m.includes('desk') || m.includes('reception') || m.includes('front office') || m.includes('workspace')) {
    return `${ctx.product} separates **owner console** (setup, reports, modules) from the **staff live desk** for day-to-day work.\n\nCapabilities on this desk: ${ctx.capabilities.map((c) => `• ${c}`).join('\n')}\n\nOpen the desk from the purple launch card in the owner sidebar.`;
  }
  if (m.includes('price') || m.includes('plan') || m.includes('cost')) {
    return `${ctx.product} uses industry-specific pricing (not one generic SME plan). See **/pricing** and the pricing section on the ${ctx.label} welcome page. Annual plans are roughly 2 months free versus monthly.`;
  }
  if (m.includes('check in') || m.includes('check-in') || m.includes('walk-in')) {
    if (industry === 'hospitality') {
      return `On the **Front desk**, open a confirmed booking and tap **Check in**, or update a room card to occupied. Owners add rooms under **Rooms** first.`;
    }
    if (industry === 'healthcare') {
      return `On **Reception**, type the walk-in patient name and tap **Check in**, or use Check in on a scheduled appointment in today’s queue.`;
    }
  }
  if (m.includes('fee') && industry === 'education') {
    return `On the **Front office** desk, enter the student name and amount, then **Record fee**. Today’s receipts appear in the fee list. Owners manage overall students from the education dashboard.`;
  }
  if (m.includes('task') && industry === 'professional') {
    return `On the **Staff workspace**, type a task title and **Add task**. Staff can mark work **Start** or **Done**. Owners still use the professional dashboard for broader client/project control.`;
  }

  return `I'm MO for **${ctx.product}** — your ${ctx.role}.\n\nI can help with:\n${ctx.capabilities.map((c) => `• ${c}`).join('\n')}\n\nTry asking:\n${ctx.samplePrompts.map((p) => `• ${p}`).join('\n')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    const industry = (String(body.industry || body.productEdition || 'business').toLowerCase() ||
      'business') as Industry;
    const businessName = String(body.businessName || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const safeIndustry: Industry = INDUSTRY_CONTEXT[industry] ? industry : 'business';
    const ctx = INDUSTRY_CONTEXT[safeIndustry];

    const system = `You are MO, Busmo's AI assistant embedded in ${ctx.product} (${ctx.label}).
You help owners and staff run ${ctx.label.toLowerCase()} operations on Busmo.
Product: ${ctx.product}
${businessName ? `Organization name: ${businessName}` : ''}
Your role: ${ctx.role}

Product capabilities (stay within these — do not invent clinical EMRs, channel managers, or features that are not listed):
${ctx.capabilities.map((c) => `- ${c}`).join('\n')}

Guidance:
- Be concise, practical, and Nigeria/Africa business aware when relevant (₦, mobile-first).
- Distinguish owner dashboard (control/setup/reports) from the staff live desk (day-to-day ops).
- If asked about Busmo Business retail features (stock SKUs, POS), clarify this is the ${ctx.label} solution unless they switch products.
- Never claim unlimited AI or unbuilt hospital/lab systems.
- Use short paragraphs or bullets.`;

    // Prefer Mistral when configured
    if (process.env.MISTRAL_API_KEY) {
      const mistral = getMistralClient();
      const models = [DEFAULT_MODEL, ...FALLBACK_MODELS];
      let lastErr: unknown = null;
      for (const model of models) {
        try {
          const result = await mistral.chat.complete({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: message },
            ],
            temperature: 0.4,
            maxTokens: 600,
          });
          const content =
            (result as any)?.choices?.[0]?.message?.content ||
            (result as any)?.choices?.[0]?.message?.content?.[0]?.text ||
            '';
          const text = typeof content === 'string' ? content : Array.isArray(content)
            ? content.map((c: any) => c.text || c).join('')
            : '';
          if (text.trim()) {
            return NextResponse.json({
              ok: true,
              reply: text.trim(),
              industry: safeIndustry,
              source: 'mistral',
            });
          }
        } catch (e) {
          lastErr = e;
        }
      }
      console.error('[industries/mo] mistral failed', lastErr);
    }

    return NextResponse.json({
      ok: true,
      reply: offlineReply(safeIndustry, message),
      industry: safeIndustry,
      source: 'offline',
    });
  } catch (err: any) {
    console.error('[industries/mo]', err);
    return NextResponse.json(
      { error: err?.message || 'MO failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const industry = (req.nextUrl.searchParams.get('industry') || 'business') as Industry;
  const ctx = INDUSTRY_CONTEXT[industry] || INDUSTRY_CONTEXT.business;
  return NextResponse.json({
    ok: true,
    industry,
    product: ctx.product,
    label: ctx.label,
    samplePrompts: ctx.samplePrompts,
    capabilities: ctx.capabilities,
  });
}
