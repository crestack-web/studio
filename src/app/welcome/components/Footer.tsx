import React from 'react';
import { Page } from '../types';

interface FooterProps {
  onNavigate: (page: Page) => void;
  minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, minimal = false }) => {
  if (minimal) {
    return (
      <footer>
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px 5%' }}>
          <div className="footer-copy">© 2026 Busmo. All rights reserved.</div>
          <a className="footer-x" href="https://x.com/busmohq" target="_blank" rel="noreferrer">𝕏 @busmohq</a>
        </div>
      </footer>
    );
  }

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand-section">
          <div className="footer-brand">Busmo</div>
          <div className="footer-tagline">Built for the heart of African commerce. Clarity for every business owner.</div>
          <div className="footer-description">
            Busmo is a business clarity platform that helps African business owners track sales, manage inventory, monitor staff performance, and make data-driven decisions with AI-powered insights.
          </div>
          <div className="footer-socials">
            <a href="https://x.com/busmohq" target="_blank" rel="noreferrer" className="social-link">𝕏</a>
            <a href="https://linkedin.com/company/busmo" target="_blank" rel="noreferrer" className="social-link">in</a>
            <a href="https://instagram.com/busmo" target="_blank" rel="noreferrer" className="social-link">📷</a>
          </div>
        </div>
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            <li><a onClick={() => onNavigate('home')}>Features</a></li>
            <li><a onClick={() => onNavigate('pricing')}>Pricing</a></li>
            <li><a onClick={() => onNavigate('seller')}>Busmo Market</a></li>
            <li><a onClick={() => onNavigate('invest')}>Investments</a></li>
            <li><a onClick={() => onNavigate('download')}>Download App</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Key Features</div>
          <ul className="footer-links">
            <li><a>Sales Tracking</a></li>
            <li><a>Inventory Management</a></li>
            <li><a>Expense Tracking</a></li>
            <li><a>Ask Busmo AI</a></li>
            <li><a>Staff Management</a></li>
            <li><a>Multi-Branch Support</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Industries</div>
          <ul className="footer-links">
            <li><a>Retail & Supermarkets</a></li>
            <li><a>Restaurants & Food</a></li>
            <li><a>Manufacturing</a></li>
            <li><a>Service Businesses</a></li>
            <li><a>Wholesale & Distribution</a></li>
            <li><a>Healthcare & Pharmacies</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            <li><a>About Us</a></li>
            <li><a>Blog</a></li>
            <li><a>Careers</a></li>
            <li><a>Contact</a></li>
            <li><a>Partners</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links">
            <li><a>Privacy Policy</a></li>
            <li><a>Terms of Service</a></li>
            <li><a>Cookie Policy</a></li>
            <li><a>Data Protection</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="footer-copy">© 2026 Busmo. All rights reserved.</div>
          <div className="footer-bottom-links">
            <a href="https://x.com/busmohq" target="_blank" rel="noreferrer" className="footer-x">𝕏 @busmohq</a>
            <span className="footer-separator">•</span>
            <a className="footer-link">Made with ❤️ for Africa</a>
            <span className="footer-separator">•</span>
            <a className="footer-link">Offline-First</a>
          </div>
        </div>
      </div>
      <style jsx>{`
        .footer-brand-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-description {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
          max-width: 280px;
        }

        .footer-socials {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-link {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .social-link:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .footer-bottom-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .footer-bottom-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footer-separator {
          color: rgba(255, 255, 255, 0.3);
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: white;
        }

        @media (max-width: 768px) {
          .footer-bottom-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-bottom-links {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .footer-separator {
            display: none;
          }
        }
      `}</style>
    </footer>
  );
};
