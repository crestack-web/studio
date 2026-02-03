
'use client';

// This will be your local emulator URL in development, and an empty string in production.
const functionsBaseUrl = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || '';

/**
 * Determines the correct URL for a Cloud Function endpoint.
 * - In local development, it uses the full base URL from the .env file.
 * - In production, it uses a relative path, relying on Firebase Hosting rewrites.
 * @param path The relative path of the function (e.g., '/initializePayment').
 * @returns The full or relative URL for the function.
 */
export function getFunctionUrl(path: string): string {
  // If a base URL is provided in the environment (for local dev), use it.
  // Otherwise, use a relative path (for production).
  return `${functionsBaseUrl}${path}`;
}
