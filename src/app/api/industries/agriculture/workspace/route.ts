import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDITION = 'agriculture';

const MODULES = [
  'farms',
  'plots',
  'crops',
  'activities',
  'harvest',
  'inputs',
  'inventory',
  'processing',
  'packaging',
  'warehouse',
  'equipment',
  'team',
  'sales',
  'exports',
  'finance',
  'reports',
  'settings',
] as const;

async function ctx(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!s.businessId) return null;
  return { businessId: s.businessId, businessName: s.businessName };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

async function loadRecords(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  moduleName: string,
  limit = 400
) {
  const { data, error } = await admin
    .from('industry_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('product_edition', EDITION)
    .eq('module', moduleName)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [] as any[], warning: error.message };
  return { rows: asRows(data), warning: null as string | null };
}

function lowerStatus(row: any) {
  return String(row?.status ?? '').toLowerCase();
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { businessId } = c;

  const [branding, ...recordSets] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    ...MODULES.map((m) => loadRecords(admin, businessId, m)),
  ]);

  const byModule: Record<string, any[]> = {};
  MODULES.forEach((m, i) => {
    byModule[m] = recordSets[i]?.rows || [];
  });

  const warnings = [
    branding.error?.message,
    ...recordSets.map((r: any) => r?.warning),
  ].filter(Boolean);

  const farms = byModule.farms;
  const plots = byModule.plots;
  const crops = byModule.crops;
  const activities = byModule.activities;
  const harvest = byModule.harvest;
  const inputs = byModule.inputs;
  const inventory = byModule.inventory;
  const warehouse = byModule.warehouse;
  const sales = byModule.sales;
  const exports = byModule.exports;
  const settingsFromRecords = byModule.settings;

  const lowStockStatuses = new Set(['low_stock', 'out_of_stock']);

  return NextResponse.json({
    ok: true,
    businessId,
    businessName: c.businessName,
    branding: branding.data || { display_name: c.businessName, logo_url: null, currency: 'NGN' },
    metrics: {
      farms: farms.length,
      plots: plots.length,
      activeCrops: crops.filter((r) => lowerStatus(r) !== 'harvested').length,
      activitiesDue: activities.filter((r) => lowerStatus(r) !== 'done').length,
      harvestReady: harvest.filter((r) => lowerStatus(r) === 'ready').length,
      lowStock: [...inputs, ...inventory, ...warehouse].filter((r) =>
        lowStockStatuses.has(lowerStatus(r))
      ).length,
      salesValue: sales.reduce((s, r) => s + Number(r.amount || 0), 0),
      exportsInProgress: exports.filter((r) => !['sent', 'archived'].includes(lowerStatus(r))).length,
    },
    farms,
    plots,
    crops,
    activities,
    harvest,
    inputs,
    inventory,
    processing: byModule.processing,
    packaging: byModule.packaging,
    warehouse,
    equipment: byModule.equipment,
    team: byModule.team,
    sales,
    exports,
    finance: byModule.finance,
    reports: byModule.reports,
    settings: settingsFromRecords?.[0]?.meta || null,
    warnings,
  });
}

async function insertRecord(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  const moduleName = String(body.module || '').trim();
  const title = String(body.title || '').trim();
  if (!(MODULES as readonly string[]).includes(moduleName)) {
    return { error: `module must be one of ${MODULES.join(', ')}`, status: 400 as const };
  }
  if (moduleName === 'settings') {
    return { error: 'settings cannot be created via record_create; use settings_save', status: 400 as const };
  }
  if (!title) return { error: 'title required', status: 400 as const };

  const { data, error } = await admin
    .from('industry_records')
    .insert({
      business_id: businessId,
      product_edition: EDITION,
      module: moduleName,
      title,
      status: body.status || 'open',
      amount: body.amount != null ? Number(body.amount) : 0,
      notes: body.notes || null,
      meta: body.meta && typeof body.meta === 'object' ? body.meta : {},
      occurred_at: body.occurredAt || body.occurred_at || new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) return { error: error.message, status: 500 as const };
  return { record: data };
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').trim();
  const { businessId } = c;

  if (action === 'settings_save') {
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
    const title = String(settings.name || settings.displayName || 'Farm settings');
    const existing = await admin
      .from('industry_records')
      .select('id')
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .eq('module', 'settings')
      .limit(1)
      .maybeSingle();
    const payload = {
      business_id: businessId,
      product_edition: EDITION,
      module: 'settings',
      title,
      status: 'active',
      notes: null,
      meta: settings,
      occurred_at: new Date().toISOString(),
    };
    const { data, error } = existing.data
      ? await admin
          .from('industry_records')
          .update({ title, meta: settings, status: 'active' })
          .eq('id', existing.data.id)
          .eq('business_id', businessId)
          .eq('product_edition', EDITION)
          .select('*')
          .single()
      : await admin.from('industry_records').insert(payload).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (settings.name || settings.logoUrl || settings.logo_url || settings.currency) {
      await admin.from('solution_branding').upsert(
        {
          business_id: businessId,
          product_edition: EDITION,
          display_name: settings.name || settings.displayName || title,
          logo_url: settings.logoUrl || settings.logo_url || null,
          currency: settings.currency || 'NGN',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id' }
      );
    }
    return NextResponse.json({ ok: true, settings: data });
  }

  if (action === 'record_create') {
    const res = await insertRecord(admin, businessId, body);
    if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, record: res.record });
  }

  if (action === 'record_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.title != null) patch.title = body.title;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.notes != null) patch.notes = body.notes;
    if (body.meta != null && typeof body.meta === 'object') {
      // Merge so partial meta updates never erase sibling keys.
      const existing = await admin
        .from('industry_records')
        .select('meta')
        .eq('id', id)
        .eq('business_id', businessId)
        .eq('product_edition', EDITION)
        .maybeSingle();
      patch.meta = { ...(existing.data?.meta || {}), ...body.meta };
    }
    if (body.occurredAt != null) patch.occurred_at = body.occurredAt;
    else if (body.occurred_at != null) patch.occurred_at = body.occurred_at;
    const { data, error } = await admin
      .from('industry_records')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (action === 'record_delete') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin
      .from('industry_records')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
