'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const translations: Record<string, any> = { en, fr };

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { returnObjects: boolean }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('busmo_language');
      if (saved === 'en' || saved === 'fr') {
        setLanguageState(saved);
        return;
      }

      const browser = (navigator.language || '').toLowerCase();
      if (browser.startsWith('fr')) {
        setLanguageState('fr');
      }
    } catch {
      // Ignore storage / browser access errors.
    }
  }, []);

  const setLanguage = useCallback((next: string) => {
    const normalized: 'en' | 'fr' = next === 'fr' ? 'fr' : 'en';
    setLanguageState(normalized);
    try {
      window.localStorage.setItem('busmo_language', normalized);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const t = useCallback((key: string, options?: { returnObjects: boolean }): any => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is missing
        let fallback = translations['en'];
        for (const fk of keys) {
           fallback = fallback?.[fk];
           if (fallback === undefined) {
            console.warn(`Translation key "${key}" not found in language "${language}" or fallback "en".`);
            return key;
           }
        }
        if (options?.returnObjects) return fallback;
        return typeof fallback === 'object' ? key : fallback;
      }
    }
    if (options?.returnObjects) return result;
    return typeof result === 'object' ? key : result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
