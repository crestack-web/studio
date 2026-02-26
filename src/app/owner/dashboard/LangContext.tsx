'use client';

// ═══════════════════════════════════════════
//  BUSMO — Language Context + useTranslation
//
//  Wrap your <AppProvider> with <LangProvider>.
//  In any component: const { t, lang, setLang } = useTranslation();
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
  LangCode,
  LangMeta,
  TranslationDict,
  LANGUAGES,
  TRANSLATIONS,
} from './translations';

// ── Context shape ──────────────────────────────────────────────────
interface LangContextValue {
  lang: LangCode;
  langMeta: LangMeta;
  setLang: (code: LangCode) => void;
  t: (key: keyof TranslationDict) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const stored = localStorage.getItem('busmo-lang') as LangCode | null;
      // Validate it's a supported lang
      if (stored && TRANSLATIONS[stored]) return stored;
    } catch {}
    return 'en';
  });

  const langMeta = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
  const isRTL = langMeta.rtl;

  // Apply dir attribute to <html> for RTL support
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem('busmo-lang', lang); } catch {}
  }, [lang, isRTL]);

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
  }, []);

  // Translation function with English fallback
  const t = useCallback((key: keyof TranslationDict): string => {
    const dict = TRANSLATIONS[lang];
    return dict[key] ?? TRANSLATIONS['en'][key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, langMeta, setLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useTranslation(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useTranslation must be used inside <LangProvider>');
  return ctx;
}
