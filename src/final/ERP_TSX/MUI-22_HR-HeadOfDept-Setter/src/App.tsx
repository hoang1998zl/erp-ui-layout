// src/App.tsx — Runner for HR-08 HeadOfDept_Setter
import React from 'react';
import { HeadOfDeptSetter } from './components/hr/HeadOfDeptSetter';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1500px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>HR-08 — HeadOfDept Setter</div>
        <HeadOfDeptSetter locale="vi" />
      </div>
    </div>
  );
}
