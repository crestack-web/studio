'use client';

import React, { useEffect, useCallback } from 'react';
import { CHATWOOT_CONFIG, CHATWOOT_BRANDING } from '@/lib/chatwoot-config';
import { chatwootService } from '@/lib/chatwoot';
import { ChatwootUser } from '@/lib/chatwoot-config';

declare global {
  interface Window {
    $chatwoot?: any;
    chatwootSettings?: any;
  }
}

interface ChatwootWidgetProps {
  user?: ChatwootUser | null;
  locale?: string;
}

export const ChatwootWidget: React.FC<ChatwootWidgetProps> = ({ user, locale = 'en' }) => {
  const initializeChatwoot = useCallback(() => {
    if (typeof window === 'undefined' || !CHATWOOT_CONFIG.enabled || window.$chatwoot) {
      return;
    }

    // Set Chatwoot settings
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: locale,
      type: 'standard',
      ...CHATWOOT_BRANDING,
    };

    // Load Chatwoot script
    const script = document.createElement('script');
    script.src = `${CHATWOOT_CONFIG.baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.$chatwoot) {
        window.$chatwoot.run({
          websiteToken: CHATWOOT_CONFIG.websiteToken,
          baseUrl: CHATWOOT_CONFIG.baseUrl,
        });

        // Identify user if provided
        if (user) {
          chatwootService.identifyUser(user);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Chatwoot widget');
    };

    document.head.appendChild(script);
  }, [user, locale]);

  useEffect(() => {
    initializeChatwoot();
  }, [initializeChatwoot]);

  // Update user identification when user changes
  useEffect(() => {
    if (user && window.$chatwoot) {
      chatwootService.identifyUser(user);
    }
  }, [user]);

  return null; // Widget renders itself via Chatwoot's SDK
};

export default ChatwootWidget;