import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../mo-sales/_auth';
import { listNigerianBanks } from '@/lib/paystack/transfers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await listNigerianBanks();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ banks: result.banks });
}
