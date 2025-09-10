// src/components/eim/DocumentUpload.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listProjects, listDocuments, uploadOne, deleteDocument, exportCSV, type DocumentRow, type DocType } from '../../mock/documents';

type Filter = { search: string; type: DocType|'all'; project_id: string; date_from?: string; date_to?: string };

const typeLabels: Record<DocType|'all', { vi: string; en: string }> = {
  contract: { vi:'Hợp đồng', en:'Contract' },
  invoice:  { vi:'Hóa đơn', en:'Invoice' },
  receipt:  { vi:'Biên nhận', en:'Receipt' },
  other:    { vi:'Khác', en:'Other' },
  all:      { vi:'Tất cả', en:'All' },
};

function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
  if (n < 1024*1024*1024) return `${(n/1024/1024).toFixed(1)} MB`;
  return `${(n/1024/1024/1024).toFixed(1)} GB`;
}

const acceptMime = [
  'application/pdf',
  'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel',
  'text/csv','text/plain'
];

export const DocumentUpload: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({ search:'', type:'all', project_id:'' });
  const [rows, setRows] = useState<DocumentRow[]>([]);

  // form state
  const [docType, setDocType] = useState<DocType>('contract');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [docDate, setDocDate] = useState('');

  const [uploads, setUploads] = useState<Array<{ id: string; name: string; size: number; mime: string; dataUrl?: string; error?: string; progress?: number }>>([]);

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(ps[0]?.id || ''); setFilter(f => ({ ...f, project_id: ps[0]?.id || '' })); }); }, []);
  const reload = async () => { setRows(await listDocuments({ search: filter.search, type: filter.type, project_id: filter.project_id || undefined, date_from: filter.date_from, date_to: filter.date_to })); };
  useEffect(()=>{ reload(); }, [filter.project_id, filter.type, filter.search, filter.date_from, filter.date_to]);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const items: Array<{ id: string; name: string; size: number; mime: string; dataUrl?: string; error?: string; progress?: number }> = [];
    for (const f of Array.from(files)) {
      const okType = acceptMime.includes(f.type) || f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.txt');
      const okSize = f.size <= 25 * 1024 * 1024; // 25MB
      const it: any = { id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name: f.name, size: f.size, mime: f.type };
      if (!okType) { it.error = t('Định dạng không hỗ trợ','Unsupported file type'); }
      if (!okSize) { it.error = (it.error? it.error + ' • ' : '') + t('Quá 25MB','Over 25MB'); }
      // preview for images/pdf under 3MB
      if (!it.error && (f.type.startsWith('image/') || f.type==='application/pdf') && f.size <= 3*1024*1024) {
        it.dataUrl = await new Promise<string|undefined>(res => { const r = new FileReader(); r.onload = ()=>res(String(r.result||'')); r.onerror=()=>res(undefined); r.readAsDataURL(f); });
      }
      items.push(it);
    }
    setUploads(prev => [...prev, ...items]);
    if (fileInput.current) fileInput.current.value='';
  };

  const onDrop = async (ev: React.DragEvent) => {
    ev.preventDefault();
    onPickFiles(ev.dataTransfer.files);
  };
  const onDragOver = (ev: React.DragEvent) => { ev.preventDefault(); };

  const removeUpload = (id: string) => setUploads(prev => prev.filter(x => x.id!==id));

  const startUpload = async () => {
    // validation
    if (!pid) { alert(t('Chưa chọn dự án','Project not selected')); return; }
    const validItems = uploads.filter(u => !u.error);
    if (!validItems.length) { alert(t('Không có tệp hợp lệ để tải','No valid files to upload')); return; }
    // upload sequentially to show progress
    for (const u of validItems) {
      setUploads(prev => prev.map(x => x.id===u.id ? { ...x, progress: 1 } : x));
      const payload = {
        title: title || u.name,
        doc_type: docType,
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        project_id: pid,
        vendor: (docType==='invoice'||docType==='receipt') ? vendor : undefined,
        amount: (docType==='invoice'||docType==='receipt') ? Number(amount||0) : undefined,
        currency: (docType==='invoice'||docType==='receipt') ? currency : undefined,
        doc_date: docDate || undefined,
        file_name: u.name,
        mime: u.mime || 'application/octet-stream',
        size: u.size,
        preview_data_url: u.dataUrl
      };
      await uploadOne(payload, (pct)=> setUploads(prev => prev.map(x => x.id===u.id ? { ...x, progress: pct } : x)));
    }
    setUploads([]);
    await reload();
    alert(t('Tải lên xong','Upload completed'));
  };

  const onExportCSV = async () => {
    const blob = await exportCSV({ project_id: filter.project_id || undefined });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='documents.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const filtered = rows; // already filtered server-side (mock)

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Tải tài liệu (Contract/Invoice/Receipt)','Upload documents (Contract/Invoice/Receipt)')}</div>
          <select value={filter.project_id} onChange={e=>setFilter(f => ({ ...f, project_id: e.target.value }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onExportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr 220px 220px 220px 220px', gap:8, alignItems:'center' }}>
        <input value={filter.search} onChange={e=>setFilter(f=>({ ...f, search: e.target.value }))} placeholder={t('Tìm tiêu đề/tệp/tags/vendor...','Search title/file/tags/vendor...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <select value={filter.type} onChange={e=>setFilter(f=>({ ...f, type: e.target.value as any }))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {(['all','contract','invoice','receipt','other'] as Array<DocType|'all'>).map(k => <option key={k} value={k}>{typeLabels[k][locale]}</option>)}
        </select>
        <input type="date" value={filter.date_from||''} onChange={e=>setFilter(f=>({ ...f, date_from: e.target.value || undefined }))} title={t('Từ ngày','From date')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <input type="date" value={filter.date_to||''} onChange={e=>setFilter(f=>({ ...f, date_to: e.target.value || undefined }))} title={t('Đến ngày','To date')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lưu ý: Virus scan sẽ chạy sau khi tải lên','Note: Virus scan runs after upload')}</div>
      </div>

      {/* Upload form */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gridTemplateColumns:'1.2fr 2fr', gap:12 }}>
        {/* Left: metadata */}
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <select value={docType} onChange={e=>setDocType(e.target.value as DocType)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              {(['contract','invoice','receipt','other'] as DocType[]).map(k => <option key={k} value={k}>{typeLabels[k][locale]}</option>)}
            </select>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t('Tiêu đề (nếu để trống sẽ dùng tên tệp)','Title (fallback = file name)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          {(docType==='invoice' || docType==='receipt') && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              <input value={vendor} onChange={e=>setVendor(e.target.value)} placeholder={t('Nhà cung cấp / Bên bán','Vendor')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <input type="number" min={0} step={0.01} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={t('Số tiền','Amount')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                {['VND','USD','EUR','JPY','CNY'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input type="date" value={docDate} onChange={e=>setDocDate(e.target.value)} placeholder={t('Ngày chứng từ','Document date')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <input value={tags} onChange={e=>setTags(e.target.value)} placeholder={t('Tags (phân cách bằng dấu phẩy)','Tags (comma separated)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Metadata sẽ áp dụng cho tất cả tệp trong đợt tải này (có thể sửa sau).','Metadata applies to all files in this batch (you can edit later).')}</div>
        </div>

        {/* Right: dropzone & queue */}
        <div>
          <div onDrop={onDrop} onDragOver={onDragOver} style={{ border:'2px dashed #cbd5e1', borderRadius:12, background:'#f8fafc', padding:16, display:'grid', placeItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Kéo & thả tệp vào đây','Drag & drop files here')}</div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>{t('hoặc','or')}</div>
              <div style={{ marginTop:8 }}>
                <button onClick={()=>fileInput.current?.click()} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Chọn tệp','Choose files')}</button>
                <input ref={fileInput} type="file" multiple accept={acceptMime.join(',')} onChange={e=>onPickFiles(e.target.files)} style={{ display:'none' }} />
              </div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:8 }}>{t('Hỗ trợ: PDF, hình ảnh, DOCX, XLSX, CSV, TXT — tối đa 25MB/tệp','Supports: PDF, images, DOCX, XLSX, CSV, TXT — up to 25MB/file')}</div>
            </div>
          </div>

          {/* Queue */}
          {uploads.length>0 && (
            <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Hàng đợi tải lên','Upload queue')}</div>
              <div>
                {uploads.map(u => (
                  <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px auto', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:44, height:44, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', display:'grid', placeItems:'center', overflow:'hidden' }}>
                        {u.dataUrl && u.mime.startsWith('image/') ? <img src={u.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
                         u.mime==='application/pdf' ? <span style={{ fontSize:12 }}>PDF</span> :
                         <span style={{ fontSize:12 }}>FILE</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight:700 }}>{u.name}</div>
                        <div style={{ color:'#6b7280', fontSize:12 }}>{humanSize(u.size)} • {u.mime||'—'}</div>
                        {u.error && <div style={{ color:'#b91c1c', fontSize:12 }}>{u.error}</div>}
                      </div>
                    </div>
                    <div>
                      {u.progress ? (
                        <div style={{ width:'100%', height:10, background:'#e5e7eb', borderRadius:999, overflow:'hidden' }}>
                          <div style={{ width:`${u.progress}%`, height:'100%' }}></div>
                        </div>
                      ) : <span style={{ color:'#6b7280' }}>—</span>}
                    </div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{u.progress? `${u.progress}%` : ' '}</div>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button onClick={()=>removeUpload(u.id)} disabled={!!u.progress} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff', opacity: u.progress? .5:1 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end' }}>
                <button onClick={startUpload} disabled={uploads.every(u=>!!u.error)} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Tải lên','Upload')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr' }}>
        <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{t('Tài liệu đã tải','Uploaded documents')}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Bấm để xem/ tải về — mock preview cho ảnh/PDF nhỏ','Click to view/download — mock preview for small images/PDF')}</div>
        </div>
        <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:10, alignContent:'start' }}>
          {filtered.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : filtered.map(d => (
            <div key={d.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'160px auto auto' }}>
              <div style={{ background:'#f8fafc', display:'grid', placeItems:'center', position:'relative' }}>
                {d.preview_data_url && d.mime.startsWith('image/') ? <img src={d.preview_data_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
                 d.preview_data_url && d.mime==='application/pdf' ? <iframe src={d.preview_data_url} style={{ width:'100%', height:'100%', border:'none' }}></iframe> :
                 <div style={{ color:'#6b7280' }}>{d.mime || 'FILE'}</div>}
                <div style={{ position:'absolute', top:8, right:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', fontSize:12 }}>
                  {d.status==='pending_scan' ? t('Đang quét','Scanning') : d.status==='clean' ? t('An toàn','Clean') : t('Chặn','Blocked')}
                </div>
              </div>
              <div style={{ padding:'8px 10px', display:'grid', gap:6 }}>
                <div style={{ fontWeight:700 }}>{d.title}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{typeLabels[d.doc_type][locale]} • {d.file_name}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{d.vendor ? `${t('Nhà CC','Vendor')}: ${d.vendor}` : ''} {typeof d.amount!=='undefined' ? ` • ${d.amount?.toLocaleString?.()||d.amount} ${d.currency||''}` : ''}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(d.tags||[]).map((tag,i) => <span key={i} style={{ fontSize:12, border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', background:'#f9fafb' }}>#{tag}</span>)}
                </div>
              </div>
              <div style={{ padding:'8px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <a href={d.preview_data_url || '#'} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>{t('Xem/Tải','View/Download')}</a>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={async ()=>{ if(confirm(t('Xóa tài liệu này?','Delete this document?'))) { await deleteDocument(d.id); await reload(); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
