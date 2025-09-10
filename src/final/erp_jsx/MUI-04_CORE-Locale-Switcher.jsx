import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * MUI-04 — CORE Locale Switcher (single JSX file)
 * - Gộp toàn bộ: mock/locales + component + App runner
 * - Giữ nguyên giao diện & hành vi từ mã gốc (TS/TSX → JSX)
 */

/* =====================
   Mock locales & helpers
===================== */
const LOCALES = [
  { id:'vi', label:'Tiếng Việt' },
  { id:'en', label:'English'   },
  { id:'ja', label:'日本語'        },
  { id:'fr', label:'Français'  },
];

const messages = {
  vi: {
    hello: 'Xin chào',
    date: 'Hôm nay',
    choose: 'Chọn ngôn ngữ',
    current: 'Đang dùng',
    close: 'Đóng',
  },
  en: {
    hello: 'Hello',
    date: 'Today',
    choose: 'Choose language',
    current: 'Current',
    close: 'Close',
  },
  ja: {
    hello: 'こんにちは',
    date: '本日',
    choose: '言語を選択',
    current: '現在',
    close: '閉じる',
  },
  fr: {
    hello: 'Bonjour',
    date: "Aujourd'hui",
    choose: 'Choisir la langue',
    current: 'Actuelle',
    close: 'Fermer',
  }
};

const fmtDate = (d, loc) => new Intl.DateTimeFormat(loc, {
  year:'numeric', month:'2-digit', day:'2-digit',
  hour:'2-digit', minute:'2-digit'
}).format(d);

/* =====================
   LocaleSwitcher component
===================== */
export function LocaleSwitcher({ open=true, onClose, value='vi', onChange }){
  const [panelOpen, setPanelOpen] = useState(open);
  const [locale, setLocale] = useState(value);

  useEffect(()=> setPanelOpen(open), [open]);
  useEffect(()=>{ onChange?.(locale); }, [locale, onChange]);

  const now = useMemo(()=>new Date(), []);

  if (!panelOpen) return null;

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#ffffff', bgAlt:'#f9fafb' };
  const msg = messages[locale] || messages.vi;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={()=>{ setPanelOpen(false); onClose?.(); }}>
      <div style={{ width:420, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>🌐 {msg.choose}</div>
          <button onClick={()=>{ setPanelOpen(false); onClose?.(); }} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>{msg.close}</button>
        </div>

        {/* Current */}
        <div style={{ padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontSize:12, color:colors.sub }}>{msg.current}:</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
            <div style={{ fontWeight:700 }}>{LOCALES.find(l=>l.id===locale)?.label || locale}</div>
            <div style={{ fontSize:12, color:colors.sub }}>· {msg.date}: {fmtDate(now, locale)}</div>
          </div>
        </div>

        {/* Options */}
        <div style={{ overflow:'auto', height:'calc(100% - 124px)' }}>
          {LOCALES.map(l => (
            <button key={l.id} onClick={()=> setLocale(l.id)} style={{ width:'100%', textAlign:'left', padding:12, border:'none', background: l.id===locale? '#f3f4f6' : 'transparent', borderBottom:`1px solid ${colors.border}`, cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:22, textAlign:'center' }}>🌐</span>
                <div style={{ fontWeight:600 }}>{l.label}</div>
                <span style={{ marginLeft:'auto', fontSize:12, color:colors.sub }}>{l.id.toUpperCase()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================
   Runner (demo mount)
===================== */
export default function App(){
  const [open, setOpen] = useState(true);
  const [loc, setLoc] = useState('vi');
  const msg = messages[loc] || messages.vi;
  const now = useMemo(()=>new Date(), []);

  return (
    <div style={{ height:'100vh' }}>
      <div style={{ position:'fixed', top:12, left:12, display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={()=>setOpen(true)} style={{ border:'1px solid #e5e7eb', padding:'8px 12px', borderRadius:8, background:'#fff' }}>Open Locale Switcher</button>
        <div style={{ color:'#6b7280' }}>{msg.hello}! · {msg.date}: {fmtDate(now, loc)}</div>
      </div>
      <LocaleSwitcher open={open} onClose={()=>setOpen(false)} value={loc} onChange={setLoc} />
    </div>
  );
}
