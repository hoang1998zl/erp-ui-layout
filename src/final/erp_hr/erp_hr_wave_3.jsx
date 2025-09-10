// ERP HR – Wave 3 Console (JSX)
// Scope: Performance (OKR + basic review), Mobility/Exit Center, Internal mobility ưu tiên. Seed data + mock audit.

import React, { useState } from "react";

// ---- Helpers ----
function krProgress(kr){
  const { current=0, target=1, direction='higher'} = kr;
  if(direction==='higher') return Math.min(100, Math.round(100*current/target));
  return Math.max(0, Math.round(100 - 100*current/target));
}
function objectiveProgress(obj){
  if(!obj.krs||obj.krs.length===0) return 0;
  return Math.round(obj.krs.map(krProgress).reduce((a,b)=>a+b,0)/obj.krs.length);
}
function finalRating({okr=0, comp=0, wOKR=0.7, wComp=0.3}){
  return Math.round(okr*wOKR + comp*wComp);
}
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

// ---- Seed ----
const SEED_OKRS=[
  { id:'o1', title:'Nâng cao chất lượng sản phẩm', krs:[ {id:'kr1', desc:'Giảm bug prod', current:5, target:10, direction:'lower'}, {id:'kr2', desc:'Tăng coverage test', current:70, target:90, direction:'higher'} ] },
  { id:'o2', title:'Cải thiện hài lòng KH', krs:[ {id:'kr3', desc:'CSAT', current:80, target:90, direction:'higher'} ] }
];

const SEED_ROLES=[
  {id:'r1', title:'Sales Executive', org:'Kinh doanh', internal_first:true},
  {id:'r2', title:'Kế toán', org:'Tài chính', internal_first:false}
];

const SEED_EMP=[
  {id:'e1', code:'EMP001', name:'Nguyễn A', org:'Kỹ thuật', title:'Kỹ sư'},
  {id:'e2', code:'EMP002', name:'Trần B', org:'Kinh doanh', title:'Sales Exec'},
  {id:'e3', code:'EMP003', name:'Phạm C', org:'Tài chính', title:'Kế toán'}
];

// ---- UI atoms ----
function Section({title, children}){
  return <div className="mb-6"><div className="mb-3 text-lg font-semibold">{title}</div><div className="p-4 bg-white border shadow rounded-2xl">{children}</div></div>;
}
function Pill({text,tone='indigo'}){
  const map={ indigo:'bg-indigo-100 text-indigo-700', green:'bg-green-100 text-green-700', amber:'bg-amber-100 text-amber-700', red:'bg-red-100 text-red-700', blue:'bg-blue-100 text-blue-700'};
  return <span className={`px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{text}</span>;
}

// ---- Tabs ----
function PerformanceTab(){
  const [okrs,setOkrs]=useState(SEED_OKRS);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="OKRs">
        {okrs.map(o=>(
          <div key={o.id} className="p-3 mb-3 border rounded-xl">
            <div className="font-medium">{o.title}</div>
            <div className="text-sm text-gray-500">Progress {objectiveProgress(o)}%</div>
            <ul className="pl-5 text-sm list-disc">
              {o.krs.map(kr=>(
                <li key={kr.id}>{kr.desc}: {kr.current}/{kr.target} → {krProgress(kr)}%</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <ReviewTab />
    </div>
  );
}

function ReviewTab(){
  const [okr,setOkr]=useState(80);
  const [comp,setComp]=useState(75);
  const [fin,setFin]=useState(finalRating({okr:80,comp:75}));
  function recalc(){ setFin(finalRating({okr,comp})); }
  return (
    <Section title="Review (basic)">
      <div className="grid gap-3 sm:grid-cols-3">
        <div><div className="text-sm">OKR Score</div><input type="number" value={okr} onChange={e=>setOkr(Number(e.target.value))} className="w-full px-2 py-1 border rounded-xl"/></div>
        <div><div className="text-sm">Competency</div><input type="number" value={comp} onChange={e=>setComp(Number(e.target.value))} className="w-full px-2 py-1 border rounded-xl"/></div>
        <div><div className="text-sm">Final</div><input type="number" value={fin} readOnly className="w-full px-2 py-1 border rounded-xl bg-gray-50"/></div>
      </div>
      <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={recalc}>Recalc</button>
    </Section>
  );
}

function MobilityTab(){
  const [roles,setRoles]=useState(SEED_ROLES);
  const [cands,setCands]=useState([{id:'m1', emp:'EMP001', role:'r1', internal:true, status:'Proposed'}]);
  function propose(empId,roleId){
    const emp=SEED_EMP.find(e=>e.id===empId);
    setCands([...cands,{id:'m'+Date.now(), emp:emp.name, role:roleId, internal:true, status:'Proposed'}]);
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Open Roles">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th className="py-2 text-left">Title</th><th>Phòng</th><th>Ưu tiên NB</th></tr></thead>
          <tbody>{roles.map(r=>(<tr key={r.id} className="border-t"><td className="py-2">{r.title}</td><td className="py-2">{r.org}</td><td className="py-2">{r.internal_first? 'Yes':'No'}</td></tr>))}</tbody>
        </table>
      </Section>
      <Section title="Candidates">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th>Ứng viên</th><th>Role</th><th>Trạng thái</th></tr></thead>
          <tbody>{cands.map(c=>(<tr key={c.id} className="border-t"><td className="py-2">{c.emp}</td><td className="py-2">{c.role}</td><td className="py-2">{c.status}</td></tr>))}</tbody>
        </table>
        <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={()=>propose('e2','r2')}>Propose internal</button>
      </Section>
    </div>
  );
}

function ExitTab(){
  const [cases,setCases]=useState([{id:'x1', emp:'EMP002', reason:'Cá nhân', status:'Open', due:addDays(14)}]);
  function close(id){ setCases(prev=>prev.map(c=> c.id===id? {...c,status:'Closed'}:c)); }
  return (
    <Section title="Exit cases">
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500"><th>NV</th><th>Lý do</th><th>Trạng thái</th><th>Due</th><th></th></tr></thead>
        <tbody>{cases.map(c=>(<tr key={c.id} className="border-t"><td className="py-2">{c.emp}</td><td className="py-2">{c.reason}</td><td className="py-2">{c.status}</td><td className="py-2">{c.due}</td><td className="py-2 text-right"><button className="px-2 py-1 border rounded-lg" onClick={()=>close(c.id)}>Close</button></td></tr>))}</tbody>
      </table>
    </Section>
  );
}

function AuditTab({events}){
  return <Section title="Audit"><div className="border rounded-xl bg-gray-50 max-h-[400px] overflow-auto"><table className="w-full text-sm"><thead><tr className="text-gray-500"><th>TS</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead><tbody>{events.length===0 && (<tr><td className="p-3 text-gray-500" colSpan={5}>Chưa có sự kiện.</td></tr>)}{events.map((e,i)=>(<tr key={i} className="border-t"><td className="p-2">{e.ts}</td><td className="p-2">{e.actor}</td><td className="p-2">{e.action}</td><td className="p-2">{e.target||'-'}</td><td className="p-2">{e.detail||'-'}</td></tr>))}</tbody></table></div></Section>;
}

// ---- Main ----
export default function HRWave3Console(){
  const [tab,setTab]=useState('perf');
  const [audit,setAudit]=useState([]);
  function log(a,t,d){ setAudit(prev=>[{ts:new Date().toISOString(), actor:'you', action:a, target:t, detail:d},...prev]); }

  const tabs=[
    {key:'perf',label:'Performance',node:<PerformanceTab/>},
    {key:'mob',label:'Mobility',node:<MobilityTab/>},
    {key:'exit',label:'Exit',node:<ExitTab/>},
    {key:'audit',label:'Audit',node:<AuditTab events={audit}/>},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 mx-auto max-w-7xl md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold">ERP HR – Wave 3</div>
            <div className="text-sm text-gray-500">Performance • Mobility/Exit • Internal mobility</div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> setAudit([])}>Clear audit</button>
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> log('snapshot.capture','wave3')}>Capture snapshot</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="p-2 bg-white border shadow rounded-2xl">
            {tabs.map(t=>(
              <div key={t.key} className={`px-3 py-2 rounded-xl cursor-pointer text-sm ${tab===t.key?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`} onClick={()=>setTab(t.key)}>{t.label}</div>
            ))}
          </div>
          <div>{(tabs.find(t=>t.key===tab)||tabs[0]).node}</div>
        </div>
      </div>
    </div>
  );
}
