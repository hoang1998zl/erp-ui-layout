// src/App.tsx — Runner for HR-02 ESS_Leave_Request
import React from 'react';
import { ESSLeaveRequest } from './components/hr/ESSLeaveRequest';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1300px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>HR-02 — ESS Leave Request</div>
        <ESSLeaveRequest locale="vi" />
      </div>
    </div>
  );
}
