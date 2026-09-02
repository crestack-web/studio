export type AdminEmailTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'lifecycle' | 'ops' | 'custom';
  /** ready = can send from admin with email+name only */
  readiness: 'ready' | 'params_required';
  defaultSubject: string;
};

export const ADMIN_EMAIL_TEMPLATES: AdminEmailTemplate[] = [
  {
    id: 'mo_sales_announcement',
    name: 'MO Sales announcement',
    description:
      'Rollout announcement: WhatsApp AI sales, orders, payment links, full business context. Selected businesses from 15 Sep 2026.',
    category: 'product',
    readiness: 'ready',
    defaultSubject: 'MO Sales is coming — selected businesses go live 15 September 2026',
  },
  {
    id: 'custom_manual',
    name: 'Manual / custom email',
    description: 'Write your own subject and body. Wrapped in standard Busmo email styling.',
    category: 'custom',
    readiness: 'ready',
    defaultSubject: '',
  },
  {
    id: 'custom_mo_draft',
    name: 'Write with MO',
    description: 'Describe what you want to say; MO drafts subject + HTML body in Busmo style for you to review and send.',
    category: 'custom',
    readiness: 'ready',
    defaultSubject: '',
  },
  {
    id: 'welcome',
    name: 'Welcome email',
    description: 'New owner welcome (uses existing welcome template pipeline where available).',
    category: 'lifecycle',
    readiness: 'params_required',
    defaultSubject: 'Welcome to Busmo',
  },
  {
    id: 'trial_reminder',
    name: 'Trial reminder',
    description: 'Remind users their trial is ending soon.',
    category: 'lifecycle',
    readiness: 'params_required',
    defaultSubject: 'Your Busmo trial is ending soon',
  },
  {
    id: 'subscription_receipt',
    name: 'Subscription receipt',
    description: 'Payment/receipt confirmation for a plan.',
    category: 'lifecycle',
    readiness: 'params_required',
    defaultSubject: 'Your Busmo subscription receipt',
  },
  {
    id: 'password_reset_confirmation',
    name: 'Password reset confirmation',
    description: 'Confirm that a password was changed.',
    category: 'ops',
    readiness: 'params_required',
    defaultSubject: 'Your Busmo password was changed',
  },
  {
    id: 'daily_business_summary',
    name: 'Daily business summary',
    description: 'Daily sales/ops summary (needs business metrics params).',
    category: 'ops',
    readiness: 'params_required',
    defaultSubject: 'Your daily Busmo summary',
  },
];

export function getAdminEmailTemplate(id: string): AdminEmailTemplate | undefined {
  return ADMIN_EMAIL_TEMPLATES.find((t) => t.id === id);
}
