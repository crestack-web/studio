/**
 * Server-safe admin email role map (no React hooks).
 * Keep in sync with adminAuth ADMIN_EMAIL_ROLES for client UI.
 */
export const ADMIN_EMAIL_ROLES: Record<string, string> = {
  'taheeratorganic@gmail.com': 'SUPER_ADMIN',
  'admin@busmo.io': 'SUPER_ADMIN',
  'majnuncode@gmail.com': 'SUPER_ADMIN',
  'sxeedtxheer@gmail.com': 'SUPER_ADMIN',
  'ahmedusmus@gmail.com': 'SUPER_ADMIN',
  'majnun@busmo.io': 'SUPER_ADMIN',
  'victoria@busmo.io': 'SUPPORT_AGENT',
};
