import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * MUI-06 — CORE Context RightPane (single JSX file)
 * - Gộp toàn bộ: mock context + right pane widgets + App runner
 * - Giữ nguyên giao diện & hành vi từ mã gốc (TS/TSX → JSX)
 */

/* =====================
   Mock Data & Helpers
===================== */
const rid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
  return v.toString(16);
});

const recentDocs = [
  { id: rid(), title:'RBAC Matrix v1', uri:'/docs/rbac-matrix', kind:'sheet' },
  { id: rid(), title:'Payroll Run SOP', uri:'/docs/payroll-sop', kind:'doc' },
  { id: rid(), title:'Audit Trail Design', uri:'/docs/audit-trail', kind:'pdf' },
];

const quickLinks = [
  { id: rid(), title:'Projects', uri:'/projects' },
  { id: rid(), title:'Approvals', uri:'/approvals' },
  { id: rid(), title:'HR / Timesheet', uri:'/hr/timesheet' },
  { id: rid(), title:'Admin / Audit', uri:'/admin/audit' },
];

const activities = [
  { id: rid(), ts: Date.now()-1000*60*12, who:'Hieu Le', what:'updated', target:'RBAC Matrix v1' },
  { id: rid(), ts: Date.now()-1000*60*40, who:'Finance Manager', what:'commented', target:'Payroll SOP' },
  { id: rid(), ts: Date.now()-1000*60*85, who:'Project Manager', what:'created task', target:'Bank file export' },
];

const fmtTime = (ts, loc='vi') => new Intl.DateTimeFormat(loc, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(ts));

/* =====================
   Cards / Widgets
===================== */
function Card({ title, children, footer }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ border:`1px solid ${colors.border}`, borderRadius:12, background:'#fff', overflow:'hidden' }}>
      <div style={{ padding:'10px 12px', fontWeight:800, borderBottom:`1px solid ${colors.border}`, background:'#f9fafb' }}>{title}</div>
      <div style={{ padding:12 }}>{children}</div>
      {footer && <div style={{ padding:10, borderTop:`1px solid ${colors.border}`, background:'#fafafa' }}>{footer}</div>}
    </div>
  );
}

function DocRow({ d, onOpen }){
  const icon = d.kind==='pdf'? '📕' : d.kind==='sheet'? '📊' : '📄';
  return (
    <button onClick={()=>onOpen(d.uri)} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor:'pointer' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:22, textAlign:'center' }}>{icon}</span>
        <div style={{ fontWeight:600 }}>{d.title}</div>
        <code style={{ marginLeft:'auto', fontSize:12, opacity:0.6 }}>{d.uri}</code>
      </div>
    </button>
  );
}

function ActivityRow({ a }){
  return (
    <div style={{ display:'flex', gap:8, padding:'8px 10px', borderBottom:'1px solid #f3f4f6' }}>
      <span>🕒</span>
      <div>
        <div style={{ fontWeight:600 }}>{a.who} <span style={{ fontWeight:400 }}>— {a.what}</span></div>
        <div style={{ fontSize:12, color:'#6b7280' }}>{a.target} • {fmtTime(a.ts)}</div>
      </div>
    </div>
  );
}

function LinkRow({ l, onOpen }){
  return (
    <button onClick={()=>onOpen(l.uri)} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor:'pointer' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:22, textAlign:'center' }}>🔗</span>
        <div style={{ fontWeight:600 }}>{l.title}</div>
        <code style={{ marginLeft:'auto', fontSize:12, opacity:0.6 }}>{l.uri}</code>
      </div>
    </button>
  );
}

/* =====================
   Context Right Pane (main)
===================== */
export function ContextRightPane({ open=true, onClose, locale='vi', onOpenRoute }){
  const [panelOpen, setPanelOpen] = useState(open);
  useEffect(()=> setPanelOpen(open), [open]);

  if (!panelOpen) return null;

  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };

  const onOpen = (uri) => onOpenRoute?.(uri);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={()=>{ setPanelOpen(false); onClose?.(); }}>
      <div style={{ width:360, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)', display:'grid', gridTemplateRows:'auto 1fr', gap:0 }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:colors.bg }}>
          <div style={{ fontWeight:800 }}>Context</div>
          <button onClick={()=>{ setPanelOpen(false); onClose?.(); }} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>

        {/* Body */}
        <div style={{ overflow:'auto', padding:12, background:colors.bgAlt }}>
          <div style={{ display:'grid', gap:12 }}>
            <Card title="Pinned Docs" footer={<span style={{ fontSize:12, color:'#6b7280' }}>3 items</span>}>
              <div>
                {recentDocs.map(d=> <DocRow key={d.id} d={d} onOpen={onOpen} />)}
              </div>
            </Card>
            <Card title="Recent Activity">
              <div>
                {activities.map(a=> <ActivityRow key={a.id} a={a} />)}
              </div>
            </Card>
            <Card title="Quick Links" footer={<span style={{ fontSize:12, color:'#6b7280' }}>{quickLinks.length} links</span>}>
              <div>
                {quickLinks.map(l=> <LinkRow key={l.id} l={l} onOpen={onOpen} />)}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================
   Runner (demo)
===================== */
export default function App(){
  const [open, setOpen] = useState(true);
  const [lastOpen, setLastOpen] = useState('');
  return (
    <div style={{ height:'100vh' }}>
      <div style={{ position:'fixed', top:12, left:12, display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={()=>setOpen(true)} style={{ border:'1px solid #e5e7eb', padding:'8px 12px', borderRadius:8, background:'#fff' }}>Open Context Pane</button>
        {lastOpen && <span style={{ color:'#6b7280' }}><b>Last opened:</b> {lastOpen}</span>}
      </div>
      <ContextRightPane open={open} onClose={()=>setOpen(false)} onOpenRoute={(uri)=>{ setLastOpen(uri); alert('Open route: '+uri); }} />
    </div>
  );
}
