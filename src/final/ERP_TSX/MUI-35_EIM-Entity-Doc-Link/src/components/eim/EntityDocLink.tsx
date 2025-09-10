// src/components/eim/EntityDocLink.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  listProjects, listVendors, listDocuments, listLinks, linkDocs, unlinkDoc, updateRelation, suggestDocs,
  type EntityType, type DocumentRow
} from '../../mock/entity_doc_link';

type DocSel = { id: string; checked: boolean };

const typeLabels: Record<EntityType, { vi: string; en: string }> = {
  project: { vi:'Dự án', en:'Project' },
  vendor:  { vi:'Nhà cung cấp', en:'Vendor' },
  task:    { vi:'Công việc', en:'Task' },
  client:  { vi:'Khách hàng', en:'Client' },
};

export const EntityDocLink: React.FC<{ locale?: 'vi'|'en', context?: { entity_type: EntityType, entity_id: string } }> = ({ locale='vi', context }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // context / selection
  const [etype, setEtype] = useState<EntityType>(context?.entity_type || 'project');
  const [eid, setEid] = useState<string>(context?.entity_id || '');

  // lookup
  const [projects, setProjects] = useState<Array<{ id:string; name:string; code?:string }>>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // library & links
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [links, setLinks] = useState<Array<{ doc_id:string; relation?: string }>>([]);
  const [suggest, setSuggest] = useState<Array<{ doc_id:string; reason:string; score:number }>>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(()=>{ listProjects().then(setProjects); listVendors().then(setVendors); listDocuments().then(setDocs); }, []);
  useEffect(()=>{ (async () => { if (!eid) return; const ll = await listLinks(etype, eid); setLinks(ll.map(x => ({ doc_id:x.doc_id, relation: x.relation }))); setSuggest(await suggestDocs(etype, eid)); })(); }, [etype, eid]);

  useEffect(()=>{
    // preselect suggestions
    const m: Record<string, boolean> = {};
    suggest.forEach(s => m[s.doc_id] = true);
    setSel(m);
  }, [suggest]);

  const linkedSet = useMemo(()=> new Set(links.map(l => l.doc_id)), [links]);
  const filteredDocs = useMemo(()=> docs.filter(d => (d.title+' '+d.file_name+' '+(d.vendor||'')+' '+(d.tags||[]).join(' ')).toLowerCase().includes(filter.toLowerCase())), [docs, filter]);

  const onLinkSelected = async () => {
    if (!eid) { alert(t('Chưa chọn thực thể','No entity selected')); return; }
    const ids = Object.keys(sel).filter(k => sel[k]);
    if (!ids.length) { alert(t('Chưa chọn tài liệu','No documents selected')); return; }
    await linkDocs(etype, eid, ids);
    const ll = await listLinks(etype, eid); setLinks(ll.map(x => ({ doc_id:x.doc_id, relation:x.relation })));
    alert(t('Đã liên kết','Linked'));
  };

  const onUnlink = async (doc_id: string) => {
    if (!eid) return;
    await unlinkDoc(etype, eid, doc_id);
    const ll = await listLinks(etype, eid); setLinks(ll.map(x => ({ doc_id:x.doc_id, relation:x.relation })));
  };

  const setRelation = async (doc_id: string, rel: string) => {
    if (!eid) return;
    await updateRelation(etype, eid, doc_id, rel as any);
    const ll = await listLinks(etype, eid); setLinks(ll.map(x => ({ doc_id:x.doc_id, relation:x.relation })));
  };

  // entity pickers
  const EntityPicker: React.FC = () => {
    if (etype==='project') {
      return (
        <select value={eid} onChange={e=>setEid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('— Chọn dự án —','— Select project —')}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
        </select>
      );
    } else if (etype==='vendor') {
      return (
        <input list="vendorList" value={eid} onChange={e=>setEid(e.target.value)} placeholder={t('Nhập tên nhà cung cấp','Enter vendor name')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
      );
    } else {
      return (
        <input value={eid} onChange={e=>setEid(e.target.value)} placeholder={t('Nhập ID','Enter ID')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
      );
    }
  };

  const DocCard: React.FC<{ d: DocumentRow }> = ({ d }) => {
    const checked = !!sel[d.id];
    const linked = linkedSet.has(d.id);
    return (
      <div key={d.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'110px auto auto' }}>
        <div style={{ background:'#f8fafc', display:'grid', placeItems:'center' }}>
          {d.preview_data_url && d.mime.startsWith('image/') ? <img src={d.preview_data_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
           <div style={{ color:'#6b7280' }}>{d.mime || 'FILE'}</div>}
        </div>
        <div style={{ padding:'8px 10px', display:'grid', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
            <input type="checkbox" checked={checked} onChange={e=>setSel(m => ({ ...m, [d.id]: e.target.checked }))} />
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{d.doc_type} • {d.file_name}</div>
          {d.vendor && <div style={{ color:'#6b7280', fontSize:12 }}>{t('Vendor','Vendor')}: {d.vendor}</div>}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {(d.tags||[]).map((tag,i) => <span key={i} style={{ fontSize:12, border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', background:'#f9fafb' }}>#{tag}</span>)}
          </div>
        </div>
        <div style={{ padding:'8px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <a href={d.preview_data_url || '#'} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>{t('Xem','Open')}</a>
          <div style={{ fontSize:12, color: linked ? '#16a34a' : '#6b7280' }}>{linked ? t('Đã liên kết','Linked') : ' '}</div>
        </div>
      </div>
    );
  };

  const LinkedRow: React.FC<{ l: { doc_id:string; relation?: string } }> = ({ l }) => {
    const d = docs.find(x => x.id===l.doc_id);
    if (!d) return null;
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 160px auto', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9' }}>
        <div style={{ display:'grid' }}>
          <div style={{ fontWeight:700 }}>{d.title}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{d.doc_type} • {d.file_name}</div>
        </div>
        <select value={l.relation||'other'} onChange={e=>setRelation(d.id, e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {['primary','supporting','invoice','receipt','other'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <button onClick={()=>onUnlink(d.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header / Context */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Liên kết tài liệu với thực thể','Link documents to entity')}</div>
          <select value={etype} onChange={e=>{ setEtype(e.target.value as EntityType); setEid(''); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {(Object.keys(typeLabels) as EntityType[]).map(k => <option key={k} value={k}>{typeLabels[k][locale]}</option>)}
          </select>
          <EntityPicker />
          <datalist id="vendorList">
            {vendors.map(v => <option key={v} value={v} />)}
          </datalist>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onLinkSelected} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Liên kết đã chọn','Link selected')}</button>
        </div>
      </div>

      {/* Library & Linked panels */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Library */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Thư viện tài liệu','Document library')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý theo ngữ cảnh sẽ tự tick sẵn','Context suggestions pre-selected')}</div>
          </div>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Tìm tiêu đề/tên tệp/vendor/tags...','Search title/file/vendor/tags...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setSel({})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Bỏ chọn','Clear')}</button>
              <button onClick={()=>{ const m: Record<string, boolean> = {}; filteredDocs.forEach(d => m[d.id]=true); setSel(m); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Chọn tất cả','Select all')}</button>
            </div>
          </div>
          <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:10, alignContent:'start' }}>
            {filteredDocs.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : filteredDocs.map(d => <DocCard key={d.id} d={d} />)}
          </div>
        </div>

        {/* Linked */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Đã liên kết','Linked to entity')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{links.length}</div>
          </div>
          <div style={{ overflow:'auto' }}>
            {links.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> : links.map(l => <LinkedRow key={l.doc_id} l={l} />)}
          </div>
          <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
            {t('Mẹo: đặt quan hệ (primary/supporting/invoice/receipt) để tích hợp với các module khác.','Tip: set relation (primary/supporting/invoice/receipt) for downstream modules.')}
          </div>
        </div>
      </div>

      {/* Suggestions banner */}
      {eid && suggest.length>0 && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#f9fafb', padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div><b>{t('Gợi ý','Suggestions')}:</b> {t('Đã tìm thấy','Found')} {suggest.length} {t('tài liệu liên quan','related docs')} — {t('tự đánh dấu sẵn ở thư viện','pre-selected in the library')}.</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tiêu chí: trùng mã dự án/tên, project_id, vendor, tags, file name.','Criteria: match project code/name, project_id, vendor, tags, file name.')}</div>
        </div>
      )}
    </div>
  );
};
