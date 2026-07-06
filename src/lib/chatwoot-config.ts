export interface ChatwootConfig {
  baseUrl: string;
  accountId: string;
  inboxId: string;
  apiAccessToken: string;
  hmacSecret: string;
  websiteToken: string;
  enabled: boolean;
}

export interface ChatwootUser {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  businessId?: string;
  subscriptionPlan?: string;
  workspaceId?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChatwootConversation {
  id: number;
  status: string;
  assignedAgentId?: number;
  tags?: string[];
}

export const CHATWOOT_CONFIG: ChatwootConfig = {
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_URL || 'https://support.busmo.io',
  accountId: process.env.NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID || '',
  inboxId: process.env.NEXT_PUBLIC_CHATWOOT_INBOX_ID || '',
  apiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN || '',
  hmacSecret: process.env.CHATWOOT_HMAC_SECRET || '',
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  enabled: process.env.NEXT_PUBLIC_CHATWOOT_ENABLED === 'true',
};

export const CHATWOOT_BRANDING = {
  primaryColor: '#6B3FE7',
  secondaryColor: '#8B5CF6',
  backgroundColor: '#FAFAFC',
  textColor: '#1A1A2E',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  logo: process.env.NEXT_PUBLIC_BUSMO_LOGO || '/busmogo.png',
  welcomeMessage: 'Hi 👋 I\'m Ask Mo. I can answer questions, help you use Busmo, or connect you with our support team if needed.',
};

export const CHATWOOT_INBOXES = {
  WEBSITE_SUPPORT: 1,
  SALES: 2,
  GENERAL_CONTACT: 3,
};

export const CHATWOOT_TAGS = {
  BILLING: 'billing',
  TECHNICAL: 'technical',
  FEATURE_REQUEST: 'feature-request',
  BUG: 'bug',
  SALES: 'sales',
  FEEDBACK: 'feedback',
  ENTERPRISE: 'enterprise',
  URGENT: 'urgent',
  ESCALATED: 'escalated',
};

export const ESCALATION_TRIGGERS = {
  keywords: ['human', 'agent', 'support', 'talk to someone', 'speak to', 'representative'],
  topics: ['billing', 'payment', 'refund', 'cancel', 'account access', 'bug', 'error'],
  maxFailedAttempts: 2,
  lowConfidenceThreshold: 0.6,
};