'use client';

import React, { useState, useRef, useEffect } from 'react';

interface StoreProduct {
  id: string;
  displayName: string;
  description: string;
  price: number;
  category: string;
  productType: string;
  digitalSubtype?: string | null;
  tags: string[];
  images: string[];
}

interface SocialCaption {
  platform: string;
  caption: string;
  hashtags?: string;
}

interface AdCopyItem {
  headline: string;
  body: string;
  cta: string;
}

interface EmailMarketing {
  subject: string;
  previewText: string;
  body: string;
}

interface ContentIdeas {
  socialCaptions?: SocialCaption[];
  adCopy?: AdCopyItem[];
  emailMarketing?: EmailMarketing;
  seoDescription?: string;
  shortDescription?: string;
  keySellingPoints?: string[];
  marketingAngle?: string;
}

interface ContentIdeasModalProps {
  product: StoreProduct;
  onClose: () => void;
  showToast: (msg: string) => void;
  currency: string;
}

export function ContentIdeasModal({ product, onClose, showToast, currency }: ContentIdeasModalProps) {
  const [contentIdeas, setContentIdeas] = useState<ContentIdeas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [activeTab, setActiveTab] = useState<'social' | 'ads' | 'email' | 'seo'>('social');
  const inputRef = useRef<HTMLInputElement>(null);

  const generate = async (refineInstruction?: string) => {
    if (refineInstruction) setRefining(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/sell/ask-mo/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            displayName: product.displayName,
            description: product.description,
            price: product.price,
            category: product.category,
            productType: product.productType,
            digitalSubtype: product.digitalSubtype,
            tags: product.tags,
          },
          instruction: refineInstruction,
        }),
      });
      const data = await res.json();
      if (data.contentIdeas) {
        setContentIdeas(data.contentIdeas);
        setInstruction('');
      } else if (data.error) {
        showToast(data.error);
      }
    } catch {
      showToast('Failed to generate content ideas');
    } finally {
      setLoading(false);
      setRefining(false);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  const handleRefine = () => {
    if (!instruction.trim()) return;
    generate(instruction.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
  };

  const renderSection = (title: string, content: React.ReactNode, copyText?: string) => (
    <div style={{
      background: 'var(--sell-surface-2, #f8f9fa)',
      border: '1px solid var(--sell-border)',
      borderRadius: 'var(--sell-radius, 8px)',
      padding: '14px 16px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
        {copyText && (
          <button
            onClick={() => copyToClipboard(copyText)}
            style={{
              background: 'none',
              border: '1px solid var(--sell-border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: '0.7rem',
              color: 'var(--sell-text-3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Copy"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
        )}
      </div>
      {content}
    </div>
  );

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--sell-border)', paddingBottom: 0 }}>
      {[
        { key: 'social' as const, label: 'Social Media', icon: '#' },
        { key: 'ads' as const, label: 'Ad Copy', icon: '📢' },
        { key: 'email' as const, label: 'Email', icon: '✉' },
        { key: 'seo' as const, label: 'SEO', icon: '🔍' },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            padding: '8px 14px',
            border: 'none',
            background: activeTab === tab.key ? 'var(--sell-primary-lt, #eef2ff)' : 'none',
            color: activeTab === tab.key ? 'var(--sell-primary, #6366f1)' : 'var(--sell-text-2)',
            fontWeight: activeTab === tab.key ? 700 : 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
            borderBottom: activeTab === tab.key ? '2px solid var(--sell-primary, #6366f1)' : '2px solid transparent',
            marginBottom: -1,
            fontFamily: 'var(--sell-font-body)',
            transition: 'all 0.15s',
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 60, backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 580,
        maxWidth: '100vw', background: 'var(--sell-surface)',
        borderLeft: '1px solid var(--sell-border)', zIndex: 61,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.15)',
        animation: 'contentSlideIn 0.24s cubic-bezier(0.4, 0, 0.2, 1) both',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--sell-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sell-text-3)', marginBottom: 2 }}>
              Content Ideas
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>
              {product.displayName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sell-border)',
              background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--sell-text-2)', flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {/* Product summary */}
          <div style={{
            display: 'flex', gap: 12, padding: '10px 14px',
            background: 'var(--sell-primary-lt, #eef2ff)',
            borderRadius: 'var(--sell-radius, 8px)',
            marginBottom: 8,
          }}>
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.displayName}
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--sell-text-1)' }}>{product.displayName}</strong>
              <br />
              <span style={{ color: 'var(--sell-primary)', fontWeight: 700 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(product.price)}
              </span>
              {product.category && <span style={{ color: 'var(--sell-text-3)' }}> &middot; {product.category}</span>}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, color: 'var(--sell-text-3)', padding: 40,
            }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--sell-border)',
                borderTopColor: 'var(--sell-primary)', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <span style={{ fontSize: '0.85rem' }}>MO is creating content ideas…</span>
            </div>
          )}

          {/* Content */}
          {!loading && contentIdeas && (
            <>
              {renderTabs()}

              {activeTab === 'social' && contentIdeas.socialCaptions && (
                <div>
                  {contentIdeas.socialCaptions.map((item, i) => (
                    <div key={i} style={{
                      background: 'var(--sell-surface-2, #f8f9fa)',
                      border: '1px solid var(--sell-border)',
                      borderRadius: 'var(--sell-radius, 8px)',
                      padding: '14px 16px',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6,
                      }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.05em', color: 'var(--sell-accent, #8b5cf6)',
                        }}>
                          {item.platform}
                        </span>
                        <button
                          onClick={() => copyToClipboard(`${item.caption}${item.hashtags ? '\n\n' + item.hashtags : ''}`)}
                          style={{
                            background: 'none', border: '1px solid var(--sell-border)',
                            borderRadius: 6, padding: '3px 7px', fontSize: '0.68rem',
                            color: 'var(--sell-text-3)', cursor: 'pointer',
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {item.caption}
                      </div>
                      {item.hashtags && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--sell-primary, #6366f1)', marginTop: 6 }}>
                          {item.hashtags}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ads' && contentIdeas.adCopy && (
                <div>
                  {contentIdeas.adCopy.map((item, i) => (
                    <div key={i} style={{
                      background: 'var(--sell-surface-2, #f8f9fa)',
                      border: '1px solid var(--sell-border)',
                      borderRadius: 'var(--sell-radius, 8px)',
                      padding: '14px 16px',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
                      }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>
                          {item.headline}
                        </span>
                        <button
                          onClick={() => copyToClipboard(`${item.headline}\n\n${item.body}\n\n${item.cta}`)}
                          style={{
                            background: 'none', border: '1px solid var(--sell-border)',
                            borderRadius: 6, padding: '3px 7px', fontSize: '0.68rem',
                            color: 'var(--sell-text-3)', cursor: 'pointer',
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', lineHeight: 1.6, marginBottom: 6 }}>
                        {item.body}
                      </div>
                      <div style={{
                        display: 'inline-block', background: 'var(--sell-primary, #6366f1)',
                        color: '#fff', padding: '4px 12px', borderRadius: 6,
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {item.cta}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'email' && contentIdeas.emailMarketing && (
                <div>
                  {renderSection(
                    'Subject Line',
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>
                      {contentIdeas.emailMarketing.subject}
                    </div>,
                    contentIdeas.emailMarketing.subject
                  )}
                  {renderSection(
                    'Preview Text',
                    <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', fontStyle: 'italic' }}>
                      {contentIdeas.emailMarketing.previewText}
                    </div>,
                    contentIdeas.emailMarketing.previewText
                  )}
                  {renderSection(
                    'Email Body',
                    <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {contentIdeas.emailMarketing.body}
                    </div>,
                    contentIdeas.emailMarketing.body
                  )}
                </div>
              )}

              {activeTab === 'seo' && (
                <div>
                  {contentIdeas.seoDescription && renderSection(
                    'SEO Meta Description',
                    <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      &ldquo;{contentIdeas.seoDescription}&rdquo;
                      <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>
                        {contentIdeas.seoDescription.length} characters
                      </div>
                    </div>,
                    contentIdeas.seoDescription
                  )}

                  {contentIdeas.shortDescription && renderSection(
                    'Short Description',
                    <div style={{ fontSize: '0.85rem', color: 'var(--sell-text-1)', lineHeight: 1.6 }}>
                      {contentIdeas.shortDescription}
                    </div>,
                    contentIdeas.shortDescription
                  )}

                  {contentIdeas.keySellingPoints && renderSection(
                    'Key Selling Points',
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--sell-text-1)', lineHeight: 1.8 }}>
                      {contentIdeas.keySellingPoints.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>,
                    contentIdeas.keySellingPoints.map(p => `• ${p}`).join('\n')
                  )}

                  {contentIdeas.marketingAngle && renderSection(
                    'Marketing Angle',
                    <div style={{ fontSize: '0.85rem', color: 'var(--sell-text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      {contentIdeas.marketingAngle}
                    </div>,
                    contentIdeas.marketingAngle
                  )}
                </div>
              )}
            </>
          )}

          {/* Error / empty */}
          {!loading && !contentIdeas && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--sell-text-3)' }}>
              Failed to generate content ideas. Try again.
            </div>
          )}
        </div>

        {/* Footer - Regenerate + Ask Mo */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--sell-border)',
          display: 'flex', flexDirection: 'column', gap: 8,
          flexShrink: 0,
        }}>
          {/* Regenerate */}
          {contentIdeas && !refining && (
            <button
              onClick={() => generate()}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 'var(--sell-radius-sm, 6px)',
                border: '1px solid var(--sell-border)', background: 'none',
                color: 'var(--sell-text-2)', fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--sell-font-body)',
                transition: 'all 0.15s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
              Regenerate
            </button>
          )}

          {/* Ask Mo input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRefine(); }}
                placeholder="Ask MO to refine — e.g. make it more playful, shorter, add emojis…"
                disabled={loading || refining}
                style={{
                  width: '100%', padding: '9px 12px', paddingRight: 36,
                  borderRadius: 'var(--sell-radius-sm, 6px)',
                  border: '1px solid var(--sell-border)',
                  background: 'var(--sell-surface)', color: 'var(--sell-text-1)',
                  fontSize: '0.78rem', fontFamily: 'var(--sell-font-body)',
                  outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
              />
              {(loading || refining) && (
                <div style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, border: '2px solid var(--sell-border)',
                  borderTopColor: 'var(--sell-primary)', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
            </div>
            <button
              onClick={handleRefine}
              disabled={loading || refining || !instruction.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 'var(--sell-radius-sm, 6px)',
                border: 'none', background: 'var(--sell-accent, #8b5cf6)',
                color: '#fff', cursor: 'pointer', flexShrink: 0,
                opacity: instruction.trim() ? 1 : 0.5,
                transition: 'opacity 0.15s',
              }}
              title="Ask MO"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes contentSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
