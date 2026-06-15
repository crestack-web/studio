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
  { credits: 1500, amount: 1500, name: 'Starter Pack', description: 'Perfect for trying out MO' },
  { credits: 3000, amount: 3000, name: 'Standard Pack', description: 'Great for regular use' },
  { credits: 5000, amount: 5000, name: 'Premium Pack', description: 'Best value for businesses', popular: true },
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
      console.log('Initializing payment for pack:', packKey, 'amount:', pack.amount);
      
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
          console.log('Payment successful with reference:', reference);
          // Payment successful - callback will handle credit update
          onSuccess?.();
          onClose();
        },
        onClose: () => {
          console.log('Payment modal closed');
          setIsProcessing(false);
          setSelectedPack(null);
        },
      });
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
              <span className={styles.moEmoji}>🤖</span>
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
              const gradientColors = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              ];
              return (
                <div
                  key={packKey}
                  className={`${styles.packCard} ${pack.popular ? styles.popular : ''} ${selectedPack === packKey ? styles.selected : ''}`}
                  style={{ background: pack.popular ? gradientColors[index] : 'var(--bg-2)' }}
                  onClick={() => !isProcessing && handlePurchase(packKey, pack)}
                >
                  {pack.popular && <div className={styles.popularBadge}>Most Popular</div>}

                  <div className={styles.packIcon}>
                    <span className={styles.packEmoji}>{index === 0 ? '🌱' : index === 1 ? '🚀' : '💎'}</span>
                  </div>

                  <div className={styles.packName} style={{ color: pack.popular ? 'white' : 'var(--text-1)' }}>{pack.name}</div>

                  <div className={styles.packCredits} style={{ color: pack.popular ? 'white' : 'var(--primary)' }}>
                    {pack.credits.toLocaleString()}
                    <span className={styles.creditsLabel} style={{ color: pack.popular ? 'rgba(255,255,255,0.8)' : 'var(--text-2)' }}>credits</span>
                  </div>

                  <div className={styles.packPrice} style={{ color: pack.popular ? 'white' : 'var(--text-1)' }}>
                    ₦{pack.amount.toLocaleString()}
                  </div>

                  {pack.description && (
                    <div className={styles.packDescription} style={{ color: pack.popular ? 'rgba(255,255,255,0.9)' : 'var(--text-2)' }}>
                      {pack.description}
                    </div>
                  )}

                  {isProcessing && selectedPack === packKey ? (
                    <button className={styles.purchaseButton} disabled style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>
                      Processing...
                    </button>
                  ) : (
                    <button className={styles.purchaseButton} style={{ background: pack.popular ? 'white' : 'var(--primary)', color: pack.popular ? 'var(--primary)' : 'white' }}>
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
