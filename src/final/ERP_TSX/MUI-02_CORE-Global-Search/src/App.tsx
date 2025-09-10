// src/App.tsx — Runner for CORE-02 Global_Search
import React, { useState } from 'react';
import { GlobalSearch } from './components/core/GlobalSearch';

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <h2>CORE-02 — Global Search</h2>
      <p>Press <b>Ctrl/⌘+K</b> or click the button below.</p>
      <button onClick={()=>setOpen(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', background:'#fff' }}>
        Open Global Search
      </button>
      <GlobalSearch open={open} onClose={()=>setOpen(false)} onNavigate={(route)=>alert('Navigate to: ' + route)} hotkey locale="vi" />
    </div>
  );
}
