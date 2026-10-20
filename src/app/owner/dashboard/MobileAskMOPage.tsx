'use client';

/**
 * Temporary: full MobileAskMO body was truncated during a deploy.
 * Route mobile users through the standard Ask MO experience so the app stays usable.
 * Breakpoint detection is fixed in @/hooks/use-mobile (matches CSS max-width: 768px).
 */
import React, { useEffect } from 'react';
import { useApp } from './AppContext';
import { useIsMobileStrict } from '@/hooks/use-mobile';
import { InlineAIChat } from './InlineAIChat';

export function MobileAskMOPage() {
  const { navigateTo } = useApp();
  const isMobile = useIsMobileStrict();

  useEffect(() => {
    if (isMobile === false) {
      navigateTo('home');
    }
  }, [isMobile, navigateTo]);

  if (isMobile !== true) {
    return null;
  }

  return <InlineAIChat />;
}
