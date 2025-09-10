
// src/App.tsx — Runner for KPI-08 Dashboard_Employee
import React from 'react';
import { DashboardEmployee } from './components/kpi/DashboardEmployee';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1600px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>KPI-08 — Dashboard Employee</div>
        <div style={{ padding:12 }}>
          <DashboardEmployee locale="vi" />
        </div>
      </div>
    </div>
  );
}
