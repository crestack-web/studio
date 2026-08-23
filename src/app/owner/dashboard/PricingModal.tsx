'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
  currentPlan?: string;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Busmo Start',
    price: '₦7,500',
    priceNum: 7500,
    cycle: '/mo',
    tag: null as string | null,
    features: [
      'Sales tracking',
      'Expenses & basic inventory',
      'Customers & suppliers',
      'Profit dashboard & basic reports',
      'Limited staff access',
    ],
    activeBg: '#F3EFFE',
    activeBorder: '#6B3FE7',
    priceColor: '#6B3FE7',
    tagBg: '#6B3FE7',
  },
  {
    id: 'standard',
    name: 'Busmo Control',
    price: '₦20,000',
    priceNum: 20000,
    cycle: '/mo',
    tag: 'Most Popular',
    features: [
      'Everything in Start',
      'Advanced inventory & COGS',
      'Cash-flow & bank reconciliation',
      'Credit sales & staff controls',
      'AI business insights',
      'Multiple locations (where supported)',
    ],
    activeBg: '#F3EFFE',
    activeBorder: '#6B3FE7',
    priceColor: '#6B3FE7',
    tagBg: '#6B3FE7',
  },
  {
    id: 'pro',
    name: 'Busmo Scale',
    price: '₦40,000',
    priceNum: 40000,
    cycle: '/mo',
    tag: 'Best Value',
    features: [
      'Everything in Control',
      'Multiple branches',
      'Advanced staff & permissions',
      'Centralized reporting',
      'Priority support',
      'Assisted onboarding',
    ],
    activeBg: '#FEF3C7',
    activeBorder: '#D97706',
    priceColor: '#D97706',
    tagBg: '#D97706',
  },
];

export function PricingModal({ isOpen, onClose, onUpgrade, currentPlan = 'starter' }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0A0A0F' }}>
            Choose Your Plan
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#F4F4F8',
              color: '#8888A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#555568', marginBottom: '24px', lineHeight: 1.5 }}>
          Upgrade to unlock premium features and grow your business.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PLANS.map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  fontFamily: '"DM Sans", sans-serif',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  background: active ? plan.activeBg : '#FAFAFC',
                  border: `1px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                  boxShadow: active ? `0 0 0 1px ${plan.activeBorder}30` : 'none',
                }}
              >
                {plan.tag && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '12px',
                      background: plan.tagBg,
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {plan.tag}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                      background: active ? plan.activeBorder : 'white',
                      transition: 'all 0.2s',
                      marginTop: '2px',
                    }}
                  >
                    {active && (
                      <Check size={10} color="white" strokeWidth={3} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0A0A0F',
                        lineHeight: 1.3,
                        marginBottom: '8px',
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {plan.name}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {plan.features.slice(0, 3).map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8888A0', lineHeight: 1.3 }}>
                          <Check size={10} />
                          <span style={{ flex: 1 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: plan.priceColor,
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    {plan.price}
                  </p>
                  <p style={{ fontSize: '11px', color: '#8888A0', marginTop: '2' }}>{plan.cycle}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #E8E8F0',
              background: 'white',
              color: '#555568',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F4F4F8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Continue with Current Plan
          </button>
          <button
            onClick={() => onUpgrade(selectedPlan)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
