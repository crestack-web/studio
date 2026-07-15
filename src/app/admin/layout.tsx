// src/app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { SupportChatWidget } from '@/components/SupportChatWidget';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Main content */}
      <div className="container mx-auto">
        {children}
      </div>
      
      {/* Support chat widget - connects to our admin support section */}
      <SupportChatWidget />
    </div>
  );
}
