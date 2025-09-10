// ERP HR – Wave 4 Console (JSX)
// Scope: Optimization, Compliance Pack (báo cáo cơ quan), Security Hardening, Load Test, SOP vận hành + Audit
// All mock/seed only, React + Tailwind, no external libs

import React, { useMemo, useState } from "react";

// ------- helpers -------
function vnd(n){ return Number(n||0).toLocaleString('vi-VN'); }
function downloadText(filename, text){ const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }
function monthISO(d){ const x=d?new Date(d):new Date(); const y=new Date(x.getFullYear(),x.getMonth(),1); return y.toISOString().slice(0,10); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

// ------- atoms -------
function Section({title, children}){ return (<div className="mb-6"><div className="mb-3 text-lg font-semibold">{title}</div><div className="p-4 bg-white border shadow rounded-2xl">{children}</div></div>); }
function Pill({text,tone='indigo'}){ const map={indigo:'bg-indigo-100 text-indigo-700',green:'bg-green-100 text-green-700',amber:'bg-amber-100 text-amber-700',red:'bg-red-100 text-red-700',blue:'bg-blue-100 text-blue-700'}; return <span className={`px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{text}</span>; }
function Stat({label,value,sub}){ return (<div className="p-3 border bg-gray-50 rounded-xl"><div className="text-xs text-gray-500">{label}</div><div className="text-xl font-semibold">{value}</div>{sub&&<div className="mt-1 text-xs text-gray-500">{sub}</div>}</div>); }

// ------- tabs -------
function OptimizationTab({audit}){
  const [bundleKb,setBundleKb]=useState(820);
  const [imgKb,setImgKb]=useState(1400);
  const [routes,setRoutes]=useState([{id:'r1', name:'Employee 360', lazy:true},{id:'r2', name:'Payroll', lazy:false},{id:'r3', name:'Recruitment', lazy:false}]);
  const [advice,setAdvice]=useState([]);
  function analyze(){
    const a=[];
    if(bundleKb>500) a.push('Bundle >500KB: bật code-splitting và tree-shaking, kiểm tra deps nặng.');
    if(imgKb>600) a.push('Ảnh tĩnh lớn: dùng WebP/AVIF, CDN cache, đặt width/height cố định.');
    if(routes.some(r=>!r.lazy)) a.push('Một số route chưa lazy: chuyển sang dynamic import().');
    if(a.length===0) a.push('Tốt! Không phát hiện vấn đề lớn.');
    setAdvice(a); audit('opt.analyze', 'perf', JSON.stringify({bundleKb,imgKb,notLazy:routes.filter(r=>!r.lazy).map(r=>r.name)}));
  }
  function toggleLazy(id){ setRoutes(prev=> prev.map(r=> r.id===id? {...r, lazy:!r.lazy}: r)); }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Hiện trạng">
        <div className="grid gap-3 mb-3 sm:grid-cols-3">
          <Stat label="Bundle" value={`${bundleKb} KB`} sub="app + vendor"/>
          <Stat label="Ảnh tĩnh" value={`${imgKb} KB`} sub="hero, icons, logos"/>
          <Stat label="Route lazy" value={`${routes.filter(r=>r.lazy).length}/${routes.length}`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><div className="text-sm">Bundle size (KB)</div><input type="number" value={bundleKb} onChange={e=>setBundleKb(Number(e.target.value||0))} className="w-full px-3 py-2 border rounded-xl"/></div>
          <div><div className="text-sm">Static images (KB)</div><input type="number" value={imgKb} onChange={e=>setImgKb(Number(e.target.value||0))} className="w-full px-3 py-2 border rounded-xl"/></div>
        </div>
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium">Routes</div>
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500"><th className="py-1 text-left">Route</th><th className="py-1 text-left">Lazy</th></tr></thead>
            <tbody>{routes.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-1">{r.name}</td>
                <td className="py-1"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={r.lazy} onChange={()=>toggleLazy(r.id)} />Lazy</label></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={analyze}>Analyze</button>
      </Section>
      <Section title="Gợi ý tối ưu">
        {advice.length===0 && <div className="text-gray-500">Chưa có gợi ý. Bấm Analyze.</div>}
        <ul className="pl-5 text-sm list-disc">
          {advice.map((t,i)=> (<li key={i}>{t}</li>))}
        </ul>
      </Section>
    </div>
  );
}

function CompliancePackTab({audit}){
  const [company,setCompany]=useState('KTEST JSC');
  const [tax,setTax]=useState('0312345678');
  const [period,setPeriod]=useState(monthISO());
  const [chk,setChk]=useState({ labor:true, bhxh:true, pit:true });
  function buildPack(){
    const payload={ company, tax, period, reports: Object.keys(chk).filter(k=>chk[k]) };
    const content=JSON.stringify(payload,null,2);
    downloadText(`compliance_${period}.json`, content);
    audit('compliance.pack', period, content);
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Thiết lập">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" className="px-3 py-2 border rounded-xl"/>
          <input value={tax} onChange={e=>setTax(e.target.value)} placeholder="MST" className="px-3 py-2 border rounded-xl"/>
          <input type="month" value={period.slice(0,7)} onChange={e=>setPeriod(e.target.value+'-01')} className="px-3 py-2 border rounded-xl"/>
        </div>
        <div className="grid gap-3 mt-3 text-sm sm:grid-cols-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={chk.labor} onChange={e=>setChk({...chk,labor:e.target.checked})}/>Báo cáo Lao động</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={chk.bhxh} onChange={e=>setChk({...chk,bhxh:e.target.checked})}/>BHXH (mẫu nộp)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={chk.pit} onChange={e=>setChk({...chk,pit:e.target.checked})}/>Thuế TNCN</label>
        </div>
        <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={buildPack}>Tạo gói</button>
      </Section>
      <Section title="Mô tả gói (demo)">
        <ul className="pl-5 text-sm list-disc">
          <li>Báo cáo Lao động: tổng hợp headcount, biến động, hợp đồng mới/chấm dứt.</li>
          <li>BHXH: file kê khai mức đóng, tăng/giảm lao động, quỹ ốm đau thai sản.</li>
          <li>Thuế TNCN: bảng kê khấu trừ tháng/quý, chứng từ khấu trừ (nếu có).</li>
        </ul>
      </Section>
    </div>
  );
}

function SecurityTab({audit}){
  const groups=[
    {name:'Authentication', items:[ 'MFA bắt buộc cho Admin', 'JWT exp ≤ 60m', 'Rotate secrets 90d' ]},
    {name:'Data', items:[ 'Encrypt at rest (DB)', 'TLS 1.2+', 'PII masking in logs' ]},
    {name:'Network', items:[ 'WAF bật', 'Rate limit per IP', 'CORS whitelist' ]},
    {name:'Build/Deploy', items:[ 'SBOM tạo mỗi build', 'SAST/DAST pass', 'Least-privilege IAM' ]},
  ];
  const [state,setState]=useState(()=>{
    const s={}; groups.forEach(g=> g.items.forEach(it=> s[`${g.name}:${it}`]={owner:'', due:addDays(14), ok:false})); return s;
  });
  const total=Object.keys(state).length; const done=Object.values(state).filter(x=>x.ok).length; const p=Math.round(100*done/(total||1));
  function setItem(key,patch){ setState(prev=> ({...prev, [key]: {...prev[key], ...patch}})); }
  function exportChecklist(){ const json=JSON.stringify(state,null,2); downloadText('security_checklist.json', json); audit('security.export','checklist',`items=${total}`); }
  return (
    <div>
      <Section title="Mức độ hoàn tất">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Items" value={total} />
          <Stat label="Done" value={done} />
          <Stat label="%" value={`${p}%`} />
        </div>
      </Section>
      {groups.map(g=> (
        <Section key={g.name} title={g.name}>
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500"><th className="py-2 text-left">Control</th><th>Owner</th><th>Due</th><th>OK</th></tr></thead>
            <tbody>
              {g.items.map(it=>{
                const k=`${g.name}:${it}`; const v=state[k];
                return (
                  <tr key={k} className="border-t">
                    <td className="py-2">{it}</td>
                    <td className="py-2"><input value={v.owner} onChange={e=>setItem(k,{owner:e.target.value})} className="px-2 py-1 border rounded-lg"/></td>
                    <td className="py-2"><input type="date" value={(v.due||'').slice(0,10)} onChange={e=>setItem(k,{due:e.target.value})} className="px-2 py-1 border rounded-lg"/></td>
                    <td className="py-2 text-center"><input type="checkbox" checked={!!v.ok} onChange={e=>setItem(k,{ok:e.target.checked})}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3"><button className="px-3 py-1.5 rounded-xl border" onClick={exportChecklist}>Export checklist</button></div>
        </Section>
      ))}
    </div>
  );
}

function LoadTestTab({audit}){
  const [target,setTarget]=useState('https://api.example.com');
  const [rps,setRps]=useState(50);
  const [dur,setDur]=useState(60);
  const [mix,setMix]=useState([
    {id:'m1', name:'GET /api/employees', pct:50},
    {id:'m2', name:'GET /api/payroll/runs', pct:30},
    {id:'m3', name:'POST /api/payroll/calc', pct:20},
  ]);
  const [report,setReport]=useState(null);

  function run(){
    // mock simulate
    const endpoints=mix.map(m=> ({ name:m.name, pct:m.pct, p50: (100+Math.random()*50)|0, p95:(250+Math.random()*200)|0, err:(Math.random()*2).toFixed(2) }));
    const summary={ ts:new Date().toISOString(), target, rps, dur, requests:rps*dur, endpoints };
    setReport(summary); audit('load.run', target, JSON.stringify({rps,dur}));
  }
  function bar(width){ return <div className="h-2 bg-indigo-200 rounded" style={{width: `${Math.min(100,width)}%`}}/>; }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Cấu hình">
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target base URL" className="px-3 py-2 border rounded-xl"/>
          <div><div className="text-sm">RPS</div><input type="number" value={rps} onChange={e=>setRps(Number(e.target.value||0))} className="w-full px-3 py-2 border rounded-xl"/></div>
          <div><div className="text-sm">Duration (s)</div><input type="number" value={dur} onChange={e=>setDur(Number(e.target.value||0))} className="w-full px-3 py-2 border rounded-xl"/></div>
        </div>
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium">Endpoint mix</div>
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500"><th className="py-1 text-left">Endpoint</th><th className="py-1 text-right">%</th></tr></thead>
            <tbody>
              {mix.map(m=> (
                <tr key={m.id} className="border-t">
                  <td className="py-1">{m.name}</td>
                  <td className="py-1 text-right"><input type="number" value={m.pct} onChange={e=>setMix(prev=> prev.map(x=> x.id===m.id? {...x, pct:Number(e.target.value||0)}:x))} className="border rounded-lg px-2 py-0.5 w-20 text-right"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-3 px-3 py-1.5 rounded-xl border" onClick={run}>Run test</button>
      </Section>
      <Section title="Kết quả">
        {!report && <div className="text-gray-500">Chưa chạy. Bấm Run test.</div>}
        {report && (
          <div>
            <div className="grid gap-3 mb-3 sm:grid-cols-4">
              <Stat label="Requests" value={report.requests} />
              <Stat label="RPS" value={report.rps} />
              <Stat label="Duration" value={`${report.dur}s`} />
              <Stat label="Target" value={<span className="text-xs break-all">{report.target}</span>} />
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500"><th className="py-2 text-left">Endpoint</th><th className="py-2 text-left">p50 (ms)</th><th className="py-2 text-left">p95 (ms)</th><th className="py-2 text-left">Err %</th><th className="py-2 text-left">Visual</th></tr></thead>
              <tbody>
                {report.endpoints.map((e,i)=> (
                  <tr key={i} className="border-t">
                    <td className="py-2">{e.name}</td>
                    <td className="py-2">{e.p50}</td>
                    <td className="py-2">{e.p95}</td>
                    <td className="py-2">{e.err}</td>
                    <td className="py-2">{bar(Math.min(100, e.p95/5))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1.5 rounded-xl border" onClick={()=>downloadText('load_report.json', JSON.stringify(report,null,2))}>Download JSON</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function SOPTab({audit}){
  const [title,setTitle]=useState('SOP Vận hành HRIS');
  const [owner,setOwner]=useState('Ops Lead');
  const [steps,setSteps]=useState([
    {id:'s1', cat:'Incident', text:'Nhận cảnh báo, xác định severity (SEV-1..4).'},
    {id:'s2', cat:'Escalation', text:'Báo On-call, lập bridge, cập nhật status mỗi 30ph.'},
    {id:'s3', cat:'Recovery', text:'Rollback/Failover theo runbook.'},
    {id:'s4', cat:'Postmortem', text:'Hoàn tất RCA trong 48h, plan hành động.'},
  ]);
  function add(){ setSteps(prev=> [...prev, {id:'s'+Date.now(), cat:'Khác', text:''}]); }
  function update(id,patch){ setSteps(prev=> prev.map(s=> s.id===id? {...s,...patch}:s)); }
  function remove(id){ setSteps(prev=> prev.filter(s=> s.id!==id)); }
  function download(){
    const md=['# '+title,'','**Owner:** '+owner,'','## Steps','', ...steps.map((s,i)=> `${i+1}. [${s.cat}] ${s.text}`),''].join('\n');
    downloadText('SOP.md', md); audit('sop.download', title, `steps=${steps.length}`);
  }
  function drill(){ audit('sop.drill','tabletop','SEV-2 email outage'); alert('Drill started (demo). Check audit.'); }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="SOP soạn thảo">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} className="px-3 py-2 border rounded-xl"/>
          <input value={owner} onChange={e=>setOwner(e.target.value)} className="px-3 py-2 border rounded-xl"/>
        </div>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-gray-500"><th>Cat</th><th>Nội dung</th><th></th></tr></thead>
          <tbody>
            {steps.map(s=> (
              <tr key={s.id} className="border-t">
                <td className="py-2"><input value={s.cat} onChange={e=>update(s.id,{cat:e.target.value})} className="px-2 py-1 border rounded-lg w-28"/></td>
                <td className="py-2"><input value={s.text} onChange={e=>update(s.id,{text:e.target.value})} className="w-full px-2 py-1 border rounded-lg"/></td>
                <td className="py-2 text-right"><button className="px-2 py-1 border rounded-lg" onClick={()=>remove(s.id)}>X</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-1.5 rounded-xl border" onClick={add}>+ Thêm bước</button>
          <button className="px-3 py-1.5 rounded-xl border" onClick={download}>Download SOP.md</button>
          <button className="px-3 py-1.5 rounded-xl border" onClick={drill}>Diễn tập</button>
        </div>
      </Section>
      <Section title="Gợi ý nội dung (demo)">
        <ul className="pl-5 text-sm list-disc">
          <li>On-call rota, khung giờ, kênh liên lạc.</li>
          <li>Runbook: reset mật khẩu, khôi phục backup, xử lý chậm/timeout.</li>
          <li>Checklist sau deploy: healthcheck, log errors, rollback plan.</li>
        </ul>
      </Section>
    </div>
  );
}

function AuditTab({events}){
  return (
    <Section title="Audit">
      <div className="border rounded-xl bg-gray-50 max-h-[420px] overflow-auto">
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

// ------- main -------
export default function HRWave4Console(){
  const [tab,setTab]=useState('opt');
  const [audit,setAudit]=useState([]);
  function log(action,target,detail){ setAudit(prev=> [{ts:new Date().toISOString(), actor:'you', action, target, detail}, ...prev]); }

  const tabs=[
    {key:'opt', label:'Optimization', node:<OptimizationTab audit={log}/>},
    {key:'comp', label:'Compliance Pack', node:<CompliancePackTab audit={log}/>},
    {key:'sec', label:'Security Hardening', node:<SecurityTab audit={log}/>},
    {key:'load', label:'Load Test', node:<LoadTestTab audit={log}/>},
    {key:'sop', label:'SOP vận hành', node:<SOPTab audit={log}/>},
    {key:'audit', label:'Audit', node:<AuditTab events={audit}/>},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 mx-auto max-w-7xl md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold">ERP HR – Wave 4</div>
            <div className="text-sm text-gray-500">Tối ưu • Báo cáo cơ quan • Hardening • Load test • SOP</div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> setAudit([])}>Clear audit</button>
            <button className="px-3 py-1.5 rounded-xl border" onClick={()=> log('snapshot.capture','wave4')}>Capture snapshot</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="p-2 bg-white border shadow rounded-2xl">
            {tabs.map(t=> (
              <div key={t.key} className={`px-3 py-2 rounded-xl cursor-pointer text-sm ${tab===t.key?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`} onClick={()=>setTab(t.key)}>{t.label}</div>
            ))}
          </div>
          <div>{(tabs.find(t=>t.key===tab)||tabs[0]).node}</div>
        </div>
      </div>
    </div>
  );
}
