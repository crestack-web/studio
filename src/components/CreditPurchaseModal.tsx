'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/owner/dashboard/AppContext';
import { initializePaystackPayment } from '@/lib/paymentService';
import styles from './CreditPurchaseModal.module.css';

interface CreditPack {
  credits: number;
  amount: number;
  name: string;
  description?: string;
  popular?: boolean;
}

const CREDIT_PACKS: CreditPack[] = [
  { credits: 500, amount: 500, name: 'Starter Pack', description: 'Perfect for trying out MO' },
  { credits: 1500, amount: 1200, name: 'Standard Pack', description: 'Great for regular use' },
  { credits: 3000, amount: 2000, name: 'Popular Pack', description: 'Best value for businesses', popular: true },
  { credits: 5000, amount: 3000, name: 'Premium Pack', description: 'Maximum flexibility' },
  { credits: -1, amount: 5000, name: 'Unlimited (Pro)', description: 'Unlimited MO access forever' },
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

  const handlePurchase = async (packKey: string, pack: CreditPack) => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setSelectedPack(packKey);
    setIsProcessing(true);
    setError(null);

    try {
      // Initialize payment with Paystack
      await initializePaystackPayment({
        amount: pack.amount,
        currency: 'NGN',
        email: user.email,
        metadata: {
          pack: packKey,
          userId: user.id,
          credits: pack.credits,
        },
        onSuccess: async (reference: string) => {
          // Payment successful - callback will handle credit update
          onSuccess?.();
          onClose();
        },
        onClose: () => {
          setIsProcessing(false);
          setSelectedPack(null);
        },
      });
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
      setIsProcessing(false);
      setSelectedPack(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Purchase MO Credits</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            Get more credits to unlock MO's powerful business insights
          </p>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.packGrid}>
            {CREDIT_PACKS.map((pack, index) => {
              const packKey = ['starter', 'standard', 'popular', 'premium', 'unlimited'][index];
              return (
                <div
                  key={packKey}
                  className={`${styles.packCard} ${pack.popular ? styles.popular : ''} ${selectedPack === packKey ? styles.selected : ''}`}
                  onClick={() => !isProcessing && handlePurchase(packKey, pack)}
                >
                  {pack.popular && <div className={styles.popularBadge}>Most Popular</div>}
                  
                  <div className={styles.packName}>{pack.name}</div>
                  
                  <div className={styles.packCredits}>
                    {pack.credits === -1 ? '∞' : pack.credits.toLocaleString()}
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
