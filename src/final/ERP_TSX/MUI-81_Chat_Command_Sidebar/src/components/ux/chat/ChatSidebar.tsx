
// src/components/ux/chat/ChatSidebar.tsx — embeddable role-based chat sidebar
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { answer, type ChatMsg, type Role, commands as slashCommands } from './chatEngine';

export type ChatSidebarProps = {
  initialRole?: Role;
  open?: boolean;
  onOpenChange?: (o:boolean)=>void;
  widthPx?: number;
};

const rid = () => Math.random().toString(36).slice(2);

const rolePrompts: Record<Role, { title: string; prompts: { label: string; text: string }[] }> = {
  Admin: {
    title: 'Kịch bản nhanh (Admin)',
    prompts: [
      { label:'RBAC Matrix', text:'Hiển thị ma trận quyền theo vai trò (ADM-02).' },
      { label:'Audit logs', text:'Cách lọc audit logs theo user và entity.' },
      { label:'Chính sách mật khẩu', text:'Tóm tắt quy tắc mật khẩu & rotation.' },
    ]
  },
  Finance: {
    title:'Kịch bản nhanh (Finance)',
    prompts:[
      { label:'Expense policy', text:'/expense policy' },
      { label:'Tạo Expense', text:'/expense new' },
      { label:'Phê duyệt EX-1023', text:'/approve EX-1023' }
    ]
  },
  PM: {
    title:'Kịch bản nhanh (PM)',
    prompts:[
      { label:'Tình trạng PRJ-A', text:'/task status PRJ-A' },
      { label:'Mở Task board', text:'Mở bảng công việc dự án.' },
      { label:'Báo cáo Sprint', text:'Tạo báo cáo sprint tuần này.' },
    ]
  },
  HR: {
    title:'Kịch bản nhanh (HR)',
    prompts:[
      { label:'Onboarding 3 bước', text:'Hướng dẫn onboarding nhân sự mới trong 3 bước.' },
      { label:'Chính sách nghỉ phép', text:'Tóm tắt chính sách ngày phép năm.' },
      { label:'Báo cáo headcount', text:'Cách chạy báo cáo headcount theo phòng ban.' },
    ]
  },
  Employee: {
    title:'Kịch bản nhanh (Employee)',
    prompts:[
      { label:'Tạo Expense', text:'/expense new' },
      { label:'Xin nghỉ', text:'Hướng dẫn tạo yêu cầu nghỉ phép.' },
      { label:'Tìm tài liệu OCR', text:'/kb OCR invoice' }
    ]
  }
};

function MsgBubble({ m }: { m: ChatMsg }){
  const mine = m.from==='user';
  return (
    <div style={{ display:'grid', justifyContent: mine? 'end' : 'start' }}>
      <div style={{ maxWidth: '80%', background: mine? '#e0f2fe' : '#f8fafc', border:'1px solid #e5e7eb', padding:'8px 10px', borderRadius: mine? '12px 12px 2px 12px':'12px 12px 12px 2px', whiteSpace:'pre-wrap', fontSize:13 }}>
        {m.text}
      </div>
    </div>
  );
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ initialRole='Employee', open: openProp, onOpenChange, widthPx=380 }) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [open, setOpen] = useState<boolean>(!!openProp);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ id: rid(), from:'system', text: 'Bắt đầu hội thoại. Gõ /help để xem lệnh.', at: Date.now() }]);
  const [q, setQ] = useState('');

  useEffect(()=> { if (openProp!==undefined) setOpen(openProp); }, [openProp]);
  useEffect(()=> { onOpenChange?.(open); }, [open]);

  const send = async (text: string) => {
    const t = text.trim(); if (!t) return;
    const me: ChatMsg = { id: rid(), from:'user', text: t, at: Date.now() };
    setMsgs(ms => [...ms, me]);
    setQ('');
    const outs = await answer(t, role);
    setMsgs(ms => [...ms, ...outs.map(o => ({ ...o, id: rid() }))]);
  };

  // Slash command hint dropdown (simple)
  const [showCmds, setShowCmds] = useState(false);
  const filteredCmds = useMemo(()=> {
    if (!q.startsWith('/')) return [];
    const key = q.slice(1).toLowerCase();
    return slashCommands.filter(c => (c.id.includes(key) || (c.keywords||[]).some(k => k.includes(key)))).slice(0,6);
  }, [q]);

  // Embeddable toggle button (floating)
  return (
    <>
      <button
        onClick={()=> setOpen(o=>!o)}
        title="Chat (Ctrl+/)"
        style={{ position:'fixed', right:14, bottom:14, zIndex:55, border:'1px solid #e5e7eb', borderRadius:999, padding:'10px 12px', background:'#fff', boxShadow:'0 10px 24px rgba(0,0,0,.15)' }}
      >💬 Chat</button>

      {open && (
        <div role="complementary" aria-label="Chat sidebar" style={{ position:'fixed', top:0, right:0, height:'100vh', width: widthPx, background:'#fff', borderLeft:'1px solid #e5e7eb', zIndex:54, display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
            <div style={{ fontWeight:800 }}>Role Chat</div>
            <select value={role} onChange={e=> setRole(e.target.value as Role)} style={{ marginLeft:8, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
              <option>Employee</option><option>Finance</option><option>PM</option><option>HR</option><option>Admin</option>
            </select>
            <button onClick={()=> setOpen(false)} aria-label="Close" style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, width:28, height:28, background:'#fff' }}>✕</button>
          </div>

          {/* Body: suggestions + messages */}
          <div style={{ display:'grid', gridTemplateRows:'auto 1fr', overflow:'hidden' }}>
            <div style={{ borderBottom:'1px dashed #e5e7eb', padding:'8px 10px', display:'grid', gap:8 }}>
              <div style={{ fontWeight:600 }}>{rolePrompts[role].title}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {rolePrompts[role].prompts.map((p,i) => (
                  <button key={i} onClick={()=> send(p.text)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', background:'#fff', fontSize:12, cursor:'pointer' }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div style={{ overflow:'auto', padding:10, display:'grid', gap:8 }}>
              {msgs.filter(m => m.from!=='system').map(m => <MsgBubble key={m.id} m={m} />)}
              {msgs.filter(m => m.from==='system').map(m => <div key={m.id} style={{ color:'#94a3b8', fontSize:12 }}>{m.text}</div>)}
            </div>
          </div>

          {/* Input */}
          <div style={{ display:'grid', gap:6, padding:'10px 12px', borderTop:'1px solid #e5e7eb' }}>
            <div style={{ position:'relative' }}>
              <input
                value={q}
                onChange={e=> { setQ(e.target.value); setShowCmds(e.target.value.startsWith('/')); }}
                onKeyDown={(e)=> { if (e.key==='Enter') { e.preventDefault(); send(q); } }}
                placeholder="Nhập tin nhắn hoặc gõ / để xem lệnh…"
                style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:999, padding:'8px 12px' }}
              />
              {/* Slash command dropdown */}
              {showCmds && filteredCmds.length>0 && (
                <div style={{ position:'absolute', left:0, right:0, bottom:'110%', background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, boxShadow:'0 10px 24px rgba(0,0,0,.15)', overflow:'hidden' }}>
                  {filteredCmds.map((c,i) => (
                    <button key={c.id+i} onClick={()=> { setQ(c.sample || '/'+c.id.replace('.',' ')); setShowCmds(false); }} style={{ width:'100%', textAlign:'left', display:'grid', gap:4, padding:'8px 10px', borderBottom:'1px solid #f1f5f9', background:'#fff' }}>
                      <div style={{ fontWeight:600 }}>{c.title}</div>
                      {c.sample && <div style={{ color:'#64748b', fontSize:12 }}>{c.sample}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', color:'#64748b', fontSize:12 }}>
              <div>Mẹo: thử <code>/help</code>, <code>/expense policy</code>, <code>/task status PRJ-A</code></div>
              <div>Embeddable • UX‑08</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
