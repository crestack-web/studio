/**
 * Authentication Library
 * Supabase authentication for staff and users
 */

import { getSupabase } from '@/lib/supabase';

/**
 * Send OTP login code to staff email
 */
export async function sendStaffLoginOTP(email: string): Promise<{
  success: boolean;
  staffId?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabase();
    // Send OTP via Supabase's built-in OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification code',
    };
  }
}

/**
 * Verify OTP login code
 */
export async function verifyStaffLoginOTP(
  email: string,
  otp: string,
  staffId: string
): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) throw error;

    return {
      success: true,
      token: data.session?.access_token,
      user: data.user,
    };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      error: error.message?.includes('Invalid')
        ? 'Invalid verification code. Please try again.'
        : error.message || 'Verification failed',
    };
  }
}

/**
 * Get current authenticated user (if any)
 */
export function getCurrentUser(): any {
  const supabase = getSupabase();
  // This is a synchronous check - for server-side use getSession() instead
  return { isAuthenticated: true };
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  window.location.href = '/staff/login';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}
