// src/components/core/AuditLogViewer.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { fetchAudit, AuditItem } from '../../mock/audit';

export type AuditLogViewerProps = {
  loader?: () => Promise<AuditItem[]>;     // default: fetchAudit()
  locale?: 'vi'|'en';
  pageSize?: number;                       // default: 20
};

const entityOptions = ['all','project','task','expense','document','approval'];
const actionOptions = ['all','CREATE','UPDATE','DELETE','SUBMIT','APPROVE','REJECT'];

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  loader = fetchAudit,
  locale = 'vi',
  pageSize = 20
}) => {
  const [rows, setRows] = useState<AuditItem[]>([]);
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await loader();
      setRows(data);
      setLoading(false);
    };
    load();
  }, [loader]);

  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim();
    const fromTime = from ? new Date(from + 'T00:00:00').getTime() : 0;
    const toTime = to ? new Date(to + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER;
    return rows.filter(r => {
      if (entity !== 'all' && r.entity_type !== entity) return false;
      if (action !== 'all' && r.action !== action) return false;
      if (actor && !(r.actor_email || '').toLowerCase().includes(actor.toLowerCase())) return false;
      const ts = new Date(r.created_at).getTime();
      if (ts < fromTime || ts > toTime) return false;
      if (!qq) return true;
      const hay = `${r.entity_type} ${r.entity_id} ${r.action} ${r.actor_email ?? ''} ${JSON.stringify(r.data||{})}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q, entity, action, actor, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

  useEffect(() => { setPage(1); }, [q, entity, action, actor, from, to]);

  const toggle = (id: string) => setExpanded(s => ({ ...s, [id]: !s[id] }));

  const clearFilters = () => {
    setQ(''); setEntity('all'); setAction('all'); setActor(''); setFrom(''); setTo('');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit_export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = ['id','entity_type','entity_id','action','actor_email','created_at'];
    const lines = [header.join(',')].concat(filtered.map(r => [r.id, r.entity_type, r.entity_id, r.action, r.actor_email || '', r.created_at].map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gap:10, padding:12 }}>
      {/* Toolbar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm kiếm...','Search...')} style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <select value={entity} onChange={e=>setEntity(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            {entityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={action} onChange={e=>setAction(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            {actionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input value={actor} onChange={e=>setActor(e.target.value)} placeholder={t('Người thực hiện','Actor')} style={{ width:160, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center' }}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <span>→</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <button onClick={clearFilters} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Xóa lọc','Clear')}</button>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>CSV</button>
          <button onClick={exportJSON} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>JSON</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', background:'#fff' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ textAlign:'left', padding:10, borderRight:'1px solid #eef2f7', width:140 }}>Time</th>
              <th style={{ textAlign:'left', padding:10, borderRight:'1px solid #eef2f7', width:120 }}>Entity</th>
              <th style={{ textAlign:'left', padding:10, borderRight:'1px solid #eef2f7' }}>Entity ID</th>
              <th style={{ textAlign:'left', padding:10, borderRight:'1px solid #eef2f7', width:120 }}>Action</th>
              <th style={{ textAlign:'left', padding:10, borderRight:'1px solid #eef2f7', width:200 }}>Actor</th>
              <th style={{ textAlign:'left', padding:10, width:80 }}>More</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>Loading...</td></tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>No data</td></tr>
            )}
            {!loading && pageRows.map(r => (
              <React.Fragment key={r.id}>
                <tr style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:10 }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ padding:10 }}><code>{r.entity_type}</code></td>
                  <td style={{ padding:10, fontFamily:'monospace' }}>{r.entity_id}</td>
                  <td style={{ padding:10 }}><b>{r.action}</b></td>
                  <td style={{ padding:10 }}>{r.actor_email || '—'}</td>
                  <td style={{ padding:10 }}>
                    <button onClick={()=>toggle(r.id)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>
                      {expanded[r.id] ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expanded[r.id] && (
                  <tr>
                    <td colSpan={6} style={{ padding:0, background:'#f8fafc' }}>
                      <pre style={{ margin:0, padding:12, whiteSpace:'pre-wrap', overflow:'auto' }}>{JSON.stringify(r.data ?? {}, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{filtered.length} records</div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1}
                  style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: page===1 ? 0.5 : 1 }}>Prev</button>
          <span>Page {page}/{totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages}
                  style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: page===totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      </div>
    </div>
  );
};
