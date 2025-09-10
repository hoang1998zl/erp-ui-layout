import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== File: src/mock/audit.ts ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});

const actors = ['ceo@ktest.vn','manager@ktest.vn','emp1@ktest.vn','emp2@ktest.vn','fin@ktest.vn'];
const entities = ['Project','User','Invoice','Timesheet','Doc'];
const actions = ['CREATE','UPDATE','DELETE','VIEW','EXPORT','APPROVE','REJECT'];

function randomInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
function randFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function seedLogs(n=300){
  const now = Date.now();
  const rows = [];
  for (let i=0;i<n;i++){
    const ts = now - randomInt(0, 1000*60*60*24*14); // last 14 days
    const ent = randFrom(entities);
    const id = rid().slice(0,8);
    rows.push({
      id: rid(),
      ts,
      actor: randFrom(actors),
      action: randFrom(actions),
      entity: ent,
      entity_id: ent==='Project'? `PRJ-${randomInt(1,999).toString().padStart(3,'0')}`: id,
      ip: `10.0.${randomInt(0,10)}.${randomInt(2,254)}`,
      status: randFrom(['success','warning','error']),
      meta: { browser: randFrom(['Chrome','Safari','Edge']), os: randFrom(['macOS','Windows','Linux']) },
    });
  }
  return rows.sort((a,b)=> b.ts-a.ts);
}

const fmtTime = (ts, loc='vi') => new Intl.DateTimeFormat(loc, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(new Date(ts));

/* ===== Filters ===== */
function Filters({ q, setQ, actor, setActor, action, setAction, entity, setEntity, status, setStatus, from, setFrom, to, setTo, onReset }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr repeat(5, 1fr)', gap:8, padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
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
      </div>
    </div>
  );
}

/* ===== Export Toolbar ===== */
function ExportToolbar({ count, onExportCSV, onExportJSON }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
      <div>{count} records</div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onExportCSV} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Export CSV</button>
        <button onClick={onExportJSON} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Export JSON</button>
      </div>
    </div>
  );
}

/* ===== Table ===== */
function StatusBadge({ s }){
  const color = s==='success'? '#16a34a' : s==='warning'? '#f59e0b' : '#dc2626';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:'#f3f4f6', color }}>{s}</span>;
}

function Row({ r, i }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <tr style={{ background: i%2? '#fafafa':'#fff' }}>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, whiteSpace:'nowrap' }}>{fmtTime(r.ts)}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.actor}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.action}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.entity}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{r.entity_id}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{r.ip}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={r.status} /></td>
    </tr>
  );
}

/* ===== Main: Audit Export ===== */
export function AuditExport(){
  const [rows] = useState(()=> seedLogs(320));
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

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

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  const toCSV = (arr)=>{
    const header = ['time','actor','action','entity','entity_id','ip','status'];
    const lines = [header.join(',')];
    arr.forEach(r=>{
      const row = [fmtTime(r.ts), r.actor, r.action, r.entity, r.entity_id, r.ip, r.status];
      lines.append?
        lines.append(row.map(v=> '"'+String(v).replace('"','""')+'"').join(',')):
        lines.push(row.map(v=> '"'+String(v).replace('"','""')+'"').join(','));
    });
    return lines.join('\n');
  };

  const download = (name, content, mime='text/plain')=>{
    const blob = new Blob([content], { type:mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const onExportCSV = ()=> download('audit-export.csv', toCSV(filtered), 'text/csv');
  const onExportJSON = ()=> download('audit-export.json', JSON.stringify(filtered, null, 2), 'application/json');

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto auto 1fr', background:colors.bg }}>
      <Filters q={q} setQ={setQ} actor={actor} setActor={setActor} action={action} setAction={setAction} entity={entity} setEntity={setEntity} status={status} setStatus={setStatus} from={from} setFrom={setFrom} to={to} setTo={setTo} onReset={()=>{ setQ(''); setActor(''); setAction(''); setEntity(''); setStatus(''); setFrom(''); setTo(''); }} />
      <ExportToolbar count={filtered.length} onExportCSV={onExportCSV} onExportJSON={onExportJSON} />
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i)=> <Row key={r.id} r={r} i={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <AuditExport />
    </div>
  );
}
