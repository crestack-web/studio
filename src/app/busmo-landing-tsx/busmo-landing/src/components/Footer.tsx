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
        <div>
          <div className="footer-brand">Busmo</div>
          <div className="footer-tagline">Built for the heart of African commerce. Clarity for every business owner.</div>
        </div>
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            <li><a onClick={() => onNavigate('home')}>Features</a></li>
            <li><a onClick={() => onNavigate('pricing')}>Pricing</a></li>
            <li><a onClick={() => onNavigate('seller')}>Busmo Market</a></li>
            <li><a onClick={() => onNavigate('busmogo')}>BusmoGo</a></li>
            <li><a>Ask Busmo AI</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            <li><a>About</a></li>
            <li><a>Blog</a></li>
            <li><a>Careers</a></li>
            <li><a>Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links">
            <li><a>Privacy Policy</a></li>
            <li><a>Terms of Service</a></li>
            <li><a>Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">© 2026 Busmo. All rights reserved.</div>
        <a className="footer-x" href="https://x.com/busmohq" target="_blank" rel="noreferrer">𝕏 @busmohq</a>
      </div>
    </footer>
  );
};
