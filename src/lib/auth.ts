/**
 * Authentication Library
 * Real Firebase authentication for staff and users
 */

import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

/**
 * Send OTP login code to staff email
 */
export async function sendStaffLoginOTP(email: string): Promise<{
  success: boolean;
  staffId?: string;
  error?: string;
}> {
  try {
    const sendOTP = httpsCallable(functions, 'sendOtpLogin');
    const result = await sendOTP({ email });
    const data = result.data as any;
    
    return {
      success: true,
      staffId: data.staffId,
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
    const verifyOTP = httpsCallable(functions, 'verifyOtpLogin');
    const result = await verifyOTP({ email, otp, staffId });
    const data = result.data as any;
    
    if (data.token) {
      // Store token for authenticated requests
      localStorage.setItem('staffToken', data.token);
    }
    
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      error: error.code === 'INVALID_OTP' 
        ? 'Invalid verification code. Please try again.'
        : error.message || 'Verification failed',
    };
  }
}

/**
 * Get current authenticated user (if any)
 */
export function getCurrentUser(): any {
  const token = localStorage.getItem('staffToken');
  if (!token) return null;
  
  // TODO: Decode and validate JWT token
  // For now, just return that user is authenticated
  return { isAuthenticated: true };
}

/**
 * Logout current user
 */
export function logout(): void {
  localStorage.removeItem('staffToken');
  window.location.href = '/staff/login';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}
