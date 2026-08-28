/**
 * Server-safe admin email role map (no React hooks).
 * Single source of truth for admin whitelist + roles.
 */
export const ADMIN_EMAIL_ROLES: Record<string, string> = {
  'taheeratorganic@gmail.com': 'SUPER_ADMIN',
  'admin@busmo.io': 'SUPER_ADMIN',
  'majnuncode@gmail.com': 'SUPER_ADMIN',
  'sxeedtxheer@gmail.com': 'SUPER_ADMIN',
  'ahmedusmus@gmail.com': 'SUPER_ADMIN',
  'majnun@busmo.io': 'SUPER_ADMIN',
  'victoria@busmo.io': 'SUPPORT_AGENT',
  'crestack@gmail.com': 'SUPER_ADMIN',
};

export const ADMIN_EMAILS = Object.keys(ADMIN_EMAIL_ROLES);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() in ADMIN_EMAIL_ROLES;
}

export function getAdminRole(email: string | null | undefined): string {
  if (!email) return 'SUPPORT_AGENT';
  return ADMIN_EMAIL_ROLES[email.toLowerCase().trim()] || 'SUPPORT_AGENT';
}
