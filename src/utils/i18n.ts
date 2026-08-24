/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';
import { ThemeColorId } from './theme';
import enUS from '../locales/en-US.json';
import ptBR from '../locales/pt-BR.json';
import es from '../locales/es-ES.json';

export type Language = 'pt-BR' | 'en-US' | 'es' | 'pt' | 'en';
export type Theme = 'light' | 'dark';
export type Currency = 'USD' | 'BRL' | 'EUR';

export interface TranslationDict {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

// Flatten nested JSON objects into dot-notated string keys
const flattenDict = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  let res: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(res, flattenDict(obj[key], p));
      } else {
        res[p] = String(obj[key]);
      }
    }
  }
  return res;
};

const flatEnUS = flattenDict(enUS);
const flatPtBR = flattenDict(ptBR);
const flatEs = flattenDict(es);

// Dynamically construct and expose translations dictionary from the JSON files
// to maintain 100% backward compatibility with any legacy imports.
export const translations: TranslationDict = {};

const allKeys = Array.from(new Set([
  ...Object.keys(flatEnUS),
  ...Object.keys(flatPtBR),
  ...Object.keys(flatEs)
]));

allKeys.forEach((key) => {
  translations[key] = {
    en: flatEnUS[key] || flatPtBR[key] || flatEs[key] || key,
    pt: flatPtBR[key] || flatEnUS[key] || flatEs[key] || key,
    es: flatEs[key] || flatEnUS[key] || flatPtBR[key] || key,
  };
});

// Helper to normalize languages
export const normalizeLanguage = (lang: string): 'en-US' | 'pt-BR' | 'es' => {
  const l = lang.toLowerCase();
  if (l.startsWith('pt')) return 'pt-BR';
  if (l.startsWith('es')) return 'es';
  return 'en-US';
};

// Auto-detect country and default currency
export const detectDefaultCurrency = (): Currency => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('pt') || browserLang.includes('br')) {
    return 'BRL';
  }
  // Check timezone for European countries or language Spanish/Italian/French etc. for Euro fallback
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
  if (
    browserLang.startsWith('es') || 
    browserLang.startsWith('fr') || 
    browserLang.startsWith('de') || 
    browserLang.startsWith('it') ||
    tz.includes('europe') ||
    tz.includes('madrid') ||
    tz.includes('paris') ||
    tz.includes('berlin') ||
    tz.includes('rome')
  ) {
    return 'EUR';
  }
  return 'USD';
};

// Global format currency helper that reads dynamic preferences from localStorage
export const formatCurrency = (value: number, langOrCurrency?: string): string => {
  const currentCurrency = localStorage.getItem('life4billion_currency') || localStorage.getItem('omnisaas_currency') || detectDefaultCurrency();
  const locale = getActiveLocale();
  
  try {
    return value.toLocaleString(locale, { style: 'currency', currency: currentCurrency });
  } catch (e) {
    // Fallback if formatting fails
    const symbol = currentCurrency === 'BRL' ? 'R$ ' : currentCurrency === 'EUR' ? '€' : '$';
    return symbol + value.toFixed(2);
  }
};

// Dynamic Date and Time Localization Helpers
export const getActiveLocale = (): string => {
  const lang = localStorage.getItem('life4billion_language') || localStorage.getItem('omnisaas_language') || 'en-US';
  const norm = normalizeLanguage(lang);
  if (norm === 'pt-BR') return 'pt-BR';
  if (norm === 'es') return 'es-ES';
  return 'en-US';
};

export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = getActiveLocale();
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = getActiveLocale();
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatNumber = (value: number, decimals = 2): string => {
  const locale = getActiveLocale();
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercent = (value: number): string => {
  const locale = getActiveLocale();
  return (value / 100).toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
};

export interface LanguageThemeContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  themeColor: ThemeColorId;
  setThemeColor: (color: ThemeColorId) => void;
  t: (key: keyof typeof enUS | string, fallback?: string) => string;
}

export const LanguageThemeContext = createContext<LanguageThemeContextProps | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageThemeContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageThemeProvider');
  }
  
  // Normalize language to 2-letter format ('pt', 'es', 'en')
  // to ensure compatibility with existing language comparisons across the codebase
  const rawLanguage = context.language;
  const language = rawLanguage.toLowerCase().startsWith('pt') ? 'pt' : rawLanguage.toLowerCase().startsWith('es') ? 'es' : 'en';

  return {
    ...context,
    language,
    rawLanguage
  };
};

export const useLanguageTheme = () => {
  return useTranslation();
};
