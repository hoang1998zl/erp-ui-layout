// src/App.tsx — Runner for CORE-05 Audit_Log_Viewer
import React from 'react';
import { AuditLogViewer } from './components/core/AuditLogViewer';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:1000, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>CORE-05 — Audit Log Viewer</div>
        <AuditLogViewer locale="vi" pageSize={20} />
      </div>
    </div>
  );
}
