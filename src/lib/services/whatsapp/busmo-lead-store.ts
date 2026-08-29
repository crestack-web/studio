/**
 * Phase 5B — Busmo acquisition lead persistence.
 *
 * Identity: normalized phone (never raw formatting).
 * Scope: platform acquisition only. No merchant business_id.
 *
 * MO may write: new | engaged | qualified | signup_started | handed_off
 * MO must NOT independently declare: signed_up | activated | converted
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizePhone } from '@/lib/infobip/client';

export type LeadStage =
  | 'new'
  | 'engaged'
  | 'qualified'
  | 'signup_started'
  | 'signed_up'
  | 'activated'
  | 'converted'
  | 'handed_off';

export const MO_WRITABLE_STAGES: ReadonlySet<LeadStage> = new Set([
  'new',
  'engaged',
  'qualified',
  'signup_started',
  'handed_off',
]);

export type BusmoLead = {
  id: string;
  phone: string;
  normalized_phone: string;
  name: string | null;
  business_name: string | null;
  business_type: string | null;
  needs: string | null;
  pain_points: string | null;
  recommended_plan: string | null;
  stage: LeadStage;
  source: string;
  source_connection_id: string | null;
  campaign: string | null;
  handoff_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LeadUpdateFields = {
  name?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  needs?: string | null;
  pain_points?: string | null;
  recommended_plan?: string | null;
  stage?: LeadStage;
  handoff_reason?: string | null;
  campaign?: string | null;
  metadata?: Record<string, unknown>;
};

function mapLeadRow(row: Record<string, unknown>): BusmoLead {
  return {
    id: String(row.id),
    phone: String(row.phone || ''),
    normalized_phone: String(row.normalized_phone || ''),
    name: row.name != null ? String(row.name) : null,
    business_name: row.business_name != null ? String(row.business_name) : null,
    business_type: row.business_type != null ? String(row.business_type) : null,
    needs: row.needs != null ? String(row.needs) : null,
    pain_points: row.pain_points != null ? String(row.pain_points) : null,
    recommended_plan:
      row.recommended_plan != null ? String(row.recommended_plan) : null,
    stage: (row.stage as LeadStage) || 'new',
    source: String(row.source || 'whatsapp'),
    source_connection_id:
      row.source_connection_id != null ? String(row.source_connection_id) : null,
    campaign: row.campaign != null ? String(row.campaign) : null,
    handoff_reason:
      row.handoff_reason != null ? String(row.handoff_reason) : null,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

export async function getOrCreateLead(params: {
  phone: string;
  sourceConnectionId: string;
  source?: string;
  campaign?: string | null;
  contactName?: string | null;
}): Promise<BusmoLead> {
  const sb = getSupabaseAdmin();
  const normalized = normalizePhone(params.phone);
  if (!normalized) {
    throw new Error('lead_phone_required');
  }

  const { data: existing } = await sb
    .from('busmo_leads')
    .select('*')
    .eq('normalized_phone', normalized)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (!existing.source_connection_id && params.sourceConnectionId) {
      patch.source_connection_id = params.sourceConnectionId;
    }
    if (existing.stage === 'new') {
      patch.stage = 'engaged';
    }
    if (
      params.contactName &&
      !existing.name &&
      String(params.contactName).trim()
    ) {
      patch.name = String(params.contactName).trim().slice(0, 120);
    }
    if (Object.keys(patch).length > 1) {
      const { data: updated } = await sb
        .from('busmo_leads')
        .update(patch)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (updated) return mapLeadRow(updated);
    }
    return mapLeadRow(existing);
  }

  // Concurrent-safe: unique on normalized_phone + upsert.
  const id = crypto.randomUUID();
  const insert = {
    id,
    phone: params.phone.slice(0, 32),
    normalized_phone: normalized,
    name: params.contactName
      ? String(params.contactName).trim().slice(0, 120)
      : null,
    source: params.source || 'whatsapp',
    source_connection_id: params.sourceConnectionId || null,
    campaign: params.campaign || null,
    stage: 'new' as LeadStage,
    metadata: {},
  };

  const { data, error } = await sb
    .from('busmo_leads')
    .upsert(insert, {
      onConflict: 'normalized_phone',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();

  if (error) {
    const { data: again } = await sb
      .from('busmo_leads')
      .select('*')
      .eq('normalized_phone', normalized)
      .maybeSingle();
    if (again) return mapLeadRow(again);
    throw error;
  }

  return mapLeadRow(data);
}

export async function getLeadById(leadId: string): Promise<BusmoLead | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('busmo_leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();
  return data ? mapLeadRow(data) : null;
}

export async function updateLead(
  leadId: string,
  fields: LeadUpdateFields
): Promise<BusmoLead> {
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (fields.name !== undefined) {
    patch.name = fields.name ? String(fields.name).trim().slice(0, 120) : null;
  }
  if (fields.business_name !== undefined) {
    patch.business_name = fields.business_name
      ? String(fields.business_name).trim().slice(0, 200)
      : null;
  }
  if (fields.business_type !== undefined) {
    patch.business_type = fields.business_type
      ? String(fields.business_type).trim().slice(0, 120)
      : null;
  }
  if (fields.needs !== undefined) {
    patch.needs = fields.needs
      ? String(fields.needs).trim().slice(0, 2000)
      : null;
  }
  if (fields.pain_points !== undefined) {
    patch.pain_points = fields.pain_points
      ? String(fields.pain_points).trim().slice(0, 2000)
      : null;
  }
  if (fields.recommended_plan !== undefined) {
    patch.recommended_plan = fields.recommended_plan
      ? String(fields.recommended_plan).trim().slice(0, 64)
      : null;
  }
  if (fields.stage !== undefined) {
    if (!MO_WRITABLE_STAGES.has(fields.stage)) {
      throw new Error(`lead_stage_not_mo_writable:${fields.stage}`);
    }
    patch.stage = fields.stage;
  }
  if (fields.handoff_reason !== undefined) {
    patch.handoff_reason = fields.handoff_reason
      ? String(fields.handoff_reason).trim().slice(0, 500)
      : null;
  }
  if (fields.campaign !== undefined) {
    patch.campaign = fields.campaign
      ? String(fields.campaign).trim().slice(0, 120)
      : null;
  }
  if (fields.metadata !== undefined && typeof fields.metadata === 'object') {
    patch.metadata = fields.metadata;
  }

  const { data, error } = await sb
    .from('busmo_leads')
    .update(patch)
    .eq('id', leadId)
    .select('*')
    .single();

  if (error) throw error;
  return mapLeadRow(data);
}

export function formatLeadForContext(lead: BusmoLead): string {
  const lines: string[] = [
    `Lead id: ${lead.id}`,
    `Stage: ${lead.stage}`,
    `Phone: …${lead.normalized_phone.slice(-4)}`,
  ];
  if (lead.name) lines.push(`Name: ${lead.name}`);
  if (lead.business_name) lines.push(`Business: ${lead.business_name}`);
  if (lead.business_type) lines.push(`Business type: ${lead.business_type}`);
  if (lead.needs) lines.push(`Needs: ${lead.needs}`);
  if (lead.pain_points) lines.push(`Pain points: ${lead.pain_points}`);
  if (lead.recommended_plan)
    lines.push(`Recommended plan: ${lead.recommended_plan}`);
  if (lead.handoff_reason) lines.push(`Handoff reason: ${lead.handoff_reason}`);
  return lines.join('\n');
}
