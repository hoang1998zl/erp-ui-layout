// src/components/admin/AuditExport.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listActions, listEntityTypes, listActors, queryAudit, exportAudit, type Query, type AuditEvent } from '../../mock/audit';

export type AuditExportAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listActions?: typeof listActions;
    listEntityTypes?: typeof listEntityTypes;
    listActors?: typeof listActors;
    queryAudit?: typeof queryAudit;
    exportAudit?: typeof exportAudit;
  };
};

export const AuditExportAdmin: React.FC<AuditExportAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listActions: adapters.listActions || listActions,
    listEntityTypes: adapters.listEntityTypes || listEntityTypes,
    listActors: adapters.listActors || listActors,
    queryAudit: adapters.queryAudit || queryAudit,
    exportAudit: adapters.exportAudit || exportAudit,
  };

  // Filters
  const today = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0,10);
  const [from, setFrom] = useState(toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)));
  const [to, setTo] = useState(toISODate(today));
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [contains, setContains] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);

  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadFilterData = async () => {
    const [a1, a2, a3] = await Promise.all([fns.listActions(), fns.listEntityTypes(), fns.listActors()]);
    setActions(a1); setEntityTypes(a2); setActors(a3);
  };
  useEffect(() => { loadFilterData(); }, []);

  const buildQuery = (): Query => ({ from, to, actor: actor || undefined, action: action || undefined, entity_type: entityType || undefined, entity_id: entityId || undefined, contains: contains || undefined, limit, offset });

  const load = async () => {
    setLoading(true);
    const q = buildQuery();
    const res = await fns.queryAudit(q);
    setRows(res.rows); setTotal(res.total); setLoading(false);
  };
  useEffect(() => { load(); }, [from, to, actor, action, entityType, entityId, contains, limit, offset]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const reset = () => {
    setActor(''); setAction(''); setEntityType(''); setEntityId(''); setContains(''); setLimit(50); setOffset(0);
  };

  const onExport = async (fmt: 'csv'|'json') => {
    const blob = await fns.exportAudit(buildQuery(), fmt);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit_${from}_to_${to}.${fmt}`; a.click();
    URL.revokeObjectURL(url);
  };

  const quickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days-1)*24*60*60*1000);
    setFrom(toISODate(start)); setTo(toISODate(end));
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:12, padding:12 }}>
      {/* Left: Filters */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Bộ lọc','Filters')}</div>
        <div style={{ padding:12, display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Từ ngày','From')}</label>
              <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Đến ngày','To')}</label>
              <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
          </div>

          <div>
            <label style={{ color:'#6b7280', fontSize:12 }}>{t('Người dùng','Actor')}</label>
            <select value={actor} onChange={e=>{ setActor(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
              <option value="">{t('— Tất cả —','— All —')}</option>
              {actors.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color:'#6b7280', fontSize:12 }}>{t('Hành động','Action')}</label>
            <select value={action} onChange={e=>{ setAction(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
              <option value="">{t('— Tất cả —','— All —')}</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Loại thực thể','Entity type')}</label>
              <select value={entityType} onChange={e=>{ setEntityType(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                <option value="">{t('— Tất cả —','— All —')}</option>
                {entityTypes.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Mã/ID thực thể','Entity ID')}</label>
              <input value={entityId} onChange={e=>{ setEntityId(e.target.value); setOffset(0); }} placeholder="e.g., EXP-1234" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
          </div>

          <div>
            <label style={{ color:'#6b7280', fontSize:12 }}>{t('Chứa từ khóa','Contains')}</label>
            <input value={contains} onChange={e=>{ setContains(e.target.value); setOffset(0); }} placeholder={t('Tìm trong JSON/meta','Search in JSON/meta')} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, alignItems:'end' }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Số bản ghi xem trước','Preview limit')}</label>
              <input type="number" min={10} max={1000} value={limit} onChange={e=>{ setLimit(Math.max(10, Math.min(1000, Number(e.target.value)))); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>quickRange(7)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>7d</button>
              <button onClick={()=>quickRange(30)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>30d</button>
              <button onClick={()=>quickRange(90)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>90d</button>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'space-between' }}>
            <button onClick={reset} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Xóa lọc','Clear')}</button>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>onExport('csv')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>Export CSV</button>
              <button onClick={()=>onExport('json')} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>Export JSON</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: Preview table */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Xem trước kết quả','Results preview')}</div>
          <div style={{ color:'#6b7280' }}>{t('Tổng','Total')}: {total}</div>
        </div>
        <div style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ textAlign:'left', padding:10, width:190 }}>Timestamp</th>
                <th style={{ textAlign:'left', padding:10, width:170 }}>Actor</th>
                <th style={{ textAlign:'left', padding:10, width:120 }}>Action</th>
                <th style={{ textAlign:'left', padding:10, width:140 }}>Entity</th>
                <th style={{ textAlign:'left', padding:10 }}>Meta</th>
                <th style={{ textAlign:'left', padding:10, width:120 }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>{t('Không có dữ liệu','No data')}</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:10, fontFamily:'monospace' }}>{new Date(r.ts).toLocaleString()}</td>
                  <td style={{ padding:10 }}>{r.actor}</td>
                  <td style={{ padding:10 }}>{r.action}</td>
                  <td style={{ padding:10 }}>{r.entity_type || '—'} {r.entity_id ? `(${r.entity_id})` : ''}</td>
                  <td style={{ padding:10, fontFamily:'monospace', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:560 }}>{JSON.stringify(r.meta)}</td>
                  <td style={{ padding:10 }}>{r.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
          <div>{t('Trang','Page')} {Math.floor(offset/limit)+1}/{totalPages}</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button onClick={()=>setOffset(o=>Math.max(0, o - limit))} disabled={offset===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: offset===0?0.5:1 }}>Prev</button>
            <button onClick={()=>setOffset(o=>Math.min((totalPages-1)*limit, o + limit))} disabled={offset + limit >= total} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: offset+limit>=total?0.5:1 }}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
};
