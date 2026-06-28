"use client";

import React from 'react';
import { Navbar } from '../components/Navbar';
import { SupportSection } from '../components/SupportSection';
import { Footer } from '../components/Footer';
import type { Page } from '../types';

export default function SupportPage() {
  const handleNavigate = (page: Page | string) => {
    if (page === 'home') {
      window.location.href = '/welcome';
    } else if (page === 'signup') {
      window.location.href = '/welcome/signup';
    } else if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'pricing') {
      window.location.href = '/pricing';
    } else if (page === 'seller') {
      window.location.href = '/seller';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else if (page === 'download') {
      window.location.href = '/welcome/download';
    } else {
      window.location.href = '/welcome';
    }
  };

  return (
    <>
      <Navbar currentPage="support" onNavigate={(page) => handleNavigate(page)} />
      <SupportSection onNavigate={handleNavigate} />
      <Footer onNavigate={handleNavigate} />
    </>
  );
}
