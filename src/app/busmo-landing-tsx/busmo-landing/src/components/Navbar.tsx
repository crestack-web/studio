import React, { useState } from 'react';
import { Page } from '../types';
import { useScrolled } from '../hooks/useScrolled';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const BusmoLogo = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="#6B3FE7"/>
    <path d="M10 12h8c2.2 0 4 1.8 4 4s-1.8 4-4 4H10V12z" fill="white" fillOpacity="0.9"/>
    <path d="M10 20h9c2.5 0 4.5 2 4.5 4.5S21.5 29 19 29H10V20z" fill="white"/>
  </svg>
);

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'For Sellers', page: 'seller' },
  { label: 'Investors', page: 'invest' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (p: Page) => {
    onNavigate(p);
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
