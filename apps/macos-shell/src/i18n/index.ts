import { createContext, useContext, useCallback } from 'react';
import React from 'react';
import en from './locales/en';
import zh from './locales/zh';

export type Locale = 'en' | 'zh';

const dictionaries: Record<Locale, Record<string, string>> = { en, zh };

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key) => en[key] ?? key,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = dictionaries[locale] ?? dictionaries.en;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = dict[key] ?? en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return value;
    },
    [dict],
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, t } },
    children,
  );
}

export function useT() {
  return useContext(I18nContext).t;
}

export function useLocale() {
  return useContext(I18nContext).locale;
}
