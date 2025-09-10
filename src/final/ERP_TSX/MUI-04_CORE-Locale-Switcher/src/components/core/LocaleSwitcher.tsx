// src/components/core/LocaleSwitcher.tsx
import React, { useMemo, useState } from 'react';
import { useI18n, Locale, Currency, TimeZone } from '../../i18n/i18n';

const tzOptions: TimeZone[] = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'America/Los_Angeles',
];

export const LocaleSwitcher: React.FC = () => {
  const i18n = useI18n();
  const [loc, setLoc] = useState<Locale>(i18n.locale);
  const [cur, setCur] = useState<Currency>(i18n.currency);
  const [tz, setTz] = useState<TimeZone>(i18n.timeZone);
  const now = useMemo(()=>new Date(), []);

  return (
    <div style={{ display:'grid', gap:10, padding:12, background:'#ffffff' }}>
      <div style={{ fontWeight:700 }}>{i18n.t('app.title')}</div>
      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center' }}>
        <label style={{ color:'#6b7280' }}>{i18n.t('label.language')}</label>
        <select value={loc} onChange={e=>setLoc(e.target.value as Locale)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
          <option value="vi">Tiếng Việt (vi‑VN)</option>
          <option value="en">English (en‑US)</option>
        </select>

        <label style={{ color:'#6b7280' }}>{i18n.t('label.currency')}</label>
        <select value={cur} onChange={e=>setCur(e.target.value as Currency)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
          <option value="VND">VND — Vietnamese Đồng</option>
          <option value="USD">USD — US Dollar</option>
        </select>

        <label style={{ color:'#6b7280' }}>{i18n.t('label.timezone')}</label>
        <select value={tz} onChange={e=>setTz(e.target.value as TimeZone)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
          {tzOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center', padding:'10px', border:'1px solid #e5e7eb', borderRadius:10, background:'#f9fafb' }}>
        <div style={{ fontWeight:700 }}>{i18n.t('label.preview')}</div>
        <div />

        <label style={{ color:'#6b7280' }}>{i18n.t('label.number')}</label>
        <div>{i18n.formatNumber(1234567.89)}</div>

        <label style={{ color:'#6b7280' }}>{i18n.t('label.currencyAmount')}</label>
        <div>{i18n.formatCurrency(2350000)}</div>

        <label style={{ color:'#6b7280' }}>{i18n.t('label.date')}</label>
        <div>{i18n.formatDate(now)}</div>

        <label style={{ color:'#6b7280' }}>{i18n.t('label.time')}</label>
        <div>{i18n.formatTime(now)}</div>
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => { i18n.setLocale(loc); i18n.setCurrency(cur); i18n.setTimeZone(tz); }}
                style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>{i18n.t('label.apply')}</button>
        <button onClick={() => { i18n.reset(); setLoc(i18n.locale); setCur(i18n.currency); setTz(i18n.timeZone); }}
                style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, padding:'8px 12px' }}>{i18n.t('label.reset')}</button>
      </div>

      <div style={{ color:'#6b7280', fontSize:13 }}>
        <b>{i18n.t('hello')}!</b> {i18n.t('sample.paragraph')}
      </div>
    </div>
  );
};
