import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { debitWallet, creditWallet } from '@/lib/wallet/business-wallet';
import {
  createTransferRecipient,
  initiateTransfer,
} from '@/lib/paystack/transfers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Bulk payroll payout from Busmo wallet via Paystack transfer.
 * Body: { businessId, entryIds: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const entryIds: string[] = Array.isArray(body.entryIds)
      ? body.entryIds.map(String)
      : [];

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!entryIds.length) return NextResponse.json({ error: 'entryIds required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const sb = getSupabaseAdmin();
    const { data: entries, error } = await sb
      .from('payroll_entries')
      .select('*')
      .eq('business_id', businessId)
      .in('id', entryIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const unpaid = (entries || []).filter((e: any) => e.status !== 'paid');
    if (!unpaid.length) {
      return NextResponse.json({ error: 'No unpaid entries selected' }, { status: 400 });
    }

    // Load staff bank details
    const staffIds = unpaid.map((e: any) => e.staff_id).filter(Boolean);
    const staffMap: Record<string, any> = {};
    if (staffIds.length) {
      const { data: staffRows } = await sb.from('staff').select('*').in('id', staffIds);
      for (const s of staffRows || []) staffMap[(s as any).id] = s;
    }

    const prepared: Array<{
      entry: any;
      bankCode: string;
      accountNumber: string;
      accountName: string;
      bankName: string;
      amountKobo: number;
      recipientCode?: string;
    }> = [];

    for (const entry of unpaid) {
      const staff = entry.staff_id ? staffMap[entry.staff_id] : null;
      const bankCode = String(entry.bank_code || staff?.bank_code || '').trim();
      const accountNumber = String(entry.account_number || staff?.account_number || '').replace(/\D/g, '');
      const accountName = String(
        entry.account_name || staff?.account_name || entry.staff_name || staff?.name || 'Staff'
      ).trim();
      const bankName = String(entry.bank_name || staff?.bank_name || '').trim();
      const amountMajor = Number(entry.net_salary) || 0;
      if (!bankCode || accountNumber.length < 10) {
        return NextResponse.json(
          {
            error: `Missing bank details for ${entry.staff_name || 'staff'}. Add bank, account number, then retry.`,
            staffName: entry.staff_name,
            entryId: entry.id,
          },
          { status: 400 }
        );
      }
      if (amountMajor <= 0) {
        return NextResponse.json(
          { error: `Invalid net salary for ${entry.staff_name}` },
          { status: 400 }
        );
      }
      prepared.push({
        entry,
        bankCode,
        accountNumber,
        accountName,
        bankName,
        amountKobo: Math.round(amountMajor * 100),
        recipientCode: staff?.paystack_recipient_code || undefined,
      });
    }

    const totalKobo = prepared.reduce((s, p) => s + p.amountKobo, 0);
    const batchRef = `payroll-${businessId.slice(0, 8)}-${Date.now()}`;

    // Debit Busmo wallet first
    const debit = await debitWallet({
      businessId,
      amountKobo: totalKobo,
      purpose: 'payroll',
      reference: batchRef,
      description: `Payroll batch (${prepared.length} staff)`,
      userId: user.id,
      metadata: { entryIds: prepared.map((p) => p.entry.id) },
    });
    if (!debit.ok) {
      const status = debit.error === 'insufficient_balance' ? 402 : 400;
      return NextResponse.json({ error: debit.error }, { status });
    }

    const results: Array<{
      entryId: string;
      staffName: string;
      ok: boolean;
      transferCode?: string;
      error?: string;
    }> = [];

    let paidKobo = 0;

    for (const item of prepared) {
      try {
        let recipientCode = item.recipientCode;
        if (!recipientCode) {
          const rec = await createTransferRecipient({
            name: item.accountName,
            accountNumber: item.accountNumber,
            bankCode: item.bankCode,
          });
          if (!rec.ok) throw new Error(rec.error);
          recipientCode = rec.data.recipient_code;
          if (item.entry.staff_id) {
            await sb
              .from('staff')
              .update({
                paystack_recipient_code: recipientCode,
                bank_code: item.bankCode,
                bank_name: item.bankName,
                account_number: item.accountNumber,
                account_name: item.accountName,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.entry.staff_id);
          }
        }

        const transferRef = `${batchRef}-${item.entry.id}`.slice(0, 100);
        const tr = await initiateTransfer({
          amountKobo: item.amountKobo,
          recipientCode,
          reason: `Salary ${item.entry.period} — ${item.entry.staff_name || 'staff'}`,
          reference: transferRef,
        });
        if (!tr.ok) throw new Error(tr.error);

        await sb
          .from('payroll_entries')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString(),
            paid_from_wallet: true,
            wallet_reference: batchRef,
            paystack_transfer_code: tr.data.transfer_code,
            paystack_transfer_status: tr.data.status,
            bank_code: item.bankCode,
            bank_name: item.bankName,
            account_number: item.accountNumber,
            account_name: item.accountName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.entry.id);

        paidKobo += item.amountKobo;
        results.push({
          entryId: item.entry.id,
          staffName: item.entry.staff_name,
          ok: true,
          transferCode: tr.data.transfer_code,
        });
      } catch (e: any) {
        results.push({
          entryId: item.entry.id,
          staffName: item.entry.staff_name,
          ok: false,
          error: e?.message || 'Transfer failed',
        });
      }
    }

    // Refund wallet for failed transfers
    const failedKobo = totalKobo - paidKobo;
    if (failedKobo > 0) {
      await creditWallet({
        businessId,
        amountKobo: failedKobo,
        purpose: 'refund',
        reference: `${batchRef}-refund`,
        description: 'Payroll transfer failures refunded to wallet',
        userId: user.id,
        metadata: { failed: results.filter((r) => !r.ok) },
      });
    }

    const paid = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    const { getWallet } = await import('@/lib/wallet/business-wallet');
    const wallet = await getWallet(businessId);

    return NextResponse.json({
      ok: failed === 0,
      paid,
      failed,
      total: results.length,
      balance: wallet.balanceMajor,
      balanceKobo: wallet.balanceKobo,
      results,
      batchReference: batchRef,
    });
  } catch (e: any) {
    console.error('[payroll/pay]', e);
    return NextResponse.json({ error: e?.message || 'Payroll pay failed' }, { status: 500 });
  }
}
