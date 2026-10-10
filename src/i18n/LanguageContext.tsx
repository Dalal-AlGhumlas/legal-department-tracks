import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from './translations';

interface LanguageContextValue {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (typeof TRANSLATIONS)['ar'] | (typeof TRANSLATIONS)['en'];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'masar_ksu_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {
      // ignore storage errors
    }
    return 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);
    document.title = t.meta.title;
  }, [lang, dir, t]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
