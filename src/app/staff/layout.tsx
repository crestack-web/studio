'use client';

import './home/busmo.css';
import { useEffect, useState } from 'react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('staff-theme') as 'light' | 'dark' | 'system' | null;
      const themeValue = savedTheme || 'light';
      
      let actualTheme: 'light' | 'dark';
      
      if (themeValue === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        actualTheme = themeValue;
      }
      
      document.documentElement.setAttribute('data-theme', actualTheme);
      document.body.setAttribute('data-theme', actualTheme);
    };

    applyTheme();
    setMounted(true);

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const savedTheme = localStorage.getItem('staff-theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      {children}
    </>
  );
}
