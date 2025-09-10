
// src/App.tsx — Runner for FIN-06 Budget_Input_Grid
import React from 'react';
import { BudgetInputGrid } from './components/fin/BudgetInputGrid';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1800px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>FIN-06 — Budget Input Grid</div>
        <BudgetInputGrid locale="vi" />
      </div>
    </div>
  );
}
