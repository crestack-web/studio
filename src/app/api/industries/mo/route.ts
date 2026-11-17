import { NextRequest, NextResponse } from 'next/server';
import { getMistralClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/ai/mistral';
import { loadMoBusinessContext, formatMoBusinessContextForPrompt } from '@/lib/ask-mo/business-context';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Industry =
  | 'hospitality'
  | 'healthcare'
  | 'education'
  | 'agriculture'
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
  agriculture: {
    label: 'Agriculture',
    product: 'Busmo Agriculture',
    role: 'farm and agribusiness operations assistant',
    capabilities: [
      'Farms, plots and crop cycles',
      'Field activities and harvest & yield',
      'Inputs, inventory, processing and packaging',
      'Warehouse, sales orders and export files',
      'Equipment, farm team and agribusiness finance',
    ],
    samplePrompts: [
      'How do I log a field activity?',
      'Where do I record a harvest?',
      'How do I track an export file?',
      'How do I set the farm logo?',
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

function offlineReply(industry: Industry, message: string, patient?: any): string {
  const ctx = INDUSTRY_CONTEXT[industry] || INDUSTRY_CONTEXT.business;
  const m = message.toLowerCase();

  if (patient && patient.name) {
    const conditions: string[] = Array.isArray(patient.conditions) ? patient.conditions : [];
    const allergies: string[] = Array.isArray(patient.allergies) ? patient.allergies : [];
    const logs: any[] = Array.isArray(patient.conditionLog) ? patient.conditionLog : [];
    const active = logs.filter((l) => String(l.status) === 'active');
    const latest = [...logs].sort((a, b) => String(b.recorded_at).localeCompare(String(a.recorded_at)))[0];

    if (m.includes('allerg')) {
      return allergies.length
        ? `**${patient.name}** has recorded allergies: ${allergies.join(', ')}. Confirm before prescribing or dispensing.`
        : `No allergies are recorded for **${patient.name}**. Ask the patient to confirm before prescribing.`;
    }
    if (m.includes('condition') || m.includes('diagnos') || m.includes('summary') || m.includes('history') || m.includes('conclusion')) {
      const lines = [
        `**${patient.name}** — ${patient.age ? `${patient.age}y` : 'age not recorded'}${patient.sex ? ` · ${patient.sex}` : ''}${patient.mrn ? ` · ${patient.mrn}` : ''}.`,
        conditions.length ? `Active problems: ${conditions.join(', ')}.` : 'No active problems recorded.',
        allergies.length ? `Allergies: ${allergies.join(', ')}.` : 'No known allergies recorded.',
        latest ? `Latest entry (${String(latest.recorded_at).slice(0, 10)}): ${latest.condition} — ${latest.note || latest.status}.` : '',
        patient.notes ? `Clinical notes: ${patient.notes}` : '',
        active.length ? `Open follow-ups: ${active.map((l) => l.condition).join(', ')}.` : '',
      ].filter(Boolean);
      return `${lines.join('\n\n')}\n\nThis is a summary of recorded data only — confirm with the patient and your own examination before acting.`;
    }
    if (m.includes('follow') || m.includes('next') || m.includes('review') || m.includes('plan')) {
      return active.length
        ? `Suggested focus for **${patient.name}**: ${active
            .map((l) => `${l.condition}${l.severity ? ` (${l.severity})` : ''}`)
            .join(', ')}. Review the latest notes, confirm adherence and book the next follow-up.`
        : `No open conditions flagged for **${patient.name}**. A routine review and preventive screening check would be reasonable.`;
    }
    return `**${patient.name}**: ${conditions.length ? conditions.join(', ') : 'no recorded conditions'}${
      allergies.length ? ` · allergies: ${allergies.join(', ')}` : ''
    }. Ask me for a summary, allergy check, or follow-up plan.`;
  }

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
  if (industry === 'agriculture') {
    if (m.includes('field') || m.includes('activit') || m.includes('plant') || m.includes('spray') || m.includes('irrigat')) {
      return `On **Field activities**, use **Log field activity** to capture the plot, activity type, assignee and due date. The farm workspace shows open jobs by crop stage so the team can work from one list.`;
    }
    if (m.includes('harvest') || m.includes('yield') || m.includes('plot')) {
      return `Open **Harvest & yield** and use **Record harvest** to capture the plot, crop, quantity and grade. MO highlights plots that are ready and compares yield against the season target.`;
    }
    if (m.includes('export') || m.includes('shipment') || m.includes('document')) {
      return `On **Exports**, start an export file with the buyer, destination country, expected ship date and document status. The register keeps phytosanitary and consignment documents visible in one place.`;
    }
    if (m.includes('stock') || m.includes('input') || m.includes('inventor')) {
      return `**Farm inputs** and **Inventory** track seeds, fertiliser, agrochemicals and warehouse stock. Use **Restock inventory** to add a delivery, and MO will flag items below their reorder level.`;
    }
  }

  return `I'm MO for **${ctx.product}** — your ${ctx.role}.\n\nI can help with:\n${ctx.capabilities.map((c) => `• ${c}`).join('\n')}\n\nTry asking:\n${ctx.samplePrompts.map((p) => `• ${p}`).join('\n')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    const industry = (String(body.industry || body.productEdition || 'business').toLowerCase() ||
      'business') as Industry;
    let businessName = String(body.businessName || '').trim();
    let businessId = String(body.businessId || body.business_id || '').trim();
    const patientContext =
      body.patientContext && typeof body.patientContext === 'object' ? body.patientContext : null;

    // Same owner session as Busmo Business Ask MO
    if (!businessId) {
      try {
        const user = await getAuthUser(req);
        if (user) {
          const session = await loadIndustrySession(
            user.id,
            user.user_metadata as Record<string, unknown>,
          );
          if (session?.businessId) businessId = String(session.businessId);
          if (!businessName && session?.businessName) businessName = String(session.businessName);
        }
      } catch {
        /* optional for offline replies */
      }
    }

    let liveBusinessBlock = '';
    if (businessId) {
      try {
        const live = await loadMoBusinessContext(businessId);
        if (live) liveBusinessBlock = formatMoBusinessContextForPrompt(live);
      } catch (e) {
        console.warn('[industries/mo] business context', e);
      }
    }

    const patientBlock = patientContext
      ? `\nPatient in context (the clinician is reviewing this record):
- Name: ${String(patientContext.name || 'Patient')}
- Age / sex: ${patientContext.age ? `${patientContext.age}y` : 'unknown'} / ${patientContext.sex || 'unknown'}
- MRN: ${patientContext.mrn || 'unknown'}
- Blood group: ${patientContext.blood_group || 'unknown'}
- Active conditions: ${Array.isArray(patientContext.conditions) && patientContext.conditions.length ? patientContext.conditions.join(', ') : 'none recorded'}
- Allergies: ${Array.isArray(patientContext.allergies) && patientContext.allergies.length ? patientContext.allergies.join(', ') : 'none recorded'}
- Last visit: ${patientContext.last_visit || 'unknown'}
- Outstanding balance: ${patientContext.balance ?? 0}
- Clinical notes: ${patientContext.notes || 'none'}
- Condition timeline:
${
  Array.isArray(patientContext.conditionLog) && patientContext.conditionLog.length
    ? patientContext.conditionLog
        .slice(0, 12)
        .map(
          (l: any) =>
            `  • ${String(l.recorded_at || '').slice(0, 10)} — ${l.condition} [${l.status}${
              l.severity ? ` · ${l.severity}` : ''
            }]${l.note ? `: ${l.note}` : ''}`,
        )
        .join('\n')
    : '  (no entries yet)'
}
` : '';

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
${patientBlock}

Guidance:
- Be concise, practical, and Nigeria/Africa business aware when relevant (₦, mobile-first).
- Distinguish owner dashboard (control/setup/reports) from the staff live desk (day-to-day ops).
- If asked about Busmo Business retail features (stock SKUs, POS), clarify this is the ${ctx.label} solution unless they switch products.
- Never claim unlimited AI or unbuilt hospital/lab systems.
- Use short paragraphs or bullets.
${liveBusinessBlock ? `\n${liveBusinessBlock}\nWhen answering about this organisation's performance, use the live numbers above. Prefer ${ctx.label} solution workflows (rooms, patients, projects, students, staff desks) over retail POS language unless the user asks about the linked Busmo Business catalog.` : ''}
${patientContext ? '- Ground every patient answer strictly in the patient record above. Do not invent test results, vitals or diagnoses.\n- You support clinical judgement; never give a definitive diagnosis or prescribe. Flag red flags and recommend the clinician confirm.' : ''}`;

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
      reply: offlineReply(safeIndustry, message, patientContext),
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
