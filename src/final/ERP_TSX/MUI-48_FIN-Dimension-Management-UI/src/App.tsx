
// src/App.tsx — Runner for FIN-04 Dimension_Management_UI
import React from 'react';
import { DimensionManagement } from './components/fin/DimensionManagement';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1700px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>FIN-04 — Dimension Management</div>
        <DimensionManagement locale="vi" />
      </div>
    </div>
  );
}
