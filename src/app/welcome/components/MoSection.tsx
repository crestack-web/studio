import React from 'react';
import { MoIcon } from '../../owner/dashboard/NavIcons';

export const MoSection: React.FC = () => (
  <section className="mo-section-new">
    <div className="mo-scene">
      <div className="mo-glow-blob" />

      <div className="mo-features-left">
        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">🛒</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Record activity by text</div>
            <div className="mo-feat-pill-sub">Sales and expenses without forms</div>
          </div>
        </div>
        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">💰</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Ask about profit</div>
            <div className="mo-feat-pill-sub">Answers from your real data</div>
          </div>
        </div>
        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">📦</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">What needs attention</div>
            <div className="mo-feat-pill-sub">Stock and sales signals</div>
          </div>
        </div>
        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">📊</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">What changed</div>
            <div className="mo-feat-pill-sub">Trends you can act on</div>
          </div>
        </div>
      </div>

      <div className="mo-iphone-wrap">
        <div className="mo-iphone-frame">
          <div className="mo-iphone-inner">
            <div className="mo-dynamic-island">
              <div className="mo-di-camera" />
              <div className="mo-di-sensor" />
            </div>
            <div className="mo-status-bar">
              <span className="mo-status-time">09:55</span>
            </div>
            <div className="mo-topbar">
              <span className="mo-topbar-title">Ask MO</span>
            </div>
            <div className="mo-chat-header">
              <div className="mo-chat-info">
                <div className="mo-chat-avatar">
                  <MoIcon size={16} />
                  <div className="mo-online-dot" />
                </div>
                <div>
                  <div className="mo-chat-name">Ask MO</div>
                  <div className="mo-chat-status">Online · ready to help</div>
                </div>
              </div>
            </div>
            <div className="mo-chat-body" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 8 }}>Try asking</div>
              <div style={{ fontSize: '0.8rem', marginBottom: 6 }}>"What changed in my sales this week?"</div>
              <div style={{ fontSize: '0.8rem', marginBottom: 6 }}>"What is selling?"</div>
              <div style={{ fontSize: '0.8rem' }}>"Am I making real profit?"</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mo-features-right">
        <div className="mo-try-card">
          <div className="mo-try-title">Your data can talk back</div>
          <div className="mo-try-examples">
            <div className="mo-try-item">"What changed in my sales this week?"</div>
            <div className="mo-try-item">"What is selling?"</div>
            <div className="mo-try-item">"Where are expenses rising?"</div>
            <div className="mo-try-item">"Am I making real profit?"</div>
          </div>
        </div>
        <div className="mo-try-card">
          <div className="mo-try-title">Record without forms</div>
          <div className="mo-try-examples">
            <div className="mo-try-item">"Sold 5 phones at ₦85k"</div>
            <div className="mo-try-item">"Add expense: fuel ₦12,000"</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
