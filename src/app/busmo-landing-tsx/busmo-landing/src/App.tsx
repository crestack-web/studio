import React, { useState, useEffect } from 'react';
import './styles/globals.css';
import { Page } from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage, LoginFormPage } from './pages/AuthPages';
import { SignupPage } from './pages/SignupPage';
import { SellerPage } from './pages/SellerPage';
import { InvestPage, InvestSignupPage, InvestLoginPage } from './pages/InvestorPages';
import { BusmoGoPage } from './pages/BusmoGoPage';

const PAGES_WITHOUT_NAV: Page[] = ['signup', 'invest-signup'];

export default function App() {
  const [page, setPage] = useState<Page>('home');

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showNav = !PAGES_WITHOUT_NAV.includes(page);

  return (
    <>
      {showNav && <Navbar currentPage={page} onNavigate={navigate} />}

      <main style={{ paddingTop: showNav ? 'var(--nav-h)' : 0 }}>
        {page === 'home' && <HomePage onNavigate={navigate} />}
        {page === 'pricing' && <PricingPage onNavigate={navigate} />}
        {page === 'login' && <LoginPage onNavigate={navigate} />}
        {page === 'login-form' && <LoginFormPage onNavigate={navigate} />}
        {page === 'signup' && <SignupPage onNavigate={navigate} />}
        {page === 'seller' && <SellerPage onNavigate={navigate} />}
        {page === 'invest' && <InvestPage onNavigate={navigate} />}
        {page === 'invest-signup' && <InvestSignupPage onNavigate={navigate} />}
        {page === 'invest-login' && <InvestLoginPage onNavigate={navigate} />}
        {page === 'busmogo' && <BusmoGoPage onNavigate={navigate} />}
      </main>
    </>
  );
}
