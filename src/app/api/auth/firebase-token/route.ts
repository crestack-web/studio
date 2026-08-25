import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminAuth, isAdminInitialized } from '@/lib/firebase-admin';

/**
 * Exchange a valid Supabase access token for a Firebase custom token
 * so the client can use Firestore under security rules (request.auth).
 *
 * POST { accessToken?: string }  — or Authorization: Bearer <supabase_jwt>
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin is not configured on the server' },
        { status: 503 }
      );
    }

    let accessToken =
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';

    try {
      const body = await request.json();
      if (body?.accessToken) accessToken = String(body.accessToken);
    } catch {
      /* no body */
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Supabase access token' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid Supabase session' },
        { status: 401 }
      );
    }

    const user = data.user;
    const auth = getAdminAuth();

    // Ensure a Firebase Auth user exists with the same UID as Supabase
    try {
      await auth.getUser(user.id);
    } catch {
      try {
        await auth.createUser({
          uid: user.id,
          email: user.email || undefined,
          emailVerified: !!user.email_confirmed_at,
          displayName:
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            undefined,
        });
      } catch (createErr: any) {
        // Race: user may have been created between get and create
        if (createErr?.code !== 'auth/uid-already-exists') {
          console.error('[firebase-token] createUser failed', createErr);
          return NextResponse.json(
            { error: createErr?.message || 'Failed to provision Firebase user' },
            { status: 500 }
          );
        }
      }
    }

    const claims: Record<string, string> = {};
    if (user.user_metadata?.role) {
      claims.role = String(user.user_metadata.role);
    }
    if (user.user_metadata?.businessId) {
      claims.businessId = String(user.user_metadata.businessId);
    }

    const firebaseToken = await auth.createCustomToken(user.id, claims);

    return NextResponse.json({ firebaseToken, uid: user.id });
  } catch (err: any) {
    console.error('[firebase-token]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to mint Firebase token' },
      { status: 500 }
    );
  }
}
