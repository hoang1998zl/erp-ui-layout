// src/components/pm/ProjectList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listProjects, listClients, listEmployees, exportCSV,
  getViews, saveView, setDefault, deleteView,
  type Query, type SavedView
} from '../../mock/projects_list';

type StepKey = 'list';

export const ProjectList: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // Filters
  const [q, setQ] = useState<Query>({ sort: 'updated_desc', limit: 15, offset: 0 });
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [emps, setEmps] = useState<any[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [currentView, setCurrentView] = useState<string>('');

  const totalPages = Math.max(1, Math.ceil(total / (q.limit || 15)));

  const reload = async () => {
    const res = await listProjects(q);
    setRows(res.rows); setTotal(res.total);
  };
  useEffect(()=>{ reload(); }, [q.search, q.status, q.client_id, q.project_type, q.currency, q.date_from, q.date_to, q.pm_id, q.sort, q.limit, q.offset]);
  useEffect(()=>{ listClients().then(setClients); listEmployees({ active_only: true }).then(setEmps); getViews().then(v => { setViews(v); const def = v.find(x=>x.is_default); if (def) { setCurrentView(def.id); setQ({ ...def.query, limit: def.query.limit || 15, offset: 0 }); } }); }, []);

  const findClient = (id?:string) => clients.find(c=>c.id===id);
  const findEmp = (id?:string) => emps.find(e=>e.id===id);

  const onExport = async () => {
    const blob = await exportCSV(q);
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='projects.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const saveCurrentView = async () => {
    const name = prompt(t('Tên view','View name')) || '';
    if (!name) return;
    const makeDefault = confirm(t('Đặt làm mặc định?','Set as default?'));
    const pin = confirm(t('Ghim view này?','Pin this view?'));
    const v = await saveView(name, q, makeDefault, pin);
    setViews(await getViews());
    setCurrentView(v.id);
  };

  const applyView = async (id: string) => {
    const v = (await getViews()).find(x=>x.id===id); if (!v) return;
    setCurrentView(id);
    setQ({ ...v.query, limit: v.query.limit || 15, offset: 0 });
  };

  const removeView = async (id: string) => {
    if (!confirm(t('Xoá view này?','Delete this view?'))) return;
    await deleteView(id);
    const vs = await getViews();
    setViews(vs);
    if (currentView===id) setCurrentView('');
  };

  const setDefaultView = async (id: string) => {
    await setDefault(id);
    setViews(await getViews());
  };

  const resetFilters = () => setQ({ sort: 'updated_desc', limit: 15, offset: 0 });

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:800 }}>{t('Danh sách dự án','Project list')}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <a href="#" onClick={e=>{ e.preventDefault(); alert(t('Đi tới khởi tạo dự án (PM-01)','Go to Project Creation (PM-01)')); }} style={{ textDecoration:'none' }}>
            <button style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Tạo dự án','New project')}</button>
          </a>
        </div>
      </div>

      {/* Saved views bar */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {views.filter(v=>v.pinned).map(v => (
            <button key={v.id} onClick={()=>applyView(v.id)} title={new Date(v.created_at).toLocaleString()}
                    style={{ border:'1px solid ' + (currentView===v.id ? '#4f46e5' : '#e5e7eb'), color: currentView===v.id ? '#4f46e5' : '#111827', background:'#fff', borderRadius:999, padding:'6px 10px' }}>
              {v.name}{v.is_default ? ' ★' : ''}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={saveCurrentView} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu view hiện tại','Save current view')}</button>
            <select value={currentView} onChange={e=>applyView(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Chọn view —','— Choose view —')}</option>
              {views.map(v => <option key={v.id} value={v.id}>{v.name}{v.is_default?' ★':''}</option>)}
            </select>
          </div>
        </div>
        {currentView && (
          <div style={{ marginTop:6, color:'#6b7280', display:'flex', gap:8 }}>
            <button onClick={()=>setDefaultView(currentView)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Đặt làm mặc định','Set default')}</button>
            <button onClick={()=>removeView(currentView)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá view','Delete view')}</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gap:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr repeat(6, 1fr) 1fr auto', gap:8 }}>
          <input value={q.search||''} onChange={e=>setQ({ ...q, search:e.target.value, offset:0 })} placeholder={t('Tìm tên/mã...','Search name/code...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <select value={q.status||''} onChange={e=>setQ({ ...q, status:e.target.value as any, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Trạng thái','Status')}</option>
            <option value="draft">{t('Nháp','Draft')}</option>
            <option value="submitted">{t('Đã gửi','Submitted')}</option>
          </select>
          <select value={q.client_id||''} onChange={e=>setQ({ ...q, client_id:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Khách hàng','Client')}</option>
            {clients.map((c:any) => <option key={c.id} value={c.id}>{c.name}{c.code?` (${c.code})`:''}</option>)}
          </select>
          <select value={q.project_type||''} onChange={e=>setQ({ ...q, project_type:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Loại','Type')}</option>
            <option value="External">{t('External','External')}</option>
            <option value="Internal">{t('Internal','Internal')}</option>
            <option value="Non-billable">{t('Non-billable','Non-billable')}</option>
          </select>
          <select value={q.currency||''} onChange={e=>setQ({ ...q, currency:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tiền tệ','Currency')}</option>
            {['VND','USD','EUR','JPY'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={q.date_from||''} onChange={e=>setQ({ ...q, date_from:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <input type="date" value={q.date_to||''} onChange={e=>setQ({ ...q, date_to:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <select value={q.pm_id||''} onChange={e=>setQ({ ...q, pm_id:e.target.value||undefined, offset:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('PM','PM')}</option>
            {emps.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={resetFilters} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá lọc','Reset')}</button>
        </div>
      </div>

      {/* Table */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Kết quả','Results')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <select value={q.sort||'updated_desc'} onChange={e=>setQ({ ...q, sort:e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="updated_desc">{t('Cập nhật ↓','Updated ↓')}</option>
              <option value="start_asc">{t('Bắt đầu ↑','Start ↑')}</option>
              <option value="start_desc">{t('Bắt đầu ↓','Start ↓')}</option>
              <option value="name_asc">{t('Tên A→Z','Name A→Z')}</option>
              <option value="budget_desc">{t('Ngân sách ↓','Budget ↓')}</option>
            </select>
          </div>
        </div>
        <div style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ textAlign:'left', padding:8 }}>{t('Dự án','Project')}</th>
                <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Mã','Code')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Khách hàng','Client')}</th>
                <th style={{ textAlign:'left', padding:8, width:180 }}>{t('PM','PM')}</th>
                <th style={{ textAlign:'left', padding:8, width:110 }}>{t('Trạng thái','Status')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Thời gian','Timeline')}</th>
                <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Tiền tệ','Currency')}</th>
                <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Ngân sách','Budget')}</th>
                <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Giờ ước tính','Est. hours')}</th>
                <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Cập nhật','Updated')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={10} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
              {rows.map(p => (
                <tr key={p.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:8 }}>
                    <div style={{ fontWeight:700 }}>{p.general.name}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{p.general.project_type || '—'}</div>
                  </td>
                  <td style={{ padding:8 }}>{p.general.code || '—'}</td>
                  <td style={{ padding:8 }}>{findClient(p.general.client_id)?.name || t('Nội bộ','Internal')}</td>
                  <td style={{ padding:8 }}>{p.pm_id ? (findEmp(p.pm_id)?.name || p.pm_id) : <i style={{ color:'#6b7280' }}>{t('Chưa chọn','Not set')}</i>}</td>
                  <td style={{ padding:8 }}>
                    <span style={{ padding:'2px 8px', borderRadius:999, background: p.status==='submitted' ? '#dcfce7' : '#f3f4f6', color: p.status==='submitted' ? '#166534' : '#374151' }}>
                      {p.status==='submitted' ? t('Đã gửi','Submitted') : t('Nháp','Draft')}
                    </span>
                  </td>
                  <td style={{ padding:8 }}>{(p.general.start_date||'—')+' → '+(p.general.end_date||'—')}</td>
                  <td style={{ padding:8 }}>{p.general.currency || '—'}</td>
                  <td style={{ padding:8 }}>{p.totals.budget.toLocaleString()}</td>
                  <td style={{ padding:8 }}>{p.totals.hours}</td>
                  <td style={{ padding:8 }}>{new Date(p.updated_at || p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
          <div>{t('Trang','Page')} {Math.floor((q.offset||0)/(q.limit||15))+1}/{totalPages} — {t('Tổng','Total')}: {total}</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <label>{t('Hiển thị','Show')}</label>
            <select value={q.limit||15} onChange={e=>setQ({ ...q, limit:Number(e.target.value), offset:0 })}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
            <button onClick={()=>setQ({ ...q, offset: Math.max(0, (q.offset||0) - (q.limit||15)) })} disabled={(q.offset||0)===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: (q.offset||0)===0?0.5:1 }}>Prev</button>
            <button onClick={()=>setQ({ ...q, offset: Math.min((totalPages-1)*(q.limit||15), (q.offset||0)+(q.limit||15)) })} disabled={(q.offset||0) + (q.limit||15) >= total} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: ((q.offset||0)+(q.limit||15) >= total)?0.5:1 }}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
};
