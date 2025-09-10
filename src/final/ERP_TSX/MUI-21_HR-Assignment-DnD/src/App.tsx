// src/App.tsx — Runner for HR-07 HR_Assignment_DnD
import React from 'react';
import { HRAssignmentDnD } from './components/hr/HRAssignmentDnD';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1500px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>HR-07 — HR Assignment (Drag & Drop)</div>
        <HRAssignmentDnD locale="vi" />
      </div>
    </div>
  );
}
