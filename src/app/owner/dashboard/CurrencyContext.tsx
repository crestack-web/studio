'use client';

// ═══════════════════════════════════════════
//  BUSMO — Currency Context
//
//  Provides:
//    const { currency, currencyCode, setCurrency,
//            formatMoney, formatMoneyCompact } = useCurrency();
//
//  Usage examples:
//    formatMoney(48600)          → '₦48,600.00'
//    formatMoneyCompact(1250000) → '₦1.25M'
//    formatMoney(48600, 'GHS')   → 'GH₵48,600.00'
//
//  The selected currency is persisted to localStorage
//  under the key 'busmo-currency'.
// ═══════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  Currency,
  getCurrency,
  formatMoney as _formatMoney,
  currencyFromCountry,
  CURRENCIES,
} from './currencies';

// ── Context shape ──────────────────────────────────────────────────
interface CurrencyContextValue {
  /** The full Currency object (symbol, decimals, etc.) */
  currency: Currency;
  /** ISO 4217 code e.g. 'NGN' */
  currencyCode: string;
  /** Change the active currency */
  setCurrencyCode: (code: string) => void;
  /** Set currency by country ISO code e.g. 'NG' → NGN */
  setCurrencyByCountry: (countryCode: string) => void;
  /** Format a number: 48600 → '₦48,600.00' */
  formatMoney: (amount: number) => string;
  /** Format compact: 1250000 → '₦1.25M' */
  formatMoneyCompact: (amount: number) => string;
  /** Format with +/- sign for cashflow: +48600 → '+₦48,600' */
  formatMoneyDelta: (amount: number) => string;
  /** All available currencies */
  allCurrencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('busmo-currency');
      if (stored && CURRENCIES.find(c => c.code === stored)) return stored;
    } catch {}
    return 'NGN'; // safe African default
  });

  useEffect(() => {
    try { localStorage.setItem('busmo-currency', currencyCode); } catch {}
  }, [currencyCode]);

  const currency = getCurrency(currencyCode);

  const setCurrencyCode = useCallback((code: string) => {
    if (CURRENCIES.find(c => c.code === code)) {
      setCurrencyState(code);
    }
  }, []);

  const setCurrencyByCountry = useCallback((countryCode: string) => {
    const c = currencyFromCountry(countryCode);
    setCurrencyState(c.code);
  }, []);

  const formatMoney = useCallback(
    (amount: number) => _formatMoney(amount, currencyCode),
    [currencyCode]
  );

  const formatMoneyCompact = useCallback(
    (amount: number) => _formatMoney(amount, currencyCode, { compact: true }),
    [currencyCode]
  );

  const formatMoneyDelta = useCallback(
    (amount: number) => {
      const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
      return `${sign}${_formatMoney(Math.abs(amount), currencyCode)}`;
    },
    [currencyCode]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode,
        setCurrencyCode,
        setCurrencyByCountry,
        formatMoney,
        formatMoneyCompact,
        formatMoneyDelta,
        allCurrencies: CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
