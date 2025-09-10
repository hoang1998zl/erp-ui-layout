// src/components/eim/DocumentViewer.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listDocuments, getDocument, seedIfEmpty, type DocumentRow } from '../../mock/doc_viewer';

type FitMode = 'fit-width'|'fit-height'|'actual';

export const DocumentViewer: React.FC<{ locale?: 'vi'|'en', initialId?: string }> = ({ locale='vi', initialId }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [fit, setFit] = useState<FitMode>('fit-width');
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const previewRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    await seedIfEmpty();
    const rows = await listDocuments();
    setDocs(rows);
    if (!activeId) {
      if (initialId && rows.find(r => r.id===initialId)) setActiveId(initialId);
      else setActiveId(rows[0]?.id || '');
    }
  };
  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(()=> docs.filter(d => (d.title+' '+d.file_name+' '+(d.vendor||'')+' '+(d.tags||[]).join(' ')).toLowerCase().includes(filter.toLowerCase())), [docs, filter]);
  const idx = useMemo(()=> filtered.findIndex(d => d.id===activeId), [filtered, activeId]);
  const active = useMemo(()=> filtered[idx] || null, [filtered, idx]);

  // keyboard navigation
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if (e.key==='ArrowRight') { if (idx < filtered.length - 1) setActiveId(filtered[idx+1].id); }
      if (e.key==='ArrowLeft')  { if (idx > 0) setActiveId(filtered[idx-1].id); }
      if (e.key==='+' || (e.key==='=' && (e.ctrlKey||e.metaKey))) { e.preventDefault(); if (isImage(active)) setZoom(z => Math.min(400, z+10)); }
      if (e.key==='-' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); if (isImage(active)) setZoom(z => Math.max(10, z-10)); }
      if (e.key==='0' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); if (isImage(active)) setZoom(100); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, idx, active]);

  const isImage = (d: DocumentRow | null) => !!d && (d.mime?.startsWith('image/') || (d.preview_data_url?.startsWith('data:image/')));
  const isPDF = (d: DocumentRow | null) => !!d && (d.mime==='application/pdf' || (d.preview_data_url?.startsWith('data:application/pdf')));

  useEffect(()=>{ setZoom(100); setRotation(0); }, [activeId]);
  useEffect(()=>{ if (fit!=='actual') setZoom(100); }, [fit]);

  const onRotate = (deg: number) => setRotation(r => (r + deg + 360) % 360);

  const openNewTab = () => {
    if (!active) return;
    const url = active.preview_data_url || '#';
    window.open(url, '_blank');
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Document Viewer','Document Viewer')}</div>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Tìm tiêu đề/tên tệp/vendor/tags...','Search title/file/vendor/tags...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:360 }} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end' }}>
          <button onClick={openNewTab} disabled={!active?.preview_data_url} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: active?.preview_data_url?1:.5 }}>{t('Mở tab mới','Open in new tab')}</button>
        </div>
      </div>

      {/* Body: left list + right preview */}
      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:12, minHeight: '70vh' }}>
        {/* Left list */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr', overflow:'hidden' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>
            {t('Thư viện','Library')} ({filtered.length})
          </div>
          <div style={{ overflow:'auto' }}>
            {filtered.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> : filtered.map(d => {
              const activeRow = d.id===activeId;
              return (
                <button key={d.id} onClick={()=>setActiveId(d.id)}
                        style={{ width:'100%', textAlign:'left', border:'none', background: activeRow ? '#eef2ff' : '#fff', borderTop:'1px solid #f1f5f9', padding:8, display:'grid', gridTemplateColumns:'50px 1fr', gap:8, alignItems:'center' }}>
                  <div style={{ width:50, height:50, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', overflow:'hidden', display:'grid', placeItems:'center' }}>
                    {d.preview_data_url && d.mime?.startsWith('image/') ? <img src={d.preview_data_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
                     d.mime==='application/pdf' ? <span style={{ fontSize:12 }}>PDF</span> :
                     <span style={{ fontSize:12 }}>{(d.mime||'FILE').slice(0,10)}</span>}
                  </div>
                  <div style={{ overflow:'hidden' }}>
                    <div style={{ fontWeight:700, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{d.title}</div>
                    <div style={{ color:'#6b7280', fontSize:12, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{d.doc_type} • {d.file_name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto', overflow:'hidden' }}>
          {/* Metadata + toolbar */}
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f9fafb' }}>
            <div style={{ display:'grid' }}>
              <div style={{ fontWeight:800 }}>{active?.title || t('Chưa chọn tài liệu','No document selected')}</div>
              {active && (
                <div style={{ color:'#6b7280', fontSize:12 }}>
                  {active.doc_type} • {active.file_name} • {active.mime} • {(active.size||0).toLocaleString()}B {active.vendor? ` • ${t('Vendor','Vendor')}: ${active.vendor}`:''} {typeof active.amount!=='undefined'? ` • ${active.amount?.toLocaleString?.()||active.amount} ${active.currency||''}`:''}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {isImage(active) ? (
                <>
                  <select value={fit} onChange={e=>setFit(e.target.value as FitMode)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
                    <option value="fit-width">{t('Fit chiều rộng','Fit width')}</option>
                    <option value="fit-height">{t('Fit chiều cao','Fit height')}</option>
                    <option value="actual">{t('100%','100%')}</option>
                  </select>
                  <button onClick={()=>setZoom(z=>Math.max(10, z-10))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>−</button>
                  <div style={{ width:70, textAlign:'center' }}>{zoom}%</div>
                  <button onClick={()=>setZoom(z=>Math.min(400, z+10))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>＋</button>
                  <button onClick={()=>onRotate(90)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>⟳</button>
                </>
              ) : isPDF(active) ? (
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mẹo: dùng điều khiển của trình duyệt trong khung PDF để zoom/print.','Tip: use the browser PDF controls to zoom/print.')}</div>
              ) : (
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Không hỗ trợ preview loại tệp này.','Preview not supported for this file type.')}</div>
              )}
            </div>
          </div>

          {/* Preview area */}
          <div ref={previewRef} style={{ position:'relative', overflow:'auto', background:'#f8fafc' }}>
            {!active ? (
              <div style={{ padding:20, color:'#6b7280' }}>{t('Chọn một tài liệu để xem trước.','Select a document to preview.')}</div>
            ) : isImage(active) ? (
              <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', padding:10 }}>
                <img src={active.preview_data_url} style={{
                  maxWidth: fit==='fit-width'? '100%' : undefined,
                  maxHeight: fit==='fit-height'? '100%' : undefined,
                  transform: `scale(${zoom/100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform .1s ease-out',
                  boxShadow: '0 10px 30px rgba(0,0,0,.08)',
                  borderRadius: 12
                }} />
              </div>
            ) : isPDF(active) ? (
              <iframe src={active.preview_data_url} style={{ width:'100%', height:'100%', border:'none' }} title="PDF preview"></iframe>
            ) : (
              <div style={{ padding:20 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{t('Không thể preview','Cannot preview')}</div>
                <div style={{ color:'#6b7280' }}>{t('Loại tệp','File type')}: {active.mime || '—'}</div>
              </div>
            )}
          </div>

          {/* Footer: tags & actions */}
          <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {(active?.tags||[]).map((tag,i) => <span key={i} style={{ fontSize:12, border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', background:'#f9fafb' }}>#{tag}</span>)}
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{active ? `${t('Tạo bởi','Created by')}: ${active.created_by} • ${new Date(active.created_at).toLocaleString()}` : ' '}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
