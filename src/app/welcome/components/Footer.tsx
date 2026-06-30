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
            <a href="https://x.com/busmohq" target="_blank" rel="noreferrer" className="social-link" aria-label="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/busmo" target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://instagram.com/busmodotio" target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="https://youtube.com/@busmodotio" target="_blank" rel="noreferrer" className="social-link" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
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
