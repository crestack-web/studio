import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/attendance
 * body: { action: 'clock_in' | 'clock_out', businessId, staffId?, staffName? }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').toLowerCase();
    const businessId = String(
      body.businessId ||
        user.user_metadata?.businessId ||
        user.user_metadata?.business_id ||
        ''
    ).trim();
    const staffId = String(body.staffId || user.id);
    const staffName =
      body.staffName ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Staff';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (action !== 'clock_in' && action !== 'clock_out') {
      return NextResponse.json({ error: 'action must be clock_in or clock_out' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'clock_in') {
      // Prevent double open shift
      const { data: openRows } = await supabase
        .from('attendance')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .is('check_out', null)
        .limit(5);

      if (openRows && openRows.length > 0) {
        return NextResponse.json({
          ok: true,
          alreadyOpen: true,
          id: openRows[0].id,
        });
      }

      const id = crypto.randomUUID();
      const note = JSON.stringify({
        status: 'clocked_in',
        staffName,
        staffId,
      });

      const { error } = await supabase.from('attendance').insert({
        id,
        business_id: businessId,
        user_id: user.id,
        check_in: now,
        check_out: null,
        note,
        created_at: now,
      });

      if (error) {
        console.error('[attendance] clock_in', error);
        return NextResponse.json(
          { error: error.message || 'Failed to clock in' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, id, checkIn: now });
    }

    // clock_out
    const { data: openRows } = await supabase
      .from('attendance')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .is('check_out', null)
      .order('check_in', { ascending: false })
      .limit(1);

    const open = openRows?.[0];
    if (!open) {
      return NextResponse.json({ error: 'No open shift to clock out' }, { status: 404 });
    }

    let note = open.note;
    try {
      const parsed =
        typeof note === 'string' && note.startsWith('{')
          ? JSON.parse(note)
          : { staffName, staffId };
      parsed.status = 'clocked_out';
      note = JSON.stringify(parsed);
    } catch {
      note = JSON.stringify({ status: 'clocked_out', staffName, staffId });
    }

    const checkIn = open.check_in || open.created_at || now;

    // Aggregate sales for this staff during the open shift
    let salesCount = 0;
    let totalRevenue = 0;
    let expectedCash = 0;
    let bankTotal = 0;
    const saleIds: string[] = [];

    try {
      const { data: salesRows } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', checkIn)
        .lte('created_at', now)
        .limit(500);

      for (const sale of salesRows || []) {
        const meta =
          sale.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
        const recorded = meta.recordedBy || {};
        const owners = [
          meta.soldBy,
          recorded.uid,
          recorded.staffId,
          sale.user_id,
          sale.staff_id,
        ]
          .filter(Boolean)
          .map(String);
        if (
          !owners.includes(String(user.id)) &&
          !owners.includes(String(staffId))
        ) {
          continue;
        }
        salesCount += 1;
        saleIds.push(String(sale.id));
        const total =
          Number(
            sale.total_revenue ??
              sale.total_amount ??
              sale.total ??
              meta.totalRevenue ??
              0
          ) || 0;
        totalRevenue += total;
        const method = String(
          sale.payment_method || meta.paymentMethod || 'cash'
        ).toLowerCase();
        const breakdown = meta.paymentBreakdown || meta.paymentMethods || [];
        if (Array.isArray(breakdown) && breakdown.length) {
          for (const pb of breakdown) {
            const m = String(pb.method || '').toLowerCase();
            const amt = Number(pb.amount || 0) || 0;
            if (m === 'cash') expectedCash += amt;
            else if (m === 'split') {
              expectedCash += amt * 0.5;
              bankTotal += amt * 0.5;
            } else if (['transfer', 'pos', 'card'].includes(m)) bankTotal += amt;
          }
        } else if (method === 'cash') expectedCash += total;
        else if (method === 'split') {
          expectedCash += total * 0.5;
          bankTotal += total * 0.5;
        } else if (['transfer', 'pos', 'card'].includes(method)) bankTotal += total;
      }
    } catch (aggErr) {
      console.warn('[attendance] shift sales aggregate', aggErr);
    }

    const shiftSummary = {
      status: 'clocked_out',
      staffName,
      staffId,
      shiftClose: true,
      checkIn,
      checkOut: now,
      salesCount,
      totalRevenue,
      expectedCash,
      bankTotal,
      saleIds,
      pendingCashReconciliation: expectedCash > 0,
    };

    note = JSON.stringify(shiftSummary);

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now, note })
      .eq('id', open.id)
      .eq('business_id', businessId);

    if (error) {
      console.error('[attendance] clock_out', error);
      return NextResponse.json(
        { error: error.message || 'Failed to clock out' },
        { status: 500 }
      );
    }

    // Persist shift close for money control / staff accountability
    try {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, metadata, owner_id, user_id, business_name, name')
        .eq('id', businessId)
        .maybeSingle();
      const prevMeta =
        biz?.metadata && typeof biz.metadata === 'object' ? (biz.metadata as any) : {};
      const closes = Array.isArray(prevMeta.shiftCloses) ? prevMeta.shiftCloses : [];
      closes.unshift({
        id: open.id,
        ...shiftSummary,
        businessId,
        createdAt: now,
      });
      await supabase
        .from('businesses')
        .update({
          metadata: { ...prevMeta, shiftCloses: closes.slice(0, 300) },
        })
        .eq('id', businessId);

      // Notify owner by email
      const ownerId = biz?.owner_id || (biz as any)?.user_id || null;
      let ownerEmail = '';
      let ownerName = 'Owner';
      if (ownerId) {
        const { data: ownerUser } = await supabase.auth.admin.getUserById(String(ownerId));
        ownerEmail = ownerUser?.user?.email || '';
        ownerName =
          ownerUser?.user?.user_metadata?.full_name ||
          ownerUser?.user?.user_metadata?.name ||
          ownerEmail.split('@')[0] ||
          'Owner';
        if (!ownerEmail) {
          const { data: profile } = await supabase
            .from('users')
            .select('email, name, full_name')
            .eq('id', ownerId)
            .maybeSingle();
          ownerEmail = (profile as any)?.email || '';
          ownerName =
            (profile as any)?.name ||
            (profile as any)?.full_name ||
            ownerName;
        }
      }
      // Fallback: business contact email on users linked by business_id
      if (!ownerEmail) {
        const { data: profiles } = await supabase
          .from('users')
          .select('email, name, role, business_id')
          .eq('business_id', businessId)
          .limit(10);
        const ownerProfile = (profiles || []).find((u: any) =>
          ['owner', 'admin', 'business owner'].includes(
            String(u.role || '').toLowerCase()
          )
        );
        if (ownerProfile?.email) {
          ownerEmail = ownerProfile.email;
          ownerName = ownerProfile.name || ownerName;
        }
      }

      if (ownerEmail) {
        const businessName =
          (biz as any)?.business_name || (biz as any)?.name || 'Your business';
        const fmt = (n: number) =>
          `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
        const { sendTransactionalEmail } = await import(
          '@/services/email/brevo-service'
        );
        await sendTransactionalEmail({
          to: [{ email: ownerEmail, name: ownerName }],
          subject: `Shift closed — ${staffName} · ${businessName}`,
          htmlContent: `
            <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
              <h2 style="margin:0 0 8px">Shift closed</h2>
              <p style="color:#64748b;margin:0 0 16px">${businessName}</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px">
                <p style="margin:0 0 8px"><strong>Staff:</strong> ${staffName}</p>
                <p style="margin:0 0 8px"><strong>Sales:</strong> ${salesCount}</p>
                <p style="margin:0 0 8px"><strong>Revenue:</strong> ${fmt(totalRevenue)}</p>
                <p style="margin:0 0 8px"><strong>Expected cash:</strong> ${fmt(expectedCash)}</p>
                <p style="margin:0 0 8px"><strong>Bank / transfer:</strong> ${fmt(bankTotal)}</p>
                <p style="margin:0"><strong>Cash reconciliation:</strong> ${
                  expectedCash > 0
                    ? 'Pending — review on Money Control → Cash reconciliation'
                    : 'No cash to reconcile'
                }</p>
              </div>
              <p style="margin:16px 0 0;font-size:13px;color:#64748b">
                Open Busmo → Money Control or Staff Accountability to review this shift.
              </p>
            </div>
          `,
          sender: { name: 'Busmo', email: 'noreply@busmo.io' },
        });
      }
    } catch (notifyErr) {
      console.warn('[attendance] shift close notify failed', notifyErr);
    }

    return NextResponse.json({
      ok: true,
      id: open.id,
      checkOut: now,
      shiftSummary,
    });
  } catch (err: any) {
    console.error('[attendance]', err);
    return NextResponse.json(
      { error: err?.message || 'Attendance failed' },
      { status: 500 }
    );
  }
}

/** GET /api/staff/attendance?businessId= */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = userData.user;
    const businessId = String(
      req.nextUrl.searchParams.get('businessId') ||
        user.user_metadata?.businessId ||
        user.user_metadata?.business_id ||
        ''
    ).trim();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, records: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load attendance' },
      { status: 500 }
    );
  }
}
