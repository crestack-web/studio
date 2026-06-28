import React from 'react';

interface SupportSectionProps {
  onNavigate?: (page: string) => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ onNavigate }) => {
  return (
    <section className="support-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Support</div>
          <h2 className="section-title">Need Help?</h2>
          <p className="section-sub">Our team is here to help you succeed with Busmo.</p>
        </div>
        <div className="support-grid">
          <div className="support-card">
            <div className="support-icon">💬</div>
            <h3 className="support-title">Live Chat</h3>
            <p className="support-desc">Chat with our support team in real-time.</p>
          </div>
          <div className="support-card">
            <div className="support-icon">📧</div>
            <h3 className="support-title">Email Support</h3>
            <p className="support-desc">Send us an email and we'll respond within 24 hours.</p>
          </div>
          <div className="support-card">
            <div className="support-icon">📚</div>
            <h3 className="support-title">Help Center</h3>
            <p className="support-desc">Browse our documentation and tutorials.</p>
          </div>
        </div>
      </div>
    </section>
  );
};