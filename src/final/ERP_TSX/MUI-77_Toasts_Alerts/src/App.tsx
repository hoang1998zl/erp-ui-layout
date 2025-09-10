
// src/App.tsx — Runner for UX-04 Toasts_Alerts
import React from 'react';
import { ToastDemo } from './components/ux/toast/ToastDemo';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 0' }}>
      <div style={{ width:'min(1200px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>UX‑04 — Toasts & Alerts</div>
        <div style={{ padding:12 }}>
          <ToastDemo />
        </div>
      </div>
    </div>
  );
}
