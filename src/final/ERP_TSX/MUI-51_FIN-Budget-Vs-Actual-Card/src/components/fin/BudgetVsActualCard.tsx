
// src/components/fin/BudgetVsActualCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listAccounts, ensureSeed as ensureCoASeed } from '../../mock/coa';
import { listScenarios, getCurrent, newScenario, setCurrent, type BudgetScenario } from '../../mock/budget';
import { seedIfEmpty, listValues } from '../../mock/dimensions';
import { seedActualsIfEmpty, listActuals, type GLEntry } from '../../mock/gl_actuals';

type PeriodMode = 'MTD'|'YTD';
type GroupMode = 'overall'|'account'|'project'|'dept';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function PercentBar({ pct, tone }: { pct:number, tone:'green'|'red'|'amber'|'slate' }){
  const cap = Math.min(200, Math.max(0, pct));
  return (
    <div style={{ height:10, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
      <div style={{ width:`${cap}%`, height:'100%', background: tone==='green'?'#22c55e': tone==='red'?'#ef4444': tone==='amber'?'#f59e0b':'#94a3b8' }} />
    </div>
  );
}

export const BudgetVsActualCard: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // Seeds
  useEffect(()=>{ ensureCoASeed(); seedIfEmpty(); seedActualsIfEmpty(); if (!getCurrent()) newScenario('FY Budget (Draft)', new Date().getFullYear(), 'VND'); }, []);

  const accounts = useMemo(()=> listAccounts(), []);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [scenarioId, setScenarioId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth()+1); // 1..12
  const [period, setPeriod] = useState<PeriodMode>('YTD');
  const [group, setGroup] = useState<GroupMode>('overall');

  const [project, setProject] = useState<string>(''); // optional filter
  const [dept, setDept] = useState<string>('');

  const prjList = useMemo(()=> listValues('PROJECT'), []);
  const deptList = useMemo(()=> listValues('DEPT'), []);

  useEffect(()=>{ const arr = listScenarios(); setScenarios(arr); const cur = getCurrent(); if (cur) setScenarioId(cur.id); }, []);

  const scenario = useMemo(()=> scenarios.find(s => s.id===scenarioId) || getCurrent(), [scenarios, scenarioId]);

  // Helper: month keys
  const months: string[] = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12'];
  const monthLabel = (m:number)=> ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];

  // Actuals calc (debit/credit to signed amount by account type)
  const actualLines = useMemo(() => {
    const all = listActuals();
    const inYear = all.filter(a => new Date(a.date).getUTCFullYear() === (scenario?.fiscal_year || new Date().getFullYear()));
    const inPeriod = inYear.filter(a => {
      const mm = new Date(a.date).getUTCMonth()+1;
      return period==='MTD' ? (mm===month) : (mm<=month);
    });
    const matchProject = project ? (a:GLEntry)=> a.project_code===project : (_:GLEntry)=> true;
    const matchDept = dept ? (a:GLEntry)=> a.dept_code===dept : (_:GLEntry)=> true;
    return inPeriod.filter(a => matchProject(a) && matchDept(a));
  }, [scenario?.fiscal_year, period, month, project, dept, listActuals()]);

  function accountType(accCode: string): 'revenue'|'expense'|'other' {
    const acc = accounts.find(a => a.code===accCode);
    if (!acc) return 'other';
    return (acc as any).type || 'other';
  }
  function signedAmount(gl: GLEntry): number {
    const t = accountType(gl.account);
    const amt = (gl.debit||0) - (gl.credit||0);
    // for revenue, credit is positive actual — invert sign
    if (t==='revenue') return -amt; // so revenue credit gives positive
    return amt; // expenses: debit positive
  }

  // Aggregate actuals by key
  const actualByKey = useMemo(()=> {
    const m: Record<string, number> = {};
    actualLines.forEach(l => {
      const key = group==='overall' ? 'ALL' : group==='account' ? l.account : group==='project' ? (l.project_code||'—') : (l.dept_code||'—');
      m[key] = (m[key]||0) + signedAmount(l);
    });
    return m;
  }, [actualLines, group]);

  // Budget calc
  const budgetByKey = useMemo(()=> {
    const m: Record<string, number> = {};
    if (!scenario) return m;
    const upto = months.slice(0, month);
    scenario.lines.forEach(l => {
      if (project && l.project_code!==project) return;
      if (dept && l.dept_code!==dept) return;
      const sum = upto.reduce((s,k)=> s + (Number((l as any).amounts?.[k]) || 0), 0);
      const key = group==='overall' ? 'ALL' : group==='account' ? l.account_code : group==='project' ? (l.project_code||'—') : (l.dept_code||'—');
      m[key] = (m[key]||0) + sum;
    });
    return m;
  }, [scenario, month, project, dept, group]);

  // Merge keys
  const keys = useMemo(()=> {
    const set = new Set<string>([...Object.keys(budgetByKey), ...Object.keys(actualByKey)]);
    if (group==='overall') return ['ALL'];
    return Array.from(set).sort();
  }, [budgetByKey, actualByKey, group]);

  type Row = { key:string; name:string; budget:number; actual:number; variance:number; pct:number; tone:'green'|'red'|'amber'|'slate' };
  const rows: Row[] = useMemo(()=> {
    const out: Row[] = [];
    keys.forEach(k => {
      const budget = budgetByKey[k] || 0;
      const actual = actualByKey[k] || 0;
      const variance = actual - budget;
      const pct = budget>0 ? (actual / budget) * 100 : (actual>0 ? 200 : 0);
      // tone: for expense, >100% is red; for revenue, >100% is green
      let tone:'green'|'red'|'amber'|'slate' = 'slate';
      const accType = group==='account' ? accountType(k) : 'expense'; // default assume expense for overall/project/dept
      if (accType==='revenue') {
        if (pct >= 110) tone='green'; else if (pct>=90) tone='amber'; else tone='red';
      } else {
        if (pct <= 90) tone='green'; else if (pct<=110) tone='amber'; else tone='red';
      }
      const name =
        group==='overall' ? t('Tổng','Total') :
        group==='account' ? `${k} — ${(listAccounts().find(a => a.code===k)?.name_vi || k)}` :
        k;
      out.push({ key:k, name, budget, actual, variance, pct, tone });
    });
    return out.sort((a,b)=> Math.abs(b.variance)-Math.abs(a.variance)); // sort by magnitude
  }, [keys, budgetByKey, actualByKey, group]);

  // Drill drawer
  const [drillKey, setDrillKey] = useState<string>('');
  const drillLines = useMemo(()=> {
    if (!drillKey) return [];
    return actualLines.filter(l => {
      if (group==='overall') return true;
      if (group==='account') return l.account===drillKey;
      if (group==='project') return (l.project_code||'—')===drillKey;
      return (l.dept_code||'—')===drillKey;
    });
  }, [drillKey, actualLines, group]);

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, width:'min(1200px, 96vw)' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Budget vs Actual','Budget vs Actual')}</div>
          <Badge text="FIN-07" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Theo dõi ngân sách so với thực tế, có drill‑down','Track budget vs actual with drilldown')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          <select value={scenario?.id||''} onChange={e=>{ setScenarioId(e.target.value); setCurrent(e.target.value); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name} — {s.fiscal_year}</option>)}
          </select>
          <select value={period} onChange={e=> setPeriod(e.target.value as PeriodMode)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="YTD">YTD</option>
            <option value="MTD">MTD</option>
          </select>
          <select value={month} onChange={e=> setMonth(parseInt(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {Array.from({length:12}, (_,i)=>i+1).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select value={group} onChange={e=> setGroup(e.target.value as GroupMode)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="overall">{t('Tổng','Overall')}</option>
            <option value="account">{t('Theo tài khoản','By account')}</option>
            <option value="project">{t('Theo dự án','By project')}</option>
            <option value="dept">{t('Theo phòng ban','By dept')}</option>
          </select>
          <select value={project} onChange={e=> setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Project: tất cả','Project: all')}</option>
            {prjList.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
          </select>
          <select value={dept} onChange={e=> setDept(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Dept: tất cả','Dept: all')}</option>
            {deptList.map(d => <option key={d.code} value={d.code}>{d.code} — {d.name_vi}</option>)}
          </select>
        </div>
      </div>

      {/* Rows */}
      <div style={{ marginTop:12, display:'grid', gap:8 }}>
        {rows.slice(0, group==='overall'? 1 : 10).map(r => (
          <div key={r.key} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ fontWeight:700 }}>{r.name}</div>
                <Badge text={(r.pct||0).toFixed(0)+'%'} tone={r.tone} />
              </div>
              <div style={{ fontFamily:'monospace', color:'#111827' }}>
                {t('NS','B')}: {r.budget.toLocaleString()} • {t('TT','A')}: {r.actual.toLocaleString()} • Δ: <b style={{ color: r.variance>0? '#ef4444':'#22c55e' }}>{r.variance.toLocaleString()}</b>
              </div>
            </div>
            <div style={{ marginTop:6 }}><PercentBar pct={r.pct} tone={r.tone} /></div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={()=> setDrillKey(r.key)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xem phát sinh','View items')}</button>
            </div>
          </div>
        ))}
        {rows.length===0 && <div style={{ color:'#6b7280' }}>— {t('Chưa có dữ liệu','No data')} —</div>}
      </div>

      {/* Drill drawer */}
      {drillKey && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(900px, 96vw)' }} onClick={()=>setDrillKey('')}>
          <div />
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Chi tiết phát sinh','Actual items')}</div>
              <button onClick={()=>setDrillKey('')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
            <div style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ padding:'6px' }}>Date</th>
                  <th style={{ padding:'6px' }}>{t('Tài khoản','Account')}</th>
                  <th style={{ padding:'6px' }}>Project</th>
                  <th style={{ padding:'6px' }}>Dept</th>
                  <th style={{ padding:'6px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
                  <th style={{ padding:'6px' }}>{t('Diễn giải','Memo')}</th>
                </tr></thead>
                <tbody>
                  {drillLines.map(l => (
                    <tr key={l.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'6px' }}>{new Date(l.date).toISOString().slice(0,10)}</td>
                      <td style={{ padding:'6px', fontFamily:'monospace' }}>{l.account}</td>
                      <td style={{ padding:'6px' }}>{l.project_code||'—'}</td>
                      <td style={{ padding:'6px' }}>{l.dept_code||'—'}</td>
                      <td style={{ padding:'6px', textAlign:'right' }}>{(Math.abs((l.debit||0)-(l.credit||0))).toLocaleString()}</td>
                      <td style={{ padding:'6px' }}>{l.memo||''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drillLines.length===0 && <div style={{ color:'#6b7280', padding:8 }}>—</div>}
            </div>
            <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={()=>{
                const header = 'date,account,project_code,dept_code,debit,credit,memo';
                const rows = drillLines.map(l => [new Date(l.date).toISOString().slice(0,10), l.account, l.project_code||'', l.dept_code||'', l.debit, l.credit, (l.memo||'').replace(/,/g,' ')].join(','));
                const csv = [header, ...rows].join('\n');
                const blob = new Blob([csv], { type:'text/csv' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='actual_items.csv'; a.click(); URL.revokeObjectURL(url);
              }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Export CSV','Export CSV')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
