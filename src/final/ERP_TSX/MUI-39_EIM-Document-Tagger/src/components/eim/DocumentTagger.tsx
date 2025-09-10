// src/components/eim/DocumentTagger.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listDocuments, setTags, addTags, removeTags, bulkAdd, bulkRemove, suggestTags, tagStats, normalizeTags, type DocumentRow, type DocType } from '../../mock/tagger_docs';

const typeLabels: Record<DocType|'all', { vi: string; en: string }> = {
  contract: { vi:'Hợp đồng', en:'Contract' },
  invoice:  { vi:'Hóa đơn', en:'Invoice' },
  receipt:  { vi:'Biên nhận', en:'Receipt' },
  other:    { vi:'Khác', en:'Other' },
  all:      { vi:'Tất cả', en:'All' },
};

function Chip({ text, onClick, selected=false }: { text:string, onClick?:()=>void, selected?: boolean }) {
  return <button onClick={onClick} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'0 10px', background: selected? '#eef2ff':'#f9fafb', fontSize:12 }}>{text}</button>;
}

export const DocumentTagger: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // filters
  const [filter, setFilter] = useState<{ search:string; type: DocType|'all'; project_id: string }>({ search:'', type:'all', project_id:'' });
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [suggested, setSuggested] = useState<Record<string, string[]>>({});
  const [stats, setStats] = useState<Array<{ tag:string; count:number }>>([]);

  const reload = async () => {
    const list = await listDocuments({ search: filter.search, type: filter.type, project_id: filter.project_id || undefined });
    setRows(list);
    const sg: Record<string, string[]> = {};
    list.slice(0, 50).forEach(d => { sg[d.id] = suggestTags(d); });
    setSuggested(sg);
    setStats(await tagStats(filter.project_id || undefined));
  };
  useEffect(()=>{ reload(); }, [filter.search, filter.type, filter.project_id]);

  const allSelectedIds = useMemo(()=> Object.keys(selected).filter(k => selected[k]), [selected]);
  const anySelected = allSelectedIds.length>0;

  const toggleSel = (id: string, v?: boolean) => setSelected(m => ({ ...m, [id]: typeof v==='boolean' ? v : !m[id] }));
  const selectAll = () => { const m: Record<string, boolean> = {}; rows.forEach(r => m[r.id]=true); setSelected(m); };
  const clearSel = () => setSelected({});

  const addDocTag = async (doc_id: string, text: string) => {
    const tags = normalizeTags(text.split(',').map(s => s.trim()));
    if (!tags.length) return;
    await addTags(doc_id, tags);
    await reload();
  };
  const removeDocTag = async (doc_id: string, tag: string) => {
    await removeTags(doc_id, [tag]);
    await reload();
  };

  const [bulkText, setBulkText] = useState('');
  const doBulkAdd = async () => { if (!anySelected) return alert(t('Chưa chọn tài liệu','No documents selected')); const tags = normalizeTags(bulkText.split(',').map(s => s.trim())); if (!tags.length) return; await bulkAdd(allSelectedIds, tags); await reload(); setBulkText(''); };
  const doBulkRemove = async () => { if (!anySelected) return alert(t('Chưa chọn tài liệu','No documents selected')); const tags = normalizeTags(bulkText.split(',').map(s => s.trim())); if (!tags.length) return; await bulkRemove(allSelectedIds, tags); await reload(); setBulkText(''); };

  const TagEditor: React.FC<{ d: DocumentRow }> = ({ d }) => {
    const [txt, setTxt] = useState('');
    return (
      <div style={{ display:'grid', gap:6 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(d.tags||[]).map((tag,i) => <Chip key={i} text={`#${tag}`} onClick={()=>removeDocTag(d.id, tag)} />)}
          {(!d.tags || d.tags.length===0) && <div style={{ color:'#6b7280', fontSize:12 }}>—</div>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6 }}>
          <input value={txt} onChange={e=>setTxt(e.target.value)} placeholder={t('Nhập tag, phân cách bằng dấu phẩy','Enter tag(s), comma separated')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <button onClick={()=>{ addDocTag(d.id, txt); setTxt(''); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm','Add')}</button>
        </div>
        {suggested[d.id]?.length>0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {suggested[d.id].map((s,i) => <Chip key={i} text={`+ ${s}`} onClick={()=>addDocTag(d.id, s)} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header & Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Gắn tag tài liệu','Document tagging')}</div>
          <select value={filter.type} onChange={e=>setFilter(f=>({ ...f, type: e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {(['all','contract','invoice','receipt','other'] as Array<DocType|'all'>).map(k => <option key={k} value={k}>{typeLabels[k][locale]}</option>)}
          </select>
          <input value={filter.search} onChange={e=>setFilter(f=>({ ...f, search: e.target.value }))} placeholder={t('Tìm tiêu đề/tệp/tags/vendor...','Search title/file/tags/vendor...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:360 }} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={selectAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Chọn tất cả','Select all')}</button>
          <button onClick={clearSel} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Bỏ chọn','Clear')}</button>
        </div>
      </div>

      {/* Body: left docs list + right tag workspace */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Docs list */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Danh sách tài liệu','Documents')} ({rows.length})</div>
          <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:10 }}>
            {rows.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : rows.map(d => (
              <div key={d.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'110px auto auto' }}>
                <div style={{ background:'#f8fafc', display:'grid', gridTemplateColumns:'40px 1fr auto', gap:8, alignItems:'center', padding:'6px 8px' }}>
                  <input type="checkbox" checked={!!selected[d.id]} onChange={e=>toggleSel(d.id, e.target.checked)} />
                  <div>
                    <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{d.doc_type} • {d.file_name}</div>
                  </div>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{d.doc_date || '—'}</div>
                </div>
                <div style={{ padding:'8px 10px' }}>
                  <TagEditor d={d} />
                </div>
                <div style={{ padding:'8px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{d.vendor || ' '}</div>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{(d.tags||[]).length} {t('tags','tags')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tag workspace */}
        <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12 }}>
          {/* Bulk editor */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto auto', gap:6 }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Bulk tag','Bulk tag')}</div>
            <div style={{ padding:'6px 10px', color:'#6b7280', fontSize:12 }}>{t('Đang chọn','Selected')}: {allSelectedIds.length}</div>
            <div style={{ padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr auto auto', gap:8 }}>
              <input value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder={t('Nhập các tag, phân cách bằng dấu phẩy','Enter tags, comma separated')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <button onClick={doBulkAdd} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Thêm vào','Add to selected')}</button>
              <button onClick={doBulkRemove} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Gỡ khỏi','Remove from selected')}</button>
            </div>
          </div>

          {/* Suggestions / Top tags */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Gợi ý & Thống kê','Suggestions & Stats')}</div>
            <div style={{ padding:'6px 10px', color:'#6b7280', fontSize:12 }}>{t('Top tags trong dự án/khối lọc','Top tags in current scope')}</div>
            <div style={{ padding:'8px 10px', display:'flex', flexWrap:'wrap', gap:6, alignContent:'start' }}>
              {stats.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : stats.map(s => <Chip key={s.tag} text={`${s.tag} (${s.count})`} onClick={()=>{ setBulkText(b => b ? b+','+s.tag : s.tag); }} />)}
            </div>
          </div>

          {/* Help */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', color:'#6b7280', fontSize:12 }}>
            {t('Quy ước','Convention')}: {t('tag chuẩn hoá theo lowercase-kebab; bấm vào tag để gỡ; gợi ý dựa trên loại tài liệu, vendor, năm và token trong tên tệp/tiêu đề.','tags normalized to lowercase-kebab; click tag to remove; suggestions from doc type, vendor, year and tokens from file name/title.')}
          </div>
        </div>
      </div>
    </div>
  );
};
