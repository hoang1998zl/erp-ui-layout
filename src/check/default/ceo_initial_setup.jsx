import React, { useEffect, useMemo, useState } from "react";

function cx(...c){return c.filter(Boolean).join(" ");}
function money(n,cur='VND'){try{return new Intl.NumberFormat('vi-VN',{style:'currency',currency:cur,maximumFractionDigits:0}).format(Number(n)||0)}catch{return String(n)}}
function Badge({tone='gray', children}){const map={gray:'bg-gray-100 text-gray-700 border-gray-200',green:'bg-emerald-100 text-emerald-700 border-emerald-200',amber:'bg-amber-100 text-amber-700 border-amber-200',rose:'bg-rose-100 text-rose-700 border-rose-200',indigo:'bg-indigo-100 text-indigo-700 border-indigo-200',blue:'bg-blue-100 text-blue-700 border-blue-200'};return <span className={cx('px-2 py-0.5 rounded-full text-xs border whitespace-nowrap',map[tone]||map.gray)}>{children}</span>}
function Field({label,children,hint}){return(<label className="block text-sm"><span className="font-medium text-gray-700">{label}</span>{hint&&<span className="ml-2 text-xs text-gray-400">{hint}</span>}<div className="mt-1">{children}</div></label>)}
function Input(props){return <input {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)} />}
function Select({children,...props}){return <select {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)}>{children}</select>}
function Toggle({on,onChange}){return(<button onClick={()=>onChange(!on)} className={cx('h-6 w-11 rounded-full transition flex items-center p-0.5',on?'bg-indigo-600':'bg-gray-300')} aria-pressed={on}><span className={cx('h-5 w-5 bg-white rounded-full shadow transform transition',on?'translate-x-5':'translate-x-0')} /></button>)}
function Card({title, subtitle, actions, children}){return(<section className="flex flex-col p-4 border border-gray-200 shadow-sm bg-white/95 backdrop-blur rounded-2xl"><header className="flex items-center justify-between gap-3 mb-3"><div><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle&&<p className="text-xs text-gray-500">{subtitle}</p>}</div><div className="flex items-center gap-2">{actions}</div></header><div className="min-h-[100px] grow">{children}</div></section>)}

export default function CEOInitialSetupMatrix(){
  const [group,setGroup]=useState({id:'GRP-01', name:'Your Group', companies:[
    {id:'COA', name:'Company A', currency:'VND', fiscalStartMonth:1, vatRate:8, vatNumber:'0312345678', taxMethod:'VAT', branches:[
      {id:'HCM', name:'Ho Chi Minh', sites:[{id:'HCM-S1', name:'Site Office 1'}]},
      {id:'DN', name:'Da Nang', sites:[{id:'DN-S1', name:'Site Office 1'}]},
    ]},
    {id:'COB', name:'Company B', currency:'USD', fiscalStartMonth:4, vatRate:10, vatNumber:'99887766', taxMethod:'VAT', branches:[
      {id:'HN', name:'Ha Noi', sites:[{id:'HN-S1', name:'Site Office 1'}]},
    ]},
  ]});

  const [depts,setDepts]=useState(['FIN','PRC','OPS','HR','IT','DES']);
  const [deptShare,setDeptShare]=useState({
    FIN:{COA:true,COB:true}, PRC:{COA:true,COB:false}, OPS:{COA:true,COB:true}, HR:{COA:true,COB:true}, IT:{COA:true,COB:true}, DES:{COA:true,COB:false}
  });

  const [hrPeople,setHrPeople]=useState([
    {id:'E-001', name:'Lan', email:'lan@co', company:'COA', dept:'PRC'},
    {id:'E-002', name:'Minh', email:'minh@co', company:'COA', dept:'PRC'},
    {id:'E-003', name:'Huy', email:'huy@co', company:'COA', dept:'FIN'},
    {id:'E-004', name:'Hoa', email:'hoa@co', company:'COB', dept:'OPS'},
  ]);

  const roles=['CEO','Middle Manager','Executive','Finance Lead'];
  const [headrow,setHeadrow]=useState([{id:'ACT-001', action:'Approve', scope:'Company', company:'COA', dept:'', project:'', role:'CEO'}]);
  const [delegation,setDelegation]=useState([{id:'R-001', active:true, company:'COA', dept:'FIN', project:'', action:'FinalApprove', fromRole:'CEO', toType:'role', to:'Middle Manager', amountMin:0, amountMax:100_000_000, dateFrom:'2025-08-01', dateTo:'2025-12-31'}]);
  const [kpi,setKpi]=useState([{name:'Quality', unit:'%', direction:'maximize', weight:30, target:95},{name:'Schedule', unit:'%', direction:'maximize', weight:30, target:92},{name:'Safety', unit:'#', direction:'minimize', weight:20, target:0},{name:'Cost', unit:'%', direction:'minimize', weight:20, target:100}]);
  const [budgetBaseline,setBudgetBaseline]=useState({COA:1_230_000_000, COB:820_000_000});
  const [approvalThresholds,setApprovalThresholds]=useState({COA:{PR:50_000_000,PO:60_000_000,Budget:100_000_000}, COB:{PR:40_000_000,PO:50_000_000,Budget:80_000_000}});
  const [templates,setTemplates]=useState({COA:{policy:'Default Policy Pack', checklist:'Construction Checklist v2'}, COB:{policy:'Default Policy Pack', checklist:'Procurement Checklist v1'}});
  const [integrations,setIntegrations]=useState({COA:{bank:true, einvoice:true, payroll:false}, COB:{bank:true, einvoice:false, payroll:false}});

  const cats=[
    {key:'Org', label:'Company Basics'},
    {key:'Branches', label:'Branches & Sites'},
    {key:'Depts', label:'Departments Sharing'},
    {key:'Roles', label:'Headrow Actions'},
    {key:'Deleg', label:'Delegation Rules'},
    {key:'HR', label:'HR Assignment'},
    {key:'KPI', label:'KPI/OKR'},
    {key:'Budget', label:'Budget Baseline'},
    {key:'Thresh', label:'Approval Thresholds'},
    {key:'Tpl', label:'Templates & Checklists'},
    {key:'Integr', label:'Integrations'}
  ];

  const [sel, setSel] = useState({level:'Group', id:'GRP-01'});
  const selParts = sel.id.split(':');
  const selCompanyId = sel.level==='Company'? sel.id : sel.level!=='Group'? selParts[0] : null;
  const focusedCompany = selCompanyId || group.companies[0]?.id || 'COA';
  const [selCell,setSelCell]=useState({company: focusedCompany, cat:'Org'});

  function companyList(){return group.companies.map(c=>c.id)}

  function statusFor(company, key){
    if(key==='Org'){ const c=group.companies.find(x=>x.id===company); return c && c.currency && c.fiscalStartMonth && c.taxMethod? 'Done':'Setup'; }
    if(key==='Branches'){ const c=group.companies.find(x=>x.id===company); return c && (c.branches||[]).length>0? 'Done':'Setup'; }
    if(key==='Depts'){ return depts.some(d=>deptShare[d]?.[company])? 'Done':'Setup'; }
    if(key==='Roles'){ return headrow.some(h=>h.company===company)? 'Done':'Setup'; }
    if(key==='Deleg'){ return delegation.some(r=>r.company===company)? 'Done':'Setup'; }
    if(key==='HR'){ return hrPeople.some(p=>p.company===company)? 'Done':'Setup'; }
    if(key==='KPI'){ const w=kpi.reduce((s,k)=>s+Number(k.weight||0),0); return w===100? 'Done':'Setup'; }
    if(key==='Budget'){ return Number(budgetBaseline[company]||0)>0? 'Done':'Setup'; }
    if(key==='Thresh'){ return approvalThresholds[company]!=null? 'Done':'Setup'; }
    if(key==='Tpl'){ const t=templates[company]; return t && t.policy && t.checklist? 'Done':'Setup'; }
    if(key==='Integr'){ const it=integrations[company]||{}; return it.bank||it.einvoice||it.payroll? 'In progress':'Setup'; }
    return 'Setup';
  }
  function toneForStatus(s){ if(s==='Done') return 'green'; if(s==='In progress') return 'amber'; return 'rose'; }
  function progress(company){ const done=cats.filter(c=> statusFor(company,c.key)==='Done').length; return Math.round((done/cats.length)*100); }

  function addCompany(){ const id='CO'+String(group.companies.length+1); setGroup({...group, companies:[...group.companies,{id, name:'New Company', currency:'VND', fiscalStartMonth:1, vatRate:8, vatNumber:'', taxMethod:'VAT', branches:[]}]}); setSel({level:'Company', id}); setSelCell({company:id, cat:'Org'}); }
  function removeCompany(id){ const co=group.companies.find(c=>c.id===id); if(!co) return; if(co.branches.length){ alert('Remove branches first'); return;} setGroup({...group, companies: group.companies.filter(c=>c.id!==id)}); if(selCompanyId===id) setSel({level:'Group', id:group.id}); }
  function addBranch(coId){ const cp={...group}; const co=cp.companies.find(c=>c.id===coId); if(!co) return; const id = (co.branches.length? co.branches[0].id.slice(0,2):'BR') + '-' + (co.branches.length+1); co.branches=[...co.branches,{id, name:'New Branch', sites:[]}]; setGroup(cp); }
  function addSite(coId, brId){ const cp={...group}; const br=cp.companies.find(c=>c.id===coId)?.branches.find(b=>b.id===brId); if(!br) return; const id = brId + '-S' + (br.sites.length+1); br.sites=[...br.sites,{id, name:'New Site'}]; setGroup(cp); }
  function removeBranch(coId, brId){ const cp={...group}; const co=cp.companies.find(c=>c.id===coId); if(!co) return; const br=co.branches.find(b=>b.id===brId); if(!br) return; if(br.sites.length){ alert('Remove sites first'); return;} co.branches=co.branches.filter(b=>b.id!==brId); setGroup(cp); }
  function removeSite(coId, brId, sId){ const cp={...group}; const br=cp.companies.find(c=>c.id===coId)?.branches.find(b=>b.id===brId); if(!br) return; br.sites=br.sites.filter(s=>s.id!==sId); setGroup(cp); }

  function setCompanyBasics(coId, patch){ const cp={...group}; const i=cp.companies.findIndex(c=>c.id===coId); if(i>=0){ cp.companies[i]={...cp.companies[i], ...patch}; setGroup(cp);} }

  function addDept(code){ const n=(code||'').trim().toUpperCase(); if(!n) return; if(depts.includes(n)) return; setDepts([...depts,n]); setDeptShare({...deptShare, [n]: Object.fromEntries(companyList().map(c=>[c,true]))}); }
  function toggleDept(c,d,v){ const cp=JSON.parse(JSON.stringify(deptShare)); cp[d]=cp[d]||{}; cp[d][c]=v; setDeptShare(cp); }
  function addHeadrow(co){ const id='ACT-'+String(headrow.length+1).padStart(3,'0'); setHeadrow([...headrow,{id, action:'Approve', scope:'Company', company:co, dept:'', project:'', role:'CEO'}]); }
  function delHeadrow(id){ setHeadrow(headrow.filter(h=>h.id!==id)); }
  function addRule(co){ const id='R-'+String(delegation.length+1).padStart(3,'0'); setDelegation([...delegation,{id, active:true, company:co, dept:'', project:'', action:'FinalApprove', fromRole:'CEO', toType:'role', to:'Executive', amountMin:0, amountMax:50_000_000, dateFrom:'2025-08-01', dateTo:'2025-12-31'}]); }
  function delRule(id){ setDelegation(delegation.filter(r=>r.id!==id)); }
  function setKPIWeight(name, w){ setKpi(kpi.map(k=> k.name===name? {...k, weight:Number(w||0)}:k)); }
  function setBudget(co,v){ setBudgetBaseline({...budgetBaseline, [co]:Number(v||0)}); }
  function setThreshold(co, type, v){ const cp={...approvalThresholds}; cp[co]=cp[co]||{}; cp[co][type]=Number(v||0); setApprovalThresholds(cp); }
  function setTemplate(co, key, v){ const cp={...templates}; cp[co]=cp[co]||{}; cp[co][key]=v; setTemplates(cp); }
  function setIntegration(co, key, v){ const cp={...integrations}; cp[co]=cp[co]||{}; cp[co][key]=v; setIntegrations(cp); }

  const tree = useMemo(()=>{
    return [{level:'Group', id:group.id, label:group.name, children: group.companies.map(co=>({level:'Company', id:co.id, label:`${co.name} (${co.id})`, children: co.branches.map(br=>({level:'Branch', id:`${co.id}:${br.id}`, label:`${br.name} (${br.id})`, children: br.sites.map(s=>({level:'Site', id:`${co.id}:${br.id}:${s.id}`, label:`${s.name} (${s.id})`}))}))}))}];
  },[group]);

  useEffect(()=>{ if(selCompanyId){ setSelCell(prev=> ({...prev, company: selCompanyId})); } },[selCompanyId]);
  useEffect(()=>{ try{ console.assert(group.companies.length>=1,'has company'); const sum=kpi.reduce((s,k)=>s+Number(k.weight||0),0); console.assert(sum>=0,'kpi weights number'); }catch{} },[group,kpi]);

  function Matrix(){
    return (
      <Card title="Setup matrix" subtitle="Companies × Setup areas">
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Company</th>{cats.map(c=> <th key={c.key} className="px-3 py-2">{c.label}</th>)}<th className="px-3 py-2">Progress</th></tr></thead>
            <tbody>
              {group.companies.map(co=> (
                <tr key={co.id} className={cx('border-t align-top', focusedCompany===co.id && 'bg-indigo-50/30')}>
                  <td className="px-3 py-2"><div className="font-medium">{co.name}</div><div className="text-xs text-gray-500">{co.id}</div></td>
                  {cats.map(c=> {
                    const s=statusFor(co.id,c.key); const active= selCell.company===co.id && selCell.cat===c.key; return (
                      <td key={c.key} className="px-3 py-2">
                        <button onClick={()=>setSelCell({company:co.id, cat:c.key})} className={cx('w-full px-2 py-2 rounded border transition text-left flex items-center justify-between gap-2', active? 'border-indigo-300 bg-white':'border-transparent hover:bg-slate-50')}>
                          <span className="text-sm">Open</span>
                          <Badge tone={toneForStatus(s)}>{s}</Badge>
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center"><Badge tone={toneForStatus(progress(co.id)>=80?'Done':progress(co.id)>=50?'In progress':'Setup')}>{progress(co.id)}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function Editor(){
    const company=selCell.company; const cell=selCell.cat; const selectedCompany = group.companies.find(c=>c.id===company);
    if(!selectedCompany) return <div className="text-xs text-gray-500">Select a company.</div>;
    if(cell==='Org') return (
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <Field label="Company name"><Input value={selectedCompany.name} onChange={e=>setCompanyBasics(company,{name:e.target.value})} /></Field>
        <Field label="Currency"><Select value={selectedCompany.currency} onChange={e=>setCompanyBasics(company,{currency:e.target.value})}><option>VND</option><option>USD</option><option>EUR</option></Select></Field>
        <Field label="Fiscal start month"><Select value={selectedCompany.fiscalStartMonth} onChange={e=>setCompanyBasics(company,{fiscalStartMonth:Number(e.target.value)})}>{Array.from({length:12},(_,i)=>i+1).map(m=> <option key={m} value={m}>{m}</option>)}</Select></Field>
        <Field label="Tax method"><Select value={selectedCompany.taxMethod} onChange={e=>setCompanyBasics(company,{taxMethod:e.target.value})}><option>VAT</option><option>Other</option></Select></Field>
        <Field label="VAT rate %"><Input type="number" value={selectedCompany.vatRate} onChange={e=>setCompanyBasics(company,{vatRate:Number(e.target.value||0)})} /></Field>
        <Field label="VAT number"><Input value={selectedCompany.vatNumber} onChange={e=>setCompanyBasics(company,{vatNumber:e.target.value})} /></Field>
      </div>
    );
    if(cell==='Branches') return (
      <div className="text-sm">
        <div className="flex items-center gap-2 mb-2"><button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>addBranch(company)}>+ Branch</button></div>
        <div className="space-y-2">
          {selectedCompany.branches.map(br=> (
            <div key={br.id} className="p-3 border rounded-xl">
              <div className="flex items-center justify-between"><div className="font-medium">{br.name} ({br.id})</div><button className="text-xs text-rose-600" onClick={()=>removeBranch(company,br.id)}>Del</button></div>
              <div className="flex items-center gap-2 mt-2"><button className="px-2 text-xs border rounded-lg h-7" onClick={()=>addSite(company,br.id)}>+ Site</button></div>
              <ul className="grid grid-cols-2 gap-2 mt-2 text-xs">{br.sites.map(s=> (<li key={s.id} className="flex items-center justify-between p-2 border rounded">{s.name} ({s.id}) <button className="text-rose-600" onClick={()=>removeSite(company,br.id,s.id)}>Del</button></li>))}</ul>
            </div>
          ))}
        </div>
      </div>
    );
    if(cell==='Depts') return <DeptsEditor company={company} depts={depts} deptShare={deptShare} onToggle={toggleDept} onAdd={addDept} />;
    if(cell==='Roles') return (
      <div className="text-sm">
        <div className="flex items-center gap-2 mb-2"><button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>addHeadrow(company)}>+ Head action</button></div>
        <div className="overflow-auto border rounded-lg"><table className="min-w-full text-sm"><thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Role</th><th className="w-10 px-3 py-2"></th></tr></thead><tbody>{headrow.filter(h=>h.company===company).map(h=> (<tr key={h.id} className="border-t"><td className="px-3 py-2">{h.id}</td><td className="px-3 py-2 text-center">{h.action}</td><td className="px-3 py-2 text-center">{h.role}</td><td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>delHeadrow(h.id)}>Del</button></td></tr>))}</tbody></table></div>
      </div>
    );
    if(cell==='Deleg') return (
      <div className="text-sm">
        <div className="flex items-center gap-2 mb-2"><button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>addRule(company)}>+ Rule</button></div>
        <div className="overflow-auto border rounded-lg"><table className="min-w-full text-sm"><thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2">From</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Max</th><th className="px-3 py-2">Date</th><th className="w-10 px-3 py-2"></th></tr></thead><tbody>{delegation.filter(r=>r.company===company).map(r=> (<tr key={r.id} className="border-t"><td className="px-3 py-2">{r.id}</td><td className="px-3 py-2 text-center">{r.fromRole}</td><td className="px-3 py-2 text-center">{r.action}</td><td className="px-3 py-2 text-center">{r.to}</td><td className="px-3 py-2 text-right">{money(r.amountMax, selectedCompany.currency)}</td><td className="px-3 py-2 text-center">{r.dateFrom} → {r.dateTo}</td><td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>delRule(r.id)}>Del</button></td></tr>))}</tbody></table></div>
      </div>
    );
    if(cell==='HR') return (
      <div className="text-sm">
        <div className="overflow-auto border rounded-lg"><table className="min-w-full text-sm"><thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Dept</th></tr></thead><tbody>{hrPeople.filter(p=>p.company===company).map(p=> (<tr key={p.id} className="border-t"><td className="px-3 py-2">{p.id}</td><td className="px-3 py-2 text-center">{p.name}</td><td className="px-3 py-2 text-center">{p.email}</td><td className="px-3 py-2 text-center">{p.dept}</td></tr>))}</tbody></table></div>
        <div className="grid grid-cols-4 gap-2 mt-2"><Input placeholder="Name" id="hrn"/><Input placeholder="Email" id="hre"/><Select id="hrd">{depts.map(d=> <option key={d}>{d}</option>)}</Select><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>{const n=document.getElementById('hrn'); const e=document.getElementById('hre'); const d=document.getElementById('hrd'); if(n&&e&&d){ const id='E-'+String(hrPeople.length+1).padStart(3,'0'); setHrPeople([...hrPeople,{id, name:n.value, email:e.value, company, dept:d.value}]); n.value=''; e.value=''; }}}>Add</button></div>
      </div>
    );
    if(cell==='KPI') return (
      <div className="text-sm">
        <div className="overflow-auto border rounded-lg"><table className="min-w-full text-sm"><thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">KPI</th><th className="px-3 py-2">Weight</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Direction</th></tr></thead><tbody>{kpi.map(k=> (<tr key={k.name} className="border-t"><td className="px-3 py-2">{k.name}</td><td className="px-3 py-2 text-center"><Input type="number" value={k.weight} onChange={e=>setKPIWeight(k.name,e.target.value)} /></td><td className="px-3 py-2 text-center"><Input type="number" value={k.target} onChange={e=>setKpi(kpi.map(x=> x.name===k.name? {...x, target:Number(e.target.value||0)}:x))} /></td><td className="px-3 py-2 text-center">{k.direction}</td></tr>))}</tbody></table></div>
        <div className="mt-2 text-xs text-gray-500">Total weight: {kpi.reduce((s,k)=>s+Number(k.weight||0),0)}</div>
      </div>
    );
    if(cell==='Budget') return (
      <div className="grid grid-cols-2 gap-3 text-sm"><Field label="Baseline"><Input type="number" value={budgetBaseline[company]||0} onChange={e=>setBudget(company,e.target.value)} /></Field><div className="p-3 border rounded-xl bg-slate-50"><div className="text-xs text-gray-500">Display</div><div className="text-sm font-medium">{money(budgetBaseline[company]||0, selectedCompany.currency)}</div></div></div>
    );
    if(cell==='Thresh') return (
      <div className="grid grid-cols-3 gap-3 text-sm"><Field label="PR"><Input type="number" value={approvalThresholds[company]?.PR||0} onChange={e=>setThreshold(company,'PR',e.target.value)} /></Field><Field label="PO"><Input type="number" value={approvalThresholds[company]?.PO||0} onChange={e=>setThreshold(company,'PO',e.target.value)} /></Field><Field label="Budget"><Input type="number" value={approvalThresholds[company]?.Budget||0} onChange={e=>setThreshold(company,'Budget',e.target.value)} /></Field></div>
    );
    if(cell==='Tpl') return (
      <div className="grid grid-cols-2 gap-3 text-sm"><Field label="Policy pack"><Select value={templates[company]?.policy||'Default Policy Pack'} onChange={e=>setTemplate(company,'policy',e.target.value)}><option>Default Policy Pack</option><option>Construction Policy Pack</option><option>Manufacturing Policy Pack</option></Select></Field><Field label="Checklist"><Select value={templates[company]?.checklist||'Construction Checklist v2'} onChange={e=>setTemplate(company,'checklist',e.target.value)}><option>Construction Checklist v2</option><option>Procurement Checklist v1</option><option>HR Onboarding v3</option></Select></Field></div>
    );
    if(cell==='Integr') return (
      <div className="grid grid-cols-3 gap-3 text-sm"><Field label="Bank"><Toggle on={!!integrations[company]?.bank} onChange={v=>setIntegration(company,'bank',v)} /></Field><Field label="E-Invoice"><Toggle on={!!integrations[company]?.einvoice} onChange={v=>setIntegration(company,'einvoice',v)} /></Field><Field label="Payroll"><Toggle on={!!integrations[company]?.payroll} onChange={v=>setIntegration(company,'payroll',v)} /></Field></div>
    );
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2"><div className="bg-indigo-600 size-8 rounded-xl" /><h1 className="font-semibold">CEO Initial Setup — Matrix</h1></div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="px-3 text-xs border rounded-lg h-9" onClick={addCompany}>+ Company</button>
            <div className="rounded-full size-8 bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_420px] gap-6">
        <aside className="space-y-4">
          <Card title="Explorer" subtitle="Group → Company → Branch → Site" actions={<Badge tone="indigo">{sel.level}</Badge>}>
            <div className="text-sm">
              {tree.map(n=> (<TreeNode key={n.id} node={n} sel={sel} setSel={setSel} onRemoveCompany={removeCompany} onRemoveBranch={removeBranch} onRemoveSite={removeSite} />))}
            </div>
            {selCompanyId && (
              <div className="flex items-center gap-2 mt-3">
                <button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>addBranch(selCompanyId)}>+ Branch</button>
                {sel.level==='Branch' && <button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>addSite(selParts[0],selParts[1])}>+ Site</button>}
              </div>
            )}
          </Card>
        </aside>

        <section className="space-y-4">
          <Matrix />
        </section>

        <aside className="space-y-4">
          <Card title={`Editor — ${selCell.company}`} subtitle={cats.find(c=>c.key===selCell.cat)?.label} actions={<Badge tone="indigo">Context</Badge>}>
            <Editor />
          </Card>
          <Card title="Quick actions" subtitle="Common operations">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {cats.map(c=> (
                <button key={c.key} className="px-3 border rounded-lg h-9" onClick={()=>setSelCell({company: focusedCompany, cat:c.key})}>{c.label}</button>
              ))}
            </div>
          </Card>
          <Card title="Legend" subtitle="Status badges">
            <div className="flex items-center gap-2 text-xs"><Badge tone="green">Done</Badge><Badge tone="amber">In progress</Badge><Badge tone="rose">Setup</Badge></div>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-xs text-center text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
    </div>
  );
}

function TreeNode({node, sel, setSel, onRemoveCompany, onRemoveBranch, onRemoveSite}){
  const active = sel.id===node.id;
  const lvl=node.level;
  const ids=node.id.split(':');
  return (
    <div className="mb-1">
      <div className={cx('w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50', active && 'bg-slate-100')}>
        <button onClick={()=>setSel({level:node.level, id:node.id})} className="text-left grow">
          <span className="text-xs text-gray-500">{node.level}</span>
          <div className="text-sm">{node.label}</div>
        </button>
        {lvl==='Company' && <button className="text-xs text-rose-600" onClick={()=>onRemoveCompany(ids[0])}>Del</button>}
        {lvl==='Branch' && <button className="text-xs text-rose-600" onClick={()=>onRemoveBranch(ids[0],ids[1])}>Del</button>}
        {lvl==='Site' && <button className="text-xs text-rose-600" onClick={()=>onRemoveSite(ids[0],ids[1],ids[2])}>Del</button>}
      </div>
      {node.children && node.children.length>0 && (
        <div className="pl-2 ml-3 border-l">
          {node.children.map(ch=> <TreeNode key={ch.id} node={ch} sel={sel} setSel={setSel} onRemoveCompany={onRemoveCompany} onRemoveBranch={onRemoveBranch} onRemoveSite={onRemoveSite} />)}
        </div>
      )}
    </div>
  );
}

function DeptsEditor({company, depts, deptShare, onToggle, onAdd}){
  const [newDept,setNewDept]=useState('');
  const companies=Object.keys(Object.values(deptShare)[0]||{[company]:true});
  return (
    <div className="text-sm">
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Dept</th>{companies.map(id=> <th key={id} className="px-3 py-2">{id}</th>)}</tr></thead>
          <tbody>
            {depts.map(d=> (
              <tr key={d} className="border-t">
                <td className="px-3 py-2 font-medium">{d}</td>
                {companies.map(c=> (
                  <td key={c} className="px-3 py-2 text-center">
                    <input type="checkbox" checked={!!deptShare[d]?.[c]} onChange={e=>onToggle(c,d,e.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Input placeholder="New dept code" value={newDept} onChange={e=>setNewDept(e.target.value)} />
        <button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>{onAdd(newDept); setNewDept('');}}>Add</button>
      </div>
    </div>
  );
}
