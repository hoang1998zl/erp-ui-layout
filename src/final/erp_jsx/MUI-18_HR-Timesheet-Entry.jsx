import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock Timesheet ===== */
const LS_KEY = 'erp.ess.timesheet.v1';
const PROJECTS = [
  { id:'PRJ-001', name:'ERP Core' },
  { id:'PRJ-002', name:'Mobile App' },
  { id:'PRJ-003', name:'Data Platform' },
];
const TASKS = [
  { id:'T-101', name:'Design' },
  { id:'T-102', name:'Frontend' },
  { id:'T-103', name:'Backend' },
  { id:'T-104', name:'Testing' },
  { id:'T-105', name:'Docs' },
];

/* ===== Utils ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});
const fmtDate = (d)=> new Intl.DateTimeFormat('vi', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(d));
const addDays = (d, n)=> { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const toISO = (d)=> new Date(d).toISOString().slice(0,10);
const weekStart = (d)=> { const x = new Date(d); const wd = (x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; };
function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }
function nowISO(){ return new Date().toISOString(); }

/* ===== Persister ===== */
function load(){ const t = localStorage.getItem(LS_KEY); return t? JSON.parse(t): { weeks:{} }; }
function save(x){ localStorage.setItem(LS_KEY, JSON.stringify(x)); }

/* ===== Primitives ===== */
function Select({ label, value, onChange, options }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }}>
        <option value=''>-- Choose --</option>
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, type='text' }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

/* ===== Row Editor ===== */
function RowEditor({ value, onChange, onRemove }){
  const colors = { border:'#e5e7eb' };
  const update = (k,v)=> onChange({ ...value, [k]: v });
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr 3fr repeat(7, 1fr) auto', gap:8, alignItems:'center', borderBottom:`1px solid ${colors.border}`, padding:'8px 0' }}>
      <select value={value.project||''} onChange={e=>update('project', e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }}>
        <option value=''>Project</option>
        {PROJECTS.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={value.task||''} onChange={e=>update('task', e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }}>
        <option value=''>Task</option>
        {TASKS.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input value={value.note||''} onChange={e=>update('note', e.target.value)} placeholder='Note' style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
      {Array.from({length:7}).map((_,i)=> (
        <input key={i} value={value.hours?.[i]??''} onChange={e=>{
          const arr = Array.isArray(value.hours)? value.hours.slice(): Array(7).fill('');
          arr[i] = e.target.value.replace(/[^0-9.]/g,'');
          update('hours', arr);
        }} placeholder='h' style={{ textAlign:'center', border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 6px' }} />
      ))}
      <button onClick={onRemove} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 8px', color:'#dc2626' }}>Remove</button>
    </div>
  );
}

/* ===== Week Header ===== */
function WeekHeader({ start }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  const days = Array.from({length:7}).map((_,i)=> addDays(start,i));
  const fmt = (d)=> new Intl.DateTimeFormat('vi', { weekday:'short', month:'2-digit', day:'2-digit' }).format(d);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr 3fr repeat(7, 1fr) auto', gap:8, padding:'8px 0', color:colors.sub }}>
      <div>Project</div>
      <div>Task</div>
      <div>Note</div>
      {days.map((d,i)=> <div key={i} style={{ textAlign:'center' }}>{fmt(d)}</div>)}
      <div />
    </div>
  );
}

/* ===== Timesheet Week ===== */
function TimesheetWeek({ startISO, value, onChange }){
  const colors = { border:'#e5e7eb' };
  const rows = value.rows||[];
  const addRow = ()=> onChange({ ...value, rows:[...rows, { id:rid(), project:'', task:'', note:'', hours:Array(7).fill('') }] });
  const updateRow = (i, v)=>{ const arr = rows.slice(); arr[i]=v; onChange({ ...value, rows:arr }); };
  const removeRow = (i)=>{ const arr = rows.slice(); arr.splice(i,1); onChange({ ...value, rows:arr }); };

  const totals = Array(7).fill(0);
  rows.forEach(r=> r.hours?.forEach((h, i)=> totals[i]+= parseFloat(h||'0') ));
  const total = totals.reduce((a,b)=> a+b, 0);

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:12, background:'#fff' }}>
      <WeekHeader start={new Date(startISO)} />
      {rows.map((r,i)=> (
        <RowEditor key={r.id} value={r} onChange={(v)=> updateRow(i, v)} onRemove={()=> removeRow(i)} />
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
        <button onClick={addRow} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>+ Add Row</button>
        <div style={{ display:'grid', gridTemplateColumns:'3fr repeat(7, 1fr)', gap:8, alignItems:'center' }}>
          <div style={{ textAlign:'right', paddingRight:6 }}>Total</div>
          {totals.map((v,i)=> <div key={i} style={{ textAlign:'center', fontWeight:700 }}>{v.toFixed(1)}</div>)}
        </div>
      </div>
      <div style={{ textAlign:'right', marginTop:8, color:'#6b7280' }}>Weekly total: <b>{total.toFixed(1)}</b> hours</div>
    </div>
  );
}

/* ===== Main: Timesheet Entry ===== */
export function TimesheetEntry(){
  const [store, setStore] = useState(()=> load());
  const [weekStartISO, setWeekStartISO] = useState(()=> toISO(weekStart(new Date())));

  useEffect(()=> save(store), [store]);

  const week = store.weeks[weekStartISO] || { rows:[] };
  const updateWeek = (v)=> setStore(prev=> ({ ...prev, weeks: { ...prev.weeks, [weekStartISO]: v } }));

  const prev = ()=> setWeekStartISO(toISO(addDays(weekStartISO, -7)));
  const next = ()=> setWeekStartISO(toISO(addDays(weekStartISO, 7)));

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <div style={{ fontWeight:800 }}>Timesheet Entry</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={prev} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>‹ Prev</button>
          <div style={{ fontWeight:600 }}>{fmtDate(weekStartISO)} — {fmtDate(addDays(weekStartISO, 6))}</div>
          <button onClick={next} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>Next ›</button>
        </div>
      </div>

      <div style={{ padding:12, overflow:'auto' }}>
        <TimesheetWeek startISO={weekStartISO} value={week} onChange={updateWeek} />
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <TimesheetEntry />
    </div>
  );
}
