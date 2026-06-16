/**
 * Payment Service
 * Integrates Paystack for Nigerian users and Whop for international users
 */

import { getUserCountryCode } from './currency';

export interface PaymentConfig {
  amount: number;
  currency: string;
  email: string;
  paymentMethod?: 'card' | 'bank_transfer' | 'ussd';
  metadata?: Record<string, any>;
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
}

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// Whop Configuration
const WHOP_API_KEY = process.env.WHOP_PAYEMENT_API || '';

/**
 * Initialize Paystack payment for Nigerian users
 */
export async function initializePaystackPayment(config: PaymentConfig): Promise<void> {
  if (typeof window === 'undefined') return;

  // Check if Paystack public key is configured
  if (!PAYSTACK_PUBLIC_KEY) {
    console.error('Paystack public key not configured');
    throw new Error('Payment gateway not configured. Please contact support.');
  }

  // Load Paystack script if not already loaded
  if (!(window as any).PaystackPop) {
    await loadPaystackScript();
  }

  // Convert amount from USD to NGN if currency is USD
  let amountInKobo = config.amount * 100; // Default: assume amount is already in target currency
  if (config.currency === 'USD') {
    // Convert USD to NGN (1 USD = 1,550 NGN)
    const USD_TO_NGN_RATE = 1550;
    amountInKobo = config.amount * USD_TO_NGN_RATE * 100;
  }

  const paystack = (window as any).PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: amountInKobo, // Paystack expects amount in kobo (smallest currency unit)
    currency: config.currency === 'USD' ? 'NGN' : (config.currency || 'NGN'), // Always use NGN for Paystack
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
    // Check if script is already loaded
    if ((window as any).PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      console.log('Paystack script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      reject(new Error('Failed to load payment gateway script'));
    };
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
  // Always use Paystack for all users
  return 'paystack';
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
