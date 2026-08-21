'use client';
import { getSupabase } from '@/lib/supabase';

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(_auth: any, email: string, password: string): void {
  // CRITICAL: Call signIn directly. Do NOT use 'await'.
  const supabase = getSupabase();
  supabase.auth.signUp({ email, password });
  // Code continues immediately. Auth state change is handled by onAuthStateChange listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(_auth: any, email: string, password: string): void {
  // CRITICAL: Call signIn directly. Do NOT use 'await'.
  const supabase = getSupabase();
  supabase.auth.signInWithPassword({ email, password });
  // Code continues immediately. Auth state change is handled by onAuthStateChange listener.
}
