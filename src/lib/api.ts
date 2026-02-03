
'use client';

// In development, this will be the URL from .env (e.g., http://127.0.0.1:5001/...)
// In production, this will be an empty string, and we'll use relative paths.
const functionsBaseUrl = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || '';

/**
 * Determines the correct URL for a Cloud Function endpoint.
 * - In local development, it uses the full base URL from the .env file.
 * - In production, it uses a relative path, relying on Firebase Hosting rewrites.
 * @param path The relative path of the function (e.g., '/initializePayment').
 * @returns The full or relative URL for the function.
 */
export function getFunctionUrl(path: string): string {
  // When deployed to Firebase Hosting, process.env.NODE_ENV will be 'production'.
  // We use relative paths in production, and Firebase Hosting's rewrite rules will direct them to the Cloud Functions.
  if (process.env.NODE_ENV === 'production') {
    return path;
  }
  
  // For local client-side development, we use the full URL to the Cloud Functions emulator.
  // This requires NEXT_PUBLIC_FUNCTIONS_BASE_URL to be set in the .env file.
  if (!functionsBaseUrl) {
    console.error("Functions base URL is not configured. Please set NEXT_PUBLIC_FUNCTIONS_BASE_URL in your .env file for local development.");
    return ''; // Return empty string to cause a controlled failure
  }

  return `${functionsBaseUrl}${path}`;
}
