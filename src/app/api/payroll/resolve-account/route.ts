import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../mo-sales/_auth';
import { resolveAccount } from '@/lib/paystack/transfers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');
  const bankCode = String(body.bankCode || '').trim();
  if (accountNumber.length < 10 || !bankCode) {
    return NextResponse.json({ error: 'accountNumber (10 digits) and bankCode required' }, { status: 400 });
  }

  const result = await resolveAccount(accountNumber, bankCode);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    accountNumber: result.data.account_number,
    accountName: result.data.account_name,
  });
}
