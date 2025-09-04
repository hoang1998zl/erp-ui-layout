import React, { useEffect, useMemo, useState } from "react";

function cx(...c){return c.filter(Boolean).join(" ");}
function money(n,cur='VND'){try{return new Intl.NumberFormat('vi-VN',{style:'currency',currency:cur,maximumFractionDigits:0}).format(Number(n)||0)}catch{return String(n)}}
function Badge({tone='gray', children}){const map={gray:'bg-gray-100 text-gray-700 border-gray-200',green:'bg-emerald-100 text-emerald-700 border-emerald-200',amber:'bg-amber-100 text-amber-700 border-amber-200',rose:'bg-rose-100 text-rose-700 border-rose-200',indigo:'bg-indigo-100 text-indigo-700 border-indigo-200',blue:'bg-blue-100 text-blue-700 border-blue-200'};return <span className={cx('px-2 py-0.5 rounded-full text-xs border whitespace-nowrap',map[tone]||map.gray)}>{children}</span>}
function Field({label,children,hint}){return(<label className="block text-sm"><span className="font-medium text-gray-700">{label}</span>{hint&&<span className="ml-2 text-xs text-gray-400">{hint}</span>}<div className="mt-1">{children}</div></label>)}
function Input(props){return <input {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)} />}
function Select({children,...props}){return <select {...props} className={cx('h-9 w-full border rounded-lg px-2 text-sm',props.className)}>{children}</select>}
function Toggle({on,onChange}){return(<button onClick={()=>onChange(!on)} className={cx('h-6 w-11 rounded-full transition flex items-center p-0.5',on?'bg-indigo-600':'bg-gray-300')} aria-pressed={on}><span className={cx('h-5 w-5 bg-white rounded-full shadow transform transition',on?'translate-x-5':'translate-x-0')} /></button>)}
function Card({title, subtitle, actions, children}){return(<section className="flex flex-col p-4 border border-gray-200 shadow-sm bg-white/95 backdrop-blur rounded-2xl"><header className="flex items-center justify-between gap-3 mb-3"><div><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle&&<p className="text-xs text-gray-500">{subtitle}</p>}</div><div className="flex items-center gap-2">{actions}</div></header><div className="min-h-[100px] grow">{children}</div></section>)}

const MODULES=[
  {key:'ORG', label:'Organization'},
  {key:'FIN', label:'Finance'},
  {key:'DLG', label:'Delegation'},
  {key:'KPI', label:'KPI/OKR'},
  {key:'BDG', label:'Budget'},
  {key:'TPL', label:'Templates'},
  {key:'IAM', label:'Users/Roles'},
  {key:'NTF', label:'Notifications'},
  {key:'CMP', label:'Compliance'}
];

function CellStatus({status}){
  const tone = status.state==='Done'?'green':status.state==='Partial'?'amber':'rose';
  return (
    <div className="flex items-center justify-center gap-2">
      <Badge tone={tone}>{status.state}</Badge>
      <span className="text-xs text-gray-500">{status.desc}</span>
    </div>
  );
}

export default function CEOSetupMatrixActionHub(){
  const [view,setView]=useState('Company');
  const [period,setPeriod]=useState('FY 2025');
  const companies=['COA','COB'];
  const depts=['FIN','PRC','OPS','HR','IT','DES'];
  const [company,setCompany]=useState('COA');
  const cols = useMemo(()=> view==='Company'? companies : depts,[view]);

  const [state,setState]=useState(()=>{
    const obj={};
    companies.forEach(co=>{
      obj[`Company:${co}`]={
        ORG:{state:'Partial', desc:'2 branches'},
        FIN:{state:'Partial', desc:'VND; FM=1'},
        DLG:{state:'Partial', desc:'3 rules'},
        KPI:{state:'Partial', desc:'Weights 80%'},
        BDG:{state:'Partial', desc:'Baseline set'},
        TPL:{state:'Done', desc:'2 links'},
        IAM:{state:'Partial', desc:'35 users'},
        NTF:{state:'Not set', desc:'0 channels'},
        CMP:{state:'Partial', desc:'2 audits'}
      };
    });
    depts.forEach(d=>{
      obj[`Dept:${company}:${d}`]={
        ORG:{state:'Partial', desc:'Head not set'},
        FIN:{state:'Partial', desc:'Budget present'},
        DLG:{state:'Not set', desc:'0 rules'},
        KPI:{state:'Partial', desc:'3 KPIs'},
        BDG:{state:'Partial', desc:'v1 open'},
        TPL:{state:'Done', desc:'Checklist'},
        IAM:{state:'Partial', desc:'5 staff'},
        NTF:{state:'Not set', desc:'0'},
        CMP:{state:'Not set', desc:'0'}
      };
    });
    return obj;
  });

  const [hr,setHr]=useState([
    {id:'E-001', name:'Lan', email:'lan@co', company:'COA', dept:'PRC', role:'Buyer'},
    {id:'E-002', name:'Minh', email:'minh@co', company:'COA', dept:'FIN', role:'Executive'},
    {id:'E-003', name:'Huy', email:'huy@co', company:'COA', dept:'OPS', role:'PM'},
    {id:'E-004', name:'Hoa', email:'hoa@co', company:'COB', dept:'OPS', role:'Executive'},
    {id:'E-005', name:'Tung', email:'tung@co', company:'COA', dept:'DES', role:'Designer'}
  ]);

  const [filter,setFilter]=useState('All');
  const [q,setQ]=useState('');
  const [inspector,setInspector]=useState({open:false, scope:'Company:COA', module:'ORG'});

  function scopeKey(col){ return view==='Company'? `Company:${col}` : `Dept:${company}:${col}`; }
  function scopeLabel(key){ const parts=key.split(':'); return parts[0]==='Company'? `${parts[1]}` : `${parts[2]} @ ${parts[1]}`; }
  function getStatus(key,mod){ return state[key]?.[mod] || {state:'Not set', desc:'—'}; }
  function setStatus(key,mod,newStatus){ setState(prev=>{ const cp={...prev}; cp[key]={...(cp[key]||{})}; cp[key][mod]=newStatus; return cp; }); }

  const prioritized = useMemo(()=>{
    const rows=[];
    cols.forEach(c=>{
      MODULES.forEach(m=>{
        const key=scopeKey(c); const st=getStatus(key,m.key);
        const okay = filter==='All' || st.state===filter;
        const match = !q || (c.toLowerCase().includes(q.toLowerCase()) || m.label.toLowerCase().includes(q.toLowerCase()));
        if(okay && match && st.state!=='Done') rows.push({scope:key, col:c, module:m.key, label:m.label, status:st});
      });
    });
    rows.sort((a,b)=>{
      const pri=(s)=> s==='Not set'? 0 : s==='Partial'? 1 : 9;
      if(pri(a.status.state)!==pri(b.status.state)) return pri(a.status.state)-pri(b.status.state);
      return a.label.localeCompare(b.label);
    });
    return rows.slice(0,8);
  },[cols,filter,q,state,view,company]);

  useEffect(()=>{ try{ console.assert(cols.length>0,'has columns'); }catch{} },[cols]);

  function Matrix({title, rows}){
    return (
      <Card title={title} subtitle={view==='Company'? 'Companies × Modules' : `${company} — Depts × Modules`}>
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="text-gray-600 bg-gray-50"><tr><th className="px-3 py-2 text-left">Module</th>{cols.map(c=> <th key={c} className="px-3 py-2">{c}</th>)}</tr></thead>
            <tbody>
              {rows.map(m=> (
                <tr key={m.key} className="border-t">
                  <td className="px-3 py-2 font-medium">{m.label}</td>
                  {cols.map(c=>{ const key=scopeKey(c); const st=getStatus(key,m.key); return (
                    <td key={c} className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CellStatus status={st} />
                        <div className="flex items-center gap-1">
                          <button className="px-2 text-xs border rounded-lg h-7" onClick={()=>setInspector({open:true, scope:key, module:m.key})}>{st.state==='Done'? 'Edit':'Set up'}</button>
                          <button className="px-2 text-xs border rounded-lg h-7" onClick={()=>setStatus(key,m.key,{state:'Done', desc:'Quick mark'})}>Mark done</button>
                        </div>
                      </div>
                    </td>
                  )})}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function Inspector(){
    const key=inspector.scope; const mod=inspector.module; const st=getStatus(key,mod);
    const [local,setLocal]=useState({});
    useEffect(()=>{ setLocal({}); },[key,mod]);
    function save(desc){ setStatus(key,mod,{state:'Done', desc:desc||st.desc||'Configured'}); setInspector({...inspector, open:false}); }

    const scopeTitle=scopeLabel(key);
    const ModuleTitle = MODULES.find(x=>x.key===mod)?.label || mod;

    return (
      <Card title={`${ModuleTitle}`} subtitle={scopeTitle} actions={<button className="h-8 px-2 text-xs border rounded-lg" onClick={()=>setInspector({...inspector, open:false})}>Close</button>}>
        {mod==='ORG' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Currency"><Select value={local.currency||'VND'} onChange={e=>setLocal({...local,currency:e.target.value})}><option>VND</option><option>USD</option><option>EUR</option></Select></Field>
            <Field label="Fiscal start month"><Select value={local.fm||1} onChange={e=>setLocal({...local,fm:Number(e.target.value)})}>{Array.from({length:12},(_,i)=>i+1).map(m=> <option key={m} value={m}>{m}</option>)}</Select></Field>
            <Field label="VAT rate %"><Input type="number" value={local.vat||8} onChange={e=>setLocal({...local,vat:Number(e.target.value||0)})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`Cur ${local.currency||'VND'} FM ${local.fm||1}`)}>Save</button></div>
          </div>
        )}
        {mod==='FIN' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Cash threshold"><Input type="number" value={local.cash||300000000} onChange={e=>setLocal({...local,cash:Number(e.target.value||0)})}/></Field>
            <Field label="AR days target"><Input type="number" value={local.ar||40} onChange={e=>setLocal({...local,ar:Number(e.target.value||0)})}/></Field>
            <Field label="AP days target"><Input type="number" value={local.ap||40} onChange={e=>setLocal({...local,ap:Number(e.target.value||0)})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`Cash ${money(local.cash||0)}`)}>Save</button></div>
          </div>
        )}
        {mod==='DLG' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="From role"><Select value={local.from||'CEO'} onChange={e=>setLocal({...local,from:e.target.value})}><option>CEO</option><option>Middle Manager</option></Select></Field>
            <Field label="To role"><Select value={local.to||'Executive'} onChange={e=>setLocal({...local,to:e.target.value})}><option>Executive</option><option>Finance Lead</option></Select></Field>
            <Field label="Max amount"><Input type="number" value={local.max||50000000} onChange={e=>setLocal({...local,max:Number(e.target.value||0)})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`${local.from||'CEO'} → ${local.to||'Executive'} <= ${money(local.max||0)}`)}>Save</button></div>
          </div>
        )}
        {mod==='KPI' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Quality %"><Input type="number" value={local.q||30} onChange={e=>setLocal({...local,q:Number(e.target.value||0)})}/></Field>
            <Field label="Schedule %"><Input type="number" value={local.s||30} onChange={e=>setLocal({...local,s:Number(e.target.value||0)})}/></Field>
            <Field label="Safety %"><Input type="number" value={local.sf||20} onChange={e=>setLocal({...local,sf:Number(e.target.value||0)})}/></Field>
            <Field label="Cost %"><Input type="number" value={local.c||20} onChange={e=>setLocal({...local,c:Number(e.target.value||0)})}/></Field>
            <div className="md:col-span-4"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`Weights ${Math.round((local.q||30)+(local.s||30)+(local.sf||20)+(local.c||20))}%`)}>Save</button></div>
          </div>
        )}
        {mod==='BDG' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Baseline"><Input type="number" value={local.base||100000000} onChange={e=>setLocal({...local,base:Number(e.target.value||0)})}/></Field>
            <Field label="Escalation %"><Input type="number" value={local.escal||10} onChange={e=>setLocal({...local,escal:Number(e.target.value||0)})}/></Field>
            <Field label="Lock edits"><Toggle on={!!local.lock} onChange={v=>setLocal({...local,lock:v})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`Base ${money(local.base||0)}`)}>Save</button></div>
          </div>
        )}
        {mod==='TPL' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Policy pack"><Select value={local.policy||'Default'} onChange={e=>setLocal({...local,policy:e.target.value})}><option>Default</option><option>Construction</option><option>Manufacturing</option></Select></Field>
            <Field label="Checklist"><Select value={local.check||'Construction v2'} onChange={e=>setLocal({...local,check:e.target.value})}><option>Construction v2</option><option>Procurement v1</option><option>HR Onboarding v3</option></Select></Field>
            <div className="md:col-span-2"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`${local.policy||'Default'} + ${local.check||'Construction v2'}`)}>Save</button></div>
          </div>
        )}
        {mod==='IAM' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Add user email"><Input value={local.email||''} onChange={e=>setLocal({...local,email:e.target.value})} placeholder="user@co"/></Field>
            <Field label="Role"><Select value={local.role||'Executive'} onChange={e=>setLocal({...local,role:e.target.value})}><option>Executive</option><option>Middle Manager</option><option>Finance Lead</option></Select></Field>
            <Field label="Invite now"><Toggle on={!!local.invite} onChange={v=>setLocal({...local,invite:v})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(local.email? `Invited ${local.email}`:'Updated roles')}>Save</button></div>
          </div>
        )}
        {mod==='NTF' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Channel"><Select value={local.ch||'Email'} onChange={e=>setLocal({...local,ch:e.target.value})}><option>Email</option><option>Slack</option><option>SMS</option></Select></Field>
            <Field label="Events"><Select value={local.ev||'Approvals'} onChange={e=>setLocal({...local,ev:e.target.value})}><option>Approvals</option><option>Budget changes</option><option>KPI alerts</option></Select></Field>
            <Field label="Enabled"><Toggle on={!!local.enabled} onChange={v=>setLocal({...local,enabled:v})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`${local.ch||'Email'} ${local.ev||'Approvals'}`)}>Save</button></div>
          </div>
        )}
        {mod==='CMP' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Enable audits"><Toggle on={!!local.audit} onChange={v=>setLocal({...local,audit:v})}/></Field>
            <Field label="Reviewer"><Input value={local.reviewer||'compliance@co'} onChange={e=>setLocal({...local,reviewer:e.target.value})}/></Field>
            <Field label="SLA days"><Input type="number" value={local.sla||7} onChange={e=>setLocal({...local,sla:Number(e.target.value||0)})}/></Field>
            <div className="md:col-span-3"><button className="px-3 text-xs border rounded-lg h-9" onClick={()=>save(`Audits ${local.audit? 'on':'off'}`)}>Save</button></div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2"><div className="bg-indigo-600 size-8 rounded-xl" /><h1 className="font-semibold">CEO Setup Matrix — Action Hub</h1></div>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={view} onChange={e=>setView(e.target.value)}><option>Company</option><option>Dept</option></Select>
            {view==='Dept' && <Select value={company} onChange={e=>setCompany(e.target.value)}>{companies.map(c=> <option key={c}>{c}</option>)}</Select>}
            <Select value={period} onChange={e=>setPeriod(e.target.value)}><option>FY 2025</option><option>FY 2026</option></Select>
            <div className="rounded-full size-8 bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
        <section className="space-y-4">
          <Card title="Filters" subtitle="Focus on what is not done yet">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <Field label="Status"><Select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Not set</option><option>Partial</option><option>Done</option></Select></Field>
              <Field label="Search"><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Module or column"/></Field>
              <div className="flex items-end gap-2 md:col-span-3">
                <button className="px-3 text-xs border rounded-lg h-9" onClick={()=>setFilter('Not set')}>Only missing</button>
                <button className="px-3 text-xs border rounded-lg h-9" onClick={()=>setFilter('All')}>Show all</button>
              </div>
            </div>
          </Card>

          <Matrix title="Setup matrix" rows={MODULES} />

          <Card title="Do next" subtitle="Top 8 gaps by priority">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {prioritized.map((g,i)=> (
                <button key={i} onClick={()=>setInspector({open:true, scope:g.scope, module:g.module})} className="flex items-center justify-between p-2 text-left border rounded-lg hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium">{g.label}</div>
                    <div className="text-xs text-gray-500">{scopeLabel(g.scope)}</div>
                  </div>
                  <Badge tone={g.status.state==='Not set'?'rose':'amber'}>{g.status.state}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          {inspector.open? <Inspector/> : (
            <Card title="Inspector" subtitle="Select a cell → Set up">
              <div className="text-xs text-gray-500">Click any cell's Set up/Edit to configure that module for a specific column. This panel will show the right mini-form for quick completion.</div>
            </Card>
          )}

          <Card title="Shortcuts" subtitle="Open full screens">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button className="px-3 border rounded-lg h-9">Organization Setup</button>
              <button className="px-3 border rounded-lg h-9">Delegation Overrides</button>
              <button className="px-3 border rounded-lg h-9">Budget & KPI Manager</button>
              <button className="px-3 border rounded-lg h-9">Approvals Cockpit</button>
            </div>
          </Card>

          <Card title="Summary" subtitle="Progress">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 border rounded-xl bg-slate-50"><div className="text-xs text-gray-500">Columns</div><div className="text-lg font-semibold">{cols.length}</div></div>
              <div className="p-3 border rounded-xl bg-slate-50"><div className="text-xs text-gray-500">Modules</div><div className="text-lg font-semibold">{MODULES.length}</div></div>
            </div>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-xs text-center text-slate-500">© 2025 Your Company • PDPL compliant • Audit ready</footer>
    </div>
  );
}
