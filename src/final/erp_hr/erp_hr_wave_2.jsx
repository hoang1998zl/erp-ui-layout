// ERP HR – Wave 2 Console (JSX)
// Scope: Recruitment (req→offer), Onboarding checklist, Payroll run console + bank file, e‑payslip,
// HR Analytics v1, Snapshots. Seed data + mock audit; no external libs beyond React + Tailwind.

import React, { useMemo, useState } from "react";

// --------- Helpers (pure) ---------
function monthISO(d){ const x = d? new Date(d): new Date(); const y = new Date(x.getFullYear(), x.getMonth(), 1); return y.toISOString().slice(0,10); }
function vnd(n){ return Number(n||0).toLocaleString('vi-VN'); }
function next(arr, cur){ const i = arr.indexOf(cur); return i>=0 && i < arr.length-1 ? arr[i+1] : null; }
function generateBankCsv(lines){
  // Expect: { bank_code, bank_account, name, amount, desc }
  const header = 'bank_code,bank_account,name,amount,desc';
  const rows = lines.map(l => [l.bank_code||'', l.bank_account||'', l.name||'', l.amount||0, (l.desc||'').replace(/,/g,' ')].join(','));
  return [header, ...rows].join('\n');
}
function downloadText(filename, text){
  const blob = new Blob([text], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// Simple payslip calc (demo)
function calcPayslip({base=0, allowance=0, ot=0}){
  const gross = base + allowance + ot;
  const insurance_ee = Math.round(base * 0.105); // demo rate
  const pit = Math.max(0, Math.round((gross - insurance_ee - 11000000) * 0.1)); // very simplified
  const net = gross - insurance_ee - pit;
  return { gross, insurance_ee, pit, net };
}

// --------- Seed (demo) ---------
const SEED_EMP = [
  { id:'e1', code:'EMP001', name:'Nguyễn Văn A', org:'Kỹ thuật', title:'Kỹ sư QC', bank_account:'00123456789', bank_code:'VCB', base:18000000, allowance:980000 },
  { id:'e2', code:'EMP002', name:'Trần Thị B', org:'Kinh doanh', title:'Sales Executive', bank_account:'888777666', bank_code:'TCB', base:16000000, allowance:680000 },
  { id:'e3', code:'EMP003', name:'Phạm C', org:'Tài chính', title:'Kế toán', bank_account:'11223344', bank_code:'ACB', base:14000000, allowance:680000 },
];

const SEED_REQS = [
  { id:'r1', title:'Kỹ sư QC', org:'Kỹ thuật', qty:2, status:'Draft', internal_first:true, gate:'A' },
  { id:'r2', title:'Sales Executive', org:'Kinh doanh', qty:1, status:'Open', internal_first:true, gate:'None' },
];

const PIPE = ['Apply','Screen','Interview','Offer'];

const ONBOARD_TEMPLATES = {
  Staff: [
    { id:'t1', title:'Ký nhận Offer/TT cá nhân', category:'Hồ sơ', required:true },
    { id:'t2', title:'Tạo email/SSO', category:'Tài khoản', required:true },
    { id:'t3', title:'Bàn giao thiết bị', category:'Tài sản', required:true },
    { id:'t4', title:'Giới thiệu quy chế & văn hóa', category:'Đào tạo', required:false },
  ],
  Manager: [
    { id:'t1', title:'Ký HĐLĐ & điều khoản quản lý', category:'Hồ sơ', required:true },
    { id:'t2', title:'Cấp quyền quản lý', category:'Tài khoản', required:true },
    { id:'t3', title:'Thiết lập KPI 90 ngày', category:'Hiệu suất', required:true },
  ]
};

// --------- Small UI atoms ---------
function Section({title, children}){
  return (
    <div className="mb-6">
      <div className="mb-3 text-lg font-semibold">{title}</div>
      <div className="p-4 bg-white border border-gray-100 shadow rounded-2xl">{children}</div>
    </div>
  );
}
function Pill({text, tone='indigo'}){
  const map = { indigo:'bg-indigo-100 text-indigo-700', green:'bg-green-100 text-green-700', amber:'bg-amber-100 text-amber-700', red:'bg-red-100 text-red-700', blue:'bg-blue-100 text-blue-700' };
  return <span className={`px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{text}</span>;
}

// --------- Tabs ---------
function RecruitmentTab({audit}){
  const [reqs, setReqs] = useState(SEED_REQS);
  const [title, setTitle] = useState('');
  const [org, setOrg] = useState('Kỹ thuật');
  const [qty, setQty] = useState(1);
  const [internalFirst, setInternalFirst] = useState(true);

  function addReq(){
    const r = { id:'r'+(reqs.length+1), title, org, qty:Number(qty||1), status:'Draft', internal_first: internalFirst, gate:'None' };
    setReqs([r, ...reqs]);
    audit('req.create', r.id, JSON.stringify(r));
    setTitle(''); setQty(1);
  }
  function moveStatus(id){
    const flow = ['Draft','HRScreened','DirApproved','GroupHRApproved','Open','Interviewing','OfferPending','OfferAccepted','OfferDeclined','Closed'];
    setReqs(prev=> prev.map(r=>{
      if(r.id!==id) return r; const to = next(flow, r.status) || 'Closed';
      audit('req.status', id, `${r.status}→${to}`);
      return { ...r, status: to };
    }));
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Tạo requisition">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Chức danh" className="px-3 py-2 border rounded-xl"/>
          <input value={org} onChange={e=>setOrg(e.target.value)} placeholder="Phòng ban" className="px-3 py-2 border rounded-xl"/>
          <input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Số lượng" className="px-3 py-2 border rounded-xl"/>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internalFirst} onChange={e=>setInternalFirst(e.target.checked)} />Ưu tiên nội bộ</label>
        </div>
        <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={addReq} disabled={!title}>Thêm</button>
      </Section>

      <Section title="Danh sách requisitions">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th className="py-2 text-left">ID</th><th className="py-2 text-left">Chức danh</th><th className="py-2 text-left">Phòng</th><th className="py-2 text-left">SL</th><th className="py-2 text-left">Ưu tiên NB</th><th className="py-2 text-left">Trạng thái</th><th></th></tr></thead>
          <tbody>
            {reqs.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td className="py-2">{r.title}</td>
                <td className="py-2">{r.org}</td>
                <td className="py-2">{r.qty}</td>
                <td className="py-2">{r.internal_first? 'Yes':'No'}</td>
                <td className="py-2"><Pill text={r.status} tone={r.status==='Open'?'green':'indigo'} /></td>
                <td className="py-2 text-right"><button className="px-2 py-1 border rounded-lg" onClick={()=>moveStatus(r.id)}>Next</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <PipelineTab audit={audit} />
      <OfferTab audit={audit} />
    </div>
  );
}

function PipelineTab({audit}){
  const [cards, setCards] = useState([
    { id:'c1', name:'Nguyễn A', stage:'Apply', req_id:'r2' },
    { id:'c2', name:'Trần B', stage:'Screen', req_id:'r2' },
    { id:'c3', name:'Lê C', stage:'Interview', req_id:'r1' },
  ]);
  function move(id, dir){
    setCards(prev=> prev.map(c=>{
      if(c.id!==id) return c; const idx = PIPE.indexOf(c.stage); const n = Math.max(0, Math.min(PIPE.length-1, idx+dir));
      const to = PIPE[n]; audit('pipeline.move', id, `${c.stage}→${to}`);
      return {...c, stage: to};
    }));
  }
  return (
    <Section title="Pipeline ứng viên">
      <div className="grid grid-cols-4 gap-3">
        {PIPE.map(col=> (
          <div key={col} className="p-2 border bg-gray-50 rounded-xl">
            <div className="mb-2 font-medium">{col}</div>
            {(cards.filter(c=>c.stage===col)).map(c=> (
              <div key={c.id} className="p-2 mb-2 bg-white border rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">Req {c.req_id}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="px-2 py-0.5 border rounded-lg" disabled={c.stage==='Apply'} onClick={()=>move(c.id,-1)}>&lt;</button>
                    <button className="px-2 py-0.5 border rounded-lg" disabled={c.stage==='Offer'} onClick={()=>move(c.id,1)}>&gt;</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

function OfferTab({audit}){
  const [salary, setSalary] = useState(18000000);
  const [grade, setGrade] = useState('G5');
  const [candidate, setCandidate] = useState('Nguyễn A');
  function createOffer(){
    const off = { id: 'of'+Date.now(), candidate, salary, grade, status:'Draft' };
    audit('offer.create', off.id, JSON.stringify(off));
    alert('Offer created (demo). Check audit.');
  }
  return (
    <Section title="Tạo offer">
      <div className="grid gap-3 sm:grid-cols-4">
        <input value={candidate} onChange={e=>setCandidate(e.target.value)} placeholder="Ứng viên" className="px-3 py-2 border rounded-xl"/>
        <input type="number" value={salary} onChange={e=>setSalary(Number(e.target.value||0))} placeholder="Lương đề nghị" className="px-3 py-2 border rounded-xl"/>
        <input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Grade" className="px-3 py-2 border rounded-xl"/>
        <button className="px-3 py-1.5 rounded-xl border" onClick={createOffer}>Tạo</button>
      </div>
    </Section>
  );
}

function OnboardingTab({audit}){
  const [role, setRole] = useState('Staff');
  const [owner, setOwner] = useState('ManagerXYZ');
  const [empCode, setEmpCode] = useState('EMP001');
  const [tasks, setTasks] = useState([]);
  React.useEffect(()=>{
    const base = (ONBOARD_TEMPLATES[role]||[]).map((t,i)=> ({...t, id: `${t.id}-${i}`, assignee: owner, due: addDays( (t.category==='Hồ sơ')?3 : (t.category==='Tài sản')?1 : 7 ) }));
    setTasks(base);
  }, [role, owner]);

  const total = tasks.length||1; const done = tasks.filter(t=>t.done).length; const p = Math.round(100*done/total);
  function updateTask(id, patch){ setTasks(prev=> prev.map(t=> t.id===id? {...t, ...patch}: t)); }
  function addTask(){ setTasks(prev=> [...prev, { id: 'new-'+(prev.length+1), title:'', assignee: owner, due: addDays(7), required:false, done:false, category:'Khác' }]); }
  function exportPlan(){ const payload = { employee_code:empCode, role, owner, tasks }; audit('onboard.save', empCode, JSON.stringify(payload)); console.log('ONBOARD_PLAN', payload); alert('Plan printed to console (demo).'); }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Section title="Thiết lập">
          <div className="grid gap-3">
            <input value={empCode} onChange={e=>setEmpCode(e.target.value)} placeholder="Employee code" className="px-3 py-2 border rounded-xl"/>
            <select value={role} onChange={e=>setRole(e.target.value)} className="px-3 py-2 border rounded-xl">
              {Object.keys(ONBOARD_TEMPLATES).map(k=> (<option key={k} value={k}>{k}</option>))}
            </select>
            <input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Owner (manager)" className="px-3 py-2 border rounded-xl"/>
            <div className="text-sm text-gray-600">Progress: {done}/{total} ({p}%)</div>
          </div>
        </Section>
      </div>
      <div className="lg:col-span-2">
        <Section title="Checklist">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500"><th className="py-2 text-left">Yêu cầu</th><th className="py-2 text-left">Danh mục</th><th className="py-2 text-left">Phụ trách</th><th className="py-2 text-left">Hạn</th><th className="py-2 text-left">Bắt buộc</th><th className="py-2 text-left">Hoàn tất</th><th></th></tr></thead>
            <tbody>
              {tasks.map(t=> (
                <tr key={t.id} className="border-t">
                  <td className="py-2"><input value={t.title} onChange={e=>updateTask(t.id, {title:e.target.value})} className="w-full px-2 py-1 border rounded-lg"/></td>
                  <td className="py-2"><input value={t.category||''} onChange={e=>updateTask(t.id, {category:e.target.value})} className="px-2 py-1 border rounded-lg"/></td>
                  <td className="py-2"><input value={t.assignee||''} onChange={e=>updateTask(t.id, {assignee:e.target.value})} className="px-2 py-1 border rounded-lg"/></td>
                  <td className="py-2"><input type="date" value={(t.due||'').slice(0,10)} onChange={e=>updateTask(t.id, {due:e.target.value})} className="px-2 py-1 border rounded-lg"/></td>
                  <td className="py-2 text-center"><input type="checkbox" checked={!!t.required} onChange={e=>updateTask(t.id, {required:e.target.checked})}/></td>
                  <td className="py-2 text-center"><input type="checkbox" checked={!!t.done} onChange={e=>updateTask(t.id, {done:e.target.checked})}/></td>
                  <td className="py-2 text-right"><button className="px-2 py-1 border rounded-lg" onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 rounded-xl border" onClick={addTask}>+ Thêm dòng</button>
            <button className="px-3 py-1.5 rounded-xl border" onClick={exportPlan}>Lưu kế hoạch</button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function PayrollRunTab({audit}){
  const [runs, setRuns] = useState([{ id:'run1', month: monthISO(), status:'Open' }]);
  const flow = ['Open','PreValidate','Locked','Approved','Disbursed','Reported'];
  function addRun(){ const r = { id: 'run'+(runs.length+1), month: monthISO(), status:'Open' }; setRuns([r, ...runs]); audit('payroll.run.create', r.id, JSON.stringify(r)); }
  function advance(id){ setRuns(prev=> prev.map(r=>{ if(r.id!==id) return r; const to = next(flow, r.status)||r.status; if(to!==r.status){ audit('payroll.run.status', id, `${r.status}→${to}`);} return {...r, status: to}; })); }
  function exportBank(id){
    const run = runs.find(r=>r.id===id); if(!run) return;
    const lines = SEED_EMP.map(e=> ({ bank_code:e.bank_code, bank_account:e.bank_account, name:e.name, amount: calcPayslip({ base:e.base, allowance:e.allowance, ot:0 }).net, desc: `Salary ${run.month}` }));
    const csv = generateBankCsv(lines);
    downloadText(`bank_${id}.csv`, csv);
    audit('payroll.bank.export', id, `lines=${lines.length}`);
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Payroll runs">
        <button className="mb-3 px-3 py-1.5 rounded-xl border" onClick={addRun}>New run</button>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th className="py-2 text-left">ID</th><th className="py-2 text-left">Kỳ</th><th className="py-2 text-left">Trạng thái</th><th></th></tr></thead>
          <tbody>
            {runs.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td className="py-2">{r.month}</td>
                <td className="py-2"><Pill text={r.status} tone={r.status==='Approved'?'green': r.status==='Locked'?'blue': r.status==='PreValidate'?'amber': r.status==='Disbursed'?'green': r.status==='Reported'?'indigo':'indigo'} /></td>
                <td className="flex justify-end gap-2 py-2 text-right">
                  <button className="px-2 py-1 border rounded-lg" onClick={()=>advance(r.id)}>Next</button>
                  <button className="px-2 py-1 border rounded-lg" disabled={r.status!=='Approved'} onClick={()=>exportBank(r.id)}>Export bank</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <PayslipTab />
    </div>
  );
}

function PayslipTab(){
  const [empId, setEmpId] = useState('e1');
  const [month, setMonth] = useState(monthISO());
  const emp = SEED_EMP.find(e=>e.id===empId) || SEED_EMP[0];
  const ps = calcPayslip({ base: emp.base, allowance: emp.allowance, ot: 0 });
  return (
    <Section title="e‑Payslip (demo)">
      <div className="grid gap-3 sm:grid-cols-4">
        <select value={empId} onChange={e=>setEmpId(e.target.value)} className="px-3 py-2 border rounded-xl">
          {SEED_EMP.map(e=> (<option key={e.id} value={e.id}>{e.name} ({e.code})</option>))}
        </select>
        <input type="month" value={month.slice(0,7)} onChange={e=>setMonth(e.target.value+'-01')} className="px-3 py-2 border rounded-xl"/>
      </div>
      <div className="grid gap-3 mt-3 sm:grid-cols-4">
        <SlipStat label="Gross" value={vnd(ps.gross)} />
        <SlipStat label="BH người LĐ" value={vnd(ps.insurance_ee)} />
        <SlipStat label="PIT" value={vnd(ps.pit)} />
        <SlipStat label="Net" value={vnd(ps.net)} />
      </div>
    </Section>
  );
}
function SlipStat({label, value}){
  return (
    <div className="p-3 border bg-gray-50 rounded-xl">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function AnalyticsTab(){
  const headcount = SEED_EMP.length;
  const active = SEED_EMP.filter(e=>e.base>0).length;
  const payrollOnRevenue = '23%'; // demo
  const turnover = '8%';
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <KpiCard label="Headcount" value={headcount} />
      <KpiCard label="Active" value={active} />
      <KpiCard label="Payroll/Revenue" value={payrollOnRevenue} />
      <KpiCard label="Turnover" value={turnover} />
    </div>
  );
}
function KpiCard({label, value}){
  return (
    <div className="p-4 bg-white border shadow rounded-2xl">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SnapshotsTab({audit}){
  const [snaps, setSnaps] = useState([]);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  function build(){
    const s = { id: 'S'+(snaps.length+1), ts: new Date().toISOString(), hc: SEED_EMP.length, active: SEED_EMP.length, baseTotal: SEED_EMP.reduce((a,b)=>a+b.base,0) };
    setSnaps([s, ...snaps]); audit('snapshot.build', s.id, JSON.stringify(s));
  }
  const L = snaps.find(x=>x.id===left); const R = snaps.find(x=>x.id===right);
  const delta = L && R ? { hc: R.hc-L.hc, active: R.active-L.active, baseTotal: R.baseTotal-L.baseTotal } : null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Snapshots">
        <button className="mb-3 px-3 py-1.5 rounded-xl border" onClick={build}>Create snapshot</button>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th className="py-2 text-left">ID</th><th className="py-2 text-left">Thời gian</th><th className="py-2 text-right">HC</th><th className="py-2 text-right">Active</th><th className="py-2 text-right">Base Total</th></tr></thead>
          <tbody>
            {snaps.map(s=> (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.id}</td>
                <td className="py-2">{s.ts}</td>
                <td className="py-2 text-right">{s.hc}</td>
                <td className="py-2 text-right">{s.active}</td>
                <td className="py-2 text-right">{vnd(s.baseTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="So sánh">
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={left} onChange={e=>setLeft(e.target.value)} className="px-3 py-2 border rounded-xl"><option value="">(left)</option>{snaps.map(s=> (<option key={s.id} value={s.id}>{s.id}</option>))}</select>
          <select value={right} onChange={e=>setRight(e.target.value)} className="px-3 py-2 border rounded-xl"><option value="">(right)</option>{snaps.map(s=> (<option key={s.id} value={s.id}>{s.id}</option>))}</select>
        </div>
        <div className="mt-3 text-sm">
          {!delta && <div className="text-gray-500">Chọn 2 snapshot để so sánh.</div>}
          {delta && (
            <ul className="pl-5 list-disc">
              <li>Δ HC: {delta.hc}</li>
              <li>Δ Active: {delta.active}</li>
              <li>Δ Base Total: {vnd(delta.baseTotal)}</li>
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}

function AuditTab({events}){
  return (
    <Section title="Audit">
      <div className="border rounded-xl bg-gray-50 max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500"><th className="p-2 text-left">TS</th><th className="p-2 text-left">Actor</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Target</th><th className="p-2 text-left">Detail</th></tr></thead>
          <tbody>
            {events.length===0 && (<tr><td className="p-3 text-gray-500" colSpan={5}>Chưa có sự kiện.</td></tr>)}
            {events.map((e,i)=> (
              <tr key={i} className="border-t">
                <td className="p-2">{e.ts}</td>
                <td className="p-2">{e.actor}</td>
                <td className="p-2">{e.action}</td>
                <td className="p-2">{e.target||'-'}</td>
                <td className="p-2">{e.detail||'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function addDays(n){ const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

// --------- Main ---------
export default function HRWave2(){
  const [tab, setTab] = useState('recruit');
  const [audit, setAudit] = useState([]);
  function log(action, target, detail){ setAudit(prev=> [{ ts: new Date().toISOString(), actor:'you', action, target, detail }, ...prev]); }

  const tabs = [
    { key:'recruit', label:'Recruitment', node:<RecruitmentTab audit={log}/> },
    { key:'onboard', label:'Onboarding', node:<OnboardingTab audit={log}/> },
    { key:'payroll', label:'Payroll + Bank', node:<PayrollRunTab audit={log}/> },
    { key:'payslip', label:'e‑Payslip', node:<PayslipTab/> },
    { key:'analytics', label:'Analytics v1', node:<AnalyticsTab/> },
    { key:'snapshots', label:'Snapshots', node:<SnapshotsTab audit={log}/> },
    { key:'audit', label:'Audit', node:<AuditTab events={audit}/> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 mx-auto max-w-7xl md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold">ERP HR – Wave 2</div>
            <div className="text-sm text-gray-500">Recruitment • Onboarding • Payroll run + Bank • e‑Payslip • Analytics • Snapshots</div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> setAudit([])}>Clear audit</button>
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> log('snapshot.capture','wave2')}>Capture snapshot</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="p-2 bg-white border border-gray-100 shadow rounded-2xl">
            {tabs.map(t => (
              <div key={t.key} className={`px-3 py-2 rounded-xl cursor-pointer text-sm ${tab===t.key?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`} onClick={()=>setTab(t.key)}>
                {t.label}
              </div>
            ))}
          </div>
          <div>
            {(tabs.find(t=>t.key===tab)||tabs[0]).node}
          </div>
        </div>
      </div>
    </div>
  );
}
