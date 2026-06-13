
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase app if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

// A mapping of our internal function names to their proxied API paths.
const functionPathMap: { [key: string]: string } = {
  initializePayment: '/api/initializePayment',
  verifyPayment: '/api/verifyPayment',
  fetchBankList: '/api/fetchBankList',
  verifyBankAccount: '/api/verifyBankAccount',
  sendAdminSignInLink: '/api/sendAdminSignInLink',
  sendStaffSignInLink: '/api/sendStaffSignInLink',
  sendEmailVerification: '/api/sendEmailVerification',
  sendPasswordReset: '/api/sendPasswordReset',
  claimReferral: '/api/claimReferral',
  ensureReferralCode: '/api/ensureReferralCode',
  adminRecordReferralPayout: '/api/adminRecordReferralPayout',
  sendOtpLogin: '/api/sendOtpLogin', // Added for OTP email
  createProduct: '/api/createProduct',
  getProducts: '/api/getProducts',
};

/**
 * Returns the correct, relative API path for a Cloud Function endpoint.
 * This path will be intercepted by the Next.js rewrites configuration.
 *
 * @param functionName The camelCase name of the function (e.g., 'initializePayment').
 * @returns The relative API path for the function.
 */
export function getFunctionUrl(functionName: keyof typeof functionPathMap): string {
  const path = functionPathMap[functionName];

  if (!path) {
    console.error(`Function path for '${functionName}' is not defined.`);
    return `/api/undefined_function/${functionName}`;
  }

  return path;
}

export const addProduct = async (productData: any) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const createProduct = httpsCallable(functions, 'createProduct');
  try {
    const result = await createProduct(productData);
    return result.data;
  } catch (error: any) {
    console.error('Error adding product:', error);
    console.error('Add product error code:', error?.code || 'unknown');
    console.error('Add product error details:', error?.message || error);
    if (error?.details) {
      console.error('Add product error additional details:', error.details);
    }
    throw error;
  }
};

export const getProducts = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const getProductsFn = httpsCallable(functions, 'getProducts');
  try {
    const result = await getProductsFn();
    return result.data;
  } catch (error: any) {
    console.error('Error getting products:', error);
    console.error('Get products error code:', error?.code || 'unknown');
    console.error('Get products error details:', error?.message || error);
    if (error?.details) {
      console.error('Get products error additional details:', error.details);
    }
    throw error;
  }
};
