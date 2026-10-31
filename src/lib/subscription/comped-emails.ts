/**
 * Emails with complimentary full product access (no billing required).
 * Checked in resolveUserAccess — also persist via admin grant when possible.
 */
export const COMPED_LIFETIME_EMAILS = new Set(
  [
    'busmohq@gmail.com',
  ].map((e) => e.toLowerCase().trim())
);

export function isCompedLifetimeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return COMPED_LIFETIME_EMAILS.has(email.toLowerCase().trim());
}
