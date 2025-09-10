
// src/components/fin/BudgetInputGrid.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listAccounts, ensureSeed as ensureCoASeed } from '../../mock/coa';
import { seedIfEmpty, listTypes, listValues, type DimensionType, type DimensionValue } from '../../mock/dimensions';
import { MONTHS, newScenario, getCurrent, setCurrent, upsertScenario, addLine, deleteLine, spreadEven, sumLine, sumByMonth, exportCSV, importCSV, validateScenario, type BudgetScenario, type BudgetLine } from '../../mock/budget';

type Tab = 'grid'|'validate'|'help';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function Field({ label, children }: { label:string, children:any }){
  return <label style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, alignItems:'center' }}><div style={{ color:'#6b7280', fontSize:12 }}>{label}</div><div>{children}</div></label>;
}
function num(v:any){ const n = Number(v); return Number.isFinite(n) ? n : 0; }

export const BudgetInputGrid: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [tab, setTab] = useState<Tab>('grid');

  // Data sources
  const [accounts, setAccounts] = useState<Array<{ code:string, name:string, type:string }>>([]);
  const [types, setTypes] = useState<DimensionType[]>([]);
  const [projects, setProjects] = useState<DimensionValue[]>([]);
  const [depts, setDepts] = useState<DimensionValue[]>([]);

  // Scenario
  const [scenario, setScenario] = useState<BudgetScenario | null>(null);
  const [csvText, setCsvText] = useState('');

  // Load seeds and current scenario
  useEffect(()=>{
    ensureCoASeed(); seedIfEmpty();
    const accs = listAccounts().filter(a => a.is_postable && (a.type==='expense' || a.type==='revenue'));
    setAccounts(accs.map(a => ({ code:a.code, name:a.name_vi, type:a.type })));
    const ts = listTypes(); setTypes(ts);
    const prj = listValues('PROJECT'); setProjects(prj);
    const dp = listValues('DEPT'); setDepts(dp);

    let sc = getCurrent();
    if (!sc) sc = newScenario('FY Budget (Draft)', new Date().getFullYear(), 'VND');
    setScenario({ ...sc });
  }, []);

  const set = (patch: Partial<BudgetScenario>) => { if (!scenario) return; const next = { ...scenario, ...patch } as BudgetScenario; setScenario(next); upsertScenario(next); };

  const addRow = () => { if (!scenario) return; const l = addLine(scenario, {}); setScenario({ ...getCurrent()! }); };
  const delRow = (id: string) => { if (!scenario) return; deleteLine(scenario, id); setScenario({ ...getCurrent()! }); };

  const onChangeCell = (line: BudgetLine, m: string, value: any) => {
    if (!scenario) return;
    if (scenario.locked_months[m as any]) return;
    const v = num(value);
    line.amounts[m as any] = v;
    upsertScenario(scenario); setScenario({ ...scenario });
  };

  const colTotals = useMemo(()=> scenario ? sumByMonth(scenario.lines) : ({} as any), [scenario?.lines]);

  const handleExport = () => { if (!scenario) return; const csv = exportCSV(scenario); const blob = new Blob([csv], { type:'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`budget_${scenario.fiscal_year}.csv`; a.click(); URL.revokeObjectURL(url); };
  const handleImport = () => { if (!scenario) return; importCSV(scenario, csvText); setScenario({ ...getCurrent()! }); alert(t('Đã nạp CSV','Imported CSV')); };

  const lockToggle = (m: string) => { if (!scenario) return; const lm:any = { ...(scenario.locked_months||{}) }; lm[m] = !lm[m]; set({ locked_months: lm }); };

  const spreadRow = (line: BudgetLine) => {
    const target = prompt(t('Tổng năm để phân bổ đều? (bỏ trống = dùng tổng hiện tại)','Year total to spread evenly? (leave blank = use current sum)'));
    const total = target ? Number(target) : sumLine(line);
    if (Number.isNaN(total)) return;
    spreadEven(line, total);
    upsertScenario(scenario!); setScenario({ ...scenario! });
  };
  const spreadAll = () => { if (!scenario) return;
    const ok = confirm(t('Phân bổ đều tất cả các dòng theo tổng hiện tại?','Evenly spread all rows using current totals?'));
    if (!ok) return;
    scenario.lines.forEach(l => spreadEven(l, sumLine(l)));
    upsertScenario(scenario); setScenario({ ...scenario });
  };

  const { ok, errors } = useMemo(()=> scenario ? validateScenario(scenario) : { ok:false, errors:[], warnings:[] }, [scenario]);

  const headerMonth = (mk: string) => {
    const idx = MONTHS.indexOf(mk as any);
    const name = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx];
    return `${name}`;
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'grid', gap:6 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontWeight:800 }}>{t('Bảng nhập ngân sách','Budget Input Grid')}</div>
            <Badge text="FIN-06" />
            <span style={{ color:'#6b7280', fontSize:12 }}>{t('Hỗ trợ phân bổ đều (spread helper), khoá theo tháng, CSV import/export','Spread helper, month locks, CSV import/export')}</span>
          </div>
          {scenario && (
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <Field label={t('Năm tài chính','Fiscal year')}><input type="number" value={scenario.fiscal_year} onChange={e=>set({ fiscal_year: Number(e.target.value)||new Date().getFullYear() })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} /></Field>
              <Field label={t('Tiền tệ','Currency')}><input value={scenario.currency} onChange={e=>set({ currency: e.target.value.toUpperCase() })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} /></Field>
              <Field label={t('Tên kịch bản','Scenario name')}><input value={scenario.name} onChange={e=>set({ name: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:260 }} /></Field>
              <Field label={t('Trạng thái','Status')}>
                <select value={scenario.status} onChange={e=>set({ status: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option value="draft">{t('Nháp','Draft')}</option>
                  <option value="locked">{t('Khoá','Locked')}</option>
                  <option value="submitted">{t('Nộp duyệt','Submitted')}</option>
                </select>
              </Field>
            </div>
          )}
        </div>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={addRow} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Thêm dòng','Add row')}</button>
            <button onClick={spreadAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Phân bổ đều tất cả','Spread all evenly')}</button>
            <button onClick={()=>setTab('validate')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Kiểm tra','Validate')}</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {(['grid','validate','help'] as Tab[]).map(k => (
              <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background: tab===k ? '#eef2ff':'#fff' }}>{k.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid + Side panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:12 }}>
        {/* Grid */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:980 }}>
            <thead style={{ position:'sticky', top:0, background:'#fff', zIndex:1 }}>
              <tr style={{ borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px', whiteSpace:'nowrap' }}>#</th>
                <th style={{ padding:'6px', whiteSpace:'nowrap' }}>{t('TK','Account')}</th>
                <th style={{ padding:'6px', whiteSpace:'nowrap' }}>{t('Dự án','Project')}</th>
                <th style={{ padding:'6px', whiteSpace:'nowrap' }}>{t('Phòng ban','Dept')}</th>
                <th style={{ padding:'6px', whiteSpace:'nowrap' }}>{t('Ghi chú','Note')}</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ padding:'6px', textAlign:'right', whiteSpace:'nowrap' }}>
                    {headerMonth(m)}<br/>
                    <label style={{ fontSize:11, color:'#6b7280' }}>
                      <input type="checkbox" checked={!!scenario?.locked_months[m]} onChange={()=>lockToggle(m)} /> lock
                    </label>
                  </th>
                ))}
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Tổng năm','Year Total')}</th>
                <th style={{ padding:'6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {scenario?.lines.map((l, idx) => (
                <tr key={l.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px', textAlign:'right' }}>{idx+1}</td>
                  <td style={{ padding:'6px', minWidth:160 }}>
                    <input list="acc_list" value={l.account_code||''} onChange={e=>{ l.account_code = e.target.value; upsertScenario(scenario); setScenario({ ...scenario }); }} placeholder="6421" style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }} />
                  </td>
                  <td style={{ padding:'6px', minWidth:160 }}>
                    <select value={l.project_code||''} onChange={e=>{ l.project_code=e.target.value||undefined; upsertScenario(scenario!); setScenario({ ...scenario! }); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }}>
                      <option value="">{t('— Không —','— None —')}</option>
                      {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'6px', minWidth:160 }}>
                    <select value={l.dept_code||''} onChange={e=>{ l.dept_code=e.target.value||undefined; upsertScenario(scenario!); setScenario({ ...scenario! }); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }}>
                      <option value="">{t('— Không —','— None —')}</option>
                      {depts.map(d => <option key={d.code} value={d.code}>{d.code} — {d.name_vi}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'6px', minWidth:180 }}>
                    <input value={l.note||''} onChange={e=>{ l.note=e.target.value; upsertScenario(scenario!); setScenario({ ...scenario! }); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }} />
                  </td>
                  {MONTHS.map(m => (
                    <td key={m} style={{ padding:'6px', textAlign:'right', background: scenario?.locked_months[m]? '#f8fafc' : undefined }}>
                      <input
                        type="number" step="0.01"
                        value={l.amounts[m]}
                        onChange={e=>onChangeCell(l, m, e.target.value)}
                        disabled={!!scenario?.locked_months[m] || scenario?.status==='locked'}
                        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:110, textAlign:'right' }}
                      />
                    </td>
                  ))}
                  <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{sumLine(l).toLocaleString()}</td>
                  <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                    <button onClick={()=>spreadRow(l)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Phân bổ','Spread')}</button>
                    <button onClick={()=>delRow(l.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 8px', background:'#fff', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                  </td>
                </tr>
              ))}
              {/* Column totals */}
              {scenario && (
                <tr style={{ borderTop:'2px solid #e5e7eb', background:'#fafafa' }}>
                  <td colSpan={5} style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{t('Tổng theo tháng','Totals by month')}</td>
                  {MONTHS.map(m => <td key={m} style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{(colTotals as any)[m]?.toLocaleString?.() || '0'}</td>)}
                  <td style={{ padding:'6px', textAlign:'right', fontWeight:800 }}>
                    {Object.values(colTotals).reduce((a:any,b:any)=>a+(Number(b)||0),0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
          <datalist id="acc_list">
            {accounts.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
          </datalist>
        </div>

        {/* Right panel: CSV & Locks & Validate */}
        <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8 }}>
            <div style={{ fontWeight:700 }}>{t('CSV','CSV')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Header','Header')}: <code>account_code,project_code,dept_code,note,M01..M12</code></div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
              <button onClick={handleImport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Nạp CSV','Import')}</button>
            </div>
            <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} placeholder="Paste CSV here" style={{ width:'100%', minHeight:120, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', fontFamily:'monospace' }} />
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Khoá theo tháng','Month locks')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
              {MONTHS.map(m => (
                <label key={m} style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background: scenario?.locked_months[m]? '#f8fafc':'#fff' }}>
                  <input type="checkbox" checked={!!scenario?.locked_months[m]} onChange={()=>lockToggle(m)} />
                  <span>{headerMonth(m)}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, overflow:'auto' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Kiểm tra','Validation')}</div>
            {ok ? <div style={{ color:'#16a34a' }}>{t('Không có lỗi','No errors')}</div> : <ul>{errors.map((e,i)=><li key={i} style={{ color:'#ef4444' }}>{e}</li>)}</ul>}
            <div style={{ color:'#6b7280', fontSize:12, marginTop:8 }}>{t('Gợi ý','Hint')}: {t('dùng nút "Phân bổ" để trải đều theo 12 tháng.','use "Spread" to distribute evenly across 12 months.')}</div>
          </div>
        </div>
      </div>

      {/* Help */}
      {tab==='help' && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700 }}>{t('Gợi ý tích hợp','Integration notes')}</div>
          <ul>
            <li>{t('Đọc danh mục TK từ CoA (FIN‑01/02/03) — chỉ cho phép khai ngân sách trên TK expense/revenue.','Use CoA for GL accounts (expense/revenue)')}</li>
            <li>{t('Đọc chiều PROJECT/DEPT từ FIN‑04/05.','Use PROJECT/DEPT dimensions from FIN‑04/05.')}</li>
            <li>{t('API đề xuất','Suggested API')}: <code>GET/POST /fin/budget/scenarios</code>, <code>POST /fin/budget/{'{id}'}:import_csv</code>, <code>GET /fin/budget/{'{id}'}:export_csv</code></li>
            <li>{t('Khoá tháng để ngăn chỉnh sửa sau khi chốt kỳ.','Lock months after cut-off.')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
