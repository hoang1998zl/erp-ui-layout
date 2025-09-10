
// src/App.tsx — Runner for UX‑08 Chat_Command_Sidebar
import React from 'react';
import { ChatSidebar } from './components/ux/chat/ChatSidebar';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <header style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#fff', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:800 }}>ERP Demo Page</div>
        <div style={{ marginLeft:'auto', color:'#64748b', fontSize:12 }}>Open the chat via the bubble at bottom‑right</div>
      </header>
      <main style={{ padding:12 }}>
        <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(3, minmax(260px, 1fr))' }}>
          {[1,2,3].map(i => (
            <section key={i} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>Card {i}</div>
              <div style={{ padding:12, color:'#334155', fontSize:14, lineHeight:1.7 }}>
                Đây là nội dung giả lập của trang ERP. Sidebar chat có thể **embed** vào mọi trang để hỗ trợ theo vai trò, đưa ra gợi ý kịch bản và lệnh nhanh.
              </div>
            </section>
          ))}
        </div>
      </main>
      <ChatSidebar initialRole="Employee" />
    </div>
  );
}
