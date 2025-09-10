// ERP HR – Wave 1 Console (Remake, JSX version)
// Full JSX with seed data & mock audit

import React, { useMemo, useState } from "react";

// ---------- Helpers (pure) ----------
function csvToRows(csv) {
  if (!csv || !csv.trim()) return [];
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',').map(s=>s.trim().toLowerCase());
  const idx = (k)=> header.indexOf(k);
  const iEmp = idx('employee_code');
  const iDate = idx('date');
  const iIn = idx('in');
  const iOut = idx('out');
  const iDev = idx('device');
  const out = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    if (cols.length < 4) continue;
    out.push({
      employee_code: (cols[iEmp]||'').trim(),
      date: (cols[iDate]||'').trim(),
      in: (cols[iIn]||'').trim(),
      out: (cols[iOut]||'').trim(),
      device: iDev>=0 ? (cols[iDev]||'').trim() : undefined,
    });
  }
  return out;
}

const PAYROLL_NEXT = {
  Open: 'PreValidate',
  PreValidate: 'Locked',
  Locked: 'Approved',
  Approved: 'Disbursed',
  Disbursed: 'Reported',
  Reported: null,
};

function nextPayrollStatus(s){ return PAYROLL_NEXT[s]; }
function vnd(n){ return Number(n||0).toLocaleString('vi-VN'); }

// ---------- Seed (demo) ----------
const SEED_EMP = [
  { id:'e1', employee_code:'EMP001', full_name:'Nguyễn Văn A', org:'Kỹ thuật', title:'Kỹ sư QC', dob:'1994-05-20', national_id:'012345678901', address:'Q.1, TP.HCM', join_date:'2024-01-10', status:'Active' },
  { id:'e2', employee_code:'EMP002', full_name:'Trần Thị B', org:'Kinh doanh', title:'Sales Executive', dob:'1996-02-02', national_id:'023456789012', address:'Q.3, TP.HCM', join_date:'2023-07-01', status:'Active' },
  { id:'e3', employee_code:'EMP003', full_name:'Phạm C', org:'Tài chính – Nội vụ', title:'Kế toán', join_date:'2022-11-15', status:'OnLeave' },
];

const SEED_CONTRACTS = [
  {
    id:'c1', employee_id:'e1', type:'fixed', status:'Active',
    versions:[
      { id:'cv1', effective_from:'2024-01-10', salary_base: 15000000, allowance:{ meal:680000 }, file_ref:'HDDL_EMP001_v1.pdf' },
      { id:'cv2', effective_from:'2025-01-01', salary_base: 18000000, allowance:{ meal:680000, phone:300000 }, file_ref:'PL_EMP001_2025.pdf' },
    ]
  }
];

const SEED_LEAVE = [
  { id:'l1', employee_code:'EMP001', type:'annual', from:'2025-08-15', to:'2025-08-15', days:1, status:'ManagerApproved' },
  { id:'l2', employee_code:'EMP002', type:'sick', from:'2025-08-12', to:'2025-08-12', days:0.5, status:'Submitted' },
];

const SEED_OT = [
  { id:'o1', employee_code:'EMP001', date:'2025-08-10', hours:2, reason:'Release', status:'HRChecked' },
  { id:'o2', employee_code:'EMP003', date:'2025-08-05', hours:4, reason:'Inventory', status:'Submitted' },
];

const SEED_ROLES = ['Group HR Admin','Group Analyst','Company HR','Line Manager','Employee'];
const SEED_PERMS = ['org.read','org.write','employee.read','employee.write','contract.sign','time.approve','payroll.lock','payroll.approve','audit.view'];

// ---------- Small UI atoms ----------
function Section({title, children}){
  return (
    <div className="mb-6">
      <div className="mb-3 text-lg font-semibold">{title}</div>
      <div className="p-4 bg-white border border-gray-100 shadow rounded-2xl">{children}</div>
    </div>
  );
}

function Stat({label, value}){
  return (
    <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Pill({text, tone='indigo'}){
  const map = {
    indigo:'bg-indigo-100 text-indigo-700',
    green:'bg-green-100 text-green-700',
    amber:'bg-amber-100 text-amber-700',
    red:'bg-red-100 text-red-700',
    blue:'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{text}</span>;
}

// ---------- Tabs ----------
function OrgHeadcountTab(){
  const tree = [
    { name:'Ban Điều Hành', head:'EMP001', children:[
      { name:'Kỹ thuật', head:'EMP001' },
      { name:'Kinh doanh', head:'EMP002' },
      { name:'Tài chính – Nội vụ', head:'EMP003' },
    ]}
  ];

  const headcount = useMemo(()=>{
    const by = new Map();
    SEED_EMP.forEach(e=> by.set(e.org||'Khác', (by.get(e.org||'Khác')||0)+1));
    return Array.from(by.entries()).map(([org, n])=>({ org, n }));
  },[]);

  return (
    <div>
      <Section title="Sơ đồ tổ chức">
        <div className="grid gap-3">
          <div className="p-3 border rounded-xl bg-gray-50">
            <div className="font-medium">{tree[0].name} <span className="text-gray-500">• Head {tree[0].head}</span></div>
            <div className="grid gap-2 mt-2 sm:grid-cols-3">
              {tree[0].children.map((c,i)=> (
                <div key={i} className="p-3 bg-white border rounded-xl">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-500">Head {c.head}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Định biên (demo)">
        <div className="grid gap-3 mb-3 sm:grid-cols-3">
          <Stat label="Tổng headcount" value={SEED_EMP.length} />
          <Stat label="Active" value={SEED_EMP.filter(e=>e.status==='Active').length} />
          <Stat label="On leave" value={SEED_EMP.filter(e=>e.status==='OnLeave').length} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Phòng</th>
              <th className="py-2">Headcount</th>
            </tr>
          </thead>
          <tbody>
            {headcount.map((r,i)=> (
              <tr key={i} className="border-t">
                <td className="py-2">{r.org}</td>
                <td className="py-2">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Employee360Tab(){
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const filtered = useMemo(()=> SEED_EMP.filter(e=> (e.full_name+e.employee_code).toLowerCase().includes(q.toLowerCase())), [q]);
  const contracts = useMemo(()=> sel ? SEED_CONTRACTS.filter(c=> c.employee_id===sel.id) : [], [sel]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Section title="Tìm nhân sự">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tên hoặc mã NV" className="w-full px-3 py-2 border rounded-xl"/>
          <div className="mt-3 space-y-2 overflow-auto max-h-96">
            {filtered.map(e=> (
              <div key={e.id} onClick={()=>setSel(e)} className={`p-3 border rounded-xl cursor-pointer ${sel?.id===e.id?'bg-indigo-50 border-indigo-200':'bg-white'}`}>
                <div className="font-medium">{e.full_name}</div>
                <div className="text-xs text-gray-500">{e.employee_code} • {e.org} • {e.title}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="lg:col-span-2">
        <Section title="Hồ sơ 360°">
          {!sel && <div className="text-gray-500">Chọn một nhân sự để xem chi tiết.</div>}
          {sel && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{sel.full_name} <span className="font-normal text-gray-500">({sel.employee_code})</span></div>
                  <div className="flex gap-2 mt-1 text-sm">
                    <Pill text={sel.status} tone={sel.status==='Active'?'green':'amber'} />
                    <span className="text-gray-500">Join {sel.join_date||'-'}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-xl border" onClick={()=>alert('Open Admin (demo)')}>Open Admin</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="mb-2 font-medium">Thông tin</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Phòng ban</div>
                      <div>{sel.org||'-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Chức danh</div>
                      <div>{sel.title||'-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">CCCD</div>
                      <div>{sel.national_id||'-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Địa chỉ</div>
                      <div>{sel.address||'-'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="mb-2 font-medium">HĐLĐ</div>
                  {contracts.length===0 && <div className="text-sm text-gray-500">Chưa có dữ liệu hợp đồng.</div>}
                  {contracts.map(c=> (
                    <div key={c.id} className="p-3 mb-2 text-sm bg-white border rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>Type: <b>{c.type}</b> • Status: <b>{c.status}</b></div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 border rounded-lg" onClick={()=>alert('Send to Employee (demo)')}>Send→Emp</button>
                          <button className="px-2 py-1 border rounded-lg" onClick={()=>alert('Send to Company (demo)')}>Send→Co</button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="py-1 text-left">Từ</th>
                              <th className="py-1 text-left">Đến</th>
                              <th className="py-1 text-right">Lương CB</th>
                              <th className="py-1 text-left">Phụ cấp</th>
                              <th className="py-1 text-left">Tệp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.versions.map(v=> (
                              <tr key={v.id} className="border-t">
                                <td className="py-1">{v.effective_from}</td>
                                <td className="py-1">{v.effective_to||'-'}</td>
                                <td className="py-1 text-right">{vnd(v.salary_base)}</td>
                                <td className="py-1">{v.allowance? Object.entries(v.allowance).map(([k, val])=> `${k}:${vnd(val)}`).join(', ') : '-'}</td>
                                <td className="py-1"><a className="underline" href={`#${v.file_ref||''}`}>Xem</a></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function TimeGateTab(){
  const [csv, setCsv] = useState("employee_code,date,in,out\nEMP001,2025-08-07,08:59,18:05\nEMP002,2025-08-07,09:05,18:20");
  const rows = useMemo(()=> csvToRows(csv), [csv]);
  return (
    <div>
      <Section title="TimeGate ingest (CSV)">
        <div className="grid gap-4 md:grid-cols-2">
          <textarea value={csv} onChange={e=>setCsv(e.target.value)} className="w-full h-48 p-3 font-mono text-xs border rounded-xl"/>
          <div>
            <div className="mb-2 text-sm text-gray-500">Preview ({rows.length} dòng)</div>
            <div className="overflow-auto border max-h-48 rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">In</th>
                    <th className="p-2 text-left">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r,i)=> (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.employee_code}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.in}</td>
                      <td className="p-2">{r.out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={()=>alert(`Ingested ${rows.length} rows (demo)`)}>Ingest</button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function LeaveOTTab(){
  const [leave, setLeave] = useState(SEED_LEAVE);
  const [ot, setOt] = useState(SEED_OT);
  function setLeaveStatus(id, status){ setLeave(prev=> prev.map(l=> l.id===id? {...l, status}: l)); }
  function setOtStatus(id, status){ setOt(prev=> prev.map(o=> o.id===id? {...o, status}: o)); }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section title="Đơn nghỉ phép">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 text-left">NV</th>
              <th className="py-2 text-left">Loại</th>
              <th className="py-2 text-left">Từ</th>
              <th className="py-2 text-left">Đến</th>
              <th className="py-2 text-right">Ngày</th>
              <th className="py-2 text-left">Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leave.map(l=> (
              <tr key={l.id} className="border-t">
                <td className="py-2">{l.employee_code}</td>
                <td className="py-2">{l.type}</td>
                <td className="py-2">{l.from}</td>
                <td className="py-2">{l.to}</td>
                <td className="py-2 text-right">{l.days}</td>
                <td className="py-2"><Pill text={l.status} tone={l.status==='Rejected'?'red': l.status==='Submitted'?'amber':'green'} /></td>
                <td className="flex justify-end gap-2 py-2">
                  <button className="px-2 py-1 border rounded-lg" onClick={()=>setLeaveStatus(l.id,'ManagerApproved')}>Approve</button>
                  <button className="px-2 py-1 border rounded-lg" onClick={()=>setLeaveStatus(l.id,'Rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Làm thêm giờ (OT)">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 text-left">NV</th>
              <th className="py-2 text-left">Ngày</th>
              <th className="py-2 text-right">Giờ</th>
              <th className="py-2 text-left">Lý do</th>
              <th className="py-2 text-left">Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ot.map(o=> (
              <tr key={o.id} className="border-t">
                <td className="py-2">{o.employee_code}</td>
                <td className="py-2">{o.date}</td>
                <td className="py-2 text-right">{o.hours}</td>
                <td className="py-2">{o.reason}</td>
                <td className="py-2"><Pill text={o.status} tone={o.status==='Rejected'?'red': o.status==='Submitted'?'amber':'green'} /></td>
                <td className="flex justify-end gap-2 py-2">
                  <button className="px-2 py-1 border rounded-lg" onClick={()=>setOtStatus(o.id,'ManagerApproved')}>Approve</button>
                  <button className="px-2 py-1 border rounded-lg" onClick={()=>setOtStatus(o.id,'Rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function PayrollTab(){
  const [status, setStatus] = useState('Open');
  const [log, setLog] = useState([]);
  function advance(){
    const n = nextPayrollStatus(status);
    if (!n) return;
    setStatus(n);
    setLog(prev=> [`${new Date().toISOString()} • ${status} → ${n}`, ...prev]);
  }
  return (
    <div>
      <Section title="Payroll pipeline">
        <div className="flex items-center gap-3">
          <Pill text={status} tone={status==='Approved'?'green': status==='Locked'?'blue': status==='PreValidate'?'amber': status==='Disbursed'?'green': status==='Reported'?'indigo':'indigo'} />
          <button className="px-3 py-1.5 rounded-xl border" disabled={!nextPayrollStatus(status)} onClick={advance}>Next</button>
        </div>
        <div className="mt-3 text-sm text-gray-500">Open → PreValidate → Locked → Approved → Disbursed → Reported</div>
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium">Nhật ký</div>
          <div className="p-2 overflow-auto text-xs border rounded-xl bg-gray-50 max-h-40">
            {log.length===0 && <div className="text-gray-500">Chưa có sự kiện.</div>}
            {log.map((l,i)=> (<div key={i}>{l}</div>))}
          </div>
        </div>
      </Section>
    </div>
  );
}

function RBACTab(){
  const [matrix, setMatrix] = useState(()=>{
    const m = {};
    SEED_ROLES.forEach(r=>{
      m[r] = {};
      SEED_PERMS.forEach(p=> {
        m[r][p] = (
          r==='Group HR Admin' ||
          (r==='Company HR' && p.startsWith('employee')) ||
          (r==='Line Manager' && (p==='employee.read' || p==='time.approve')) ||
          (r==='Group Analyst' && (p==='org.read' || p==='employee.read' || p==='audit.view')) ||
          (r==='Employee' && p==='employee.read')
        );
      });
    });
    return m;
  });
  function toggle(r,p){ setMatrix(prev=> ({...prev, [r]: { ...prev[r], [p]: !prev[r][p] }})); }
  return (
    <div>
      <Section title="RBAC">
        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Role \\ Perm</th>
                {SEED_PERMS.map(p=> (<th key={p} className="p-2 text-left whitespace-nowrap">{p}</th>))}
              </tr>
            </thead>
            <tbody>
              {SEED_ROLES.map(r=> (
                <tr key={r} className="border-t">
                  <td className="p-2 font-medium whitespace-nowrap">{r}</td>
                  {SEED_PERMS.map(p=> (
                    <td key={p} className="p-2">
                      <input type="checkbox" checked={!!(matrix[r] && matrix[r][p])} onChange={()=>toggle(r,p)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function AuditTab({events}){
  return (
    <div>
      <Section title="Audit trail">
        <div className="border rounded-xl bg-gray-50 max-h-[460px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="p-2 text-left">Thời gian</th>
                <th className="p-2 text-left">Actor</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Target</th>
                <th className="p-2 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {(!events || events.length===0) && (
                <tr><td className="p-3 text-gray-500" colSpan={5}>Chưa có sự kiện.</td></tr>
              )}
              {(events||[]).map((e,i)=> (
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
    </div>
  );
}

// ---------- Main ----------
export default function ERPHRWave1(){
  const [tab, setTab] = useState('org');
  const [audit, setAudit] = useState([]);

  function log(action,target,detail){
    setAudit(prev=> [{ ts: new Date().toISOString(), actor:'you', action, target, detail }, ...prev]);
  }

  function ContractsTab(){
    const emp = SEED_EMP[0];
    const cons = SEED_CONTRACTS;
    return (
      <div>
        <Section title={`Contracts • ${emp.full_name} (${emp.employee_code})`}>
          {cons.map(c=> (
            <div key={c.id} className="p-4 mb-3 border rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="font-medium">Type: {c.type} • Status: {c.status}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-xl border" onClick={()=>log('contract.send_to_employee', c.id)}>Send→Emp</button>
                  <button className="px-3 py-1.5 rounded-xl border" onClick={()=>log('contract.send_to_company', c.id)}>Send→Co</button>
                </div>
              </div>
              <div className="mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-1 text-left">Từ</th>
                      <th className="py-1 text-left">Đến</th>
                      <th className="py-1 text-right">Lương CB</th>
                      <th className="py-1 text-left">Phụ cấp</th>
                      <th className="py-1 text-left">Tệp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.versions.map(v=> (
                      <tr key={v.id} className="border-t">
                        <td className="py-1">{v.effective_from}</td>
                        <td className="py-1">{v.effective_to||'-'}</td>
                        <td className="py-1 text-right">{vnd(v.salary_base)}</td>
                        <td className="py-1">{v.allowance? Object.entries(v.allowance).map(([k,val])=> `${k}:${vnd(val)}`).join(', ') : '-'}</td>
                        <td className="py-1"><a className="underline" href={`#${v.file_ref||''}`}>Xem</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  const tabs = [
    { key:'org', label:'Org/Headcount', node:<OrgHeadcountTab/> },
    { key:'emp360', label:'Employee 360', node:<Employee360Tab/> },
    { key:'contracts', label:'Contracts (ký số)', node:<ContractsTab/> },
    { key:'timegate', label:'TimeGate ingest', node:<TimeGateTab/> },
    { key:'leaveot', label:'Leave / OT', node:<LeaveOTTab/> },
    { key:'payroll', label:'Payroll pipeline', node:<PayrollTab/> },
    { key:'rbac', label:'RBAC', node:<RBACTab/> },
    { key:'audit', label:'Audit', node:<AuditTab events={audit}/> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 mx-auto max-w-7xl md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold">ERP HR – Wave 1 (JSX)</div>
            <div className="text-sm text-gray-500">Org/Headcount • Employee 360 • Contracts • TimeGate • Leave/OT • Payroll • RBAC • Audit</div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=>{ setAudit([]); }}>Clear audit</button>
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=>log('snapshot.capture','wave1')}>Capture snapshot</button>
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
