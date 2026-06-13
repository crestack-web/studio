'use client';

// ═══════════════════════════════════════════
//  BUSMO — Language Context + useTranslation
//
//  Wrap your <AppProvider> with <LangProvider>.
//  In any component: const { t, lang, setLang } = useTranslation();
//  Auto-detects browser locale on first load.
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

// ── Helper: Detect browser locale and map to supported language ──
function detectBrowserLanguage(): LangCode {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  const browserLangs = navigator.languages || [];
  
  // Map common locale codes to our supported languages
  const localeMap: Record<string, LangCode> = {
    // French
    'fr': 'fr',
    'fr-fr': 'fr',
    'fr-ca': 'fr',
    'fr-be': 'fr',
    'fr-ch': 'fr',
    'fr-af': 'fr',
    'fr-bf': 'fr',
    'fr-bi': 'fr',
    'fr-bj': 'fr',
    'fr-cd': 'fr',
    'fr-cf': 'fr',
    'fr-cg': 'fr',
    'fr-ci': 'fr',
    'fr-cm': 'fr',
    'fr-dj': 'fr',
    'fr-ga': 'fr',
    'fr-gn': 'fr',
    'fr-gq': 'fr',
    'fr-ht': 'fr',
    'fr-km': 'fr',
    'fr-ml': 'fr',
    'fr-mg': 'fr',
    'fr-mr': 'fr',
    'fr-mu': 'fr',
    'fr-ne': 'fr',
    'fr-re': 'fr',
    'fr-rw': 'fr',
    'fr-sc': 'fr',
    'fr-sn': 'fr',
    'fr-td': 'fr',
    'fr-tg': 'fr',
    // Arabic
    'ar': 'ar',
    'ar-sa': 'ar',
    'ar-ae': 'ar',
    'ar-bh': 'ar',
    'ar-dz': 'ar',
    'ar-eg': 'ar',
    'ar-iq': 'ar',
    'ar-jo': 'ar',
    'ar-kw': 'ar',
    'ar-lb': 'ar',
    'ar-ly': 'ar',
    'ar-ma': 'ar',
    'ar-om': 'ar',
    'ar-qa': 'ar',
    'ar-sd': 'ar',
    'ar-sy': 'ar',
    'ar-tn': 'ar',
    'ar-ye': 'ar',
    // Swahili
    'sw': 'sw',
    'sw-ke': 'sw',
    'sw-tz': 'sw',
    'sw-ug': 'sw',
    'sw-cd': 'sw',
    // Hausa
    'ha': 'ha',
    'ha-ne': 'ha',
    'ha-gh': 'ha',
    // Yoruba
    'yo': 'yo',
    'yo-bj': 'yo',
    // Igbo
    'ig': 'ig',
    // Amharic
    'am': 'am',
    'am-et': 'am',
    // Zulu
    'zu': 'zu',
    'zu-za': 'zu',
    // Afrikaans
    'af': 'af',
    'af-na': 'af',
    'af-za': 'af',
    // English (default)
    'en': 'en',
    'en-us': 'en',
    'en-gb': 'en',
    'en-ca': 'en',
    'en-au': 'en',
    'en-ng': 'en',
    'en-ke': 'en',
    'en-za': 'en',
    'en-gh': 'en',
  };
  
  // Check all browser languages
  for (const lang of browserLangs) {
    const langLower = lang.toLowerCase();
    if (localeMap[langLower]) {
      return localeMap[langLower];
    }
    // Try just the language code (e.g., 'en' from 'en-US')
    const langCode = langLower.split('-')[0];
    if (localeMap[langCode]) {
      return localeMap[langCode];
    }
  }
  
  // Fallback: check if primary language matches
  if (localeMap[browserLang]) {
    return localeMap[browserLang];
  }
  
  // Default to English
  return 'en';
}

// ── Context shape ──────────────────────────────────────────────────
interface LangContextValue {
  lang: LangCode;
  langMeta: LangMeta;
  setLang: (code: LangCode) => void;
  t: (key: keyof TranslationDict) => string;
  isRTL: boolean;
  detectLocale: () => void;
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

  // Auto-detect browser locale
  const detectLocale = useCallback(() => {
    const detected = detectBrowserLanguage();
    setLangState(detected);
  }, []);

  // Translation function with English fallback
  const t = useCallback((key: keyof TranslationDict): string => {
    const dict = TRANSLATIONS[lang];
    return dict[key] ?? TRANSLATIONS['en'][key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, langMeta, setLang, t, isRTL, detectLocale }}>
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
