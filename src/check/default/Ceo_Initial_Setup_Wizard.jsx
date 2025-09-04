import React, { useEffect, useMemo, useState } from "react";

function cx(...c) { return c.filter(Boolean).join(" "); }
function money(n){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0); }

function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input(props) {
  return <input {...props} className={cx("h-10 w-full rounded-lg border px-3 text-sm", props.className)} />;
}

function Select({ children, ...props }) {
  return (
    <select {...props} className={cx("h-10 w-full rounded-lg border px-2 text-sm", props.className)}>
      {children}
    </select>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cx("h-6 w-11 rounded-full transition flex items-center p-0.5", checked ? "bg-indigo-600" : "bg-gray-300")} aria-pressed={checked}>
      <span className={cx("h-5 w-5 bg-white rounded-full shadow transform transition", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function Section({ title, subtitle, children, right }) {
  return (
    <section className="p-5 border border-gray-200 shadow-sm bg-white/95 backdrop-blur rounded-2xl">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Stepper({ steps, active, onJump }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.key} className={cx("flex items-start gap-2 p-2 rounded-xl border", i === active ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200")}>
          <button onClick={() => onJump(i)} className="mt-0.5 size-6 rounded-full text-xs flex items-center justify-center border" aria-current={i===active}>
            {i + 1}
          </button>
          <div>
            <div className="text-sm font-medium">{s.title}</div>
            <div className="text-xs text-gray-500">{s.desc}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function CEOInitialSetupWizard(){
  const steps = useMemo(() => ([
    { key: 'group', title: 'Nhóm công ty & Cấu hình tài chính', desc: 'Group → Company → Branch → Site; kỳ tài chính/tiền tệ/thuế' },
    { key: 'org', title: 'Phòng ban & dùng chung/riêng', desc: 'Thiết lập phòng ban shared hay theo từng công ty' },
    { key: 'iam', title: 'Vai trò & Uỷ quyền (động)', desc: 'Thêm hành động tại headrow; hạn mức, phạm vi' },
    { key: 'approval', title: 'Luồng duyệt & ngưỡng', desc: 'Budget/PO/Contract theo công ty; SLA; bulk policy' },
    { key: 'kpi', title: 'Thiết kế KPI/OKR (AV2)', desc: 'Danh mục KPI, công thức actual, chấm điểm, áp theo cấp' },
    { key: 'dms', title: 'Tài liệu & lưu trữ', desc: 'SharePoint/Workspace & retention' },
    { key: 'templates', title: 'Mẫu & Checklist (Thư viện)', desc: 'Chọn từ thư viện: link hoặc clone tuỳ biến' },
    { key: 'users', title: 'Người dùng & mời vào', desc: 'Gán role mặc định, yêu cầu SSO' },
    { key: 'review', title: 'Tổng kết & áp dụng', desc: 'Sinh cấu hình & vào dashboard' },
  ]), []);

  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState(null);

  const [group, setGroup] = useState({ name: 'Your Group', code: 'YG', timezone: 'Asia/Ho_Chi_Minh' });
  const [companies, setCompanies] = useState([
    { name: 'Company A', code: 'COA', fiscalStart: '01', base: 'VND', vat: 8, taxId: '', branches: [ { name:'HCM Branch', code:'HCM' } ], sites: [ { name:'Site 1', code:'S1' } ] },
  ]);

  const [depts, setDepts] = useState([
    { name: 'Finance', code: 'FIN', shared: true, companies: [] },
    { name: 'Procurement', code: 'PRC', shared: false, companies: ['COA'] },
  ]);

  const [capabilities, setCapabilities] = useState(['EditBudget','FinalApprove','Delegate']);
  const [roles, setRoles] = useState([
    { role: 'CEO', limit: 1000000000, caps: { EditBudget: true, FinalApprove: true, Delegate: true } },
    { role: 'Middle Manager', limit: 50000000, caps: { EditBudget: false, FinalApprove: false, Delegate: false } },
    { role: 'Executive', limit: 5000000, caps: { EditBudget: false, FinalApprove: false, Delegate: false } },
  ]);
  const [newCap, setNewCap] = useState('');

  const [approval, setApproval] = useState([
    { company: 'COA', budgetCEO: 200000000, poCEO: 150000000, contractCEO: 300000000, slaDays: 3, bulkPolicy: true }
  ]);

  const [kpi, setKPI] = useState({
    period: 'Q3 2025',
    scope: 'Company',
    appliesTo: 'COA',
    scoring: 'linear',
    items: [
      { name: 'Quality', unit: '%', direction: 'maximize', source: 'manual', weight: 30, target: 95 },
      { name: 'Schedule', unit: '%', direction: 'maximize', source: 'dataset', formula: 'AVG(Milestone.on_time_rate)', weight: 30, target: 92 },
      { name: 'Safety', unit: '#', direction: 'minimize', source: 'dataset', formula: 'COUNT(Incidents)', weight: 20, target: 0, floor: 0, cap: 2 },
      { name: 'Cost', unit: 'VND', direction: 'minimize', source: 'formula', formula: 'ActualCost/Budget*100', weight: 20, target: 100, baseline: 100, floor: 90, cap: 120 },
    ]
  });

  const [dms, setDMS] = useState({ workspace: '', retention: { Contract: 1825, Submittal: 730, Timesheet: 365 } });
  const [tpl, setTpl] = useState({ linkMode: true, submittal: ['Form ký','Bản vẽ','Spec'], po: ['Đề nghị','Báo giá'], contract: ['Hợp đồng','Phụ lục','Bảo lãnh'] });

  const [users, setUsers] = useState({ invites: '', defaultRole: 'Executive', sso: true });

  function canNext(){
    const k = steps[active].key;
    if (k==='group') return companies.length>0 && companies.every(c=>c.name && c.code && c.base && c.fiscalStart);
    if (k==='org') return depts.length>0 && depts.every(d=>d.name && d.code && (d.shared || d.companies.length>0));
    if (k==='iam') return roles.length>0 && capabilities.length>0;
    if (k==='approval') return approval.every(a=>a.slaDays>0);
    if (k==='kpi') return kpi.items.length>0 && kpi.items.reduce((s,i)=>s+i.weight,0)===100;
    return true;
  }

  function next(){ if(active<steps.length-1) setActive(active+1); }
  function back(){ if(active>0) setActive(active-1); }
  function applyAll(){ alert('Áp dụng cấu hình khởi tạo (mock). Điều hướng sang Dashboard.'); }

  const companyCodes = companies.map(c=>c.code);
  const key = steps[active].key;

  useEffect(() => {
    try {
      console.assert(kpi.items.reduce((s,i)=>s+i.weight,0)===100, 'KPI weights must sum to 100');
      console.assert(Array.isArray(capabilities) && capabilities.length>=3, 'Capabilities should initialize');
      console.assert(companies.length>0, 'At least one company required');
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 size-8 rounded-xl" />
            <h1 className="font-semibold">Thiết lập hệ thống ban đầu (CEO)</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="h-8 px-3 text-xs border rounded-lg hover:bg-gray-50" onClick={()=>setMsg('Đã nạp cấu hình mặc định tối thiểu cho demo.')}>Dùng mặc định</button>
            <button className="h-8 px-3 text-xs border rounded-lg hover:bg-gray-50">Trợ giúp</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside>
          <Stepper steps={steps} active={active} onJump={setActive} />
        </aside>

        <div className="space-y-6">
          {msg && <div className="p-3 text-xs border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">{msg}</div>}

          {key==='group' && (
            <Section title="1) Nhóm công ty & Cấu hình tài chính" subtitle="Group → Company → Branch → Site; gộp kỳ tài chính/tiền tệ/thuế theo từng công ty">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tên Group"><Input value={group.name} onChange={e=>setGroup({...group, name:e.target.value})} /></Field>
                <Field label="Mã Group"><Input value={group.code} onChange={e=>setGroup({...group, code:e.target.value})} /></Field>
                <Field label="Múi giờ"><Select value={group.timezone} onChange={e=>setGroup({...group, timezone:e.target.value})}><option>Asia/Ho_Chi_Minh</option><option>Asia/Bangkok</option><option>UTC</option></Select></Field>
              </div>
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Công ty</th>
                    <th className="px-3 py-2">Mã</th>
                    <th className="px-3 py-2">Bắt đầu FY (tháng)</th>
                    <th className="px-3 py-2">Tiền tệ gốc</th>
                    <th className="px-3 py-2">VAT %</th>
                    <th className="px-3 py-2">MST</th>
                    <th className="px-3 py-2 w-36">Chi nhánh</th>
                    <th className="px-3 py-2 w-36">Site office</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr></thead>
                  <tbody>
                    {companies.map((c,idx)=> (
                      <tr key={c.code} className="align-top border-t">
                        <td className="px-3 py-2"><Input value={c.name} onChange={e=>{ const cp=[...companies]; cp[idx].name=e.target.value; setCompanies(cp);} } /></td>
                        <td className="px-3 py-2"><Input value={c.code} onChange={e=>{ const cp=[...companies]; cp[idx].code=e.target.value; setCompanies(cp);} } /></td>
                        <td className="px-3 py-2">
                          <Select value={c.fiscalStart} onChange={e=>{ const cp=[...companies]; cp[idx].fiscalStart=String(e.target.value); setCompanies(cp);} }>
                            {Array.from({length:12},(_,i)=>(<option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>))}
                          </Select>
                        </td>
                        <td className="px-3 py-2"><Select value={c.base} onChange={e=>{ const cp=[...companies]; cp[idx].base=String(e.target.value); setCompanies(cp);} }><option>VND</option><option>USD</option><option>EUR</option></Select></td>
                        <td className="px-3 py-2"><Input type="number" value={c.vat} onChange={e=>{ const cp=[...companies]; cp[idx].vat=Number(e.target.value); setCompanies(cp);} } /></td>
                        <td className="px-3 py-2"><Input value={c.taxId} onChange={e=>{ const cp=[...companies]; cp[idx].taxId=e.target.value; setCompanies(cp);} } /></td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {c.branches.map((b,bx)=> (
                              <div key={bx} className="flex items-center gap-2">
                                <Input value={b.name} onChange={e=>{ const cp=[...companies]; cp[idx].branches[bx].name=e.target.value; setCompanies(cp);} } />
                                <Input className="w-24" value={b.code} onChange={e=>{ const cp=[...companies]; cp[idx].branches[bx].code=e.target.value; setCompanies(cp);} } />
                              </div>
                            ))}
                            <button className="px-2 py-1 text-xs border rounded-lg" onClick={()=>{ const cp=[...companies]; cp[idx].branches.push({name:'Branch',code:'BR'}); setCompanies(cp); }}>+ Thêm CN</button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {c.sites.map((s,sx)=> (
                              <div key={sx} className="flex items-center gap-2">
                                <Input value={s.name} onChange={e=>{ const cp=[...companies]; cp[idx].sites[sx].name=e.target.value; setCompanies(cp);} } />
                                <Input className="w-20" value={s.code} onChange={e=>{ const cp=[...companies]; cp[idx].sites[sx].code=e.target.value; setCompanies(cp);} } />
                              </div>
                            ))}
                            <button className="px-2 py-1 text-xs border rounded-lg" onClick={()=>{ const cp=[...companies]; cp[idx].sites.push({name:'Site',code:'S'}); setCompanies(cp); }}>+ Thêm Site</button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setCompanies(companies.filter((_,i)=>i!==idx))}>Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setCompanies([...companies, { name:'New Company', code:'NEW', fiscalStart:'01', base:'VND', vat:8, taxId:'', branches:[], sites:[] }])}>+ Thêm công ty</button>
                <div className="text-xs text-gray-500">Có thể cập nhật chi tiết sau trong Org Setup.</div>
              </div>
            </Section>
          )}

          {key==='org' && (
            <Section title="2) Phòng ban & dùng chung/riêng" subtitle="Đánh dấu Shared để dùng cho toàn Group; nếu riêng thì chọn công ty áp dụng">
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Tên phòng ban</th>
                    <th className="px-3 py-2">Mã</th>
                    <th className="px-3 py-2">Shared</th>
                    {companyCodes.map(cc=> <th key={cc} className="px-3 py-2">{cc}</th>)}
                    <th className="w-10 px-3 py-2"></th>
                  </tr></thead>
                  <tbody>
                    {depts.map((d,idx)=> (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2"><Input value={d.name} onChange={e=>{ const cp=[...depts]; cp[idx].name=e.target.value; setDepts(cp); }} /></td>
                        <td className="px-3 py-2"><Input value={d.code} onChange={e=>{ const cp=[...depts]; cp[idx].code=e.target.value; setDepts(cp); }} /></td>
                        <td className="px-3 py-2 text-center"><Toggle checked={d.shared} onChange={v=>{ const cp=[...depts]; cp[idx].shared=v; if(v) cp[idx].companies=[]; setDepts(cp); }} /></td>
                        {companyCodes.map(cc=> (
                          <td key={cc} className="px-3 py-2 text-center">
                            <input type="checkbox" disabled={d.shared} checked={d.shared || d.companies.includes(cc)} onChange={e=>{ const cp=[...depts]; const list=new Set(cp[idx].companies); if(e.target.checked) list.add(cc); else list.delete(cc); cp[idx].companies=Array.from(list); setDepts(cp); }} />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setDepts(depts.filter((_,i)=>i!==idx))}>Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setDepts([...depts,{ name:'New Dept', code:'NEW', shared:false, companies:[] }])}>+ Thêm phòng ban</button>
                <div className="text-xs text-gray-500">Phòng ban shared sẽ khả dụng ở mọi công ty.</div>
              </div>
            </Section>
          )}

          {key==='iam' && (
            <Section title="3) Vai trò & Uỷ quyền (động)" subtitle="Thêm cột Hành động tại headrow; bật/tắt per role; đặt hạn mức">
              <div className="flex items-end gap-2">
                <Field label="Thêm hành động (capability)" hint="VD: EditKPI, ApproveContract">
                  <Input value={newCap} onChange={e=>setNewCap(e.target.value)} placeholder="CapabilityKey" />
                </Field>
                <button className="h-10 px-3 text-xs border rounded-lg" onClick={()=>{ const k=(newCap||'').trim().replace(/\s+/g,''); if(!k) return; if(!capabilities.includes(k)){ setCapabilities([...capabilities,k]); setRoles(roles.map(r=>({ ...r, caps:{...r.caps, [k]: false} }))); } setNewCap(''); }}>+ Thêm cột</button>
              </div>
              <div className="mt-2 overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Role</th>
                    {capabilities.map(cap=> <th key={cap} className="px-3 py-2">{cap}</th>)}
                    <th className="px-3 py-2">Hạn mức (VND)</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr></thead>
                  <tbody>
                    {roles.map((r,idx)=> (
                      <tr key={r.role} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.role}</td>
                        {capabilities.map(cap=> (
                          <td key={cap} className="px-3 py-2 text-center"><Toggle checked={!!r.caps[cap]} onChange={v=>{ const cp=[...roles]; cp[idx].caps[cap]=v; setRoles(cp); }} /></td>
                        ))}
                        <td className="px-3 py-2 text-center"><Input type="number" value={r.limit} onChange={e=>{ const cp=[...roles]; cp[idx].limit=Number(e.target.value); setRoles(cp); }} /></td>
                        <td className="px-3 py-2 text-right">{r.role!=='CEO' && <button className="text-xs text-rose-600" onClick={()=>setRoles(roles.filter((_,i)=>i!==idx))}>Xoá</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setRoles([...roles,{ role:'Custom', limit:0, caps:Object.fromEntries(capabilities.map(c=>[c,false])) }])}>+ Thêm role</button>
                <div className="text-xs text-gray-500">Có thể tinh chỉnh theo phạm vi Dept/Project sau.</div>
              </div>
            </Section>
          )}

          {key==='approval' && (
            <Section title="4) Luồng duyệt & ngưỡng" subtitle="Thiết lập theo công ty: Budget/PO/Contract; SLA & Bulk approve policy">
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Công ty</th>
                    <th className="px-3 py-2">Budget ≥ CEO</th>
                    <th className="px-3 py-2">PO ≥ CEO</th>
                    <th className="px-3 py-2">Contract ≥ CEO</th>
                    <th className="px-3 py-2">SLA (ngày)</th>
                    <th className="px-3 py-2">Bulk policy</th>
                  </tr></thead>
                  <tbody>
                    {approval.map((a,idx)=> (
                      <tr key={a.company} className="border-t">
                        <td className="px-3 py-2 font-medium">{a.company}</td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={a.budgetCEO} onChange={e=>{ const cp=[...approval]; cp[idx].budgetCEO=Number(e.target.value); setApproval(cp);} } /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={a.poCEO} onChange={e=>{ const cp=[...approval]; cp[idx].poCEO=Number(e.target.value); setApproval(cp);} } /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={a.contractCEO} onChange={e=>{ const cp=[...approval]; cp[idx].contractCEO=Number(e.target.value); setApproval(cp);} } /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={a.slaDays} onChange={e=>{ const cp=[...approval]; cp[idx].slaDays=Number(e.target.value); setApproval(cp);} } /></td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={a.bulkPolicy} onChange={e=>{ const cp=[...approval]; cp[idx].bulkPolicy=e.target.checked; setApproval(cp);} } />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>{
                  const notCovered = companyCodes.filter(cc=>!approval.some(a=>a.company===cc));
                  if(notCovered.length){ setApproval([...approval, { company: notCovered[0], budgetCEO:200000000, poCEO:150000000, contractCEO:300000000, slaDays:3, bulkPolicy:true }]); }
                }}>+ Thêm dòng cho công ty</button>
                <div className="text-xs text-gray-500">Rule bulk có thể giới hạn theo risk/amount.</div>
              </div>
            </Section>
          )}

          {key==='kpi' && (
            <Section title="5) Thiết kế KPI/OKR (AV2)" subtitle="Tạo KPI, công thức Actual, scoring & áp dụng theo cấp (Group/Company/Dept/Project)">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Kỳ đánh giá"><Select value={kpi.period} onChange={e=>setKPI({...kpi, period: String(e.target.value)})}><option>Q3 2025</option><option>Q4 2025</option><option>YTD 2025</option></Select></Field>
                <Field label="Phạm vi áp dụng"><Select value={kpi.scope} onChange={e=>setKPI({ ...kpi, scope: String(e.target.value) })}><option>Group</option><option>Company</option><option>Dept</option><option>Project</option></Select></Field>
                <Field label="Áp cho (ID)"><Input value={kpi.appliesTo} onChange={e=>setKPI({ ...kpi, appliesTo: e.target.value })} placeholder="VD: COA / FIN / Proj-001" /></Field>
                <Field label="Mô hình chấm điểm"><Select value={kpi.scoring} onChange={e=>setKPI({ ...kpi, scoring: String(e.target.value) })}><option value="linear">Linear (chuẩn)</option><option value="threshold">Threshold table</option><option value="banded">Banded (dải điểm)</option></Select></Field>
              </div>
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left">Tên KPI</th>
                    <th className="px-3 py-2">Đơn vị</th>
                    <th className="px-3 py-2">Hướng</th>
                    <th className="px-3 py-2">Nguồn</th>
                    <th className="px-3 py-2">Công thức/Dataset</th>
                    <th className="px-3 py-2">Mục tiêu</th>
                    <th className="px-3 py-2">Trọng số</th>
                    <th className="px-3 py-2">Floor</th>
                    <th className="px-3 py-2">Cap</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr></thead>
                  <tbody>
                    {kpi.items.map((it,idx)=> (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2"><Input value={it.name} onChange={e=>{ const cp=[...kpi.items]; cp[idx].name=e.target.value; setKPI({...kpi, items:cp}); }} /></td>
                        <td className="px-3 py-2"><Select value={it.unit} onChange={e=>{ const cp=[...kpi.items]; cp[idx].unit=String(e.target.value); setKPI({...kpi, items:cp}); }}><option>%</option><option>VND</option><option>hrs</option><option>#</option></Select></td>
                        <td className="px-3 py-2"><Select value={it.direction} onChange={e=>{ const cp=[...kpi.items]; cp[idx].direction=String(e.target.value); setKPI({...kpi, items:cp}); }}><option>maximize</option><option>minimize</option></Select></td>
                        <td className="px-3 py-2"><Select value={it.source} onChange={e=>{ const cp=[...kpi.items]; cp[idx].source=String(e.target.value); setKPI({...kpi, items:cp}); }}><option>manual</option><option>formula</option><option>dataset</option></Select></td>
                        <td className="px-3 py-2"><Input value={it.formula||''} onChange={e=>{ const cp=[...kpi.items]; cp[idx].formula=e.target.value; setKPI({...kpi, items:cp}); }} placeholder="VD: SUM(Timesheet.hours) / Plan * 100" /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.target} onChange={e=>{ const cp=[...kpi.items]; cp[idx].target=Number(e.target.value); setKPI({...kpi, items:cp}); }} /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.weight} onChange={e=>{ const cp=[...kpi.items]; cp[idx].weight=Number(e.target.value); setKPI({...kpi, items:cp}); }} /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.floor??''} onChange={e=>{ const cp=[...kpi.items]; cp[idx].floor=Number(e.target.value)||undefined; setKPI({...kpi, items:cp}); }} /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.cap??''} onChange={e=>{ const cp=[...kpi.items]; cp[idx].cap=Number(e.target.value)||undefined; setKPI({...kpi, items:cp}); }} /></td>
                        <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setKPI({...kpi, items:kpi.items.filter((_,i)=>i!==idx)})}>Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setKPI({...kpi, items:[...kpi.items, { name:'New KPI', unit:'%', direction:'maximize', source:'manual', weight:0, target:100 }]})}>+ Thêm KPI</button>
                <div className="text-xs text-gray-500">Tổng trọng số: {kpi.items.reduce((s,i)=>s+i.weight,0)} (yêu cầu = 100)</div>
              </div>
              <div className="p-3 text-xs text-gray-600 border rounded-xl">
                <div className="mb-1 font-semibold">Cách tính Actual & Score:</div>
                <ul className="pl-5 space-y-1 list-disc">
                  <li>Actual: manual nhập tay; dataset lấy từ chỉ số; formula dùng biểu thức.</li>
                  <li>Score linear: maximize ⇒ min(100, max(0, Actual/Target*100)); minimize ⇒ min(100, max(0, Target/Actual*100)); áp dụng floor/cap nếu có.</li>
                  <li>Threshold/Banded: ánh xạ theo bảng ngưỡng.</li>
                  <li>Composite: Σ(Điểm KPI_i × Trọng số_i) / 100.</li>
                  <li>Áp dụng: Group/Company/Dept/Project; có thể kế thừa hoặc override.</li>
                </ul>
              </div>
            </Section>
          )}

          {key==='dms' && (
            <Section title="6) Tài liệu & lưu trữ" subtitle="Khai báo Workspace và retention (ngày)">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Workspace URL"><Input value={dms.workspace} onChange={e=>setDMS({...dms, workspace:e.target.value})} placeholder="https://share.yourco.com/sites/erp" /></Field>
                <div />
                {Object.entries(dms.retention).map(([k,v]) => (
                  <Field key={k} label={`Retention – ${k} (ngày)`}><Input type="number" value={v} onChange={e=>setDMS({...dms, retention:{...dms.retention, [k]: Number(e.target.value)}})} /></Field>
                ))}
              </div>
            </Section>
          )}

          {key==='templates' && (
            <Section title="7) Mẫu & Checklist (Thư viện hệ thống)" subtitle="Chọn từ thư viện chuẩn; Link (nhận cập nhật) hoặc Clone để tuỳ biến theo công ty">
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="tplmode" checked={tpl.linkMode} onChange={()=>setTpl({...tpl, linkMode:true})}/> Link đến thư viện</label>
                <label className="flex items-center gap-2"><input type="radio" name="tplmode" checked={!tpl.linkMode} onChange={()=>setTpl({...tpl, linkMode:false})}/> Clone & tuỳ biến</label>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-3 border rounded-xl">
                  <div className="mb-2 text-sm font-semibold">Submittal (Library)</div>
                  <ul className="space-y-1 text-sm">{tpl.submittal.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, submittal:[...tpl.submittal, 'Mục mới']})}>+ Thêm</button>
                </div>
                <div className="p-3 border rounded-xl">
                  <div className="mb-2 text-sm font-semibold">PO (Library)</div>
                  <ul className="space-y-1 text-sm">{tpl.po.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, po:[...tpl.po, 'Mục mới']})}>+ Thêm</button>
                </div>
                <div className="p-3 border rounded-xl">
                  <div className="mb-2 text-sm font-semibold">Contract (Library)</div>
                  <ul className="space-y-1 text-sm">{tpl.contract.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, contract:[...tpl.contract, 'Mục mới']})}>+ Thêm</button>
                </div>
              </div>
              <div className="text-xs text-gray-500">Chế độ <b>Link</b>: tự động nhận bản cập nhật thư viện. <b>Clone</b>: sao chép để tuỳ biến riêng.</div>
            </Section>
          )}

          {key==='users' && (
            <Section title="8) Người dùng & mời vào" subtitle="Nhập email (phân cách bằng dấu phẩy) hoặc import CSV; gán role mặc định; yêu cầu SSO">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Danh sách email mời (csv)" hint="VD: ceo@yourco.com, manager@yourco.com">
                  <textarea className="w-full h-32 p-2 text-sm border rounded-lg" value={users.invites} onChange={e=>setUsers({...users, invites:e.target.value})} placeholder="user1@yourco.com, user2@yourco.com" />
                </Field>
                <div className="grid content-start gap-4">
                  <Field label="Role mặc định">
                    <Select value={users.defaultRole} onChange={e=>setUsers({...users, defaultRole:String(e.target.value)})}>
                      {roles.map(r=> <option key={r.role}>{r.role}</option>)}
                    </Select>
                  </Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={users.sso} onChange={e=>setUsers({...users, sso:e.target.checked})}/> Yêu cầu đăng nhập SSO</label>
                  <button className="h-10 text-xs border rounded-lg">Tải mẫu CSV</button>
                </div>
              </div>
            </Section>
          )}

          {key==='review' && (
            <Section title="9) Tổng kết & áp dụng" subtitle="Kiểm tra nhanh các thông số trước khi áp dụng">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">Group</div><div className="text-xs text-gray-600">{group.name} • {group.code} • TZ {group.timezone}</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">Companies</div><div className="text-xs text-gray-600">{companies.map(c=>`${c.name}(${c.code})`).join(', ')}</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">Departments</div><div className="text-xs text-gray-600">Shared: {depts.filter(d=>d.shared).length} • Private: {depts.filter(d=>!d.shared).length}</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">IAM</div><div className="text-xs text-gray-600">{roles.length} roles • {capabilities.length} actions</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">Approvals</div><div className="text-xs text-gray-600">{approval.length} company rule sets</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">KPI/OKR</div><div className="text-xs text-gray-600">{kpi.scope}→{kpi.appliesTo} • {kpi.items.length} KPI • weights {kpi.items.reduce((s,i)=>s+i.weight,0)}</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">DMS</div><div className="text-xs text-gray-600">{dms.workspace || '—'} • Retention set</div></div>
                <div className="p-3 border rounded-xl"><div className="mb-1 text-sm font-semibold">Templates</div><div className="text-xs text-gray-600">Mode: {tpl.linkMode? 'Link':'Clone'} • Submittal {tpl.submittal.length} • PO {tpl.po.length} • Contract {tpl.contract.length}</div></div>
                <div className="p-3 border rounded-xl md:col-span-2"><div className="mb-1 text-sm font-semibold">Users</div><div className="text-xs text-gray-600">Default: {users.defaultRole} • SSO: {users.sso? 'On':'Off'} • Invites: {users.invites? users.invites.split(',').length: 0}</div></div>
              </div>
            </Section>
          )}

          <div className="flex items-center justify-between">
            <button onClick={back} className="h-10 px-4 text-sm border rounded-lg disabled:opacity-50" disabled={active===0}>← Quay lại</button>
            {active < steps.length - 1 ? (
              <button onClick={next} disabled={!canNext()} className={cx("h-10 px-5 rounded-lg text-sm text-white", canNext() ? "bg-slate-900 hover:bg-black" : "bg-slate-400")}>Tiếp tục →</button>
            ) : (
              <button onClick={applyAll} className="h-10 px-5 text-sm text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">Áp dụng & vào Dashboard</button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-xs text-center text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
    </div>
  );
}
