import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { resolveIndustryAccess, canAccessDesk, canMutateDesk } from '@/lib/industries/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return s.businessId || null;
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [branding, students, fees] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    admin.from('education_students').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(80),
    admin
      .from('education_fee_payments')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const feeRows = fees.data || [];
  const collectedToday = feeRows
    .filter((f: any) => f.status === 'recorded')
    .reduce((s: number, f: any) => s + Number(f.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    branding: branding.data || { display_name: null, logo_url: null, currency: 'NGN' },
    metrics: {
      students: (students.data || []).length,
      feesToday: feeRows.length,
      collectedToday,
      pending: feeRows.filter((f: any) => f.status === 'pending').length,
    },
    students: students.data || [],
    recentFees: feeRows,
    warnings: [branding.error?.message, students.error?.message, fees.error?.message].filter(Boolean),
  });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'fee');

  if (action === 'student') {
    const full_name = String(body.fullName || '').trim();
    if (!full_name) return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    const { data, error } = await admin
      .from('education_students')
      .insert({
        business_id: businessId,
        full_name,
        class_name: body.className || null,
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, student: data });
  }

  if (action === 'fee') {
    const student_name = String(body.studentName || '').trim();
    if (!student_name) return NextResponse.json({ error: 'studentName required' }, { status: 400 });
    const { data, error } = await admin
      .from('education_fee_payments')
      .insert({
        business_id: businessId,
        student_id: body.studentId || null,
        student_name,
        amount: Number(body.amount || 0),
        status: body.status || 'recorded',
        method: body.method || 'cash',
        note: body.note || null,
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, fee: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
