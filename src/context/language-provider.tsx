'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ha from '@/locales/ha.json';
import ig from '@/locales/ig.json';
import yo from '@/locales/yo.json';

const translations: Record<string, any> = { en, fr, ha, ig, yo };

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { returnObjects: boolean }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

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
