import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import { safeNextPath } from '@/lib/site-url';

/**
 * Google / OAuth return URL (server-side PKCE exchange).
 * Must use the same cookie store as the browser client that started OAuth.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'), '/owner');
  const oauthError =
    searchParams.get('error_description') || searchParams.get('error');

  const loginError = (msg: string) => {
    const u = new URL('/login', origin);
    u.searchParams.set('error', msg);
    return NextResponse.redirect(u);
  };

  if (oauthError) {
    return loginError(String(oauthError));
  }

  if (/localhost|127\.0\.0\.1/i.test(new URL(request.url).hostname)) {
    return loginError(
      'Sign-in returned to localhost. Set Supabase Site URL to https://www.busmo.io'
    );
  }

  if (!code) {
    return loginError('Missing Google sign-in code. Please try again.');
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession', error.message);
      // Common: wrong Google Client ID/Secret in Supabase, or code_verifier cookie missing
      const hint =
        /code verifier|pkce|code_verifier/i.test(error.message)
          ? 'Sign-in session expired. Close other tabs and try Google once more from https://www.busmo.io'
          : /exchange external code/i.test(error.message)
            ? 'Google could not complete sign-in. In Supabase → Authentication → Providers → Google, confirm Client ID and Secret match Google Cloud (Web client), and Authorized redirect URI is https://YOUR_PROJECT.supabase.co/auth/v1/callback'
            : error.message || 'Google sign-in failed';
      return loginError(hint);
    }

    // Prefer forwarded host behind Vercel
    const forwardedHost = request.headers.get('x-forwarded-host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const base =
      forwardedHost && !/localhost/i.test(forwardedHost)
        ? `${proto}://${forwardedHost}`
        : origin;

    return NextResponse.redirect(`${base}${next}`);
  } catch (e: unknown) {
    console.error('[auth/callback]', e);
    const msg = e instanceof Error ? e.message : 'Google sign-in failed';
    return loginError(msg);
  }
}
