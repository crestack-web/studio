
'use client';

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
