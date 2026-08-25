import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cert, initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseAdmin() {
  if (getApps().length) return getApp();
  
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const supabaseToken = authHeader.slice(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid Supabase session' }, { status: 401 });
    }

    const firebaseUid = user.user_metadata?.firebase_uid || user.id;

    const firebaseAdmin = getFirebaseAdmin();
    const customToken = await getAuth(firebaseAdmin).createCustomToken(firebaseUid, {
      supabaseId: user.id,
      email: user.email,
    });

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error('Error creating Firebase custom token:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
