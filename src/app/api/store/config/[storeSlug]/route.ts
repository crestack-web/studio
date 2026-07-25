import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/store/config/[storeSlug]
 * Public — returns store config for a given slug.
 *
 * Strategy:
 * 1. Try collectionGroup('store') query (requires index — may be building).
 * 2. If that fails or returns empty, scan businesses collection directly
 *    by iterating through the top-level slug-to-businessId mapping stored
 *    in a top-level 'storeIndex' collection we write on every store save.
 * 3. If storeIndex doc exists, read the config directly by path.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;

  if (!storeSlug) {
    return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    let data: FirebaseFirestore.DocumentData | null = null;
    let businessId = '';

    // ── Strategy 1: storeIndex lookup (O(1), always reliable) ────────────────
    // Written by SellSettingsPage and StoreSetupWizard on every save.
    // Path: storeIndex/{storeSlug} → { businessId }
    try {
      const idxDoc = await db.collection('storeIndex').doc(storeSlug).get();
      if (idxDoc.exists) {
        const bId = idxDoc.data()?.businessId as string | undefined;
        if (bId) {
          const configSnap = await db
            .collection('businesses').doc(bId)
            .collection('store').doc('config')
            .get();
          if (configSnap.exists) {
            data = configSnap.data()!;
            businessId = bId;
          }
        }
      }
    } catch {
      // storeIndex lookup failed, fall through to collectionGroup
    }

    // ── Strategy 2: collectionGroup query (fallback) ──────────────────────────
    if (!data) {
      try {
        const snap = await db.collectionGroup('store')
          .where('storeSlug', '==', storeSlug)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          data = doc.data();
          businessId = doc.ref.path.split('/')[1];
        }
    } catch {
      // collectionGroup query failed (index may be building)
    }
    }

    if (!data) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const publicConfig = {
      businessId,
      storeSlug:           data.storeSlug,
      storeName:           data.storeName,
      logoUrl:             data.logoUrl ?? null,
      primaryColor:        data.primaryColor ?? '#0EA5E9',
      secondaryColor:      data.secondaryColor ?? '#6366F1',
      businessCategory:    data.businessCategory ?? '',
      currency:            data.currency ?? 'NGN',
      contactEmail:        data.contactEmail ?? '',
      contactPhone:        data.contactPhone ?? '',
      status:              data.status ?? 'draft',
      theme:               data.theme ?? 'classic',
      tagline:             data.tagline ?? null,
      storePolicy:         data.storePolicy ?? null,
      sections:            data.sections ?? null,
      enabledProductTypes: data.enabledProductTypes ?? ['physical'],
      pickupLocations:     data.pickupLocations ?? [],
      customDomain:        data.customDomain ?? null,
      customDomainStatus:  data.customDomainStatus ?? 'pending',
      paystackPublicKey:   data.paystackPublicKey ?? '',
    };

    return NextResponse.json(publicConfig, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
