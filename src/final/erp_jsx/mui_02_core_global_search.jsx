import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MUI-02 — CORE-02 Global_Search (Canvas single file)
 * Chú ý: Giữ **API & text** như mã gốc. Không dùng lib ngoài.
 * Props y hệt bản zip:
 *   <GlobalSearch open onClose onNavigate hotkey locale defaultType />
 * Runner dưới cùng mô phỏng src/App.tsx.
 */

// ===== Mock Data (từ src/mock/data.ts, chuyển sang JS) =====
/** @typedef {string} UUID */
const rid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16);
});

/** @typedef {{ id:UUID, code:string, name:string, status:'planning'|'active'|'on_hold'|'closed' }} Project */
/** @typedef {{ id:UUID, project_id:UUID, title:string, status:'todo'|'in_progress'|'done', assignee?:string }} Task */
/** @typedef {{ id:UUID, doc_type:string, title:string, uri:string }} Document */
/** @typedef {{ id:UUID, email:string, full_name:string }} User */

const projects = [
  { id: rid(), code:'PRJ-001', name:'ERP Rollout', status:'active' },
  { id: rid(), code:'PRJ-002', name:'HR Analytics', status:'planning' },
  { id: rid(), code:'PRJ-003', name:'TimeGate Ingest', status:'on_hold' },
  { id: rid(), code:'PRJ-004', name:'Payroll Pipeline', status:'active' },
];
const tasks = [
  { id: rid(), project_id: projects[0].id, title:'Define modules', status:'in_progress', assignee:'Hieu Le' },
  { id: rid(), project_id: projects[1].id, title:'Design dashboards', status:'todo', assignee:'Project Manager' },
  { id: rid(), project_id: projects[2].id, title:'Build connectors', status:'todo' },
  { id: rid(), project_id: projects[3].id, title:'Bank file export', status:'done' },
];
const documents = [
  { id: rid(), doc_type:'spec', title:'RBAC Matrix v1', uri:'/docs/rbac-matrix' },
  { id: rid(), doc_type:'sheet', title:'Payroll Run SOP', uri:'/docs/payroll-sop' },
  { id: rid(), doc_type:'pdf', title:'Audit Trail Design', uri:'/docs/audit-trail' },
];
const users = [
  { id: rid(), email:'ceo@ktest.vn', full_name:'Hieu Le' },
  { id: rid(), email:'pm@ktest.vn', full_name:'Project Manager' },
  { id: rid(), email:'fin@ktest.vn', full_name:'Finance Manager' },
  { id: rid(), email:'staff@ktest.vn', full_name:'Employee A' },
];

const delay = (ms=200)=> new Promise(res=>setTimeout(res,ms));
async function fetchProjects(){ await delay(); return projects; }
async function fetchTasks(){ await delay(); return tasks; }
async function fetchDocuments(){ await delay(); return documents; }
async function fetchUsers(){ await delay(); return users; }

// ===== GlobalSearch (từ src/components/core/GlobalSearch.tsx, chuyển JSX) =====
export function GlobalSearch({ open=false, onClose, onNavigate, hotkey=true, locale='vi', defaultType='all' }){
  /** @type {React.MutableRefObject<HTMLInputElement|null>} */
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState(defaultType); // 'all'|'project'|'task'|'document'|'user'
  const [results, setResults] = useState([]); // {id,type,label,sub,route,score}[]
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);

  const t = (vi, en) => (locale === 'vi' ? vi : en);

  // Hotkey Ctrl/Cmd+K
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.ctrlKey||e.metaKey) && k === 'k') { e.preventDefault(); onOpen(); }
      if (open) {
        if (k === 'escape') { e.preventDefault(); onClose?.(); }
        if (k === 'arrowdown') setCursor(c=>Math.min(c+1, results.length-1));
        if (k === 'arrowup') setCursor(c=>Math.max(c-1, 0));
        if (k === 'enter' && results[cursor]) { e.preventDefault(); handleGo(results[cursor]); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey, open, results, cursor]);

  const onOpen = () => {
    // Focus input slight delay to wait modal mount
    setTimeout(()=> inputRef.current?.focus(), 0);
  };

  useEffect(() => { if (open) onOpen(); }, [open]);

  // Fetch + filter
  useEffect(() => {
    let cancelled = false;
    async function run(){
      if (!open) return;
      setLoading(true);
      const [ps, ts, ds, us] = await Promise.all([
        fetchProjects(), fetchTasks(), fetchDocuments(), fetchUsers()
      ]);
      if (cancelled) return;
      const all = [];
      const q = query.trim().toLowerCase();
      const push = (type, label, sub, route) => {
        const full = `${label} ${sub||''} ${route||''}`.toLowerCase();
        const idx = q ? full.indexOf(q) : 0;
        const score = q ? (idx === -1 ? Infinity : idx) : 0; // smaller is better
        if (!q || idx !== -1) all.push({ id: route||label, type, label, sub, route, score });
      };
      if (activeType==='all' || activeType==='project') ps.forEach(p=> push('project', `${p.code} — ${p.name}`, p.status, `/projects/${p.code.toLowerCase()}`));
      if (activeType==='all' || activeType==='task') ts.forEach(tk=> push('task', tk.title, tk.status + (tk.assignee? ` • ${tk.assignee}`:''), `/tasks/${tk.id}`));
      if (activeType==='all' || activeType==='document') ds.forEach(d=> push('document', d.title, d.doc_type, d.uri));
      if (activeType==='all' || activeType==='user') us.forEach(u=> push('user', u.full_name, u.email, `/users/${encodeURIComponent(u.email)}`));
      all.sort((a,b)=> a.score - b.score || a.label.localeCompare(b.label));
      setResults(all);
      setLoading(false);
      setCursor(0);
    }
    run();
    return ()=>{ cancelled = true; };
  }, [open, query, activeType]);

  const counts = useMemo(() => {
    const c = { project:0, task:0, document:0, user:0 };
    results.forEach(r=>{ c[r.type]++; });
    return c;
  }, [results]);

  const handleGo = (r) => {
    onNavigate?.(r.route);
  };

  if (!open) return null;

  const colors = {
    border: '#e5e7eb', text:'#111827', sub:'#6b7280', bg:'#ffffff', bgAlt:'#f9fafb', brand:'#2563eb'
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:120 }} onClick={onClose}>
      <div style={{ width:960, background:colors.bg, borderRadius:12, border:`1px solid ${colors.border}`, boxShadow:'0 10px 30px rgba(0,0,0,0.2)' }} onClick={(e)=>e.stopPropagation()}>
        {/* Header search */}
        <div style={{ display:'flex', gap:8, padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Gõ để tìm...', 'Type to search...')} style={{ flex:1, height:36, padding:'0 10px', borderRadius:8, border:`1px solid ${colors.border}` }} />
          <button onClick={onClose} title={t('Đóng', 'Close')} style={{ height:36, padding:'0 12px', borderRadius:8, border:`1px solid ${colors.border}`, background:colors.bgAlt }}>Esc</button>
        </div>
        {/* Body: left filters + right results */}
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', maxHeight:520 }}>
          {/* Left */}
          <div style={{ borderRight:`1px solid ${colors.border}`, padding:8 }}>
            <SidebarItem label={t('Tất cả','All')}    active={activeType==='all'}      count={counts.project+counts.task+counts.document+counts.user} onClick={()=>setActiveType('all')} icon="🔎" />
            <SidebarItem label={t('Dự án','Projects')} active={activeType==='project'}  count={counts.project} onClick={()=>setActiveType('project')} icon="📁" />
            <SidebarItem label={t('Công việc','Tasks')} active={activeType==='task'}     count={counts.task} onClick={()=>setActiveType('task')} icon="✅" />
            <SidebarItem label={t('Tài liệu','Documents')} active={activeType==='document'} count={counts.document} onClick={()=>setActiveType('document')} icon="📄" />
            <SidebarItem label={t('Người dùng','Users')} active={activeType==='user'}    count={counts.user} onClick={()=>setActiveType('user')} icon="👤" />
          </div>
          {/* Right */}
          <div style={{ padding:8 }}>
            {loading ? (
              <div style={{ padding:16, color:colors.sub }}>{t('Đang tải…','Loading…')}</div>
            ) : (
              <div style={{ overflow:'auto', maxHeight:480 }}>
                {results.map((r, i) => (
                  <button key={r.route+String(i)} onClick={()=>handleGo(r)} onMouseEnter={()=>setCursor(i)} style={{ width:'100%', textAlign:'left', padding:12, border:'none', background: i===cursor? '#eff6ff': 'transparent', borderBottom:`1px solid ${colors.border}`, cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:22, textAlign:'center' }}>
                        {r.type==='project'?'📁': r.type==='task'?'✅': r.type==='document'?'📄':'👤'}
                      </span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600 }}>
                          <Highlight text={r.label} q={query} />
                        </div>
                        {r.sub && <div style={{ fontSize:12, color:'#6b7280' }}><Highlight text={r.sub} q={query} /></div>}
                      </div>
                      <code style={{ fontSize:12, opacity:0.6 }}>{r.route}</code>
                    </div>
                  </button>
                ))}
                {results.length===0 && (
                  <div style={{ padding:16, color:colors.sub }}>{t('Không có kết quả.','No results.')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active, count, onClick, icon }){
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', background: active? '#f3f4f6':'transparent' }}>
      <span style={{ width:20, textAlign:'center' }}>{icon}</span>
      <span style={{ fontWeight:600 }}>{label}</span>
      <span style={{ marginLeft:'auto', fontSize:12, color:'#6b7280' }}>{count}</span>
    </div>
  );
}

function Highlight({ text, q }){
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i===-1) return <>{text}</>;
  const a = text.slice(0, i), b = text.slice(i, i+q.length), c = text.slice(i+q.length);
  return <>{a}<mark style={{ background:'#fffbcc' }}>{b}</mark>{c}</>;
}

// ===== Runner (từ src/App.tsx gốc) =====
export default function App(){
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
