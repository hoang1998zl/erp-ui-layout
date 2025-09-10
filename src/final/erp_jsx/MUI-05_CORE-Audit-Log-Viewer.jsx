import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * MUI-05 — CORE Audit Log Viewer (single JSX file)
 * - Gộp toàn bộ: mock data + viewer components + App runner
 * - Giữ nguyên UI & hành vi từ mã gốc (TS/TSX → JSX)
 */

/* =====================
   Mock Data & Utilities
===================== */
const rid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16);
});

function randFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randomInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }

const actors = ['ceo@ktest.vn','pm@ktest.vn','fin@ktest.vn','staff@ktest.vn'];
const entities = ['Project','User','Invoice','Timesheet','Doc'];
const actions = ['CREATE','UPDATE','DELETE','VIEW','EXPORT','APPROVE','REJECT'];

function seedLogs(n=120){
  const now = Date.now();
  const rows = [];
  for (let i=0;i<n;i++){
    const ts = now - randomInt(0, 1000*60*60*24*7); // last 7 days
    const ent = randFrom(entities);
    const id = rid().slice(0,8);
    rows.push({
      id: rid(),
      ts,
      actor: randFrom(actors),
      action: randFrom(actions),
      entity: ent,
      entity_id: ent==='Project'? `PRJ-${randomInt(1,999).toString().padStart(3,'0')}`: id,
      ip: `192.168.1.${randomInt(2,254)}`,
      status: randFrom(['success','warning','error']),
      meta: { browser: randFrom(['Chrome','Safari','Edge']), os: randFrom(['macOS','Windows','Linux']) },
    });
  }
  return rows.sort((a,b)=> b.ts-a.ts);
}

const fmtTime = (ts, loc='vi') => new Intl.DateTimeFormat(loc, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(new Date(ts));

/* =====================
   Filter Bar
===================== */
function FilterBar({ q, setQ, actor, setActor, action, setAction, entity, setEntity, status, setStatus, from, setFrom, to, setTo, locale, onReset }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8, padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search (actor, entity, id, ip)" style={{ height:36, padding:'0 10px', border:`1px solid ${colors.border}`, borderRadius:8 }} />
      <select value={actor} onChange={e=>setActor(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        <option value="">Actor</option>
        {actors.map(a=> <option key={a} value={a}>{a}</option>)}
      </select>
      <select value={action} onChange={e=>setAction(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        <option value="">Action</option>
        {actions.map(a=> <option key={a} value={a}>{a}</option>)}
      </select>
      <select value={entity} onChange={e=>setEntity(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        <option value="">Entity</option>
        {entities.map(e=> <option key={e} value={e}>{e}</option>)}
      </select>
      <select value={status} onChange={e=>setStatus(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        <option value="">Status</option>
        <option value="success">success</option>
        <option value="warning">warning</option>
        <option value="error">error</option>
      </select>
      <div style={{ display:'flex', gap:8 }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ flex:1, height:36, padding:'0 10px', border:`1px solid ${colors.border}`, borderRadius:8 }} />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ flex:1, height:36, padding:'0 10px', border:`1px solid ${colors.border}`, borderRadius:8 }} />
      </div>
      <div style={{ gridColumn:'1 / -1', display:'flex', gap:8 }}>
        <button onClick={onReset} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Reset</button>
        <span style={{ color:colors.sub, alignSelf:'center' }}>Locale: {locale.toUpperCase()}</span>
      </div>
    </div>
  );
}

/* =====================
   Table & Row
===================== */
function StatusBadge({ s }){
  const color = s==='success'? '#16a34a' : s==='warning'? '#f59e0b' : '#dc2626';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:'#f3f4f6', color }}>{s}</span>;
}

function Row({ r, i, locale, onInspect }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <tr style={{ background: i%2? '#fafafa':'#fff' }}>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, whiteSpace:'nowrap' }}>{fmtTime(r.ts, locale)}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.actor}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.action}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.entity}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{r.entity_id}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{r.ip}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={r.status} /></td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
        <button onClick={()=>onInspect(r)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px' }}>Inspect</button>
      </td>
    </tr>
  );
}

/* =====================
   Detail Drawer
===================== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#ffffff' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:420, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:'#f9fafb' }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* =====================
   AuditLogViewer (main)
===================== */
export function AuditLogViewer({ locale='vi' }){
  const [rows] = useState(()=> seedLogs(140));
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [inspect, setInspect] = useState(null);

  const filtered = useMemo(()=>{
    const ql = q.trim().toLowerCase();
    const fd = from? new Date(from).getTime(): undefined;
    const td = to? new Date(to).getTime() + 24*3600*1000: undefined; // include end day
    return rows.filter(r => (
      (!ql || `${r.actor} ${r.entity} ${r.entity_id} ${r.ip}`.toLowerCase().includes(ql)) &&
      (!actor || r.actor===actor) &&
      (!action || r.action===action) &&
      (!entity || r.entity===entity) &&
      (!status || r.status===status) &&
      (!fd || r.ts>=fd) && (!td || r.ts<td)
    ));
  }, [rows, q, actor, action, entity, status, from, to]);

  const reset = ()=>{ setQ(''); setActor(''); setAction(''); setEntity(''); setStatus(''); setFrom(''); setTo(''); };

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr', background:colors.bg }}>
      <FilterBar q={q} setQ={setQ} actor={actor} setActor={setActor} action={action} setAction={setAction} entity={entity} setEntity={setEntity} status={status} setStatus={setStatus} from={from} setFrom={setFrom} to={to} setTo={setTo} locale={locale} onReset={reset} />
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Time</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Actor</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Action</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Entity</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Entity ID</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>IP</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Status</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i)=> <Row key={r.id} r={r} i={i} locale={locale} onInspect={setInspect} />)}
          </tbody>
        </table>
      </div>
      <Drawer open={!!inspect} onClose={()=>setInspect(null)} title="Audit Event">
        {inspect && (
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', rowGap:8, columnGap:8 }}>
            <div style={{ color:colors.sub }}>Time</div><div>{fmtTime(inspect.ts, locale)}</div>
            <div style={{ color:colors.sub }}>Actor</div><div>{inspect.actor}</div>
            <div style={{ color:colors.sub }}>Action</div><div>{inspect.action}</div>
            <div style={{ color:colors.sub }}>Entity</div><div>{inspect.entity}</div>
            <div style={{ color:colors.sub }}>Entity ID</div><div style={{ fontFamily:'ui-monospace' }}>{inspect.entity_id}</div>
            <div style={{ color:colors.sub }}>IP</div><div style={{ fontFamily:'ui-monospace' }}>{inspect.ip}</div>
            <div style={{ color:colors.sub }}>Status</div><div><StatusBadge s={inspect.status} /></div>
            <div style={{ color:colors.sub }}>Meta</div><div>{inspect.meta.browser} · {inspect.meta.os}</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* =====================
   Runner (demo)
===================== */
export default function App(){
  const [open, setOpen] = useState(true); // App container placeholder
  const [locale, setLocale] = useState('vi');

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'48px 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        <div style={{ fontWeight:800 }}>Audit Log Viewer</div>
        <div>
          <select value={locale} onChange={e=>setLocale(e.target.value)}>
            <option value='vi'>VI</option>
            <option value='en'>EN</option>
          </select>
        </div>
      </div>
      <AuditLogViewer locale={locale} />
    </div>
  );
}
