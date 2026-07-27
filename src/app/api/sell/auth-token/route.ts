import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify the user exists
    const userRecord = await auth.getUser(uid);

    // Generate a custom token valid for MO Sell
    const customToken = await auth.createCustomToken(uid, {
      source: 'busmo',
      email: userRecord.email || undefined,
    });

    return NextResponse.json({
      token: customToken,
      uid: uid,
      email: userRecord.email || null,
    });
  } catch (error: unknown) {
    console.error('Auth token generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
