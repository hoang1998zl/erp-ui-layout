import React, { useEffect, useMemo, useState } from "react";

function cx(...c){return c.filter(Boolean).join(" ");}
function money(n,cur='VND'){try{return new Intl.NumberFormat('vi-VN',{style:'currency',currency:cur,maximumFractionDigits:0}).format(Number(n)||0)}catch{return String(n)}}
function Badge({tone='gray', children}){const map={gray:'bg-gray-100 text-gray-700 border-gray-200',green:'bg-emerald-100 text-emerald-700 border-emerald-200',amber:'bg-amber-100 text-amber-700 border-amber-200',rose:'bg-rose-100 text-rose-700 border-rose-200',indigo:'bg-indigo-100 text-indigo-700 border-indigo-200'};return <span className={cx('px-2 py-0.5 rounded-full text-xs border',map[tone])}>{children}</span>}
function Field({label,children,hint}){return(<label className="block text-sm"><span className="font-medium text-gray-700">{label}</span>{hint&&<span className="ml-2 text-xs text-gray-400">{hint}</span>}<div className="mt-1">{children}</div></label>)}
function Input(props){return <input {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)} />}
function Select({children,...props}){return <select {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)}>{children}</select>}
function Toggle({on,onChange}){return(<button onClick={()=>onChange(!on)} className={cx('h-6 w-11 rounded-full transition flex items-center p-0.5',on?'bg-indigo-600':'bg-gray-300')} aria-pressed={on}><span className={cx('h-5 w-5 bg-white rounded-full shadow transform transition',on?'translate-x-5':'translate-x-0')} /></button>)}
function Card({title, subtitle, actions, children}){return(<section className="flex flex-col p-4 border border-gray-200 shadow-sm bg-white/95 backdrop-blur rounded-2xl"><header className="flex items-center justify-between gap-3 mb-3"><div><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle&&<p className="text-xs text-gray-500">{subtitle}</p>}</div><div className="flex items-center gap-2">{actions}</div></header><div className="min-h-[120px] grow">{children}</div></section>)}

export default function DelegationOverrides(){
  const [company,setCompany]=useState('COA');
  const [currency]=useState('VND');
  const companies=['COA','COB'];
  const depts=['FIN','PRC','DES'];
  const projects=['Proj-001','Proj-002','Proj-003'];
  const roles=['CEO','Middle Manager','Executive','Finance Lead'];
  const caps=['FinalApprove','EditBudget','Delegate','LockKPI'];
  const users=['ceo@yourco.com','manager@yourco.com','exec@yourco.com','finlead@yourco.com'];

  const [rules,setRules]=useState([
    {id:'R-001', active:true, company:'COA', dept:'FIN', project:'', action:'FinalApprove', fromRole:'CEO', toType:'role', to:'Middle Manager', amountMin:0, amountMax:100_000_000, dateFrom:'2025-08-01', dateTo:'2025-12-31'},
    {id:'R-002', active:true, company:'COA', dept:'', project:'Proj-001', action:'FinalApprove', fromRole:'CEO', toType:'role', to:'Executive', amountMin:0, amountMax:50_000_000, dateFrom:'2025-08-01', dateTo:'2025-12-31'},
    {id:'R-003', active:true, company:'COB', dept:'FIN', project:'', action:'EditBudget', fromRole:'CEO', toType:'role', to:'Finance Lead', amountMin:0, amountMax:60_000_000, dateFrom:'2025-08-01', dateTo:'2025-12-31'}
  ]);

  const [draft,setDraft]=useState({company:'COA', dept:'', project:'', action:'FinalApprove', fromRole:'CEO', toType:'role', to:'Middle Manager', amountMin:0, amountMax:0, dateFrom:'2025-08-01', dateTo:'2025-12-31'});

  function parseDate(s){const d=new Date(s); return isNaN(d.getTime())? null: d}
  function inRange(d, a, b){ if(!a && !b) return true; const x=parseDate(d); const da=a?parseDate(a):null; const db=b?parseDate(b):null; if(!x) return false; if(da && x<da) return false; if(db && x>db) return false; return true; }

  function matchRule(rule, ctx){
    if(!rule.active) return false;
    if(rule.company && rule.company!==ctx.company) return false;
    if(rule.project && rule.project!==ctx.project) return false;
    if(rule.dept && rule.dept!==ctx.dept) return false;
    if(rule.action!==ctx.action) return false;
    if(rule.fromRole!==ctx.fromRole) return false;
    if(rule.amountMin && Number(ctx.amount)<Number(rule.amountMin)) return false;
    if(rule.amountMax && Number(ctx.amount)>Number(rule.amountMax)) return false;
    if(!inRange(ctx.date, rule.dateFrom, rule.dateTo)) return false;
    return true;
  }

  function specificity(rule){ let s=0; if(rule.project) s+=100; if(rule.dept) s+=10; if(rule.company) s+=1; return s; }

  function pickRule(ctx){
    const cand = rules.filter(r=>matchRule(r,ctx));
    cand.sort((a,b)=> specificity(b)-specificity(a));
    return cand[0]||null;
  }

  const [sim,setSim]=useState({company:'COA', dept:'FIN', project:'Proj-009', action:'FinalApprove', fromRole:'CEO', amount:80_000_000, date:'2025-08-03'});
  const picked = pickRule(sim);

  function addRule(){
    const id = 'R-' + String(rules.length+1).padStart(3,'0');
    setRules([...rules, {id, active:true, ...draft}]);
  }

  function removeRule(id){ setRules(rules.filter(r=>r.id!==id)); }

  const matrixScope = {company, dept: 'FIN'};
  const matrix = useMemo(()=>{
    const actions = caps;
    const out = roles.map(role=>({role, actions: Object.fromEntries(actions.map(a=>[a, role==='CEO'? 'Self':'—'])) }));
    rules.filter(r=>r.active && (!r.company || r.company===matrixScope.company) && (!r.dept || r.dept===matrixScope.dept)).forEach(r=>{
      const row = out.find(x=>x.role===r.fromRole);
      if(row) row.actions[r.action] = r.toType==='role'? `→ ${r.to}` : `→ ${r.to}`;
    });
    return {actions, rows:out};
  },[rules,company]);

  useEffect(()=>{
    try{
      const a = pickRule({company:'COA', dept:'FIN', project:'Proj-009', action:'FinalApprove', fromRole:'CEO', amount:80_000_000, date:'2025-08-03'});
      console.assert(a && a.id==='R-001','dept rule picked');
      const b = pickRule({company:'COA', dept:'PRC', project:'Proj-001', action:'FinalApprove', fromRole:'CEO', amount:45_000_000, date:'2025-08-03'});
      console.assert(b && b.id==='R-002','project rule picked');
      const c = pickRule({company:'COA', dept:'FIN', project:'Proj-009', action:'FinalApprove', fromRole:'CEO', amount:120_000_000, date:'2025-08-03'});
      console.assert(c===null,'no rule over max');
      const d = pickRule({company:'COB', dept:'FIN', project:'Proj-100', action:'EditBudget', fromRole:'CEO', amount:55_000_000, date:'2025-08-03'});
      console.assert(d && d.id==='R-003','company rule picked');
    }catch{}
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2"><div className="bg-indigo-600 size-8 rounded-xl" /><h1 className="font-semibold">Delegation Overrides</h1></div>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={company} onChange={e=>setCompany(e.target.value)}>{companies.map(c=><option key={c}>{c}</option>)}</Select>
            <div className="rounded-full size-8 bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="space-y-4">
          <Card title="Rules" subtitle="Override theo Company/Dept/Project" actions={<button className="px-3 text-xs border rounded-lg h-9" onClick={addRule}>Add rule</button>}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field label="Company"><Select value={draft.company} onChange={e=>setDraft({...draft, company:e.target.value})}>{companies.map(c=><option key={c}>{c}</option>)}</Select></Field>
              <Field label="Dept"><Select value={draft.dept} onChange={e=>setDraft({...draft, dept:e.target.value})}><option value="">(All)</option>{depts.map(d=><option key={d}>{d}</option>)}</Select></Field>
              <Field label="Project"><Select value={draft.project} onChange={e=>setDraft({...draft, project:e.target.value})}><option value="">(All)</option>{projects.map(p=><option key={p}>{p}</option>)}</Select></Field>
              <Field label="Action"><Select value={draft.action} onChange={e=>setDraft({...draft, action:e.target.value})}>{caps.map(a=><option key={a}>{a}</option>)}</Select></Field>
              <Field label="From role"><Select value={draft.fromRole} onChange={e=>setDraft({...draft, fromRole:e.target.value})}>{roles.map(r=><option key={r}>{r}</option>)}</Select></Field>
              <Field label="Delegate to"><div className="grid grid-cols-2 gap-2"><Select value={draft.toType} onChange={e=>setDraft({...draft, toType:e.target.value})}><option value="role">Role</option><option value="user">User</option></Select>{draft.toType==='role'? (<Select value={draft.to} onChange={e=>setDraft({...draft, to:e.target.value})}>{roles.filter(r=>r!=='CEO').map(r=><option key={r}>{r}</option>)}</Select>) : (<Select value={draft.to} onChange={e=>setDraft({...draft, to:e.target.value})}>{users.map(u=><option key={u}>{u}</option>)}</Select>)}</div></Field>
              <Field label="Amount min"><Input type="number" value={draft.amountMin} onChange={e=>setDraft({...draft, amountMin:Number(e.target.value||0)})} /></Field>
              <Field label="Amount max"><Input type="number" value={draft.amountMax} onChange={e=>setDraft({...draft, amountMax:Number(e.target.value||0)})} /></Field>
              <Field label="Date from"><Input type="date" value={draft.dateFrom} onChange={e=>setDraft({...draft, dateFrom:e.target.value})} /></Field>
              <Field label="Date to"><Input type="date" value={draft.dateTo} onChange={e=>setDraft({...draft, dateTo:e.target.value})} /></Field>
            </div>
            <div className="mt-3 overflow-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Dept</th><th className="px-3 py-2">Project</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Min</th><th className="px-3 py-2">Max</th><th className="px-3 py-2">Date</th><th className="w-12 px-3 py-2"></th></tr></thead>
                <tbody>
                  {rules.filter(r=>!r.company || r.company===company).map((r,idx)=> (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{r.id}</td>
                      <td className="px-3 py-2 text-center"><Toggle on={r.active} onChange={v=>{const cp=[...rules]; cp[idx].active=v; setRules(cp);}} /></td>
                      <td className="px-3 py-2 text-center">{r.company||'(All)'}</td>
                      <td className="px-3 py-2 text-center">{r.dept||'(All)'}</td>
                      <td className="px-3 py-2 text-center">{r.project||'(All)'}</td>
                      <td className="px-3 py-2 text-center">{r.action}</td>
                      <td className="px-3 py-2 text-center">{r.fromRole}</td>
                      <td className="px-3 py-2 text-center">{r.toType==='role'? r.to : r.to}</td>
                      <td className="px-3 py-2 text-right">{r.amountMin? money(r.amountMin,currency):'—'}</td>
                      <td className="px-3 py-2 text-right">{r.amountMax? money(r.amountMax,currency):'—'}</td>
                      <td className="px-3 py-2 text-center">{r.dateFrom} → {r.dateTo}</td>
                      <td className="px-3 py-2 text-right"><button className="text-xs text-rose-600" onClick={()=>removeRule(r.id)}>Del</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card title="Simulator" subtitle="Kiểm tra tuyến uỷ quyền cho một giao dịch" actions={picked? <Badge tone="green">Matched</Badge>:<Badge tone="amber">No rule</Badge>}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Company"><Select value={sim.company} onChange={e=>setSim({...sim, company:e.target.value})}>{companies.map(c=><option key={c}>{c}</option>)}</Select></Field>
              <Field label="Dept"><Select value={sim.dept} onChange={e=>setSim({...sim, dept:e.target.value})}>{depts.map(d=><option key={d}>{d}</option>)}</Select></Field>
              <Field label="Project"><Input value={sim.project} onChange={e=>setSim({...sim, project:e.target.value})} /></Field>
              <Field label="Action"><Select value={sim.action} onChange={e=>setSim({...sim, action:e.target.value})}>{caps.map(a=><option key={a}>{a}</option>)}</Select></Field>
              <Field label="From role"><Select value={sim.fromRole} onChange={e=>setSim({...sim, fromRole:e.target.value})}>{roles.map(r=><option key={r}>{r}</option>)}</Select></Field>
              <Field label="Amount"><Input type="number" value={sim.amount} onChange={e=>setSim({...sim, amount:Number(e.target.value||0)})} /></Field>
              <Field label="Date"><Input type="date" value={sim.date} onChange={e=>setSim({...sim, date:e.target.value})} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-center">
              <div className="p-4 border rounded-2xl bg-slate-50"><div className="text-xs text-slate-500">Route</div><div className="text-sm font-medium">{picked? `${sim.fromRole} → ${rules.find(r=>r.id===picked.id).to}` : 'Direct'}</div></div>
              <div className="p-4 border rounded-2xl bg-slate-50"><div className="text-xs text-slate-500">Rule</div><div className="text-sm font-medium">{picked? picked.id : 'None'}</div></div>
            </div>
          </Card>

          <Card title={`Effective matrix — ${matrixScope.company}/${matrixScope.dept}`} subtitle="Tổng hợp hành động tại scope">
            <div className="overflow-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Role</th>{matrix.actions.map(a=> <th key={a} className="px-3 py-2">{a}</th>)}</tr></thead>
                <tbody>
                  {matrix.rows.map(row=> (
                    <tr key={row.role} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.role}</td>
                      {matrix.actions.map(a=> (<td key={a} className="px-3 py-2 text-center">{row.actions[a]}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-xs text-center text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
    </div>
  );
}
