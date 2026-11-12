import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return session.businessId || null;
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_staff')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) {
    // Fallback industry_records
    const rec = await admin
      .from('industry_records')
      .select('*')
      .eq('business_id', businessId)
      .eq('module', 'staff')
      .order('occurred_at', { ascending: false });
    return NextResponse.json({
      ok: true,
      staff: (rec.data || []).map((r: any) => ({
        id: r.id,
        full_name: r.title,
        email: r.meta?.email,
        role: r.meta?.role || 'front_desk',
        status: r.status || 'invited',
        phone: r.meta?.phone,
      })),
      source: 'records',
    });
  }
  return NextResponse.json({ ok: true, staff: data || [] });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const full_name = String(body.fullName || body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'front_desk');
  if (!full_name || !email) {
    return NextResponse.json({ error: 'fullName and email required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_staff')
    .upsert(
      {
        business_id: businessId,
        full_name,
        email,
        phone: body.phone || null,
        role,
        status: 'invited',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id,email' }
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Link existing auth user if they already signed up with this email
  try {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = list?.users?.find((u) => (u.email || '').toLowerCase() === email);
    if (match) {
      await admin
        .from('hospitality_staff')
        .update({ user_id: match.id, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', data.id);
      await admin.auth.admin.updateUserById(match.id, {
        user_metadata: {
          ...(match.user_metadata || {}),
          product_edition: 'hospitality',
          hospitality_role: role,
          businessId,
          business_id: businessId,
        },
      });
    }
  } catch (e) {
    console.warn('[hospitality/staff] link user', e);
  }

  return NextResponse.json({
    ok: true,
    staff: data,
    message:
      'Staff saved. They should open Hospitality login (Google or email) with this address to access the front desk.',
  });
}
