'use client';

import React from 'react';
import { LangProvider } from './LangContext';
import { CurrencyProvider } from './CurrencyContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LangProvider>
  );
}
