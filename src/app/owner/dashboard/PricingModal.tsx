'use client';

import React, { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
  currentPlan?: string;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    priceNum: 0,
    cycle: 'forever',
    tag: null,
    features: [
      'Basic inventory tracking',
      'Up to 50 products',
      'Sales tracking',
      'Basic reports',
      '1 staff member',
    ],
    activeBg: '#F3EFFE',
    activeBorder: '#6B3FE7',
    priceColor: '#6B3FE7',
    tagBg: '#6B3FE7',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$25',
    priceNum: 25,
    cycle: '/mo',
    tag: 'Popular',
    features: [
      'Everything in Starter',
      'Up to 500 products',
      'Advanced analytics',
      'Staff management (up to 10)',
      'Inventory forecasting',
      'Multi-branch support (up to 3)',
    ],
    activeBg: '#F3EFFE',
    activeBorder: '#6B3FE7',
    priceColor: '#6B3FE7',
    tagBg: '#6B3FE7',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$80',
    priceNum: 80,
    cycle: '/mo',
    tag: 'Best Value',
    features: [
      'Everything in Standard',
      'Unlimited products',
      'Unlimited staff',
      'AI-powered insights',
      'Custom reports',
      'Unlimited branches',
      'Priority support',
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
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
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#555568', marginBottom: '24px', lineHeight: 1.5 }}>
          Upgrade to unlock premium features and grow your business.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  background: active ? plan.activeBg : '#FAFAFC',
                  border: `1.5px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                  boxShadow: active ? `0 0 0 1px ${plan.activeBorder}30` : 'none',
                }}
              >
                {plan.tag && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '14px',
                      background: plan.tagBg,
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      padding: '2px 9px',
                      borderRadius: '100',
                    }}
                  >
                    {plan.tag}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                      background: active ? plan.activeBorder : 'white',
                      transition: 'all 0.2s',
                    }}
                  >
                    {active && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0A0A0F',
                        lineHeight: 1,
                        marginBottom: '6px',
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {plan.name}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                      {plan.features.slice(0, 3).map((f) => (
                        <span key={f} style={{ fontSize: '11px', color: '#8888A0' }}>
                          • {f}
                        </span>
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

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1.5px solid #E8E8F0',
              background: 'white',
              color: '#555568',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F4F4F8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Continue with Free
          </button>
          <button
            onClick={() => onUpgrade(selectedPlan)}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif',
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
