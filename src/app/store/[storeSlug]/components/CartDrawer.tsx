'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

interface Props { storeSlug: string; currency: string; }

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function CartDrawer({ storeSlug, currency }: Props) {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, totalItems } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 90,
            backdropFilter: 'blur(2px)',
            animation: 'sfFadeIn 0.18s ease both',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        height: '100%', width: 400, maxWidth: '100vw',
        background: 'var(--sf-surface)',
        borderLeft: '1px solid var(--sf-border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 91,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-16px 0 40px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--sf-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sf-text-1)' }}>
              Your Cart
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--sf-text-3)', marginTop: 2 }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--sf-border)',
              background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sf-text-2)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '40px 0', color: 'var(--sf-text-3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem' }}>🛒</div>
              <p style={{ fontWeight: 600, color: 'var(--sf-text-2)' }}>Your cart is empty</p>
              <p style={{ fontSize: '0.85rem' }}>Add products to get started</p>
              <button
                onClick={closeCart}
                style={{
                  marginTop: 8, padding: '9px 20px',
                  background: 'var(--sf-primary)', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.productId} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                paddingBottom: 12, borderBottom: '1px solid var(--sf-border)',
              }}>
                {/* Image */}
                <div style={{
                  width: 64, height: 64, borderRadius: 8,
                  background: 'var(--sf-bg)',
                  border: '1px solid var(--sf-border)',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {item.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.imageUrl} alt={item.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📦</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--sf-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.displayName}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--sf-primary)', fontWeight: 700, marginTop: 2 }}>
                    {fmt(item.price, currency)}
                  </p>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: '1px solid var(--sf-border)',
                        background: 'var(--sf-bg)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1rem', color: 'var(--sf-text-1)',
                      }}
                    >−</button>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', minWidth: 20, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: '1px solid var(--sf-border)',
                        background: 'var(--sf-bg)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1rem', color: 'var(--sf-text-1)',
                        opacity: item.quantity >= item.maxStock ? 0.4 : 1,
                      }}
                    >+</button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{
                        marginLeft: 'auto', background: 'none',
                        border: 'none', cursor: 'pointer',
                        color: 'var(--sf-text-3)', padding: 4,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--sf-text-1)', flexShrink: 0 }}>
                  {fmt(item.price * item.quantity, currency)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--sf-border)',
            display: 'flex', flexDirection: 'column', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--sf-text-2)' }}>Subtotal</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--sf-text-1)' }}>
                {fmt(subtotal, currency)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>
              Shipping and taxes calculated at checkout
            </p>
            <Link
              href={`/store/${storeSlug}/checkout`}
              onClick={closeCart}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '13px',
                background: 'var(--sf-primary)', color: '#fff',
                borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              Checkout · {fmt(subtotal, currency)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sfFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
