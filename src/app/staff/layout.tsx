'use client';

import './home/busmo.css';
import { useEffect, useState } from 'react';
import { STAFF_BRAND_LOGO_URL, STAFF_BRAND_NAME } from '@/lib/staffBrand';

function applyStaffFavicon() {
  if (typeof document === 'undefined') return;
  const href = STAFF_BRAND_LOGO_URL;

  const ensureLink = (rel: string, sizes?: string) => {
    let link = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.setAttribute('sizes', sizes);
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = href;
  };

  // Primary favicon
  let icon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.type = 'image/png';
  icon.href = href;

  ensureLink('apple-touch-icon', '180x180');
  ensureLink('shortcut icon');

  if (document.title === '' || document.title.toLowerCase().includes('busmo') || !document.title) {
    // Soft title preference for staff portal when generic
  }
  const title = document.querySelector('title');
  if (title && (!title.textContent || title.textContent === 'Busmo' || title.textContent.includes('Create Next'))) {
    title.textContent = `${STAFF_BRAND_NAME} Staff`;
  }
}

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
    applyStaffFavicon();
    setMounted(true);

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

  return <>{children}</>;
}
