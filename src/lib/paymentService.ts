/**
 * Payment Service
 * Integrates Paystack for Nigerian users and Whop for international users
 */

import { getUserCountryCode } from './currency';

export interface PaymentConfig {
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, any>;
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
}

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// Whop Configuration
const WHOP_API_KEY = process.env.WHOP_PAYEMENT_API || '';

/**
 * Initialize Paystack payment for Nigerian users
 */
export async function initializePaystackPayment(config: PaymentConfig): Promise<void> {
  if (typeof window === 'undefined') return;

  // Load Paystack script if not already loaded
  if (!(window as any).PaystackPop) {
    await loadPaystackScript();
  }

  const paystack = (window as any).PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: config.amount * 100, // Paystack expects amount in kobo (smallest currency unit)
    currency: config.currency,
    metadata: config.metadata,
    callback: function (response: any) {
      // Payment successful
      config.onSuccess?.(response.reference);
    },
    onClose: function () {
      // Payment modal closed
      config.onClose?.();
    },
  });

  paystack.openIframe();
}

/**
 * Load Paystack script dynamically
 */
function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Initialize Whop payment for international users
 */
export async function initializeWhopPayment(config: PaymentConfig): Promise<void> {
  if (typeof window === 'undefined') return;

  // For Whop, we redirect to their checkout page
  // The user will need to set up their product in Whop dashboard
  // and configure the redirect URLs
  const whopCheckoutUrl = 'https://whop.com/checkout/';
  
  // Create metadata URL parameter
  const metadata = encodeURIComponent(JSON.stringify(config.metadata || {}));
  const params = new URLSearchParams({
    email: config.email,
    amount: config.amount.toString(),
    currency: config.currency,
    metadata,
  });

  // Redirect to Whop checkout
  window.location.href = `${whopCheckoutUrl}?${params.toString()}`;
}

/**
 * Verify Paystack transaction
 */
export async function verifyPaystackTransaction(reference: string): Promise<any> {
  try {
    const response = await fetch('/api/payments/verify-paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify transaction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    throw error;
  }
}

/**
 * Get appropriate payment gateway based on user country
 */
export function getPaymentGateway(): 'paystack' | 'whop' {
  const countryCode = getUserCountryCode();
  
  // Use Paystack for Nigeria, Whop for other countries
  if (countryCode === 'NG') {
    return 'paystack';
  }
  
  return 'whop';
}

/**
 * Initialize payment based on user country
 */
export async function initializePayment(config: PaymentConfig): Promise<void> {
  const gateway = getPaymentGateway();
  
  if (gateway === 'paystack') {
    await initializePaystackPayment(config);
  } else {
    await initializeWhopPayment(config);
  }
}

/**
 * Get payment gateway name for display
 */
export function getPaymentGatewayName(): string {
  const gateway = getPaymentGateway();
  return gateway === 'paystack' ? 'Paystack' : 'Whop';
}
