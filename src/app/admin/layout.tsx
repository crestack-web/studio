// src/app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';

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
    </div>
  );
}
