// src/i18n/i18n.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'vi' | 'en';
export type Currency = 'VND' | 'USD';
export type TimeZone = string; // e.g., 'Asia/Ho_Chi_Minh'

type Dict = Record<string, string>;
type Bundle = { vi: Dict; en: Dict };

const defaultBundle: Bundle = {
  vi: {
    'app.title': 'Bộ chuyển ngôn ngữ & định dạng',
    'hello': 'Xin chào',
    'sample.paragraph': 'Đây là ví dụ về dịch chuỗi, ngày giờ và tiền tệ.',
    'label.language': 'Ngôn ngữ',
    'label.currency': 'Tiền tệ',
    'label.timezone': 'Múi giờ',
    'label.preview': 'Xem trước định dạng',
    'label.number': 'Số',
    'label.currencyAmount': 'Số tiền',
    'label.date': 'Ngày',
    'label.time': 'Giờ',
    'label.apply': 'Áp dụng',
    'label.reset': 'Mặc định',
  },
  en: {
    'app.title': 'Locale & Formatting Switcher',
    'hello': 'Hello',
    'sample.paragraph': 'This is a demo of string translation, date/time and currency formatting.',
    'label.language': 'Language',
    'label.currency': 'Currency',
    'label.timezone': 'Time zone',
    'label.preview': 'Format preview',
    'label.number': 'Number',
    'label.currencyAmount': 'Amount',
    'label.date': 'Date',
    'label.time': 'Time',
    'label.apply': 'Apply',
    'label.reset': 'Reset',
  }
};

export type I18nState = {
  locale: Locale;
  currency: Currency;
  timeZone: TimeZone;
  dict: Bundle;
};

type Ctx = I18nState & {
  t: (key: string) => string;
  formatNumber: (n: number) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: Date) => string;
  formatTime: (d: Date) => string;
  setLocale: (loc: Locale) => void;
  setCurrency: (cur: Currency) => void;
  setTimeZone: (tz: TimeZone) => void;
  reset: () => void;
};

const I18nContext = createContext<Ctx | null>(null);

const LS_KEY = 'erp.i18n';

export const I18nProvider: React.FC<{ children: React.ReactNode; bundle?: Bundle; defaultLocale?: Locale; defaultCurrency?: Currency; defaultTimeZone?: TimeZone; }> = ({
  children,
  bundle = defaultBundle,
  defaultLocale = 'vi',
  defaultCurrency = 'VND',
  defaultTimeZone = 'Asia/Ho_Chi_Minh',
}) => {
  const [state, setState] = useState<I18nState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { locale: defaultLocale, currency: defaultCurrency, timeZone: defaultTimeZone, dict: bundle };
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  const t = useCallback((key: string) => {
    const table = state.locale === 'vi' ? state.dict.vi : state.dict.en;
    return table[key] ?? key;
  }, [state.locale, state.dict]);

  const nf = useMemo(() => new Intl.NumberFormat(state.locale.replace('_', '-')), [state.locale]);
  const cf = useMemo(() => new Intl.NumberFormat(state.locale.replace('_', '-'), { style: 'currency', currency: state.currency }), [state.locale, state.currency]);
  const df = useMemo(() => new Intl.DateTimeFormat(state.locale.replace('_', '-'), { timeZone: state.timeZone, year:'numeric', month:'2-digit', day:'2-digit' }), [state.locale, state.timeZone]);
  const tf = useMemo(() => new Intl.DateTimeFormat(state.locale.replace('_', '-'), { timeZone: state.timeZone, hour:'2-digit', minute:'2-digit', second:'2-digit' }), [state.locale, state.timeZone]);

  const ctx: Ctx = {
    ...state,
    t,
    formatNumber: (n: number) => nf.format(n),
    formatCurrency: (n: number) => cf.format(n),
    formatDate: (d: Date) => df.format(d),
    formatTime: (d: Date) => tf.format(d),
    setLocale: (loc) => setState(s => ({ ...s, locale: loc })),
    setCurrency: (cur) => setState(s => ({ ...s, currency: cur })),
    setTimeZone: (tz) => setState(s => ({ ...s, timeZone: tz })),
    reset: () => setState({ locale: defaultLocale, currency: defaultCurrency, timeZone: defaultTimeZone, dict: bundle }),
  };

  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
};

export function useI18n(): Ctx {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n must be used within I18nProvider');
  return v;
}
