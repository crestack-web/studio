'use client';

/**
 * Returns the correct, relative URL path for a Cloud Function endpoint.
 * In local development, Next.js rewrites will proxy this path to the full function URL.
 * In production, Firebase Hosting rewrites will proxy this path to the function.
 * @param functionName The name of the function (e.g., 'initializePayment').
 * @returns The relative URL path for the function (e.g., '/api/initializePayment').
 */
export function getFunctionUrl(functionName: string): string {
  return `/api/${functionName}`;
}
