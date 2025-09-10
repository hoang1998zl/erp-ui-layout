// src/App.tsx — Runner for CORE-04 Localization_Switcher
import React from 'react';
import { I18nProvider } from './i18n/i18n';
import { LocaleSwitcher } from './components/core/LocaleSwitcher';

export default function App() {
  return (
    <I18nProvider defaultLocale="vi" defaultCurrency="VND" defaultTimeZone="Asia/Ho_Chi_Minh">
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6' }}>
        <div style={{ width:720, border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
          <LocaleSwitcher />
        </div>
      </div>
    </I18nProvider>
  );
}
