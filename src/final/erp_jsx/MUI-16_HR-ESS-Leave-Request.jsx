import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock Leave Types / Balances ===== */
const LS_KEY = 'erp.ess.leave.requests.v1';
const TYPES = [
  { code:'AL', name:'Annual Leave' },
  { code:'SL', name:'Sick Leave' },
  { code:'UL', name:'Unpaid Leave' },
  { code:'PL', name:'Personal Leave' },
];
const BAL = { AL: 12, SL: 5, UL: 999, PL: 3 };

/* ===== Utilities ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});
const fmt = (d)=> new Intl.DateTimeFormat('vi', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(d));
const daysBetween = (a,b)=> Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime())/86400000)+1);

/* ===== Local Storage Persister ===== */
function load(){ const t = localStorage.getItem(LS_KEY); return t? JSON.parse(t): []; }
function save(x){ localStorage.setItem(LS_KEY, JSON.stringify(x)); }

/* ===== Primitives ===== */
function Field({ label, value, onChange, type='text' }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

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

function Textarea({ label, value, onChange }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <textarea value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px', minHeight:80 }} />
    </div>
  );
}

function StatusBadge({ s }){
  const color = s==='approved'? '#16a34a': s==='rejected'? '#dc2626': s==='cancelled'? '#6b7280':'#2563eb';
  const bg = s==='approved'? '#ecfdf5': s==='rejected'? '#fef2f2': s==='cancelled'? '#f3f4f6':'#eff6ff';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:bg, color }}>{s}</span>;
}

/* ===== Leave Create Drawer ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:520, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>{children}</div>
      </div>
    </div>
  );
}

function LeaveForm({ onSubmit }){
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const options = TYPES.map(t=> ({ value:t.code, label:`${t.name} (${t.code})` }));
  const total = (from && to)? daysBetween(from, to): 0;

  const canSubmit = type && from && to && total>0;
  return (
    <div style={{ display:'grid', gap:10 }}>
      <Select label='Type' value={type} onChange={setType} options={options} />
      <Field label='From' value={from} onChange={setFrom} type='date' />
      <Field label='To' value={to} onChange={setTo} type='date' />
      <Textarea label='Reason' value={reason} onChange={setReason} />
      <div style={{ color:'#6b7280' }}>Total days: <b>{total||'-'}</b></div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button disabled={!canSubmit} onClick={()=> canSubmit && onSubmit?.({ id:rid(), type, from, to, reason, status:'submitted', created_at: Date.now() })} style={{ opacity:canSubmit?1:0.5, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>Submit</button>
      </div>
    </div>
  );
}

/* ===== Table ===== */
function Row({ r, i, onCancel }){
  const colors = { border:'#e5e7eb' };
  return (
    <tr style={{ background:i%2? '#fafafa':'#fff' }}>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.id.slice(0,8)}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{TYPES.find(t=>t.code===r.type)?.name||r.type}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{fmt(r.from)} → {fmt(r.to)} ({daysBetween(r.from, r.to)}d)</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={r.status} /></td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
        {r.status==='submitted' && <button onClick={()=> onCancel(r)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px', color:'#dc2626' }}>Cancel</button>}
      </td>
    </tr>
  );
}

/* ===== Main: ESS Leave Request ===== */
export function EssLeaveRequest(){
  const [rows, setRows] = useState(()=> load());
  const [open, setOpen] = useState(false);

  useEffect(()=> save(rows), [rows]);

  const onSubmit = (rec)=>{ setRows(prev=> [rec, ...prev]); setOpen(false); };
  const onCancel = (rec)=> setRows(prev=> prev.map(x=> x.id===rec.id? { ...x, status:'cancelled' }: x));

  const colors = { border:'#e5e7eb', bg:'#f9fafb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <div style={{ fontWeight:800 }}>My Leave Requests</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>Balances:</span>
          {TYPES.map(t=> <span key={t.code} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 8px' }}>{t.code}: {BAL[t.code]||0}</span>)}
          <button onClick={()=> setOpen(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', marginLeft:8 }}>+ New Request</button>
        </div>
      </div>

      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>ID</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Type</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Period</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Status</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=> <Row key={r.id} r={r} i={i} onCancel={onCancel} />)}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={()=> setOpen(false)} title='New Leave Request'>
        <LeaveForm onSubmit={onSubmit} />
      </Drawer>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <EssLeaveRequest />
    </div>
  );
}
