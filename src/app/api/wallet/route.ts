import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../mo-sales/_auth';
import { ensureWallet, listWalletTransactions } from '@/lib/wallet/business-wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = String(req.nextUrl.searchParams.get('businessId') || '').trim();
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const wallet = await ensureWallet(businessId);
    const transactions = await listWalletTransactions(businessId, 40);

    return NextResponse.json({
      balance: wallet.balanceMajor,
      balanceKobo: wallet.balanceKobo,
      currency: wallet.currency,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount_kobo) / 100,
        balanceAfter: Number(t.balance_after_kobo) / 100,
        purpose: t.purpose,
        reference: t.reference,
        description: t.description,
        createdAt: t.created_at,
      })),
    });
  } catch (e: any) {
    console.error('[wallet GET]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
