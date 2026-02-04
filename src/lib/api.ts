'use client';

// A mapping of our internal function names to their environment variable keys.
const functionUrlMap: { [key: string]: string | undefined } = {
  initializePayment: process.env.NEXT_PUBLIC_INITIALIZE_PAYMENT_URL,
  verifyPayment: process.env.NEXT_PUBLIC_VERIFY_PAYMENT_URL,
  fetchBankList: process.env.NEXT_PUBLIC_FETCH_BANK_LIST_URL,
  verifyBankAccount: process.env.NEXT_PUBLIC_VERIFY_BANK_ACCOUNT_URL,
};

/**
 * Returns the correct, absolute URL for a Cloud Function endpoint.
 * This function reads from environment variables, which should be configured
 * in a .env file.
 *
 * @param functionName The camelCase name of the function (e.g., 'initializePayment').
 * @returns The absolute URL for the function.
 */
export function getFunctionUrl(functionName: keyof typeof functionUrlMap): string {
  const url = functionUrlMap[functionName];

  if (!url) {
    console.error(`Function URL for '${functionName}' is not defined in environment variables. Please check your .env file.`);
    // Return a path that will fail loudly, making it easier to debug.
    return `/api/undefined_function/${functionName}`;
  }

  return url;
}
