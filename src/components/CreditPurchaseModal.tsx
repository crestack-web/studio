'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/owner/dashboard/AppContext';
import { getUserCountryCode } from '@/lib/currency';
import styles from './CreditPurchaseModal.module.css';

interface CreditPack {
  credits: number;
  amount: number;
  name: string;
  description?: string;
  popular?: boolean;
}

const CREDIT_PACKS: CreditPack[] = [
  { credits: 1500, amount: 5 * 1500, name: 'Starter Pack', description: 'Perfect for trying out MO' },
  { credits: 3000, amount: 10 * 1500, name: 'Standard Pack', description: 'Great for regular use' },
  { credits: 5000, amount: 15 * 1500, name: 'Premium Pack', description: 'Best value for businesses', popular: true },
];

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreditPurchaseModal({ isOpen, onClose, onSuccess }: CreditPurchaseModalProps) {
  const { user } = useApp();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('US');

  // Detect user country code on mount
  useEffect(() => {
    const detectedCountry = getUserCountryCode();
    setCountryCode(detectedCountry);
  }, []);

  const handlePurchase = async (packKey: string, pack: CreditPack) => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setSelectedPack(packKey);
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Initializing payment for pack:', packKey, 'amount:', pack.amount);
      
      // Call API route to initialize payment
      const response = await fetch('/api/payments/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: packKey,
          userId: user.id,
          email: user.email,
          countryCode: countryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      if (data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
      setSelectedPack(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.moToken}>
              <img src="/mo-thinking.svg" alt="MO" className={styles.moLogo} />
            </div>
            <div>
              <h2>Purchase MO Credits</h2>
              <p className={styles.headerSubtitle}>Unlock AI-powered business insights</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.packGrid}>
            {CREDIT_PACKS.map((pack, index) => {
              const packKey = ['starter', 'standard', 'premium'][index];
              return (
                <div
                  key={packKey}
                  className={`${styles.packCard} ${pack.popular ? styles.popular : ''}`}
                  onClick={() => !isProcessing && handlePurchase(packKey, pack)}
                >
                  {pack.popular && <div className={styles.popularBadge}>Most Popular</div>}

                  <div className={styles.packName}>{pack.name}</div>

                  <div className={styles.packCredits}>
                    {pack.credits.toLocaleString()}
                    <span className={styles.creditsLabel}>credits</span>
                  </div>

                  <div className={styles.packPrice}>
                    ₦{pack.amount.toLocaleString()}
                  </div>

                  {pack.description && (
                    <div className={styles.packDescription}>
                      {pack.description}
                    </div>
                  )}

                  {isProcessing && selectedPack === packKey ? (
                    <button className={styles.purchaseButton} disabled>
                      Processing...
                    </button>
                  ) : (
                    <button className={styles.purchaseButton}>
                      Purchase
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <p className={styles.secureNote}>
              🔒 Secure payment powered by Paystack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
