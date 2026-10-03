import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import { safeNextPath } from '@/lib/site-url';

const ONBOARDING_PATH = '/welcome/signup?google=callback';

/**
 * True when this account has not finished Busmo onboarding
 * (no linked business yet).
 */
async function userNeedsOnboarding(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  if (
    meta.onboardingComplete === true ||
    meta.onboarding_complete === true
  ) {
    return false;
  }

  const metaBiz = String(meta.businessId || meta.business_id || '').trim();
  if (metaBiz) return false;

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id, businessId, onboarding_complete, onboardingComplete')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const p = profile as Record<string, unknown>;
      if (p.onboarding_complete === true || p.onboardingComplete === true) {
        return false;
      }
      const bid = String(p.business_id || p.businessId || '').trim();
      if (bid) return false;
    }
  } catch {
    /* column may not exist — fall through */
  }

  // Owned business rows
  for (const col of ['owner_id', 'ownerId', 'user_id'] as const) {
    try {
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq(col, user.id)
        .limit(1);
      if (data && data.length > 0) return false;
    } catch {
      /* ignore missing column */
    }
  }

  // Brand-new Google auth user with no profile → always onboard
  return true;
}

/**
 * Google / OAuth return URL (server-side PKCE exchange).
 * New accounts (no business yet) always go to onboarding.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = safeNextPath(searchParams.get('next'), '/owner');
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
      const hint =
        /code verifier|pkce|code_verifier/i.test(error.message)
          ? 'Sign-in session expired. Close other tabs and try Google once more from https://www.busmo.io'
          : /exchange external code/i.test(error.message)
            ? 'Google could not complete sign-in. In Supabase → Authentication → Providers → Google, confirm Client ID and Secret match Google Cloud (Web client), and Authorized redirect URI is https://YOUR_PROJECT.supabase.co/auth/v1/callback'
            : error.message || 'Google sign-in failed';
      return loginError(hint);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const needsOnboarding = await userNeedsOnboarding(supabase, user);
      if (needsOnboarding) {
        next = ONBOARDING_PATH;
      } else if (
        next.includes('/welcome/signup') &&
        !needsOnboarding
      ) {
        // Returning user who started from signup page → dashboard
        next = '/owner';
      }
    }

    const forwardedHost = request.headers.get('x-forwarded-host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const base =
      forwardedHost && !/localhost/i.test(forwardedHost)
        ? `${proto}://${forwardedHost}`
        : origin;

    // next may include query string (onboarding)
    return NextResponse.redirect(`${base}${next.startsWith('/') ? next : `/${next}`}`);
  } catch (e: unknown) {
    console.error('[auth/callback]', e);
    const msg = e instanceof Error ? e.message : 'Google sign-in failed';
    return loginError(msg);
  }
}
