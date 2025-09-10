// src/components/pm/RiskIssueLog.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listProjects, listEmployees, listItems, upsertItem, deleteItem, exportCSV, exportJSON, heatmap,
  type RiskIssue, type SeverityBand
} from '../../mock/risk_issue';

type Filter = {
  type: 'all'|'risk'|'issue';
  status: string;
  owner: string;
  severity: 'all'|SeverityBand;
  search: string;
  overdueOnly: boolean;
};

const sevColor: Record<SeverityBand, string> = {
  low: '#dcfce7',
  medium: '#fef9c3',
  high: '#fed7aa',
  critical: '#fecaca',
};

const LIKELIHOOD = [
  { v:1, vi:'Hiếm khi', en:'Rare' },
  { v:2, vi:'Không chắc', en:'Unlikely' },
  { v:3, vi:'Có thể', en:'Possible' },
  { v:4, vi:'Khả năng cao', en:'Likely' },
  { v:5, vi:'Gần như chắc', en:'Almost certain' },
];
const IMPACT = [
  { v:1, vi:'Nhẹ', en:'Minor' },
  { v:2, vi:'Vừa', en:'Moderate' },
  { v:3, vi:'Đáng kể', en:'Significant' },
  { v:4, vi:'Nghiêm trọng', en:'Major' },
  { v:5, vi:'Thảm hoạ', en:'Severe' },
];

export const RiskIssueLog: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>('');
  const [emps, setEmps] = useState<Array<{id:string;name:string}>>([]);
  const [rows, setRows] = useState<RiskIssue[]>([]);
  const [grid, setGrid] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>({ type:'all', status:'', owner:'', severity:'all', search:'', overdueOnly:false });
  const [toast, setToast] = useState<string | null>(null);

  const saveToast = (m:string) => { setToast(m); setTimeout(()=>setToast(null), 1200); };

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(ps[0]?.id || ''); }); }, []);
  useEffect(()=>{ (async ()=>{
    if (!pid) return;
    setEmps((await listEmployees()).map(e=>({ id:e.id, name:e.name })));
    setRows(await listItems(pid));
    setGrid(await heatmap(pid));
  })(); }, [pid]);

  const owners = useMemo(()=>{
    const ids = new Set(rows.map(r => r.owner_id).filter(Boolean) as string[]);
    return Array.from(ids).map(id => ({ id, name: emps.find(e=>e.id===id)?.name || id }));
  }, [rows, emps]);

  const filtered = useMemo(()=>{
    const today = new Date().toISOString().slice(0,10);
    return rows.filter(r => {
      if (filter.type!=='all' && r.type!==filter.type) return false;
      if (filter.status && r.status!==filter.status) return false;
      if (filter.owner && r.owner_id!==filter.owner) return false;
      if (filter.severity!=='all' && r.severity!==filter.severity) return false;
      if (filter.overdueOnly && r.due_date && r.due_date < today && r.status!=='closed' && r.status!=='resolved') return false ? false : true;
      if (filter.search && !(r.title+' '+(r.description||'')+' '+(r.category||'')).toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter]);

  const addItem = async (type: 'risk'|'issue') => {
    const title = prompt(t('Tiêu đề','Title'));
    if (!title) return;
    await upsertItem(pid, { type, title, likelihood: type==='risk'?3:1, impact: 2 });
    setRows(await listItems(pid)); setGrid(await heatmap(pid)); saveToast(t('Đã thêm','Added'));
  };

  const onExportCSV = async () => { const blob = await exportCSV(pid); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='risk_issue_log.csv'; a.click(); URL.revokeObjectURL(url); };
  const onExportJSON = async () => { const blob = await exportJSON(pid); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='risk_issue_log.json'; a.click(); URL.revokeObjectURL(url); };

  const RiskMatrix: React.FC = () => {
    const cell = (l:number,i:number) => grid.find((c:any)=>c.likelihood===l && c.impact===i);
    return (
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', background:'#fff' }}>
        <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Ma trận rủi ro (Likelihood × Impact)','Risk matrix (Likelihood × Impact)')}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chỉ tính items loại Risk','Counts risk items only')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'80px repeat(5, 1fr)', padding:10, gap:6 }}>
          <div></div>
          {IMPACT.map(h => <div key={h.v} style={{ textAlign:'center', fontSize:12, color:'#374151' }}>{t(h.vi, h.en)}</div>)}
          {LIKELIHOOD.slice().reverse().map(v => (
            <React.Fragment key={v.v}>
              <div style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', textAlign:'center', fontSize:12, color:'#374151' }}>{t(v.vi, v.en)}</div>
              {IMPACT.map(h => {
                const c = cell(v.v, h.v);
                const bg = c ? sevColor[c.severity as SeverityBand] : '#f3f4f6';
                return (
                  <button key={h.v} onClick={()=>setFilter(f => ({ ...f, type:'risk', search:'', severity:'all' }))}
                          title={`L${v.v} × I${h.v} = ${c?.score||v.v*h.v}`}
                          style={{ height:44, border:'1px solid #e5e7eb', borderRadius:8, background:bg, display:'grid', placeItems:'center', fontWeight:700 }}>
                    {c?.count||0}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const Row: React.FC<{ r: RiskIssue }> = ({ r }) => {
    const [title, setTitle] = useState(r.title);
    const [type, setType] = useState(r.type);
    const [status, setStatus] = useState<RiskIssue['status']>(r.status);
    const [owner, setOwner] = useState(r.owner_id||'');
    const [lik, setLik] = useState(r.likelihood);
    const [imp, setImp] = useState(r.impact);
    const [due, setDue] = useState(r.due_date||'');
    const [cat, setCat] = useState(r.category||'');

    useEffect(()=>{
      setTitle(r.title); setType(r.type); setStatus(r.status); setOwner(r.owner_id||''); setLik(r.likelihood); setImp(r.impact); setDue(r.due_date||''); setCat(r.category||'');
    }, [r.id]);

    const save = async () => {
      await upsertItem(r.project_id, { id: r.id, type, title, status, owner_id: owner||undefined, likelihood: lik, impact: imp, due_date: due||undefined, category: cat });
      setRows(await listItems(pid)); setGrid(await heatmap(pid));
      saveToast(t('Đã lưu','Saved'));
    };

    const remove = async () => {
      if (!confirm(t('Xoá mục này?','Delete this item?'))) return;
      await deleteItem(r.project_id, r.id);
      setRows(await listItems(pid)); setGrid(await heatmap(pid));
      saveToast(t('Đã xoá','Deleted'));
    };

    const overdue = r.due_date && r.due_date < new Date().toISOString().slice(0,10) && (r.status!=='closed' && r.status!=='resolved');

    return (
      <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 120px 180px 220px 140px 140px 100px 120px auto', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9', background:'#fff' }}>
        <div style={{ fontWeight:700, color:'#374151' }}>{r.id.slice(0,6).toUpperCase()}</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <select value={type} onChange={e=>{ setType(e.target.value as any); }} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="risk">{t('Risk','Risk')}</option>
          <option value="issue">{t('Issue','Issue')}</option>
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {['open','in_progress','mitigated','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={owner} onChange={e=>setOwner(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('— Owner —','— Owner —')}</option>
          {emps.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={lik} onChange={e=>setLik(Number(e.target.value))} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {LIKELIHOOD.map(o => <option key={o.v} value={o.v}>{o.v} — {t(o.vi, o.en)}</option>)}
        </select>
        <select value={imp} onChange={e=>setImp(Number(e.target.value))} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {IMPACT.map(o => <option key={o.v} value={o.v}>{o.v} — {t(o.vi, o.en)}</option>)}
        </select>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'center' }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 10px', background: sevColor[r.severity], textAlign:'center', fontWeight:700 }}>{r.score}</div>
          <span style={{ fontSize:12, color:'#6b7280' }}>{r.severity}</span>
        </div>
        <input type="date" value={due} onChange={e=>setDue(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', color: overdue ? '#b91c1c' : undefined }} />
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <button onClick={remove} title={t('Xoá','Delete')} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
        </div>

        {/* second row */}
        <div style={{ gridColumn: '1 / -1', background:'#f9fafb', borderRadius:8, padding:'6px 8px', marginTop:4 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <input defaultValue={r.category||''} onBlur={e=>{ setCat(e.target.value); upsertItem(r.project_id, { id: r.id, category: e.target.value }).then(async ()=>{ setRows(await listItems(pid)); setGrid(await heatmap(pid)); }); }} placeholder={t('Danh mục','Category')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <input defaultValue={(r.labels||[]).join(', ')} onBlur={e=>{ const labs = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); upsertItem(r.project_id, { id: r.id, labels: labs }).then(async ()=>{ setRows(await listItems(pid)); setGrid(await heatmap(pid)); }); }} placeholder={t('Nhãn (phân cách bằng dấu phẩy)','Labels (comma separated)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <input defaultValue={r.identified_on||''} onBlur={e=>{ upsertItem(r.project_id, { id: r.id, identified_on: e.target.value || undefined }).then(async ()=>{ setRows(await listItems(pid)); setGrid(await heatmap(pid)); }); }} type="date" title={t('Ngày phát hiện','Identified on')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          <textarea defaultValue={r.description||''} onBlur={e=>{ upsertItem(r.project_id, { id: r.id, description: e.target.value || '' }).then(async ()=>{ setRows(await listItems(pid)); }); }} placeholder={t('Mô tả / kế hoạch giảm thiểu / hành động khắc phục','Description / mitigation / corrective actions')} style={{ marginTop:8, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%', minHeight:60 }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Sổ Rủi ro & Vấn đề','Risk & Issue Log')}</div>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>addItem('risk')} style={{ background:'#f59e0b', color:'#111827', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm Risk','Add Risk')}</button>
          <button onClick={()=>addItem('issue')} style={{ background:'#fca5a5', color:'#111827', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm Issue','Add Issue')}</button>
          <button onClick={onExportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <button onClick={onExportJSON} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:8, alignItems:'center' }}>
        <select value={filter.type} onChange={e=>setFilter(f=>({ ...f, type: e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="all">{t('Tất cả (Risk+Issue)','All')}</option>
          <option value="risk">Risk</option>
          <option value="issue">Issue</option>
        </select>
        <select value={filter.status} onChange={e=>setFilter(f=>({ ...f, status: e.target.value }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('Trạng thái','Status')}</option>
          {['open','in_progress','mitigated','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.owner} onChange={e=>setFilter(f=>({ ...f, owner: e.target.value }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('Owner','Owner')}</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={filter.severity} onChange={e=>setFilter(f=>({ ...f, severity: e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="all">{t('Mức độ','Severity')}</option>
          {(['low','medium','high','critical'] as SeverityBand[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={filter.search} onChange={e=>setFilter(f=>({ ...f, search: e.target.value }))} placeholder={t('Tìm tiêu đề/mô tả/danh mục...','Search title/description/category...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
          <label style={{ display:'flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={filter.overdueOnly} onChange={e=>setFilter(f=>({ ...f, overdueOnly: e.target.checked }))} />
            <span>{t('Chỉ quá hạn','Overdue only')}</span>
          </label>
        </div>
      </div>

      {/* Heatmap */}
      <RiskMatrix />

      {/* Header row */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#f9fafb', display:'grid', gridTemplateColumns:'100px 1fr 120px 180px 220px 140px 140px 100px 120px auto', gap:8, padding:'6px 8px' }}>
        <div style={{ fontWeight:700 }}>{t('ID','ID')}</div>
        <div style={{ fontWeight:700 }}>{t('Tiêu đề','Title')}</div>
        <div style={{ fontWeight:700 }}>{t('Loại','Type')}</div>
        <div style={{ fontWeight:700 }}>{t('Trạng thái','Status')}</div>
        <div style={{ fontWeight:700 }}>{t('Owner','Owner')}</div>
        <div style={{ fontWeight:700 }}>{t('Khả năng (1-5)','Likelihood (1-5)')}</div>
        <div style={{ fontWeight:700 }}>{t('Tác động (1-5)','Impact (1-5)')}</div>
        <div style={{ fontWeight:700 }}>{t('Điểm','Score')}</div>
        <div style={{ fontWeight:700 }}>{t('Hạn xử lý','Due')}</div>
        <div style={{ fontWeight:700, textAlign:'right' }}>{t('Hành động','Actions')}</div>
      </div>

      {/* Body */}
      <div style={{ overflow:'auto' }}>
        {filtered.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> : filtered.map(r => <Row key={r.id} r={r} />)}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{toast || ' '}</div>
        <div>{t('Tổng số','Total')}: {filtered.length}</div>
      </div>
    </div>
  );
};
