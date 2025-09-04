import React, { useMemo, useState } from "react";

function cx(...c){return c.filter(Boolean).join(" ");}
function money(n){return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0)}
function Badge({tone='gray', children}){const map={gray:'bg-gray-100 text-gray-700 border-gray-200',green:'bg-emerald-100 text-emerald-700 border-emerald-200',amber:'bg-amber-100 text-amber-700 border-amber-200',rose:'bg-rose-100 text-rose-700 border-rose-200',indigo:'bg-indigo-100 text-indigo-700 border-indigo-200'};return <span className={cx('px-2 py-0.5 rounded-full text-xs border',map[tone])}>{children}</span>}
function Toggle({on,onChange}){return(<button onClick={()=>onChange(!on)} className={cx('h-6 w-11 rounded-full transition flex items-center p-0.5',on?'bg-indigo-600':'bg-gray-300')} aria-pressed={on}><span className={cx('h-5 w-5 bg-white rounded-full shadow transform transition',on?'translate-x-5':'translate-x-0')} /></button>)}
function Card({title, subtitle, actions, children}){return(<section className="flex flex-col p-4 border border-gray-200 shadow-sm bg-white/95 backdrop-blur rounded-2xl"><header className="flex items-center justify-between gap-3 mb-3"><div><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle&&<p className="text-xs text-gray-500">{subtitle}</p>}</div><div className="flex items-center gap-2">{actions}</div></header><div className="min-h-[180px] grow">{children}</div></section>)}
function Field({label,children,hint}){return(<label className="block text-sm"><span className="font-medium text-gray-700">{label}</span>{hint&&<span className="ml-2 text-xs text-gray-400">{hint}</span>}<div className="mt-1">{children}</div></label>)}
function Input(props){return <input {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)} />}
function Select({children,...props}){return <select {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)}>{children}</select>}

const SECTIONS=["Home","Org","Departments","IAM","Approvals","KPI/OKR","Templates","Users","DMS"];

export default function ERPAppShell(){
  const [section,setSection]=useState("Home");
  const [period,setPeriod]=useState("Q3 2025");
  const [company,setCompany]=useState("COA");

  const [group,setGroup]=useState({name:"Your Group", code:"YG", tz:"Asia/Ho_Chi_Minh"});
  const [companies,setCompanies]=useState([{name:"Company A",code:"COA", fiscalStart:"01", base:"VND", vat:8, taxId:"", branches:[{name:"HCM Branch",code:"HCM"}], sites:[{name:"Site 1",code:"S1"}]},{name:"Company B",code:"COB", fiscalStart:"01", base:"VND", vat:8, taxId:"", branches:[], sites:[]}] );

  const [depts,setDepts]=useState([{name:"Finance", code:"FIN", shared:true, companies:[]},{name:"Procurement", code:"PRC", shared:false, companies:["COA"]},{name:"Design", code:"DES", shared:false, companies:["COA","COB"]}]);

  const [capabilities,setCapabilities]=useState(["EditBudget","FinalApprove","Delegate"]);
  const [roles,setRoles]=useState([{role:"CEO", limit:1_000_000_000, caps:{EditBudget:true,FinalApprove:true,Delegate:true}},{role:"Middle Manager", limit:50_000_000, caps:{EditBudget:false,FinalApprove:false,Delegate:false}},{role:"Executive", limit:5_000_000, caps:{EditBudget:false,FinalApprove:false,Delegate:false}}]);
  const [newCap,setNewCap]=useState("");

  const [approval,setApproval]=useState([{company:"COA", budgetCEO:200_000_000, poCEO:150_000_000, contractCEO:300_000_000, slaDays:3, bulkPolicy:true},{company:"COB", budgetCEO:150_000_000, poCEO:120_000_000, contractCEO:250_000_000, slaDays:3, bulkPolicy:false}]);

  const [kpi,setKPI]=useState({period:"Q3 2025", scope:"Company", appliesTo:"COA", scoring:"linear", items:[{name:"Quality",unit:"%",direction:"maximize",source:"manual",weight:30,target:95},{name:"Schedule",unit:"%",direction:"maximize",source:"dataset",formula:"AVG(Milestone.on_time_rate)",weight:30,target:92},{name:"Safety",unit:"#",direction:"minimize",source:"dataset",formula:"COUNT(Incidents)",weight:20,target:0,floor:0,cap:2},{name:"Cost",unit:"VND",direction:"minimize",source:"formula",formula:"ActualCost/Budget*100",weight:20,target:100,baseline:100,floor:90,cap:120}]});

  const [tpl,setTpl]=useState({linkMode:true, submittal:['Form ký','Bản vẽ','Spec'], po:['Đề nghị','Báo giá'], contract:['Hợp đồng','Phụ lục','Bảo lãnh']});
  const [users,setUsers]=useState([{email:"ceo@yourco.com", role:"CEO", sso:true},{email:"manager@yourco.com", role:"Middle Manager", sso:true}]);
  const [invites,setInvites]=useState("");
  const [dms,setDMS]=useState({workspace:"", retention:{Contract:1825, Submittal:730, Timesheet:365}});

  const companyCodes=companies.map(c=>c.code);

  function Shell({children}){
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl">
            <div className="flex items-center gap-2"><div className="bg-indigo-600 size-8 rounded-xl" /><h1 className="font-semibold">ERP</h1></div>
            <div className="flex items-center gap-2 ml-auto">
              <Select value={company} onChange={e=>setCompany(e.target.value)}>{companyCodes.map(c=><option key={c}>{c}</option>)}</Select>
              <Select value={period} onChange={e=>setPeriod(e.target.value)}><option>Q3 2025</option><option>Q4 2025</option><option>YTD 2025</option></Select>
              <input placeholder="Search (⌘K)" className="w-48 px-3 text-sm border rounded-lg h-9" />
              <button className="px-3 text-xs border rounded-lg h-9">Notifications</button>
              <div className="rounded-full size-8 bg-slate-200" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
          <aside className="lg:sticky lg:top-[64px] lg:self-start">
            <nav className="p-3 space-y-1 border bg-white/95 rounded-2xl">
              {SECTIONS.map(s=> (
                <button key={s} onClick={()=>setSection(s)} className={cx('w-full text-left px-3 py-2 rounded-lg text-sm', section===s?'bg-slate-900 text-white':'hover:bg-gray-50')}>{s}</button>
              ))}
            </nav>
          </aside>
          <div>{children}</div>
        </main>
        <footer className="py-6 text-xs text-center text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
      </div>
    )
  }

  function Home(){
    const completed = {
      org: depts.length>0,
      iam: roles.length>0 && capabilities.length>0,
      approvals: approval.length===companies.length,
      kpi: kpi.items.reduce((s,i)=>s+i.weight,0)===100,
      templates: tpl.submittal.length>0 && tpl.po.length>0 && tpl.contract.length>0,
      users: users.length>0,
      dms: !!dms.workspace
    };
    const doneCount = Object.values(completed).filter(Boolean).length;
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Next actions" subtitle="Hoàn thiện các cấu hình chính" actions={<Badge tone={doneCount===7?'green':'amber'}>{doneCount}/7</Badge>}>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between"><span>Org & Departments</span><button onClick={()=>setSection('Org')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>IAM & Roles</span><button onClick={()=>setSection('IAM')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>Approval thresholds</span><button onClick={()=>setSection('Approvals')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>KPI/OKR Designer</span><button onClick={()=>setSection('KPI/OKR')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>Templates Library</span><button onClick={()=>setSection('Templates')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>Users & Invites</span><button onClick={()=>setSection('Users')} className="text-xs text-indigo-600">Open</button></li>
            <li className="flex items-center justify-between"><span>DMS / Retention</span><button onClick={()=>setSection('DMS')} className="text-xs text-indigo-600">Open</button></li>
          </ul>
        </Card>
        <Card title="Approvals inbox" subtitle="Tổng hợp" actions={<button className="px-2.5 py-1 text-xs border rounded-lg">View all</button>}>
          <div className="border divide-y rounded-lg">
            {[{id:'AP-1034',mod:'Contract',title:'HĐ – Vendor X',amt:180_000_000,risk:'med'},{id:'AP-1040',mod:'PO',title:'PO – Batch #45',amt:90_000_000,risk:'low'}].map(a=> (
              <div key={a.id} className="flex items-center gap-3 p-3">
                <div className="w-20 text-xs text-gray-500">{a.mod}</div>
                <div className="flex-1"><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-gray-500">{a.id} • {money(a.amt)}</div></div>
                <Badge tone={a.risk==='high'?'rose':a.risk==='med'?'amber':'green'}>{a.risk.toUpperCase()}</Badge>
                <div className="flex items-center gap-2"><button className="px-2 py-1 text-xs border rounded-lg">Preview</button><button className="px-2 py-1 text-xs text-white rounded-lg bg-emerald-600">Approve</button></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="KPI snapshot" subtitle={period} actions={<Badge tone="indigo">{company}</Badge>}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {kpi.items.slice(0,4).map((it,i)=>{
              const target=it.target; const actual=it.direction==='minimize'?Math.max(0,target-(i*5)):Math.min(120,target-5+i*4); const score = it.direction==='maximize'? Math.min(100, Math.max(0, (actual/target)*100)) : Math.min(100, Math.max(0, (target/(actual||1))*100));
              return (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">{it.name}</div>
                  <div className="text-lg font-semibold">{it.unit==='%'? `${actual}%`: it.unit==='#'? actual: money(actual)}</div>
                  <div className="text-xs text-gray-500">Score {Math.round(score)} • Weight {it.weight}%</div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card title="System status" subtitle="Configuration coverage">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 border rounded-2xl bg-slate-50"><div className="text-lg font-semibold">{companies.length}</div><div className="text-xs text-slate-500">Companies</div></div>
            <div className="p-4 border rounded-2xl bg-slate-50"><div className="text-lg font-semibold">{depts.length}</div><div className="text-xs text-slate-500">Departments</div></div>
            <div className="p-4 border rounded-2xl bg-slate-50"><div className="text-lg font-semibold">{roles.length}</div><div className="text-xs text-slate-500">Roles</div></div>
          </div>
        </Card>
      </div>
    )
  }

  function Org(){
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Group → Company → Branch/Site" subtitle="Cấu trúc tổ chức" actions={<button className="px-2.5 py-1 text-xs border rounded-lg">Add company</button>}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500">Group</div>
              <div className="font-medium">{group.name} ({group.code})</div>
              <div className="text-xs text-gray-500">TZ {group.tz}</div>
            </div>
            {companies.map((c)=> (
              <div key={c.code} className="p-3 border rounded-lg">
                <div className="text-xs text-gray-500">Company</div>
                <div className="font-medium">{c.name} ({c.code})</div>
                <div className="text-xs text-gray-500">FY {c.fiscalStart} • {c.base} • VAT {c.vat}%</div>
                <div className="mt-2 text-xs text-gray-500">Branches</div>
                <ul className="pl-5 text-sm list-disc">{c.branches.map((b,i)=>(<li key={i}>{b.name} ({b.code})</li>))}</ul>
                <div className="mt-2 text-xs text-gray-500">Sites</div>
                <ul className="pl-5 text-sm list-disc">{c.sites.map((s,i)=>(<li key={i}>{s.name} ({s.code})</li>))}</ul>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Company switch" subtitle="Ảnh hưởng bộ lọc toàn hệ thống" actions={<Badge tone="indigo">{company}</Badge>}>
          <div className="max-w-xs"><Select value={company} onChange={e=>setCompany(e.target.value)}>{companyCodes.map(c=><option key={c}>{c}</option>)}</Select></div>
        </Card>
      </div>
    )
  }

  function Departments(){
    return (
      <div className="space-y-4">
        <Card title="Department sharing" subtitle="Shared toàn Group hoặc riêng theo công ty">
          <div className="overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Department</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Shared</th>{companyCodes.map(c=> <th key={c} className="px-3 py-2">{c}</th>)}</tr></thead>
              <tbody>
                {depts.map((d,idx)=> (
                  <tr key={d.code} className="border-t">
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2">{d.code}</td>
                    <td className="px-3 py-2 text-center"><Toggle on={d.shared} onChange={v=>{const cp=[...depts]; cp[idx].shared=v; if(v) cp[idx].companies=[]; setDepts(cp);}} /></td>
                    {companyCodes.map(cc=> (
                      <td key={cc} className="px-3 py-2 text-center">
                        <input type="checkbox" disabled={d.shared} checked={d.shared || d.companies.includes(cc)} onChange={e=>{const cp=[...depts]; const list=new Set(cp[idx].companies); if(e.target.checked) list.add(cc); else list.delete(cc); cp[idx].companies=Array.from(list); setDepts(cp);}} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  function IAM(){
    return (
      <div className="space-y-4">
        <Card title="Capabilities" subtitle="Thêm hành động ở headrow">
          <div className="flex items-end max-w-md gap-2">
            <Field label="Capability"><Input value={newCap} onChange={e=>setNewCap(e.target.value)} placeholder="CapabilityKey" /></Field>
            <button className="px-3 text-xs border rounded-lg h-9" onClick={()=>{const k=(newCap||'').trim().replace(/\s+/g,''); if(!k) return; if(!capabilities.includes(k)){setCapabilities([...capabilities,k]); setRoles(roles.map(r=>({...r, caps:{...r.caps,[k]:false}})));} setNewCap('');}}>Add</button>
          </div>
        </Card>
        <Card title="Roles × Capabilities" subtitle="Bật/tắt theo role; đặt hạn mức">
          <div className="overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Role</th>{capabilities.map(c=> <th key={c} className="px-3 py-2">{c}</th>)}<th className="px-3 py-2">Limit</th></tr></thead>
              <tbody>
                {roles.map((r,idx)=> (
                  <tr key={r.role} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.role}</td>
                    {capabilities.map(c=> (<td key={c} className="px-3 py-2 text-center"><Toggle on={!!r.caps[c]} onChange={v=>{const cp=[...roles]; cp[idx].caps[c]=v; setRoles(cp);}} /></td>))}
                    <td className="px-3 py-2 text-center"><Input type="number" value={r.limit} onChange={e=>{const cp=[...roles]; cp[idx].limit=Number(e.target.value); setRoles(cp);}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  function Approvals(){
    return (
      <div className="space-y-4">
        <Card title="Approval thresholds per company" subtitle="Budget/PO/Contract; SLA; bulk policy">
          <div className="overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Company</th><th className="px-3 py-2">Budget ≥ CEO</th><th className="px-3 py-2">PO ≥ CEO</th><th className="px-3 py-2">Contract ≥ CEO</th><th className="px-3 py-2">SLA (days)</th><th className="px-3 py-2">Bulk</th></tr></thead>
              <tbody>
                {approval.map((a,idx)=> (
                  <tr key={a.company} className="border-t">
                    <td className="px-3 py-2 font-medium">{a.company}</td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={a.budgetCEO} onChange={e=>{const cp=[...approval]; cp[idx].budgetCEO=Number(e.target.value); setApproval(cp);}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={a.poCEO} onChange={e=>{const cp=[...approval]; cp[idx].poCEO=Number(e.target.value); setApproval(cp);}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={a.contractCEO} onChange={e=>{const cp=[...approval]; cp[idx].contractCEO=Number(e.target.value); setApproval(cp);}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={a.slaDays} onChange={e=>{const cp=[...approval]; cp[idx].slaDays=Number(e.target.value); setApproval(cp);}} /></td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" checked={a.bulkPolicy} onChange={e=>{const cp=[...approval]; cp[idx].bulkPolicy=e.target.checked; setApproval(cp);}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  function KPI(){
    const totalWeight = kpi.items.reduce((s,i)=>s+i.weight,0);
    return (
      <div className="space-y-4">
        <Card title="Designer" subtitle="Định nghĩa KPI và mô hình chấm điểm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Period"><Select value={kpi.period} onChange={e=>setKPI({...kpi, period:e.target.value})}><option>Q3 2025</option><option>Q4 2025</option><option>YTD 2025</option></Select></Field>
            <Field label="Scope"><Select value={kpi.scope} onChange={e=>setKPI({...kpi, scope:e.target.value})}><option>Group</option><option>Company</option><option>Dept</option><option>Project</option></Select></Field>
            <Field label="Apply to (ID)"><Input value={kpi.appliesTo} onChange={e=>setKPI({...kpi, appliesTo:e.target.value})} placeholder="VD: COA / FIN / Proj-001" /></Field>
            <Field label="Scoring model"><Select value={kpi.scoring} onChange={e=>setKPI({...kpi, scoring:e.target.value})}><option value="linear">Linear</option><option value="threshold">Threshold</option><option value="banded">Banded</option></Select></Field>
          </div>
          <div className="mt-3 overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Direction</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Formula/Dataset</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Weight</th><th className="px-3 py-2">Floor</th><th className="px-3 py-2">Cap</th><th className="w-10 px-3 py-2"></th></tr></thead>
              <tbody>
                {kpi.items.map((it,idx)=> (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2"><Input value={it.name} onChange={e=>{const cp=[...kpi.items]; cp[idx].name=e.target.value; setKPI({...kpi, items:cp})}} /></td>
                    <td className="px-3 py-2"><Select value={it.unit} onChange={e=>{const cp=[...kpi.items]; cp[idx].unit=e.target.value; setKPI({...kpi, items:cp})}}><option>%</option><option>VND</option><option>hrs</option><option>#</option></Select></td>
                    <td className="px-3 py-2"><Select value={it.direction} onChange={e=>{const cp=[...kpi.items]; cp[idx].direction=e.target.value; setKPI({...kpi, items:cp})}}><option>maximize</option><option>minimize</option></Select></td>
                    <td className="px-3 py-2"><Select value={it.source} onChange={e=>{const cp=[...kpi.items]; cp[idx].source=e.target.value; setKPI({...kpi, items:cp})}}><option>manual</option><option>formula</option><option>dataset</option></Select></td>
                    <td className="px-3 py-2"><Input value={it.formula||''} onChange={e=>{const cp=[...kpi.items]; cp[idx].formula=e.target.value; setKPI({...kpi, items:cp})}} placeholder="SUM(hours)/Plan*100" /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={it.target} onChange={e=>{const cp=[...kpi.items]; cp[idx].target=Number(e.target.value); setKPI({...kpi, items:cp})}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={it.weight} onChange={e=>{const cp=[...kpi.items]; cp[idx].weight=Number(e.target.value); setKPI({...kpi, items:cp})}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={it.floor??''} onChange={e=>{const cp=[...kpi.items]; cp[idx].floor=Number(e.target.value)||undefined; setKPI({...kpi, items:cp})}} /></td>
                    <td className="px-3 py-2 text-center"><Input type="number" value={it.cap??''} onChange={e=>{const cp=[...kpi.items]; cp[idx].cap=Number(e.target.value)||undefined; setKPI({...kpi, items:cp})}} /></td>
                    <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>setKPI({...kpi, items:kpi.items.filter((_,i)=>i!==idx)})}>Del</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-2"><button className="text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setKPI({...kpi, items:[...kpi.items,{name:'New KPI',unit:'%',direction:'maximize',source:'manual',weight:0,target:100}]})}>+ Add KPI</button><div className="text-xs text-gray-500">Total weight {totalWeight} / 100</div></div>
        </Card>
        <Card title="Apply & simulate" subtitle="Áp vào entity và tính thử">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Entity"><Input value={kpi.appliesTo} onChange={e=>setKPI({...kpi, appliesTo:e.target.value})} /></Field>
            <Field label="Scope"><Select value={kpi.scope} onChange={e=>setKPI({...kpi, scope:e.target.value})}><option>Group</option><option>Company</option><option>Dept</option><option>Project</option></Select></Field>
            <Field label="Period"><Select value={kpi.period} onChange={e=>setKPI({...kpi, period:e.target.value})}><option>Q3 2025</option><option>Q4 2025</option><option>YTD 2025</option></Select></Field>
          </div>
          <div className="mt-3 overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">KPI</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Actual</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Weighted</th></tr></thead>
              <tbody>
                {kpi.items.map((it,idx)=>{
                  const actual = it.direction==='minimize'? Math.max(0, (it.target||1) - (idx+1)*2) : Math.max(1, (it.target||1) - 5 + idx*3);
                  const score = it.direction==='maximize'? Math.min(100, Math.max(0, (actual/(it.target||1))*100)) : Math.min(100, Math.max(0, ((it.target||1)/(actual||1))*100));
                  const weighted = score * (it.weight/100);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2 text-center">{it.unit==='%'? `${it.target}%` : it.unit==='VND'? money(it.target) : it.target}</td>
                      <td className="px-3 py-2 text-center">{it.unit==='%'? `${Math.round(actual)}%` : it.unit==='VND'? money(actual) : Math.round(actual)}</td>
                      <td className="px-3 py-2 text-center">{Math.round(score)}</td>
                      <td className="px-3 py-2 text-center">{Math.round(weighted)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  function Templates(){
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Mode" subtitle="Link vs Clone">
          <div className="flex items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="radio" name="tplmode" checked={tpl.linkMode} onChange={()=>setTpl({...tpl, linkMode:true})}/> Link</label><label className="flex items-center gap-2"><input type="radio" name="tplmode" checked={!tpl.linkMode} onChange={()=>setTpl({...tpl, linkMode:false})}/> Clone</label></div>
        </Card>
        <Card title="Submittal" subtitle="Library"><ul className="space-y-1 text-sm">{tpl.submittal.map((x,i)=>(<li key={i}>• {x}</li>))}</ul><button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, submittal:[...tpl.submittal,'Mục mới']})}>+ Add</button></Card>
        <Card title="PO" subtitle="Library"><ul className="space-y-1 text-sm">{tpl.po.map((x,i)=>(<li key={i}>• {x}</li>))}</ul><button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, po:[...tpl.po,'Mục mới']})}>+ Add</button></Card>
        <Card title="Contract" subtitle="Library"><ul className="space-y-1 text-sm">{tpl.contract.map((x,i)=>(<li key={i}>• {x}</li>))}</ul><button className="mt-2 text-xs px-3 py-1.5 rounded-lg border" onClick={()=>setTpl({...tpl, contract:[...tpl.contract,'Mục mới']})}>+ Add</button></Card>
      </div>
    )
  }

  function Users(){
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Directory" subtitle="Users in system">
          <div className="overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">SSO</th></tr></thead>
              <tbody>
                {users.map((u,i)=> (
                  <tr key={i} className="border-t"><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.role}</td><td className="px-3 py-2 text-center">{u.sso? 'On':'Off'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Invite" subtitle="Add users">
          <Field label="Emails" hint="Comma separated"><textarea className="w-full p-2 text-sm border rounded-lg h-28" value={invites} onChange={e=>setInvites(e.target.value)} placeholder="user1@yourco.com, user2@yourco.com" /></Field>
          <div className="flex items-center gap-2 mt-2"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>{const arr=invites.split(',').map(x=>x.trim()).filter(Boolean); if(arr.length){setUsers([...users, ...arr.map(e=>({email:e, role:'Executive', sso:true}))]); setInvites('');}}}>Send invites</button><button className="px-3 text-xs border rounded-lg h-9">Download CSV template</button></div>
        </Card>
      </div>
    )
  }

  function DMS(){
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Workspace" subtitle="SharePoint/Workspace URL">
          <Field label="URL"><Input value={dms.workspace} onChange={e=>setDMS({...dms, workspace:e.target.value})} placeholder="https://share.yourco.com/sites/erp" /></Field>
        </Card>
        <Card title="Retention" subtitle="Days">
          <div className="grid grid-cols-3 gap-3">{Object.entries(dms.retention).map(([k,v])=> (
            <Field key={k} label={k}><Input type="number" value={v} onChange={e=>setDMS({...dms, retention:{...dms.retention, [k]: Number(e.target.value)}})} /></Field>
          ))}</div>
        </Card>
      </div>
    )
  }

  return (
    <Shell>
      {section==="Home" && <Home/>}
      {section==="Org" && <Org/>}
      {section==="Departments" && <Departments/>}
      {section==="IAM" && <IAM/>}
      {section==="Approvals" && <Approvals/>}
      {section==="KPI/OKR" && <KPI/>}
      {section==="Templates" && <Templates/>}
      {section==="Users" && <Users/>}
      {section==="DMS" && <DMS/>}
    </Shell>
  )
}
