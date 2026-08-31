import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const MO_SELL_APP_URL = process.env.MO_SELL_APP_URL?.replace(/\/$/, '') || 'https://mo-sell.store';

function handoffSecret() {
  return (
    process.env.MO_SELL_HANDOFF_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ''
  );
}

function signPayload(payload: object): string {
  const secret = handoffSecret();
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyHandoffToken(token: string): {
  email: string;
  fullName?: string;
  busmoUserId?: string;
  exp: number;
} | null {
  const secret = handoffSecret();
  if (!secret || !token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data?.email || !data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

/** Issue a short-lived handoff token for Mo-sell signup/login */
export async function POST(req: NextRequest) {
  try {
    if (!handoffSecret()) {
      return NextResponse.json({ error: 'Handoff not configured' }, { status: 503 });
    }
    const user = await requireUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email.split('@')[0];
    const token = signPayload({
      email: user.email.toLowerCase(),
      fullName,
      busmoUserId: user.id,
      exp: Date.now() + 10 * 60 * 1000,
    });
    const redirectUrl = `${MO_SELL_APP_URL}/auth/busmo-callback?token=${encodeURIComponent(token)}`;
    return NextResponse.json({ token, redirectUrl });
  } catch (e: any) {
    console.error('[mo-sell/handoff]', e?.message);
    return NextResponse.json({ error: 'Failed to create handoff' }, { status: 500 });
  }
}

/** Mo-sell verifies token via this GET */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    const data = verifyHandoffToken(token);
    if (!data) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({
      email: data.email,
      fullName: data.fullName || null,
      busmoUserId: data.busmoUserId || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Verify failed' }, { status: 500 });
  }
}
