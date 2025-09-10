// src/components/core/ContextRightPane.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { EntityType } from '../../mock/context';
import { fetchEntity, listDocuments, linkDocument, listActivity } from '../../mock/context';

export type ContextRightPaneProps = {
  entity?: { type: EntityType; id: string };
  onClose?: () => void;
  locale?: 'vi'|'en';
  // optional adapters if integrating with real backend
  loaders?: {
    fetchEntity?: typeof fetchEntity;
    listDocuments?: typeof listDocuments;
    linkDocument?: typeof linkDocument;
    listActivity?: typeof listActivity;
  };
  actions?: Array<{
    key: string;
    label: string;
    onClick: (entity: { type: EntityType; id: string }) => void | Promise<void>;
  }>;
  width?: number;  // default 420
};

const icons: Record<EntityType, string> = {
  project: '📁', task: '✅', expense: '💳'
};

export const ContextRightPane: React.FC<ContextRightPaneProps> = ({
  entity,
  onClose,
  locale = 'vi',
  loaders = {},
  actions = [],
  width = 420
}) => {
  const [tab, setTab] = useState<'details'|'documents'|'activity'|'actions'>('details');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [acts, setActs] = useState<any[]>([]);

  useEffect(() => {
    if (!entity) return;
    setLoading(true);
    Promise.all([
      (loaders.fetchEntity || fetchEntity)(entity.type, entity.id),
      (loaders.listDocuments || listDocuments)(entity),
      (loaders.listActivity || listActivity)(entity),
    ]).then(([d, ds, as]) => {
      setDetails(d || null);
      setDocs(ds);
      setActs(as);
    }).finally(() => setLoading(false));
  }, [entity?.id, entity?.type]);

  if (!entity) return null;

  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docType = (file.type.includes('image') || file.type.includes('pdf')) ? 'receipt' : 'other';
    const d = await (loaders.linkDocument || linkDocument)(entity, file, docType as any, file.name);
    setDocs(prev => [d, ...prev]);
    setTab('documents');
  };

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width, background:'#ffffff', borderLeft:'1px solid #e5e7eb', boxShadow:'-4px 0 16px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ fontSize:22 }}>{icons[entity.type]}</div>
          <div>
            <div style={{ fontWeight:800, maxWidth: width-120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {details?.title || `${entity.type.toUpperCase()} ${entity.id.slice(0,6)}`}
            </div>
            {details?.subtitle && <div style={{ color:'#6b7280', fontSize:12 }}>{details.subtitle}</div>}
          </div>
        </div>
        <button onClick={onClose} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
        {(['details','documents','activity','actions'] as const).map(k => (
          <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', background: tab===k ? '#eef2ff' : '#fff', fontWeight: tab===k ? 700 : 500 }}>
            {k === 'details' ? t('Chi tiết','Details') : k === 'documents' ? t('Tài liệu','Documents') : k === 'activity' ? t('Hoạt động','Activity') : t('Hành động','Actions')}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto' }}>
        {loading && <div style={{ padding:12, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</div>}

        {!loading && tab === 'details' && (
          <div style={{ padding:12, display:'grid', gap:10 }}>
            <div style={{ fontWeight:700 }}>{t('Thông tin','Information')}</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {Object.entries(details?.meta || {}).map(([k,v]) => (
                  <tr key={k} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'8px 6px', color:'#6b7280', width:140 }}>{k}</td>
                    <td style={{ padding:'8px 6px' }}>{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <div style={{ fontWeight:700, marginTop:6 }}>{t('Dạng JSON đầy đủ','Raw JSON')}</div>
              <pre style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:8, padding:10, whiteSpace:'pre-wrap' }}>{JSON.stringify(details || {}, null, 2)}</pre>
            </div>
          </div>
        )}

        {!loading && tab === 'documents' && (
          <div style={{ padding:12, display:'grid', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Tài liệu đã liên kết','Linked documents')}</div>
              <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
                {t('Tải & liên kết','Upload & link')} <input type="file" style={{ display:'none' }} onChange={upload} />
              </label>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {docs.length === 0 && <div style={{ color:'#6b7280' }}>{t('Chưa có tài liệu.','No documents.')}</div>}
              {docs.map(d => (
                <a key={d.id} href={d.uri} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                  <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff', display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ width:24, textAlign:'center' }}>{d.doc_type === 'receipt' ? '🧾' : d.doc_type === 'contract' ? '📜' : d.doc_type === 'invoice' ? '💼' : '📄'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{d.title}</div>
                      <div style={{ color:'#6b7280', fontSize:12 }}>{new Date(d.uploaded_at).toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize:12, color:'#6b7280' }}>{d.doc_type.toUpperCase()}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'activity' && (
          <div style={{ padding:12, display:'grid', gap:8 }}>
            {acts.length === 0 && <div style={{ color:'#6b7280' }}>{t('Chưa có hoạt động.','No activity yet.')}</div>}
            {acts.map(a => (
              <div key={a.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, alignItems:'start', borderTop:'1px solid #f1f5f9', paddingTop:6 }}>
                <div style={{ color:'#6b7280', fontSize:12 }}>{new Date(a.time).toLocaleString()}</div>
                <div>
                  <div><b>{a.actor}</b> — {a.action}</div>
                  {a.message && <div style={{ color:'#6b7280', fontSize:13 }}>{a.message}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'actions' && (
          <div style={{ padding:12, display:'grid', gap:10 }}>
            {actions.length === 0 && <div style={{ color:'#6b7280' }}>{t('Chưa có hành động nhanh.','No quick actions.')}</div>}
            {actions.map(act => (
              <button key={act.key} onClick={()=>act.onClick(entity)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff', cursor:'pointer' }}>
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
