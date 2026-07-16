// src/app/contact/page.tsx
// Update imports to use SupportChatWidget instead of ChatwootWidget
'use client';

import { useState, useEffect } from 'react';
import SupportChatWidget from '@/components/SupportChatWidget';

export default function ContactPage() {
  
  return (
    <main className="min-h-screen">
      {/* ... existing content ... */}
      
      {/* Support chat widget - connects to our admin support section */}
      <SupportChatWidget />
    </main>
  );
}
