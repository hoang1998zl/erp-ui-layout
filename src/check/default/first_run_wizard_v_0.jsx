import React, { useMemo, useState } from "react";

/**
 * CEO Initial Setup Wizard — Post Sign‑in
 * Vietnamese-first UI (with light EN hints), TailwindCSS, no external deps.
 * Covers normalized onboarding needs before the CEO lands on the dashboard:
 * 1) Company & Fiscal  2) Currency & Tax  3) Org Seed  4) Roles & Delegation
 * 5) Approval Thresholds  6) KPI/OKR Set  7) DMS/Retention  8) Templates/Checklists
 * 9) Users/Invites  10) Review & Apply
 *
 * NOTE: All API calls are mocked; wire to your real endpoints later (OpenAPI).
 */

// ---------------- Utilities ----------------
function cx(...c) { return c.filter(Boolean).join(" "); }
function money(n){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0); }

function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700 font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({ ...props }) {
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx("h-6 w-11 rounded-full transition flex items-center p-0.5", checked ? "bg-indigo-600" : "bg-gray-300")}
      aria-pressed={checked}
    >
      <span className={cx("h-5 w-5 bg-white rounded-full shadow transform transition", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function Section({ title, subtitle, children, right }) {
  return (
    <section className="bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-sm p-5">
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

// ---------------- Main Component ----------------
export default function CEOInitialSetupWizard() {
  const steps = useMemo(() => ([
    { key: 'company', title: 'Công ty & kỳ tài chính', desc: 'Tên pháp lý, domain, múi giờ, kỳ kế toán' },
    { key: 'currency', title: 'Tiền tệ & Thuế', desc: 'Đồng tiền gốc, VAT, mã số thuế' },
    { key: 'org', title: 'Khởi tạo sơ đồ tổ chức', desc: 'Phòng ban cấp 1, manager, mã cost center' },
    { key: 'roles', title: 'Vai trò & uỷ quyền', desc: 'Role catalogue, capability, hạn mức' },
    { key: 'approval', title: 'Luồng duyệt & ngưỡng', desc: 'Budget / PO / Contract, SLA' },
    { key: 'kpi', title: 'Bộ KPI/OKR & kỳ', desc: 'Danh mục KPI, mục tiêu, trọng số' },
    { key: 'dms', title: 'Tài liệu & lưu trữ', desc: 'SharePoint/Workspace, retention' },
    { key: 'templates', title: 'Mẫu & checklist', desc: 'Submittal/PO/Contract, bằng chứng' },
    { key: 'users', title: 'Người dùng & mời vào', desc: 'Gán vai trò, import CSV, SSO' },
    { key: 'review', title: 'Tổng kết & áp dụng', desc: 'Sinh cấu hình & vào dashboard' },
  ]), []);

  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // ------------ State for each step ------------
  const [company, setCompany] = useState({ name: '', legal: '', domain: '', tz: 'Asia/Ho_Chi_Minh', fiscalStart: '01', });
  const [currency, setCurrency] = useState({ base: 'VND', list: ['VND','USD'], vat: 8, taxId: '' });
  const [org, setOrg] = useState({ depts: [ { name: 'Design', code: 'DES', manager: 'Lan' }, { name: 'Construction', code: 'CON', manager: 'Minh' } ] });
  const [roles, setRoles] = useState([
    { role: 'CEO', caps: { EditBudget: true, FinalApprove: true, Delegate: true }, limit: 1000000000 },
    { role: 'Middle Manager', caps: { EditBudget: false, FinalApprove: false, Delegate: false }, limit: 50000000 },
    { role: 'Executive', caps: { EditBudget: false, FinalApprove: false, Delegate: false }, limit: 5000000 },
    { role: 'Doer', caps: { EditBudget: false, FinalApprove: false, Delegate: false }, limit: 0 },
    { role: 'Intern', caps: { EditBudget: false, FinalApprove: false, Delegate: false }, limit: 0 },
    { role: 'External', caps: { EditBudget: false, FinalApprove: false, Delegate: false }, limit: 0 },
  ]);
  const [approval, setApproval] = useState({ budgetCEO: 200000000, poCEO: 150000000, contractCEO: 300000000, bulkPolicy: true, slaDays: 3 });
  const [kpi, setKPI] = useState({ period: 'Q3 2025', items: [ { name: 'Quality', target: 95, weight: 30 }, { name: 'Schedule', target: 92, weight: 30 }, { name: 'Safety', target: 97, weight: 20 }, { name: 'Cost', target: 90, weight: 20 } ] });
  const [dms, setDMS] = useState({ sharepoint: '', retention: { Contract: 1825, Submittal: 730, Timesheet: 365 } });
  const [templates, setTemplates] = useState({ submittal: ['Form ký','Bản vẽ','Spec'], po: ['Đề nghị','Báo giá'], contract: ['Hợp đồng','Phụ lục','Bảo lãnh'] });
  const [users, setUsers] = useState({ invites: '', defaultRole: 'Executive', sso: true });

  const canNext = useMemo(() => {
    switch (steps[active].key) {
      case 'company': return company.name && company.domain && company.legal;
      case 'currency': return !!currency.base && currency.vat >= 0 && currency.vat <= 20;
      case 'org': return org.depts.length > 0 && org.depts.every(d => d.name && d.code);
      case 'roles': return roles.length > 0;
      case 'approval': return approval.slaDays > 0;
      case 'kpi': return kpi.items.length > 0 && kpi.items.every(i => i.target>0 && i.weight>=0) && kpi.items.reduce((s,i)=>s+i.weight,0)===100;
      case 'dms': return true; // optional at start
      case 'templates': return true;
      case 'users': return true;
      case 'review': return true;
      default: return true;
    }
  }, [active, company, currency, org, roles, approval, kpi, dms, templates, users, steps]);

  function next(){ if (active < steps.length - 1) setActive(active + 1); }
  function back(){ if (active > 0) setActive(active - 1); }

  function applyAll(){
    setLoading(true); setMsg(null);
    setTimeout(() => {
      setLoading(false);
      setMsg('Đã áp dụng cấu hình khởi tạo. Điều hướng sang CEO Dashboard…');
      // navigate('/dashboard') in real app
      alert('Setup applied (mock). Ready to go to dashboard.');
    }, 800);
  }

  function useDefaults(){
    setCompany({ name: 'Your Company', legal: 'Your Company JSC', domain: 'yourco.com', tz: 'Asia/Ho_Chi_Minh', fiscalStart: '01' });
    setCurrency({ base: 'VND', list: ['VND','USD'], vat: 8, taxId: '0123456789' });
    setOrg({ depts: [ { name: 'Head Office', code: 'HO', manager: 'CEO' }, { name: 'Finance', code: 'FIN', manager: 'Huy' } ] });
    setMsg('Đã nạp cấu hình mặc định tối thiểu.');
  }

  // ---------- Render per step ----------
  const currentKey = steps[active].key;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-indigo-600" />
            <h1 className="font-semibold">Thiết lập hệ thống ban đầu (CEO)</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={useDefaults} className="h-8 px-3 rounded-lg border text-xs hover:bg-gray-50">Dùng mặc định</button>
            <button className="h-8 px-3 rounded-lg border text-xs hover:bg-gray-50">Trợ giúp</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
        {/* Stepper */}
        <aside>
          <Stepper steps={steps} active={active} onJump={setActive} />
        </aside>

        {/* Step content */}
        <div className="space-y-6">
          {msg && <div className="p-3 text-xs rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">{msg}</div>}

          {currentKey === 'company' && (
            <Section title="1) Công ty & kỳ tài chính" subtitle="Tên pháp lý, domain, múi giờ, kỳ kế toán">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tên công ty"><Input value={company.name} onChange={e=>setCompany({...company, name: e.target.value})} placeholder="VD: ABC Holdings"/></Field>
                <Field label="Tên pháp lý"><Input value={company.legal} onChange={e=>setCompany({...company, legal: e.target.value})} placeholder="VD: ABC Holdings JSC"/></Field>
                <Field label="Domain email"><Input value={company.domain} onChange={e=>setCompany({...company, domain: e.target.value})} placeholder="yourco.com"/></Field>
                <Field label="Múi giờ (TZ)"><Select value={company.tz} onChange={e=>setCompany({...company, tz: e.target.value})}><option>Asia/Ho_Chi_Minh</option><option>Asia/Bangkok</option><option>UTC</option></Select></Field>
                <Field label="Bắt đầu năm tài chính (tháng)"><Select value={company.fiscalStart} onChange={e=>setCompany({...company, fiscalStart: e.target.value})}>{Array.from({length:12},(_,i)=>(<option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>))}</Select></Field>
              </div>
            </Section>
          )}

          {currentKey === 'currency' && (
            <Section title="2) Tiền tệ & Thuế" subtitle="Đồng tiền gốc, VAT, mã số thuế">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Đồng tiền gốc"><Select value={currency.base} onChange={e=>setCurrency({...currency, base:e.target.value})}><option>VND</option><option>USD</option><option>EUR</option></Select></Field>
                <Field label="VAT (%)"><Input type="number" value={currency.vat} onChange={e=>setCurrency({...currency, vat:Number(e.target.value)})}/></Field>
                <Field label="Mã số thuế"><Input value={currency.taxId} onChange={e=>setCurrency({...currency, taxId:e.target.value})} placeholder="0123456789"/></Field>
                <Field label="Danh sách tiền tệ cho phép" hint="VD: VND, USD"><Input value={currency.list.join(', ')} onChange={e=>setCurrency({...currency, list:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/></Field>
              </div>
            </Section>
          )}

          {currentKey === 'org' && (
            <Section title="3) Khởi tạo sơ đồ tổ chức" subtitle="Tạo các phòng ban cấp 1, manager & cost center">
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên phòng ban</th>
                      <th className="px-3 py-2 text-left">Mã</th>
                      <th className="px-3 py-2 text-left">Manager</th>
                      <th className="px-3 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {org.depts.map((d,idx)=> (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2"><Input value={d.name} onChange={e=>{ const cp=[...org.depts]; cp[idx].name=e.target.value; setOrg({depts:cp}); }}/></td>
                        <td className="px-3 py-2"><Input value={d.code} onChange={e=>{ const cp=[...org.depts]; cp[idx].code=e.target.value; setOrg({depts:cp}); }}/></td>
                        <td className="px-3 py-2"><Input value={d.manager} onChange={e=>{ const cp=[...org.depts]; cp[idx].manager=e.target.value; setOrg({depts:cp}); }}/></td>
                        <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setOrg({depts: org.depts.filter((_,i)=>i!==idx)})}>Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setOrg({depts:[...org.depts, { name:'New Dept', code:'NEW', manager:'' }]})}>+ Thêm phòng ban</button>
                <div className="text-xs text-gray-500">Có thể chỉnh sửa chi tiết trong Org Setup sau khi hoàn tất.</div>
              </div>
            </Section>
          )}

          {currentKey === 'roles' && (
            <Section title="4) Vai trò & uỷ quyền" subtitle="Thiết lập role catalogue & hạn mức ban đầu">
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600"><tr><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2">EditBudget</th><th className="px-3 py-2">FinalApprove</th><th className="px-3 py-2">Delegate</th><th className="px-3 py-2">Hạn mức</th><th className="px-3 py-2 w-20"></th></tr></thead>
                  <tbody>
                    {roles.map((r,idx)=> (
                      <tr key={r.role} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.role}</td>
                        <td className="px-3 py-2 text-center"><Toggle checked={r.caps.EditBudget} onChange={v=>{ const cp=[...roles]; cp[idx].caps.EditBudget=v; setRoles(cp); }} /></td>
                        <td className="px-3 py-2 text-center"><Toggle checked={r.caps.FinalApprove} onChange={v=>{ const cp=[...roles]; cp[idx].caps.FinalApprove=v; setRoles(cp); }} /></td>
                        <td className="px-3 py-2 text-center"><Toggle checked={r.caps.Delegate} onChange={v=>{ const cp=[...roles]; cp[idx].caps.Delegate=v; setRoles(cp); }} /></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={r.limit} onChange={e=>{ const cp=[...roles]; cp[idx].limit=Number(e.target.value); setRoles(cp); }}/></td>
                        <td className="px-3 py-2 text-right">{r.role!=='CEO' && <button className="text-xs text-rose-600" onClick={()=>setRoles(roles.filter((_,i)=>i!==idx))}>Xoá</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setRoles([...roles, { role:'Custom', caps:{EditBudget:false,FinalApprove:false,Delegate:false}, limit:0 }])}>+ Thêm role</button>
                <div className="text-xs text-gray-500">Chi tiết phân quyền nâng cao có thể thiết lập trong Delegation Matrix.</div>
              </div>
            </Section>
          )}

          {currentKey === 'approval' && (
            <Section title="5) Luồng duyệt & ngưỡng" subtitle="Quy định ai duyệt ở mức nào; SLA & bulk approve policy">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ngưỡng Budget cần CEO (VND)"><Input type="number" value={approval.budgetCEO} onChange={e=>setApproval({...approval,budgetCEO:Number(e.target.value)})}/></Field>
                <Field label="Ngưỡng PO cần CEO (VND)"><Input type="number" value={approval.poCEO} onChange={e=>setApproval({...approval,poCEO:Number(e.target.value)})}/></Field>
                <Field label="Ngưỡng Contract cần CEO (VND)"><Input type="number" value={approval.contractCEO} onChange={e=>setApproval({...approval,contractCEO:Number(e.target.value)})}/></Field>
                <Field label="SLA duyệt (ngày)"><Input type="number" value={approval.slaDays} onChange={e=>setApproval({...approval,slaDays:Number(e.target.value)})}/></Field>
                <div className="col-span-full flex items-center gap-2 text-sm">
                  <Toggle checked={approval.bulkPolicy} onChange={v=>setApproval({...approval, bulkPolicy:v})} />
                  <span>Bật policy duyệt hàng loạt (low‑risk) theo rule</span>
                </div>
              </div>
            </Section>
          )}

          {currentKey === 'kpi' && (
            <Section title="6) Bộ KPI/OKR & kỳ" subtitle="Tạo danh mục KPI với mục tiêu (%) và trọng số (tổng 100)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Kỳ đánh giá"><Select value={kpi.period} onChange={e=>setKPI({...kpi, period:e.target.value})}><option>Q3 2025</option><option>Q4 2025</option><option>YTD 2025</option></Select></Field>
                <div className="flex items-end justify-end"><button className="h-10 px-3 rounded-lg border text-xs" onClick={()=>setKPI({...kpi, items:[...kpi.items, { name:'New KPI', target:90, weight:0 }]})}>+ Thêm KPI</button></div>
              </div>
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600"><tr><th className="px-3 py-2 text-left">Tên KPI</th><th className="px-3 py-2">Mục tiêu (%)</th><th className="px-3 py-2">Trọng số</th><th className="px-3 py-2 w-20"></th></tr></thead>
                  <tbody>
                    {kpi.items.map((it,idx)=> (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2"><Input value={it.name} onChange={e=>{ const cp=[...kpi.items]; cp[idx].name=e.target.value; setKPI({...kpi, items:cp}); }}/></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.target} onChange={e=>{ const cp=[...kpi.items]; cp[idx].target=Number(e.target.value); setKPI({...kpi, items:cp}); }}/></td>
                        <td className="px-3 py-2 text-center"><Input type="number" value={it.weight} onChange={e=>{ const cp=[...kpi.items]; cp[idx].weight=Number(e.target.value); setKPI({...kpi, items:cp}); }}/></td>
                        <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setKPI({...kpi, items:kpi.items.filter((_,i)=>i!==idx)})}>Xoá</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-500">Tổng trọng số hiện tại: {kpi.items.reduce((s,i)=>s+i.weight,0)} (yêu cầu = 100)</div>
            </Section>
          )}

          {currentKey === 'dms' && (
            <Section title="7) Tài liệu & lưu trữ" subtitle="Khai báo SharePoint/Workspace và chính sách lưu trữ (ngày)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SharePoint/Workspace URL"><Input value={dms.sharepoint} onChange={e=>setDMS({...dms, sharepoint:e.target.value})} placeholder="https://share.yourco.com/sites/erp"/></Field>
                <div />
                {Object.entries(dms.retention).map(([k,v]) => (
                  <Field key={k} label={`Retention – ${k} (ngày)`}><Input type="number" value={v} onChange={e=>setDMS({...dms, retention:{...dms.retention, [k]: Number(e.target.value)}})} /></Field>
                ))}
              </div>
            </Section>
          )}

          {currentKey === 'templates' && (
            <Section title="8) Mẫu & checklist" subtitle="Đặt checklist tối thiểu cho hồ sơ chính (có thể sửa sau)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-2">Submittal</div>
                  <ul className="text-sm space-y-1">{templates.submittal.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTemplates({...templates, submittal:[...templates.submittal, 'Mẫu mới']})}>+ Thêm</button>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-2">PO</div>
                  <ul className="text-sm space-y-1">{templates.po.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTemplates({...templates, po:[...templates.po, 'Mẫu mới']})}>+ Thêm</button>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-2">Contract</div>
                  <ul className="text-sm space-y-1">{templates.contract.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                  <button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTemplates({...templates, contract:[...templates.contract, 'Mẫu mới']})}>+ Thêm</button>
                </div>
              </div>
            </Section>
          )}

          {currentKey === 'users' && (
            <Section title="9) Người dùng & mời vào" subtitle="Nhập email (phân cách bằng dấu phẩy) hoặc import CSV; gán role mặc định">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Danh sách email mời (csv)" hint="VD: ceo@yourco.com, manager@yourco.com">
                  <textarea className="w-full h-32 border rounded-lg p-2 text-sm" value={users.invites} onChange={e=>setUsers({...users, invites:e.target.value})} placeholder="user1@yourco.com, user2@yourco.com" />
                </Field>
                <div className="grid gap-4 content-start">
                  <Field label="Role mặc định">
                    <Select value={users.defaultRole} onChange={e=>setUsers({...users, defaultRole:e.target.value})}>
                      {roles.map(r=> <option key={r.role}>{r.role}</option>)}
                    </Select>
                  </Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={users.sso} onChange={e=>setUsers({...users, sso:e.target.checked})}/> Yêu cầu đăng nhập SSO</label>
                  <button className="h-10 rounded-lg border text-xs">Tải mẫu CSV</button>
                </div>
              </div>
            </Section>
          )}

          {currentKey === 'review' && (
            <Section title="10) Tổng kết & áp dụng" subtitle="Kiểm tra nhanh các thông số trước khi áp dụng">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Company</div>
                  <div className="text-xs text-gray-600">{company.legal} • {company.domain} • TZ: {company.tz} • Fiscal start: Tháng {company.fiscalStart}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Currency/Tax</div>
                  <div className="text-xs text-gray-600">Base: {currency.base} • VAT: {currency.vat}% • TaxId: {currency.taxId}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Org</div>
                  <div className="text-xs text-gray-600">{org.depts.map(d=>d.name).join(', ')}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Roles/Delegation</div>
                  <div className="text-xs text-gray-600">{roles.length} roles • CEO limit {money(roles.find(r=>r.role==='CEO')?.limit||0)}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Approvals</div>
                  <div className="text-xs text-gray-600">Budget≥{money(approval.budgetCEO)} • PO≥{money(approval.poCEO)} • Contract≥{money(approval.contractCEO)} • SLA {approval.slaDays}d</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">KPI</div>
                  <div className="text-xs text-gray-600">{kpi.period} • {kpi.items.length} KPIs • total weight {kpi.items.reduce((s,i)=>s+i.weight,0)}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">DMS</div>
                  <div className="text-xs text-gray-600">{dms.sharepoint || '—'} • Retention: {Object.entries(dms.retention).map(([k,v])=>`${k}:${v}d`).join(' | ')}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-1">Templates</div>
                  <div className="text-xs text-gray-600">Submittal {templates.submittal.length} • PO {templates.po.length} • Contract {templates.contract.length}</div>
                </div>
                <div className="border rounded-xl p-3 md:col-span-2">
                  <div className="text-sm font-semibold mb-1">Users</div>
                  <div className="text-xs text-gray-600">Default: {users.defaultRole} • SSO: {users.sso? 'On':'Off'} • Invites: {users.invites? users.invites.split(',').length: 0}</div>
                </div>
              </div>
            </Section>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between">
            <button onClick={back} className="h-10 px-4 rounded-lg border text-sm disabled:opacity-50" disabled={active===0}>← Quay lại</button>
            {active < steps.length - 1 ? (
              <button onClick={next} disabled={!canNext} className={cx("h-10 px-5 rounded-lg text-sm text-white", canNext ? "bg-slate-900 hover:bg-black" : "bg-slate-400")}>Tiếp tục →</button>
            ) : (
              <button onClick={applyAll} disabled={loading} className={cx("h-10 px-5 rounded-lg text-sm text-white", loading?"bg-slate-400":"bg-emerald-600 hover:bg-emerald-700")}>{loading? 'Đang áp dụng…' : 'Áp dụng & vào Dashboard'}</button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
    </div>
  );
}
