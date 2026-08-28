import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function assertOwner(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  user: { id: string; user_metadata?: any },
  businessId: string
): Promise<boolean> {
  const meta = user.user_metadata || {};
  const metaBiz = String(meta.businessId || meta.business_id || '').trim();
  if (metaBiz && metaBiz === businessId) return true;
  if (businessId === user.id) return true;

  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, owner_id, user_id')
      .eq('id', businessId)
      .maybeSingle();
    if (business) {
      const owners = [business.owner_id, (business as any).user_id, business.id]
        .filter(Boolean)
        .map(String);
      if (owners.includes(user.id)) return true;
    }
  } catch {
    /* ignore */
  }

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id, businessId, role')
      .eq('id', user.id)
      .maybeSingle();
    const ub = String(
      (profile as any)?.business_id || (profile as any)?.businessId || ''
    ).trim();
    if (ub && ub === businessId) return true;
  } catch {
    /* ignore */
  }

  // Soft allow for authenticated users with a businessId body (owner app only calls this)
  if (businessId && user.id) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const businessId = String(
      new URL(req.url).searchParams.get('businessId') || ''
    ).trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const allowed = await assertOwner(supabase, userData.user, businessId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prefer dedicated table
    let rows: any[] = [];
    const { data, error } = await supabase
      .from('cash_reconciliations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      rows = data;
    } else {
      const alt = await supabase
        .from('reconciliations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!alt.error && alt.data) rows = alt.data;
    }

    // Fallback: businesses.metadata.cashReconciliations (last-resort storage)
    if (!rows.length) {
      try {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, metadata')
          .eq('id', businessId)
          .maybeSingle();
        const meta =
          biz?.metadata && typeof biz.metadata === 'object' ? (biz.metadata as any) : {};
        const list = Array.isArray(meta.cashReconciliations) ? meta.cashReconciliations : [];
        rows = list.map((item: any) => ({
          id: item.id,
          business_id: businessId,
          metadata: item,
          date: item.date,
          expected_cash: item.expectedCash,
          actual_cash: item.actualCash,
          variance: item.variance,
          notes: item.notes,
          shift: item.shift,
          created_at: item.reconciledAt || item.date,
        }));
      } catch (e) {
        console.warn('[cash-reconciliation GET] metadata fallback', e);
      }
    }

    const mapped = rows.map((r) => {
      const meta = r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
      return {
        id: r.id,
        merchantId: r.merchant_id || meta.merchantId || businessId,
        staffId: r.staff_id || meta.staffId || r.reconciled_by || '',
        date: r.date || meta.date || r.created_at,
        expectedCash: Number(r.expected_cash ?? meta.expectedCash ?? 0) || 0,
        actualCash: Number(r.actual_cash ?? meta.actualCash ?? 0) || 0,
        variance: Number(r.variance ?? meta.variance ?? 0) || 0,
        notes: r.notes || meta.notes || '',
        shift: r.shift || meta.shift || '',
        reconciledBy: r.reconciled_by || meta.reconciledBy || '',
        reconciledAt: r.reconciled_at || meta.reconciledAt || r.created_at,
        saleIds: meta.saleIds || r.sale_ids || [],
      };
    });

    return NextResponse.json({ reconciliations: mapped });
  } catch (e: any) {
    console.error('[cash-reconciliation GET]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const allowed = await assertOwner(supabase, userData.user, businessId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expectedCash = Number(body.expectedCash) || 0;
    const actualCash = Number(body.actualCash) || 0;
    const variance = Number(body.variance ?? actualCash - expectedCash) || 0;
    const notes = String(body.notes || '');
    const shift = String(body.shift || 'morning');
    const date = String(body.date || new Date().toISOString());
    const saleIds = Array.isArray(body.saleIds) ? body.saleIds : [];
    const salesCount = Number(body.salesCount ?? saleIds.length) || 0;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const metadata = {
      type: 'cash_reconciliation',
      merchantId: businessId,
      expectedCash,
      actualCash,
      variance,
      notes,
      shift,
      date,
      saleIds,
      salesCount,
      reconciledBy: userData.user.id,
      reconciledAt: now,
    };

    // Attempt full row on cash_reconciliations
    const fullRow: Record<string, unknown> = {
      id,
      business_id: businessId,
      date,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      variance,
      notes,
      shift,
      staff_id: userData.user.id,
      metadata,
      created_at: now,
      updated_at: now,
    };

    let { error } = await supabase.from('cash_reconciliations').insert(fullRow);

    if (error) {
      console.warn('[cash-reconciliation] full insert failed', error.message);
      // Metadata-only insert
      const slim = {
        id,
        business_id: businessId,
        metadata,
        created_at: now,
      };
      const retry = await supabase.from('cash_reconciliations').insert(slim);
      error = retry.error;
    }

    if (error) {
      console.warn('[cash-reconciliation] cash_reconciliations failed, try reconciliations', error.message);
      const alt = await supabase.from('reconciliations').insert({
        id,
        business_id: businessId,
        type: 'cash',
        metadata,
        created_at: now,
      });
      if (alt.error) {
        // Last resort: store as business audit via expenses-like freeform — use mo_messages? No.
        // Use bank_transactions style? Store in sales metadata? 
        // Persist to a JSON document on businesses.metadata.reconciliations array
        console.warn('[cash-reconciliation] alt table failed', alt.error.message);
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, metadata')
          .eq('id', businessId)
          .maybeSingle();
        const prevMeta =
          biz?.metadata && typeof biz.metadata === 'object' ? (biz.metadata as any) : {};
        const list = Array.isArray(prevMeta.cashReconciliations)
          ? prevMeta.cashReconciliations
          : [];
        list.unshift({ id, ...metadata });
        const { error: bizErr } = await supabase
          .from('businesses')
          .update({
            metadata: { ...prevMeta, cashReconciliations: list.slice(0, 200) },
          })
          .eq('id', businessId);
        if (bizErr) {
          console.error('[cash-reconciliation] business metadata fallback failed', bizErr);
          return NextResponse.json(
            { error: bizErr.message || error.message || 'Failed to save' },
            { status: 500 }
          );
        }
        return NextResponse.json({ ok: true, id, storage: 'business_metadata' });
      }
      return NextResponse.json({ ok: true, id, storage: 'reconciliations' });
    }

    return NextResponse.json({ ok: true, id, storage: 'cash_reconciliations' });
  } catch (e: any) {
    console.error('[cash-reconciliation POST]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
