
// src/components/ux/alerts/AlertBanner.tsx — UX‑04 Alerts (inline page-level)
import React from 'react';

export type AlertVariant = 'success'|'error'|'info'|'warning';

const tone = (v: AlertVariant) => {
  if (v==='success') return { bg:'#ecfdf5', bd:'#a7f3d0', fg:'#065f46', icon:'✔' };
  if (v==='error') return { bg:'#fef2f2', bd:'#fecaca', fg:'#991b1b', icon:'⚠' };
  if (v==='warning') return { bg:'#fffbeb', bd:'#fde68a', fg:'#92400e', icon:'⚠' };
  return { bg:'#eff6ff', bd:'#bfdbfe', fg:'#1e40af', icon:'ℹ' };
};

export const AlertBanner: React.FC<{
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}> = ({ variant='info', title, children, onClose }) => {
  const t = tone(variant);
  const role = variant==='error' ? 'alert' : 'status';
  return (
    <div role={role as any} style={{ border:'1px solid '+t.bd, background:t.bg, color:t.fg, borderRadius:12, padding:'10px 12px', display:'grid', gridTemplateColumns:'22px 1fr auto', gap:10, alignItems:'start' }}>
      <div aria-hidden style={{ fontSize:16, lineHeight:'20px' }}>{t.icon}</div>
      <div style={{ display:'grid', gap:4 }}>
        {title && <div style={{ fontWeight:800 }}>{title}</div>}
        {children && <div style={{ fontSize:13 }}>{children}</div>}
      </div>
      {onClose && <button onClick={onClose} aria-label="Close" style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, width:26, height:26, color:'#0f172a' }}>✕</button>}
    </div>
  );
};
