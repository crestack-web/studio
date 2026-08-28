import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../_auth';
import {
  ensureTrialCredits,
  getMoCreditConfig,
  listMoCreditPackages,
  usageThisMonth,
  usageToday,
} from '@/lib/services/whatsapp/mo-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const [wallet, cfg, packages, monthUsed, dayUsed] = await Promise.all([
      ensureTrialCredits(businessId),
      getMoCreditConfig(),
      listMoCreditPackages(),
      usageThisMonth(businessId),
      usageToday(businessId),
    ]);

    const estConversations =
      cfg.creditsPerResponse > 0
        ? Math.floor(wallet.availableCredits / cfg.creditsPerResponse)
        : 0;

    return NextResponse.json({
      trialCredits: wallet.trialCreditsGranted,
      trialCreditsUsed: wallet.trialCreditsUsed,
      trialCreditsRemaining: wallet.trialCreditsRemaining,
      purchasedCredits: wallet.purchasedCredits,
      purchasedCreditsUsed: wallet.purchasedCreditsUsed,
      purchasedCreditsRemaining: wallet.purchasedCreditsRemaining,
      usedCredits: wallet.totalCreditsUsed,
      availableCredits: wallet.availableCredits,
      usageThisMonth: monthUsed,
      usageToday: dayUsed,
      status: wallet.status,
      trialStartedAt: wallet.trialStartedAt,
      lowCreditThreshold: cfg.lowCreditPct,
      criticalCreditThreshold: cfg.criticalCreditPct,
      creditsPerResponse: cfg.creditsPerResponse,
      currency: cfg.currency,
      estimatedResponsesRemaining: estConversations,
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        credits: p.credits,
        priceKobo: p.priceKobo,
        currency: p.currency,
        description: p.description,
        // Prices are server-defined; frontend must not invent them
        priceDisplay: `${p.currency} ${(p.priceKobo / 100).toLocaleString()}`,
      })),
    });
  } catch (e: any) {
    console.error('[mo-sales/credits]', e?.message);
    return NextResponse.json({ error: 'Failed to load credits' }, { status: 500 });
  }
}
