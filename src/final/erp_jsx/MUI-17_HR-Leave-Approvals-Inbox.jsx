import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock Approvals Inbox ===== */
const LS_KEY = 'erp.approvals.inbox.v1';

const TYPES = [
  { code:'AL', name:'Annual Leave' },
  { code:'SL', name:'Sick Leave' },
  { code:'UL', name:'Unpaid Leave' },
  { code:'PL', name:'Personal Leave' },
];

const fmtDateTime = (ts)=> new Intl.DateTimeFormat('vi', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(ts));
const fmtDate = (d)=> new Intl.DateTimeFormat('vi', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(d));

function seedInbox(){
  const rows = [];
  for (let i=0;i<18;i++){
    const created = Date.now() - i*3600*1000;
    rows.push({
      id: 'REQ-'+String(1000+i),
      emp: ['Hieu Le','Tran Quynh','Pham Nam','Le An','Vu Binh','Ngo Phuong'][i%6],
      dept: ['R&D','PM','Finance','HR'][i%4],
      type: TYPES[i%TYPES.length].code,
      from: '2025-09-0'+String((i%9)+1),
      to: '2025-09-1'+String((i%9)+1),
      reason: 'Personal matters',
      status: 'pending',
      created_at: created,
      approvals: [
        { level:1, approver:'PM Lead', decision:'approved', decided_at: created-3600*1000 },
        { level:2, approver:'Department Head', decision:'pending', decided_at: null },
      ],
    });
  }
  return rows;
}

function load(){ const t = localStorage.getItem(LS_KEY); return t? JSON.parse(t): seedInbox(); }
function save(x){ localStorage.setItem(LS_KEY, JSON.stringify(x)); }

/* ===== Primitives ===== */
function Field({ label, value, onChange }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

function Select({ label, value, onChange, options }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }}>
        <option value=''>-- Any --</option>
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ s }){
  const color = s==='approved'? '#16a34a': s==='rejected'? '#dc2626': s==='pending'? '#2563eb':'#6b7280';
  const bg = s==='approved'? '#ecfdf5': s==='rejected'? '#fef2f2': s==='pending'? '#eff6ff':'#f3f4f6';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:bg, color }}>{s}</span>;
}

/* ===== Drawer ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:560, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>{children}</div>
      </div>
    </div>
  );
}

/* ===== Detail View ===== */
function ApprovalTimeline({ steps }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <ol style={{ listStyle:'none', padding:0, margin:0 }}>
      {steps.map((s,i)=> (
        <li key={i} style={{ display:'grid', gridTemplateColumns:'20px 1fr', gap:8, marginBottom:8 }}>
          <div style={{ width:20, height:20, borderRadius:999, background: s.decision==='approved'? '#16a34a': s.decision==='rejected'? '#dc2626':'#9ca3af' }} />
          <div>
            <div style={{ fontWeight:600 }}>Level {s.level} — {s.approver}</div>
            <div style={{ fontSize:12, color:colors.sub }}>{s.decision}{s.decided_at? ' @ '+fmtDateTime(s.decided_at): ''}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ===== Inbox Main ===== */
export function LeaveApprovalsInbox(){
  const [rows, setRows] = useState(()=> load());
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('pending');
  const [detail, setDetail] = useState(null);

  useEffect(()=> save(rows), [rows]);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    return rows.filter(r => (
      (!t || `${r.emp} ${r.dept} ${r.id}`.toLowerCase().includes(t)) &&
      (!type || r.type===type) &&
      (!status || r.status===status)
    ));
  }, [rows, q, type, status]);

  const approve = (r)=> setRows(prev=> prev.map(x=> x.id===r.id? { ...x, status:'approved', approvals: x.approvals.map(s=> s.level===2? { ...s, decision:'approved', decided_at: Date.now() }: s) }: x));
  const reject = (r)=> setRows(prev=> prev.map(x=> x.id===r.id? { ...x, status:'rejected', approvals: x.approvals.map(s=> s.level===2? { ...s, decision:'rejected', decided_at: Date.now() }: s) }: x));

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto auto 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <div style={{ fontWeight:800 }}>Leave Approvals Inbox</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder='Search (emp, dept, id)' style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8, padding:'0 10px' }} />
          <Select label='Type' value={type} onChange={setType} options={TYPES.map(t=> ({ value:t.code, label:t.name }))} />
          <Select label='Status' value={status} onChange={setStatus} options={[{value:'pending',label:'Pending'},{value:'approved',label:'Approved'},{value:'rejected',label:'Rejected'}]} />
        </div>
      </div>

      <div style={{ padding:'8px 12px', borderBottom:`1px solid ${colors.border}`, background:'#fff', color:colors.sub }}>
        Showing <b>{filtered.length}</b> requests
      </div>

      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>ID</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Employee</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Department</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Type</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Period</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Status</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i)=> (
              <tr key={r.id} style={{ background:i%2? '#fafafa':'#fff' }}>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{r.id}</td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.emp}</td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.dept}</td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{TYPES.find(t=>t.code===r.type)?.name||r.type}</td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{fmtDate(r.from)} → {fmtDate(r.to)}</td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={r.status} /></td>
                <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
                  <button onClick={()=> setDetail(r)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'4px 8px', marginRight:6 }}>View</button>
                  {r.status==='pending' && <>
                    <button onClick={()=> approve(r)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'4px 8px', color:'#16a34a', marginRight:6 }}>Approve</button>
                    <button onClick={()=> reject(r)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'4px 8px', color:'#dc2626' }}>Reject</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!detail} onClose={()=> setDetail(null)} title={`Request ${detail?.id||''}`}>
        {detail && (
          <div style={{ display:'grid', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <div><b>Employee:</b> {detail.emp}</div>
                <div><b>Department:</b> {detail.dept}</div>
                <div><b>Type:</b> {TYPES.find(t=>t.code===detail.type)?.name||detail.type}</div>
              </div>
              <div>
                <div><b>From:</b> {fmtDate(detail.from)}</div>
                <div><b>To:</b> {fmtDate(detail.to)}</div>
                <div><b>Submitted:</b> {fmtDateTime(detail.created_at)}</div>
              </div>
            </div>
            <div>
              <b>Reason</b>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#f9fafb' }}>{detail.reason}</div>
            </div>
            <div>
              <b>Approvals</b>
              <ApprovalTimeline steps={detail.approvals} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <LeaveApprovalsInbox />
    </div>
  );
}
