import React, { useState } from 'react';
import { Page } from '../types';
import { useScrolled } from '../hooks/useScrolled';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const BusmoLogo = () => (
  <img src="/email-logo.png" alt="Busmo Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
);

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'For Sellers', page: 'seller' },
  { label: 'Investors', page: 'invest' },
  { label: 'Download Busmo', page: 'download' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage }) => {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (p: Page) => {
    if (p === 'home') {
      window.location.href = '/welcome';
    } else if (p === 'signup') {
      window.location.href = '/welcome/signup';
    } else if (p === 'login') {
      window.location.href = '/login';
    } else if (p === 'pricing') {
      window.location.href = '/pricing';
    } else if (p === 'seller') {
      window.location.href = '/seller';
    } else if (p === 'invest') {
      window.location.href = '/invest';
    } else if (p === 'verify') {
      window.location.href = '/verify';
    } else if (p === 'download') {
      window.location.href = '/welcome/download';
    } else {
      window.location.href = '/';
    }
    setMobileOpen(false);
  };

  return (
    <>
      <nav id="main-nav" className={scrolled ? 'scrolled' : ''}>
        {/* Logo */}
        <a className="nav-logo" onClick={() => go('home')} role="button" tabIndex={0}>
          <BusmoLogo />
          Busmo
        </a>

        {/* Desktop nav links */}
        <ul className="nav-links nav-links-desktop">
          {NAV_LINKS.map(({ label, page }) => (
            <li key={page}>
              <button
                className={currentPage === page ? 'active' : ''}
                onClick={() => go(page)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="nav-actions nav-actions-desktop">
          <button className="btn-ghost" onClick={() => go('verify')}>Verify Statement</button>
          <button className="btn-ghost" onClick={() => go('pricing')}>See Pricing</button>
          <button className="btn-ghost" onClick={() => go('login')}>Sign In</button>
          <button className="btn-primary" onClick={() => go('signup')}>Get Started</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="nav-mobile-drawer">
          <ul className="nav-mobile-links">
            {NAV_LINKS.map(({ label, page }) => (
              <li key={page}>
                <button
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => go(page)}
                >
                  {label}
                </button>
              </li>
            ))}
            <li>
              <button
                className={currentPage === 'verify' ? 'active' : ''}
                onClick={() => go('verify')}
              >
                Verify Statement
              </button>
            </li>
            <li>
              <button
                className={currentPage === 'pricing' ? 'active' : ''}
                onClick={() => go('pricing')}
              >
                See Pricing
              </button>
            </li>
          </ul>
          <div className="nav-mobile-actions">
            <button className="btn-ghost" style={{ width: '100%' }} onClick={() => go('login')}>Sign In</button>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => go('signup')}>Get Started Free</button>
          </div>
        </div>
      )}
    </>
  );
};
