'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatCurrency, convertFromUsd, getUserCountryCode, getCurrencyName } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  countryCode: string;
  symbol: string;
  format: (value: number) => string;
  convertFromUSD: (value: number) => number;
  setCurrency: (countryCode: string) => void;
  rates: { [key: string]: number };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: string;
}

export function CurrencyProvider({ children, defaultCurrency }: CurrencyProviderProps) {
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [currency, setCurrency] = useState<string>('NGN');
  const [symbol, setSymbol] = useState<string>('₦');

  // Exchange rates (relative to USD)
  const rates = {
    USD: 1,
    NGN: 1550,
    GHS: 12,
    XOF: 610,
    XAF: 610,
    KES: 1290,
    ZAR: 18500,
    EUR: 0.92,
    GBP: 0.79,
  };

  // Detect user's country on mount
  useEffect(() => {
    const detectedCountry = getUserCountryCode();
    const storedCountry = localStorage.getItem('busmo_country') || detectedCountry || defaultCurrency || 'NG';
    setCountryCode(storedCountry);
    
    const currencyName = getCurrencyName(storedCountry);
    setCurrency(currencyName);
    
    // Get symbol from currency map
    const currencyMap: { [key: string]: { symbol: string } } = {
      NGN: { symbol: '₦' },
      GHS: { symbol: 'GH₵' },
      XOF: { symbol: 'CFA' },
      XAF: { symbol: 'FCFA' },
      USD: { symbol: '$' },
      KES: { symbol: 'KSh' },
      ZAR: { symbol: 'R' },
      EUR: { symbol: '€' },
      GBP: { symbol: '£' },
    };
    
    setSymbol(currencyMap[currencyName]?.symbol || currencyName);
  }, [defaultCurrency]);

  const format = (value: number): string => {
    return formatCurrency(value, countryCode);
  };

  const convertFromUSD = (value: number): number => {
    return convertFromUsd(value, countryCode);
  };

  const setCurrencyByCountry = (code: string) => {
    setCountryCode(code);
    localStorage.setItem('busmo_country', code);
    
    const currencyName = getCurrencyName(code);
    setCurrency(currencyName);
    
    const currencyMap: { [key: string]: { symbol: string } } = {
      NGN: { symbol: '₦' },
      GHS: { symbol: 'GH₵' },
      XOF: { symbol: 'CFA' },
      XAF: { symbol: 'FCFA' },
      USD: { symbol: '$' },
      KES: { symbol: 'KSh' },
      ZAR: { symbol: 'R' },
      EUR: { symbol: '€' },
      GBP: { symbol: '£' },
    };
    
    setSymbol(currencyMap[currencyName]?.symbol || currencyName);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        countryCode,
        symbol,
        format,
        convertFromUSD,
        setCurrency: setCurrencyByCountry,
        rates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
