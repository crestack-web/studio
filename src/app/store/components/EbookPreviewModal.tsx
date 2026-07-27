'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface EbookPreviewProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  author?: string;
  pageCount?: number;
  accentColor?: string;
}

export function EbookPreviewModal({
  open, onClose, fileUrl, title, author, pageCount, accentColor = '#7C3AED',
}: EbookPreviewProps) {
  const [loading, setLoading] = useState(true);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  useEffect(() => {
    if (open) setLoading(true);
  }, [open, fileUrl]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        background: '#0F172A',
        animation: 'epFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes epFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes epSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#1E293B',
        borderBottom: '1px solid #334155', flexShrink: 0,
        animation: 'epSlideUp 0.25s ease 0.05s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            📖
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9',
              margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</p>
            <p style={{
              fontSize: '0.72rem', color: '#94A3B8', margin: 0,
              display: 'flex', gap: 8,
            }}>
              {author && <span>by {author}</span>}
              {pageCount && <span>{pageCount} pages</span>}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8,
            background: 'transparent', border: '1px solid #475569',
            color: '#94A3B8', cursor: 'pointer', transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* PDF viewer */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, color: '#94A3B8', zIndex: 1, background: '#0F172A',
          }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #334155',
              borderTopColor: accentColor, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading preview…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=0&zoom=page-fit`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => setLoading(false)}
          title={`${title} preview`}
        />
      </div>

      {/* Bottom hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 16px', background: '#1E293B',
        borderTop: '1px solid #334155', flexShrink: 0,
      }}>
        <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>
          Press <kbd style={{
            padding: '1px 5px', borderRadius: 3, background: '#334155',
            color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700,
          }}>Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
