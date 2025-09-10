
// src/components/fin/CoASetupWizard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seedTemplates, newDraftFrom, getDraft, saveDraft, commitDraft, validate, toCSV, fromCSV, upsertAccount, buildTree, type CoAAccount, type CoAVersion } from '../../mock/coa';

type Step = 1|2|3|4|5|6;

function Stepper({ step, setStep }: { step: Step, setStep: (s: Step)=>void }) {
  const items = [
    [1, 'Template'],
    [2, 'Structure'],
    [3, 'Import/CSV'],
    [4, 'Mapping'],
    [5, 'Validate'],
    [6, 'Commit'],
  ] as Array<[number,string]>;
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {items.map(([n, label]) => (
        <button key={n} onClick={()=>setStep(n as Step)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', background: step===n? '#eef2ff':'#fff' }}>
          {n}. {label}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children, extra }: { title:string, children:any, extra?:any }){
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr', overflow:'hidden' }}>
      <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>{title}</div>
        <div>{extra}</div>
      </div>
      <div style={{ padding:10 }}>{children}</div>
    </div>
  );
}

function Tree({ nodes }: { nodes: any[] }) {
  return (
    <ul style={{ margin:0, paddingLeft:16 }}>
      {nodes.map(n => (
        <li key={n.code} style={{ margin:'2px 0' }}>
          <span style={{ fontFamily:'monospace' }}>{n.code}</span> — {n.name} {n.is_postable? '' : <em style={{ color:'#6b7280' }}>(header)</em>}
          {n.children?.length>0 && <Tree nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

export const CoASetupWizard: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<CoAVersion | null>(null);
  const [accounts, setAccounts] = useState<CoAAccount[]>([]);
  const [mappings, setMappings] = useState<Record<string,string>>({});
  const [csvText, setCsvText] = useState('');
  const [search, setSearch] = useState('');

  useEffect(()=>{
    const d = getDraft();
    if (d) { setDraft(d); setAccounts(d.accounts||[]); setMappings(d.mappings||{}); }
    else {
      const templates = seedTemplates();
      const accs = Object.values(templates)[0];
      const nd = newDraftFrom(accs);
      saveDraft(nd);
      setDraft(nd); setAccounts(accs); setMappings({});
    }
  }, []);

  useEffect(()=>{
    if (!draft) return;
    const nd = { ...draft, accounts, mappings };
    saveDraft(nd);
  }, [accounts, mappings]);

  const templates = seedTemplates();
  const tree = useMemo(()=> buildTree(accounts), [accounts]);
  const filteredAccounts = useMemo(()=> accounts.filter(a => (a.code+' '+a.name_vi+' '+(a.name_en||'')).toLowerCase().includes(search.toLowerCase())), [accounts, search]);
  const summary = useMemo(()=> {
    const counts = { asset:0, liability:0, equity:0, revenue:0, expense:0, other:0 } as any;
    accounts.forEach(a => counts[a.type]++);
    const postable = accounts.filter(a=>a.is_postable).length;
    const headers = accounts.length - postable;
    return { total: accounts.length, postable, headers, ...counts };
  }, [accounts]);

  const replaceWithTemplate = (key: string) => {
    const accs = templates[key];
    setAccounts(accs);
    setMappings({});
    setStep(2);
  };

  const addRow = () => {
    const code = prompt('Mã tài khoản (VD: 6422)'); if (!code) return;
    const name_vi = prompt('Tên VI'); if (!name_vi) return;
    const parent_code = prompt('Mã cha (bỏ trống nếu không)') || undefined;
    const type = (prompt('Loại (asset/liability/equity/revenue/expense/other)','asset')||'asset') as any;
    const normal_side = (prompt('Normal side (debit/credit)','debit')||'debit') as any;
    const is_postable = confirm('Có cho phép hạch toán vào tài khoản này? (OK = Yes)');
    setAccounts(prev => upsertAccount(prev, { code, name_vi, parent_code, type, normal_side, is_postable }));
  };

  const exportCSV = () => {
    const csv = toCSV(accounts);
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='coa.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ accounts, mappings }, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='coa.json'; a.click(); URL.revokeObjectURL(url);
  };

  const { ok, errors, warnings } = validate(accounts, mappings);

  const doCommit = () => {
    try {
      if (!ok) { alert(t('Vui lòng sửa lỗi trước khi commit','Please fix errors before commit')); return; }
      const note = prompt(t('Ghi chú phiên bản','Commit notes'))||'';
      const v = commitDraft('admin', note);
      alert(t('Đã commit CoA phiên bản','Committed CoA version') + ' ' + v.version);
    } catch (e:any) {
      alert(e.message || String(e));
    }
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'grid', gap:6 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontWeight:800 }}>{t('Wizard thiết lập Sơ đồ tài khoản (CoA)','Chart of Accounts Setup Wizard')}</div>
            <span style={{ color:'#6b7280', fontSize:12 }}>{t('Vai trò','Roles')}: Finance, Admin</span>
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gồm các bước: chọn template → chỉnh cấu trúc → nhập CSV → mapping → kiểm tra → commit (kích hoạt).','Steps: choose template → adjust structure → import CSV → mapping → validate → commit')}</div>
        </div>
        <div><Stepper step={step} setStep={setStep} /></div>
      </div>

      {/* Actions bar */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>setStep((s)=> Math.max(1, (s-1) as Step))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>← {t('Trước','Prev')}</button>
          <button onClick={()=>setStep((s)=> Math.min(6, (s+1) as Step))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Tiếp','Next')} →</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <button onClick={exportJSON} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button>
          <button onClick={doCommit} style={{ background: ok?'#16a34a':'#9ca3af', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Commit & Activate','Commit & Activate')}</button>
        </div>
      </div>

      {/* Body grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12 }}>
        {/* Left main */}
        <div style={{ display:'grid', gridTemplateRows:'1fr', gap:12 }}>
          {step===1 && (
            <Panel title={t('Chọn template','Choose template')} extra={<span style={{ color:'#6b7280' }}>{t('Sao chép từ mẫu rồi chỉnh sửa','Copy from template then edit')}</span>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {Object.keys(templates).map(k => (
                  <div key={k} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:8 }}>
                    <div style={{ fontWeight:700 }}>{k}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{t('Số tài khoản','Accounts')}: {templates[k].length}</div>
                    <button onClick={()=>replaceWithTemplate(k)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Dùng mẫu này','Use this template')}</button>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {step===2 && (
            <Panel title={t('Chỉnh cấu trúc & thêm tài khoản','Adjust structure & add accounts')} extra={<button onClick={addRow} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Thêm dòng','Add row')}</button>}>
              <div style={{ display:'grid', gap:8 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm theo mã/tên','Search code/name')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                <div style={{ maxHeight:360, overflow:'auto', border:'1px solid #f1f5f9', borderRadius:8, padding:6 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                        <th style={{ padding:'6px' }}>Code</th>
                        <th style={{ padding:'6px' }}>{t('Tên VI','Name VI')}</th>
                        <th style={{ padding:'6px' }}>Type</th>
                        <th style={{ padding:'6px' }}>Side</th>
                        <th style={{ padding:'6px' }}>{t('Mã cha','Parent')}</th>
                        <th style={{ padding:'6px' }}>{t('Postable','Postable')}</th>
                        <th style={{ padding:'6px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map(a => (
                        <tr key={a.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'6px' }}><input value={a.code} onChange={e=>setAccounts(prev => upsertAccount(prev, { code: e.target.value, id:a.id }))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:120 }} /></td>
                          <td style={{ padding:'6px' }}><input value={a.name_vi} onChange={e=>setAccounts(prev => upsertAccount(prev, { code:a.code, name_vi:e.target.value }))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }} /></td>
                          <td style={{ padding:'6px' }}>
                            <select value={a.type} onChange={e=>setAccounts(prev => upsertAccount(prev, { code:a.code, type:e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px' }}>
                              {['asset','liability','equity','revenue','expense','other'].map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                          </td>
                          <td style={{ padding:'6px' }}>
                            <select value={a.normal_side} onChange={e=>setAccounts(prev => upsertAccount(prev, { code:a.code, normal_side:e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px' }}>
                              {['debit','credit'].map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                          </td>
                          <td style={{ padding:'6px' }}><input value={a.parent_code||''} onChange={e=>setAccounts(prev => upsertAccount(prev, { code:a.code, parent_code:e.target.value||undefined }))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:120 }} /></td>
                          <td style={{ padding:'6px', textAlign:'center' }}><input type="checkbox" checked={a.is_postable} onChange={e=>setAccounts(prev => upsertAccount(prev, { code:a.code, is_postable:e.target.checked }))} /></td>
                          <td style={{ padding:'6px', textAlign:'right' }}><button onClick={()=>setAccounts(prev => prev.filter(x => x.code!==a.code))} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 8px', background:'#fff' }}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}

          {step===3 && (
            <Panel title={t('Nhập CSV / Dán dữ liệu','Import CSV / Paste data')} extra={<button onClick={()=>{ const arr = fromCSV(csvText); if (arr.length===0) { alert(t('CSV rỗng hoặc sai header','Empty CSV or invalid header')); return; } setAccounts(arr); setStep(4); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Nạp từ CSV','Load CSV')}</button>}>
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Header bắt buộc','Required header')}: <code>code,name_vi,name_en,type,normal_side,parent_code,is_postable,currency,active</code></div>
                <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} placeholder="Paste CSV here" style={{ width:'100%', minHeight:260, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', fontFamily:'monospace' }}></textarea>
              </div>
            </Panel>
          )}

          {step===4 && (
            <Panel title={t('Mapping sang hệ thống khác (tuỳ chọn)','Map to external system (optional)')} extra={<span style={{ color:'#6b7280' }}>{t('Yêu cầu mapping cho tài khoản postable','Recommend mapping all postable accounts')}</span>}>
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ maxHeight:360, overflow:'auto', border:'1px solid #f1f5f9', borderRadius:8, padding:6 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                        <th style={{ padding:'6px' }}>Code</th>
                        <th style={{ padding:'6px' }}>{t('Tên VI','Name')}</th>
                        <th style={{ padding:'6px' }}>{t('External code','External code')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map(a => (
                        <tr key={a.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'6px', fontFamily:'monospace' }}>{a.code}</td>
                          <td style={{ padding:'6px' }}>{a.name_vi}</td>
                          <td style={{ padding:'6px' }}>
                            <input value={mappings[a.code]||''} onChange={e=>setMappings(prev => ({ ...prev, [a.code]: e.target.value }))} placeholder={t('VD: mã kế toán cũ','Old GL code')} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', width:'100%' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}

          {step===5 && (
            <Panel title={t('Kiểm tra & cảnh báo','Validate & warnings')}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>{t('Lỗi (phải sửa trước khi commit)','Errors (must fix)')}</div>
                  {errors.length===0 ? <div style={{ color:'#16a34a' }}>{t('Không có lỗi','No errors')}</div> : <ul>{errors.map((e,i)=><li key={i} style={{ color:'#ef4444' }}>{e}</li>)}</ul>}
                </div>
                <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>{t('Cảnh báo (khuyến nghị)','Warnings (recommended)')}</div>
                  {warnings.length===0 ? <div style={{ color:'#16a34a' }}>{t('Không có cảnh báo','No warnings')}</div> : <ul>{warnings.map((w,i)=><li key={i} style={{ color:'#b45309' }}>{w}</li>)}</ul>}
                </div>
              </div>
              <div style={{ marginTop:10, color:'#6b7280', fontSize:12 }}>
                {t('Tóm tắt','Summary')}: {t('Tổng','Total')}: <b>{summary.total}</b> • Postable: <b>{summary.postable}</b> • Header: <b>{summary.headers}</b> • Asset: {summary.asset} • Liability: {summary.liability} • Equity: {summary.equity} • Revenue: {summary.revenue} • Expense: {summary.expense}
              </div>
            </Panel>
          )}

          {step===6 && (
            <Panel title={t('Commit & Activate','Commit & Activate')}>
              <div style={{ display:'grid', gap:10 }}>
                <div>{t('Khi commit, phiên bản hiện tại sẽ được kích hoạt và các phiên bản trước sẽ được lưu trữ.','On commit, current draft will be activated and previous versions will be archived.')}</div>
                <button onClick={doCommit} style={{ background: ok?'#16a34a':'#9ca3af', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', width:240 }}>{t('Commit & Activate','Commit & Activate')}</button>
              </div>
            </Panel>
          )}
        </div>

        {/* Right preview */}
        <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
          <Panel title={t('Xem nhanh cây tài khoản','Account tree preview')}>
            <div style={{ maxHeight:420, overflow:'auto' }}>
              <Tree nodes={tree} />
            </div>
          </Panel>
          <Panel title={t('JSON xem nhanh','Quick JSON')}>
            <pre style={{ margin:0, maxHeight:260, overflow:'auto' }}>{JSON.stringify({ accounts, mappings }, null, 2)}</pre>
          </Panel>
        </div>
      </div>
    </div>
  );
};
