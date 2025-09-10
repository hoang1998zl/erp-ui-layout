// src/App.tsx — Runner for EIM-03 Document_Viewer
import React from 'react';
import { DocumentViewer } from './components/eim/DocumentViewer';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1600px, 96vw)', height:'min(900px, 90vh)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>EIM-03 — Document Viewer</div>
        <DocumentViewer locale="vi" />
      </div>
    </div>
  );
}
