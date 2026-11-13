import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ctx(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!s.businessId) return null;
  return { businessId: s.businessId };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

function mapRecord(r: any) {
  return {
    id: r.id,
    full_name: r.title,
    role: r.metadata?.role || null,
    specialty: r.metadata?.specialty || null,
    phone: r.metadata?.phone || null,
    email: r.metadata?.email || null,
    notes: r.notes || null,
    status: r.status,
    created_at: r.created_at,
    source: 'records',
  };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const status = String(url.searchParams.get('status') || 'all');
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();

  const native = await admin
    .from('healthcare_staff')
    .select('*')
    .eq('business_id', c.businessId)
    .order('created_at', { ascending: false })
    .limit(150);

  let rows: any[] = [];
  let warning: string | null = null;

  if (!native.error && native.data) {
    rows = asRows(native.data);
  } else {
    const rec = await admin
      .from('industry_records')
      .select('*')
      .eq('business_id', c.businessId)
      .eq('product_edition', 'healthcare')
      .eq('module', 'staff')
      .order('created_at', { ascending: false })
      .limit(150);
    if (rec.error) warning = native.error?.message || rec.error.message;
    rows = asRows(rec.data).map(mapRecord);
  }

  if (status && status !== 'all') {
    rows = rows.filter((r) => String(r.status || 'active') === status);
  }
  if (q) {
    rows = rows.filter((r) => {
      const hay = `${r.full_name || r.name || ''} ${r.role || ''} ${r.specialty || ''} ${r.phone || ''} ${r.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const all = rows;
  const metrics = {
    total: all.length,
    active: all.filter((r) => String(r.status || 'active') === 'active').length,
    inactive: all.filter((r) => String(r.status) === 'inactive').length,
    doctors: all.filter((r) => /doctor|physician|gp|consultant/i.test(String(r.role || ''))).length,
    nurses: all.filter((r) => /nurse|midwife/i.test(String(r.role || ''))).length,
  };

  return NextResponse.json({ ok: true, staff: rows, metrics, warning });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'staff_create').trim();

  if (action === 'staff_create') {
    const full_name = String(body.fullName || body.full_name || body.name || '').trim();
    if (!full_name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const payload = {
      business_id: c.businessId,
      full_name,
      role: body.role || null,
      specialty: body.specialty || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      status: body.status || 'active',
    };

    const native = await admin.from('healthcare_staff').insert(payload).select('*').single();
    if (!native.error && native.data) {
      return NextResponse.json({ ok: true, member: native.data, source: 'native' });
    }

    // try name column variant
    const native2 = await admin
      .from('healthcare_staff')
      .insert({
        business_id: c.businessId,
        name: full_name,
        role: body.role || null,
        phone: body.phone || null,
        status: body.status || 'active',
      })
      .select('*')
      .single();
    if (!native2.error && native2.data) {
      return NextResponse.json({ ok: true, member: native2.data, source: 'native' });
    }

    const rec = await admin
      .from('industry_records')
      .insert({
        business_id: c.businessId,
        product_edition: 'healthcare',
        module: 'staff',
        title: full_name,
        status: payload.status,
        notes: payload.notes,
        occurred_at: new Date().toISOString(),
        metadata: {
          role: payload.role,
          specialty: payload.specialty,
          phone: payload.phone,
          email: payload.email,
        },
      })
      .select('*')
      .single();

    if (rec.error) {
      return NextResponse.json(
        { error: native.error?.message || native2.error?.message || rec.error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, member: mapRecord(rec.data), source: 'records' });
  }

  if (action === 'staff_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.fullName != null || body.full_name != null) patch.full_name = body.fullName || body.full_name;
    if (body.role != null) patch.role = body.role;
    if (body.specialty != null) patch.specialty = body.specialty;
    if (body.phone != null) patch.phone = body.phone;
    if (body.email != null) patch.email = body.email;
    if (body.notes != null) patch.notes = body.notes;

    const native = await admin
      .from('healthcare_staff')
      .update(patch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();

    if (!native.error && native.data) {
      return NextResponse.json({ ok: true, member: native.data });
    }

    const recPatch: Record<string, unknown> = {};
    if (body.status != null) recPatch.status = body.status;
    if (body.fullName != null || body.full_name != null) recPatch.title = body.fullName || body.full_name;
    if (body.notes != null) recPatch.notes = body.notes;

    const existing = await admin
      .from('industry_records')
      .select('metadata')
      .eq('id', id)
      .eq('business_id', c.businessId)
      .maybeSingle();

    recPatch.metadata = {
      ...(existing.data?.metadata || {}),
      ...(body.role != null ? { role: body.role } : {}),
      ...(body.specialty != null ? { specialty: body.specialty } : {}),
      ...(body.phone != null ? { phone: body.phone } : {}),
      ...(body.email != null ? { email: body.email } : {}),
    };

    const rec = await admin
      .from('industry_records')
      .update(recPatch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();

    if (rec.error) {
      return NextResponse.json(
        { error: native.error?.message || rec.error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, member: mapRecord(rec.data) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
