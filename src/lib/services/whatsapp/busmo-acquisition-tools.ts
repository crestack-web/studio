/**
 * Phase 5B — Acquisition-only tools for Busmo Acquisition MO.
 *
 * Hard boundaries:
 * - No merchant business / product / inventory / sales access
 * - No mo_credit_wallets / ensureTrialCredits / deductForMoResponse
 * - Pricing from canonical src/lib/pricing.ts only
 * - Signup URLs constructed server-side with trusted attribution
 * - Lead updates scoped to the current request lead id
 */

import 'server-only';
import { BUSMO_PLANS, formatNaira, type BusmoPlan } from '@/lib/pricing';
import {
  updateLead,
  type BusmoLead,
  type LeadStage,
  MO_WRITABLE_STAGES,
} from '@/lib/services/whatsapp/busmo-lead-store';
import {
  setConversationAgentStatus,
  type AgentStatus,
} from '@/lib/services/whatsapp/conversation-store';

/** Tool context bound to the current platform conversation — never merchant. */
export type AcquisitionToolContext = {
  lead: BusmoLead;
  conversationId: string;
  connectionId: string;
  customerPhone: string;
  /** App origin for signup links, e.g. https://app.busmo.ng */
  appOrigin: string;
};

export type ToolResult = {
  ok: boolean;
  name: string;
  result: unknown;
  error?: string;
};

function safeString(v: unknown, max = 500): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

/**
 * get_busmo_pricing — reads canonical BUSMO_PLANS (never hardcode in prompt).
 */
export function getBusmoPricing(): ToolResult {
  try {
    const plans = (BUSMO_PLANS as BusmoPlan[]).map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      monthlyPriceLabel: formatNaira(p.monthlyPrice),
      yearlyPrice: p.yearlyPrice,
      yearlyPriceLabel: formatNaira(p.yearlyPrice),
      currency: 'NGN',
      popular: Boolean(p.popular),
      features: Array.isArray(p.features) ? p.features.slice(0, 12) : [],
      cta: p.cta,
    }));
    return {
      ok: true,
      name: 'get_busmo_pricing',
      result: {
        plans,
        note: 'Prices are monthly in NGN. Yearly prices give 2 months free equivalent. Always allow the customer to choose. Do not invent discounts.',
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      name: 'get_busmo_pricing',
      result: null,
      error: e?.message || 'pricing_unavailable',
    };
  }
}

/**
 * recommend_busmo_plan — heuristic recommendation from stated needs.
 * Never forces a plan; explains why and lets the customer decide.
 */
export function recommendBusmoPlan(args: {
  businessSize?: string | null;
  complexity?: string | null;
  needs?: string | null;
  staffCount?: string | number | null;
  multiLocation?: boolean | null;
}): ToolResult {
  try {
    const plans = BUSMO_PLANS as BusmoPlan[];
    if (!plans.length) {
      return {
        ok: false,
        name: 'recommend_busmo_plan',
        result: null,
        error: 'no_plans_configured',
      };
    }

    const size = String(args.businessSize || args.complexity || '').toLowerCase();
    const needs = String(args.needs || '').toLowerCase();
    const staff =
      typeof args.staffCount === 'number'
        ? args.staffCount
        : parseInt(String(args.staffCount || '0'), 10) || 0;
    const multi = Boolean(args.multiLocation);

    const ordered = [...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    let idx = 0;
    const complexSignals =
      multi ||
      staff >= 5 ||
      /warehouse|multi.?store|multi.?shop|franchise|several|branches|payroll|production|manufacturing/i.test(
        `${size} ${needs}`
      );
    const midSignals =
      staff >= 2 ||
      /inventory|stock|credit|profit|cash.?flow|bank|reconcil|two shop|2 shop|staff/i.test(
        `${size} ${needs}`
      );

    if (complexSignals && ordered.length >= 3) idx = ordered.length - 1;
    else if (midSignals && ordered.length >= 2) idx = Math.min(1, ordered.length - 1);
    else idx = 0;

    const recommended = ordered[idx];
    const reasons: string[] = [];
    if (multi) reasons.push('multiple locations / shops');
    if (staff >= 5) reasons.push('larger staff team');
    else if (staff >= 2) reasons.push('small team to keep accountable');
    if (/profit|cogs|margin/i.test(needs)) reasons.push('need clear profit visibility');
    if (/inventory|stock/i.test(needs)) reasons.push('need stock tracking');
    if (/credit/i.test(needs)) reasons.push('credit sales / supplier tracking');
    if (/cash.?flow|bank|reconcil/i.test(needs)) reasons.push('cash-flow / bank control');
    if (!reasons.length) reasons.push('fits a straightforward operation without overpaying');

    return {
      ok: true,
      name: 'recommend_busmo_plan',
      result: {
        recommendedPlanId: recommended.id,
        recommendedPlanName: recommended.name,
        monthlyPrice: recommended.monthlyPrice,
        monthlyPriceLabel: formatNaira(recommended.monthlyPrice),
        currency: 'NGN',
        reasons,
        alternativePlans: ordered
          .filter((_, i) => i !== idx)
          .map((p) => ({
            id: p.id,
            name: p.name,
            monthlyPrice: p.monthlyPrice,
            monthlyPriceLabel: formatNaira(p.monthlyPrice),
          })),
        disclaimer:
          'This is a suggestion based on what you shared. You can choose any plan.',
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      name: 'recommend_busmo_plan',
      result: null,
      error: e?.message || 'recommend_failed',
    };
  }
}

/**
 * create_signup_link — server-constructed URL with trusted attribution.
 * Never trusts model-supplied arbitrary URLs or lead ids from the customer.
 */
export function createSignupLink(ctx: AcquisitionToolContext): ToolResult {
  try {
    const origin = (ctx.appOrigin || process.env.NEXT_PUBLIC_APP_URL || '')
      .replace(/\/$/, '');
    if (!origin) {
      return {
        ok: false,
        name: 'create_signup_link',
        result: null,
        error: 'app_origin_not_configured',
      };
    }

    // Real route: /welcome/signup
    // Today the signup page only consumes: trial, ref (referral code), google=callback.
    // source/lead/connection are NOT yet read by signup — Phase 6 lifecycle must
    // wire busmo_leads attribution. We still attach them for forward compatibility.
    const params = new URLSearchParams({
      source: 'whatsapp',
      lead: ctx.lead.id,
      connection: ctx.connectionId,
    });
    if (ctx.lead.campaign) {
      params.set('campaign', ctx.lead.campaign);
    }
    if (ctx.lead.recommended_plan) {
      params.set('plan', ctx.lead.recommended_plan);
    }

    const url = `${origin}/welcome/signup?${params.toString()}`;

    console.log(
      JSON.stringify({
        event: 'acquisition_signup_link_created',
        leadId: ctx.lead.id,
        connectionId: ctx.connectionId,
        conversationId: ctx.conversationId,
        hasCampaign: Boolean(ctx.lead.campaign),
        hasPlan: Boolean(ctx.lead.recommended_plan),
        attributionNote:
          'params attached for Phase 6; signup page does not yet persist lead/source',
      })
    );

    return {
      ok: true,
      name: 'create_signup_link',
      result: {
        url,
        leadId: ctx.lead.id,
        attributionStatus: 'link_params_only',
        note:
          'Share this link with the customer. Source=whatsapp and lead id are on the URL for future attribution; signup currently does not consume them (Phase 6).',
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      name: 'create_signup_link',
      result: null,
      error: e?.message || 'signup_link_failed',
    };
  }
}

/**
 * update_lead — scoped to current lead only.
 */
export async function toolUpdateLead(
  ctx: AcquisitionToolContext,
  args: {
    name?: string;
    business_name?: string;
    business_type?: string;
    needs?: string;
    pain_points?: string;
    recommended_plan?: string;
    stage?: string;
  }
): Promise<ToolResult> {
  try {
    const stage = args.stage as LeadStage | undefined;
    if (stage && !MO_WRITABLE_STAGES.has(stage)) {
      return {
        ok: false,
        name: 'update_lead',
        result: null,
        error: `stage_not_allowed:${stage}`,
      };
    }

    const updated = await updateLead(ctx.lead.id, {
      name: safeString(args.name, 120),
      business_name: safeString(args.business_name, 200),
      business_type: safeString(args.business_type, 120),
      needs: safeString(args.needs, 2000),
      pain_points: safeString(args.pain_points, 2000),
      recommended_plan: safeString(args.recommended_plan, 64),
      stage,
    });

    Object.assign(ctx.lead, updated);

    return {
      ok: true,
      name: 'update_lead',
      result: {
        id: updated.id,
        stage: updated.stage,
        name: updated.name,
        business_name: updated.business_name,
        business_type: updated.business_type,
        recommended_plan: updated.recommended_plan,
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      name: 'update_lead',
      result: null,
      error: e?.message || 'update_lead_failed',
    };
  }
}

/**
 * handoff_to_human — reuses agent_status = human_active.
 */
export async function handoffToHuman(
  ctx: AcquisitionToolContext,
  args: { reason?: string }
): Promise<ToolResult> {
  try {
    const reason = safeString(args.reason, 500) || 'customer_requested_human';

    await setConversationAgentStatus(ctx.conversationId, 'human_active' as AgentStatus);

    await updateLead(ctx.lead.id, {
      stage: 'handed_off',
      handoff_reason: reason,
    });
    ctx.lead.stage = 'handed_off';
    ctx.lead.handoff_reason = reason;

    console.log(
      JSON.stringify({
        event: 'acquisition_handoff',
        conversationId: ctx.conversationId,
        leadId: ctx.lead.id,
        connectionId: ctx.connectionId,
        reason,
      })
    );

    return {
      ok: true,
      name: 'handoff_to_human',
      result: {
        agentStatus: 'human_active',
        leadStage: 'handed_off',
        reason,
        message:
          'Conversation handed to a human. AI will not reply until status is reset.',
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      name: 'handoff_to_human',
      result: null,
      error: e?.message || 'handoff_failed',
    };
  }
}

/** Tool definitions for the acquisition agent (Mistral function calling). */
export const ACQUISITION_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_busmo_pricing',
      description:
        'Get current Busmo plan names, monthly prices, and key differences from the canonical pricing source. Call this before stating any price.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'recommend_busmo_plan',
      description:
        'Recommend a Busmo plan based on business size, complexity, staff, and needs. Does not force a purchase.',
      parameters: {
        type: 'object',
        properties: {
          businessSize: {
            type: 'string',
            description: 'e.g. small, growing, multi-location',
          },
          complexity: { type: 'string' },
          needs: {
            type: 'string',
            description: 'Key needs: inventory, profit, credit, staff, etc.',
          },
          staffCount: { type: 'string' },
          multiLocation: { type: 'boolean' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_signup_link',
      description:
        'Create a server-attributed signup link for this prospect. Call when the customer wants to start or try Busmo.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_lead',
      description:
        'Save useful prospect details learned in conversation (name, business type, needs, recommended plan, stage).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          business_name: { type: 'string' },
          business_type: { type: 'string' },
          needs: { type: 'string' },
          pain_points: { type: 'string' },
          recommended_plan: { type: 'string' },
          stage: {
            type: 'string',
            enum: ['new', 'engaged', 'qualified', 'signup_started', 'handed_off'],
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'handoff_to_human',
      description:
        'Hand the conversation to a human Busmo team member. Use when the customer asks for a person, is frustrated, needs negotiation outside your authority, or you cannot answer confidently.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Short reason for handoff' },
        },
        required: [],
      },
    },
  },
];

export async function executeAcquisitionTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AcquisitionToolContext
): Promise<ToolResult> {
  console.log(
    JSON.stringify({
      event: 'acquisition_tool_called',
      tool: name,
      leadId: ctx.lead.id,
      conversationId: ctx.conversationId,
      argKeys: Object.keys(args || {}).slice(0, 10),
    })
  );

  switch (name) {
    case 'get_busmo_pricing':
      return getBusmoPricing();
    case 'recommend_busmo_plan':
      return recommendBusmoPlan({
        businessSize: safeString(args.businessSize),
        complexity: safeString(args.complexity),
        needs: safeString(args.needs),
        staffCount: args.staffCount as string | number | null,
        multiLocation: Boolean(args.multiLocation),
      });
    case 'create_signup_link':
      return createSignupLink(ctx);
    case 'update_lead':
      return toolUpdateLead(ctx, {
        name: safeString(args.name) || undefined,
        business_name: safeString(args.business_name) || undefined,
        business_type: safeString(args.business_type) || undefined,
        needs: safeString(args.needs) || undefined,
        pain_points: safeString(args.pain_points) || undefined,
        recommended_plan: safeString(args.recommended_plan) || undefined,
        stage: safeString(args.stage) || undefined,
      });
    case 'handoff_to_human':
      return handoffToHuman(ctx, {
        reason: safeString(args.reason) || undefined,
      });
    default:
      return {
        ok: false,
        name,
        result: null,
        error: `unknown_tool:${name}`,
      };
  }
}
