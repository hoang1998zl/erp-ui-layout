// src/App.tsx — Runner for ADM-01 User_Management
import React from 'react';
import { UserManagement } from './components/admin/UserManagement';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:1100, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>ADM-01 — User Management</div>
        <UserManagement locale="vi" pageSize={12} />
      </div>
    </div>
  );
}
