
// src/components/fin/ExpenseForm.tsx — mobile‑first expense entry
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listValues } from '../../mock/dimensions';
import { seedUsersIfEmpty, currentUser } from '../../mock/users';
import { listDrafts, newDraft, getDraft, upsert, deleteDraft, addLine, removeLine, setReceipt, totals, submit, validate, type ExpenseDraft, type ExpenseLine } from '../../mock/expense';

type Tab = 'form'|'list'|'help';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

const categories = [
  { code:'MEAL', name_vi:'Ăn uống' },
  { code:'TAXI', name_vi:'Taxi/Grab' },
  { code:'HOTEL', name_vi:'Khách sạn' },
  { code:'AIR', name_vi:'Vé máy bay' },
  { code:'OFFICE', name_vi:'VPP/Khác' },
];

export const ExpenseForm: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [tab, setTab] = useState<Tab>('form');

  // Seeds
  useEffect(()=>{ seedIfEmpty(); seedUsersIfEmpty(); }, []);

  const user = useMemo(()=> currentUser(), []);
  useEffect(()=>{ // seed a demo draft for user if not exists
    try { const { seedDemo } = require('../../mock/expense'); seedDemo({ code: user.code }); } catch {}
  }, []);

  const [drafts, setDrafts] = useState<ExpenseDraft[]>([]);
  const [id, setId] = useState<string>('');
  const [d, setD] = useState<ExpenseDraft | null>(null);

  const projects = listValues('PROJECT');
  const depts = listValues('DEPT');

  const reload = () => { const arr = listDrafts().filter(x => x.employee_code===user.code); setDrafts(arr); if (!id && arr[0]) setId(arr[0].id); };
  useEffect(()=>{ reload(); }, []);
  useEffect(()=>{ if (!id) return; setD(getDraft(id)); }, [id]);

  const set = (patch: Partial<ExpenseDraft>) => { if (!d) return; const next = { ...d, ...patch } as ExpenseDraft; setD(next); upsert(next); };

  const addRow = () => { if (!d) return; addLine(d, { project_code: d.project_code }); setD(getDraft(d.id)); };
  const delRow = (lid: string) => { if (!d) return; removeLine(d, lid); setD(getDraft(d.id)); };

  const handleImage = (l: ExpenseLine, file: File) => {
    const fr = new FileReader();
    fr.onload = () => { setReceipt(l, String(fr.result)); if (d) upsert(d); setD(d ? { ...getDraft(d.id)! } : null); };
    fr.readAsDataURL(file);
  };

  const total = d ? totals(d) : { gross:0, tax:0, net:0 };

  const onSubmit = () => {
    if (!d) return;
    const res = submit(d);
    if (!res.ok) { alert(res.errors.join('\\n')); return; }
    alert(t('Đã nộp phiếu chi phí','Expense submitted'));
    reload();
  };

  const onNew = () => { const nd = newDraft(user); setId(nd.id); setD(nd); reload(); };

  const v = d ? validate(d) : { ok:false, errors:[] };

  return (
    <div style={{ display:'grid', gap:12, padding:12, maxWidth: 780, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Phiếu chi phí (mobile‑first)','Expense form (mobile‑first)')}</div>
          <Badge text="FIN-08" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Draft → Submit','Draft → Submit')}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>setTab('form')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab==='form'?'#eef2ff':'#fff' }}>{t('Form','Form')}</button>
          <button onClick={()=>setTab('list')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab==='list'?'#eef2ff':'#fff' }}>{t('Danh sách','My drafts')}</button>
          <button onClick={()=>setTab('help')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab==='help'?'#eef2ff':'#fff' }}>Help</button>
        </div>
      </div>

      {/* Draft selector */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:8, display:'flex', gap:8, alignItems:'center', overflowX:'auto' }}>
        <button onClick={onNew} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', whiteSpace:'nowrap' }}>＋ {t('Phiếu mới','New')}</button>
        {drafts.map(x => (
          <button key={x.id} onClick={()=>setId(x.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: id===x.id ? '#eef2ff':'#fff', whiteSpace:'nowrap' }}>
            {new Date(x.date).toISOString().slice(0,10)} — {(x.title||t('Chưa đặt tiêu đề','Untitled'))} <Badge text={x.status} tone={x.status==='submitted'?'green':'slate'} />
          </button>
        ))}
      </div>

      {/* Form */}
      {tab==='form' && d && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
          <div style={{ padding:10, display:'grid', gap:10 }}>
            {/* header fields */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tiêu đề','Title')}</div>
                <input value={d.title} onChange={e=>set({ title: e.target.value })} placeholder={t('VD: Taxi + ăn trưa','e.g., Taxi + lunch')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div style={{ fontSize:12, color:'#6b7280' }}>{t('Ngày','Date')}</div>
                <input type="date" value={new Date(d.date).toISOString().slice(0,10)} onChange={e=>set({ date: new Date(e.target.value).toISOString() })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }} />
              </label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <div style={{ fontSize:12, color:'#6b7280' }}>Currency</div>
                <select value={d.currency} onChange={e=>set({ currency: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  {['VND','USD','EUR','JPY','KRW','CNY'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div style={{ fontSize:12, color:'#6b7280' }}>{t('Dự án (header)','Project (header)')}</div>
                <select value={d.project_code||''} onChange={e=>set({ project_code: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  <option value="">{t('— Không —','— None —')}</option>
                  {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
                </select>
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div style={{ fontSize:12, color:'#6b7280' }}>{t('Phòng ban','Dept')}</div>
                <select value={d.dept_code||''} onChange={e=>set({ dept_code: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  <option value="">{t('— Không —','— None —')}</option>
                  {depts.map(dp => <option key={dp.code} value={dp.code}>{dp.code} — {dp.name_vi}</option>)}
                </select>
              </label>
            </div>

            {/* lines */}
            <div style={{ display:'grid', gap:8 }}>
              {d.lines.map((l, idx) => (
                <div key={l.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
                    <div style={{ fontWeight:700 }}>{t('Dòng','Line')} #{idx+1}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>delRow(l.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <label style={{ display:'grid', gap:6 }}>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{t('Nhóm chi phí','Category')}</div>
                      <select value={l.category} onChange={e=>{ l.category = e.target.value; upsert(d); setD({ ...d }); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                        {categories.map(c => <option key={c.code} value={c.code}>{c.name_vi}</option>)}
                      </select>
                    </label>
                    <label style={{ display:'grid', gap:6 }}>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{t('Số tiền (gross)','Amount (gross)')}</div>
                      <input type="number" step="0.01" value={l.amount||0} onChange={e=>{ l.amount = Number(e.target.value||0); upsert(d); setD({ ...d }); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }} />
                    </label>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <label style={{ display:'grid', gap:6 }}>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{t('Thuế suất (%)','Tax rate (%)')}</div>
                      <input type="number" step="0.01" value={l.tax_rate||0} onChange={e=>{ l.tax_rate = Number(e.target.value||0); upsert(d); setD({ ...d }); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }} />
                    </label>
                    <label style={{ display:'grid', gap:6 }}>
                      <div style={{ fontSize:12, color:'#6b7280' }}>Project (override)</div>
                      <select value={l.project_code||''} onChange={e=>{ l.project_code = e.target.value||undefined; upsert(d); setD({ ...d }); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                        <option value="">{t('— Theo header —','— From header —')}</option>
                        {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
                      </select>
                    </label>
                  </div>
                  <label style={{ display:'grid', gap:6 }}>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{t('Diễn giải','Description')}</div>
                    <input value={l.description||''} onChange={e=>{ l.description = e.target.value; upsert(d); setD({ ...d }); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }} />
                  </label>
                  <div style={{ display:'grid', gap:6 }}>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{t('Hóa đơn/biên lai','Receipt')}</div>
                    <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                      <input type="file" accept="image/*" onChange={e=>{ const f = e.target.files?.[0]; if (f) handleImage(l, f); }} />
                      {l.receipt_image && <img src={l.receipt_image} alt="receipt" style={{ width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addRow} style={{ border:'2px dashed #cbd5e1', borderRadius:12, padding:'10px 12px', background:'#fff', width:'100%' }}>＋ {t('Thêm dòng chi phí','Add expense line')}</button>
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ borderTop:'1px solid #e5e7eb', padding:10, display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
            <div style={{ color:'#6b7280', fontSize:12 }}>
              {t('Tổng','Total')}: <b>{total.gross.toLocaleString()} {d.currency}</b> • VAT: <b>{total.tax.toLocaleString()}</b> • {t('Trước thuế','Net')}: <b>{total.net.toLocaleString()}</b>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ if (!d) return; upsert(d); alert(t('Đã lưu nháp','Draft saved')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px', background:'#fff' }}>{t('Lưu nháp','Save draft')}</button>
              <button onClick={onSubmit} disabled={d.status==='submitted'} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'10px 12px' }}>{t('Nộp duyệt','Submit')}</button>
            </div>
          </div>
        </div>
      )}

      {/* List tab */}
      {tab==='list' && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Phiếu của tôi','My expense reports')}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>Date</th>
              <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
              <th style={{ padding:'6px' }}>{t('TT','Status')}</th>
              <th style={{ padding:'6px' }}>{t('Số dòng','Lines')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr></thead>
            <tbody>
              {drafts.map(x => (
                <tr key={x.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px' }}>{new Date(x.date).toISOString().slice(0,10)}</td>
                  <td style={{ padding:'6px' }}>{x.title||t('Chưa đặt tiêu đề','Untitled')}</td>
                  <td style={{ padding:'6px' }}><Badge text={x.status} tone={x.status==='submitted'?'green':'slate'} /></td>
                  <td style={{ padding:'6px' }}>{x.lines.length}</td>
                  <td style={{ padding:'6px' }}>
                    <button onClick={()=>{ setId(x.id); setTab('form'); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Mở','Open')}</button>
                    <button onClick={()=>{ if (!confirm(t('Xoá phiếu này?','Delete this draft?'))) return; deleteDraft(x.id); reload(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 8px', background:'#fff', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Help */}
      {tab==='help' && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Notes</div>
          <ul>
            <li>{t('Quy trình','Workflow')}: Draft → Submit. Bước duyệt/chi trả sẽ ở các UI FIN‑09/FIN‑10 (theo catalog, nếu có). </li>
            <li>{t('Đính kèm','Attachments')}: ảnh biên lai lưu **dataURL** trong localStorage (demo). Sản phẩm thật lưu S3/SharePoint & lưu URL.</li>
            <li>{t('API đề xuất','Suggested API')}: <code>POST /fin/expense</code>, <code>GET /fin/expense/{'{id}'}</code>, <code>POST /fin/expense/{'{id}'}:submit</code>, <code>POST /fin/expense/{'{id}'}:upload</code>.</li>
            <li>{t('RBAC','RBAC')}: Employee tạo & nộp; Manager/Finance duyệt ở bước sau; tất cả hành động ghi **audit**.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
