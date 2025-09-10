// src/components/eim/ReceiptOCRUploader.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listProjects, uploadOne, type DocumentRow } from '../../mock/documents';
import { listReceipts, getByDocId, runOCRMock, upsertReceipt, exportCSV, type ExpenseReceipt } from '../../mock/receipt_ocr';

type FitMode = 'fit-width'|'fit-height';
const humanSize = (n:number)=> n<1024?`${n} B`: n<1024*1024?`${(n/1024).toFixed(1)} KB`: n<1024*1024*1024?`${(n/1024/1024).toFixed(1)} MB`:`${(n/1024/1024/1024).toFixed(1)} GB`;

export const ReceiptOCRUploader: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>('');
  const [queue, setQueue] = useState<Array<{ id:string; name:string; size:number; mime:string; dataUrl?: string; progress?: number }>>([]);
  const [fit, setFit] = useState<FitMode>('fit-width');
  const [receipts, setReceipts] = useState<ExpenseReceipt[]>([]);
  const [active, setActive] = useState<ExpenseReceipt | null>(null);
  const [search, setSearch] = useState('');

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(ps[0]?.id||''); }); }, []);
  const reload = async () => { if (!pid) return; setReceipts(await listReceipts(pid)); };
  useEffect(()=>{ reload(); }, [pid]);

  const pickFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr: any[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = (f.type.startsWith('image/') && f.size<=3*1024*1024) ? await new Promise<string|undefined>(res=>{ const r = new FileReader(); r.onload=()=>res(String(r.result||'')); r.onerror=()=>res(undefined); r.readAsDataURL(f); }) : undefined;
      arr.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name: f.name, size: f.size, mime: f.type, dataUrl });
    }
    setQueue(prev => [...prev, ...arr]);
    if (fileInput.current) fileInput.current.value='';
  };

  const onDrop = (e: React.DragEvent)=>{ e.preventDefault(); pickFiles(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent)=>{ e.preventDefault(); };

  const startUpload = async () => {
    if (!pid) { alert(t('Chưa chọn dự án','Select a project first')); return; }
    for (const u of queue) {
      setQueue(prev => prev.map(x => x.id===u.id ? { ...x, progress: 1 } : x));
      const res = await uploadOne({
        title: u.name, doc_type: 'receipt', project_id: pid,
        file_name: u.name, mime: u.mime||'application/octet-stream', size: u.size, preview_data_url: u.dataUrl
      }, pct => setQueue(prev => prev.map(x => x.id===u.id ? { ...x, progress: pct } : x)));
      // run OCR mock
      const doc: DocumentRow = { id: res.id, title: u.name, doc_type:'receipt', tags:[], project_id: pid, file_name: u.name, mime: u.mime, size: u.size, preview_data_url: u.dataUrl, status:'clean', created_by:'current_user', created_at:new Date().toISOString() } as any;
      const rec = await runOCRMock(doc);
      setActive(rec);
    }
    setQueue([]);
    await reload();
  };

  const filtered = useMemo(()=> receipts.filter(r => {
    const get = (f:any)=> (f?.value||'')+'';
    const hay = [get(r.vendor), get(r.date), get(r.currency), get(r.total), get(r.category)].join(' ').toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [receipts, search]);

  const saveActive = async (patch: Partial<ExpenseReceipt>) => {
    if (!active) return;
    const rec = await upsertReceipt({ ...active, ...patch, id: active.id, doc_id: active.doc_id });
    setActive(rec);
    await reload();
  };

  const onExport = async () => {
    const blob = await exportCSV(pid || undefined); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='receipts.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const confidenceChip = (c?: number) => {
    const bg = !c ? '#e5e7eb' : c>0.85 ? '#dcfce7' : c>0.7 ? '#fef9c3' : '#fee2e2';
    return { background:bg, borderRadius:999, padding:'0 8px', fontSize:12 };
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Tải biên nhận + OCR','Receipt OCR upload')}</div>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm vendor/ngày/số tiền...','Search vendor/date/amount...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Uploader + List */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12 }}>
        {/* Uploader + Review */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Tải tệp biên nhận','Upload receipt files')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Hỗ trợ ảnh/PDF (ảnh ≤ 3MB có preview).','Supports images/PDF (images ≤ 3MB preview).')}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:10 }}>
            {/* Dropzone & Queue */}
            <div>
              <div onDrop={onDrop} onDragOver={onDragOver} style={{ border:'2px dashed #cbd5e1', borderRadius:12, background:'#f8fafc', padding:16, display:'grid', placeItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700 }}>{t('Kéo & thả ảnh/PDF vào đây','Drag & drop images/PDF here')}</div>
                  <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>{t('hoặc','or')}</div>
                  <div style={{ marginTop:8 }}>
                    <button onClick={()=>fileInput.current?.click()} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Chọn tệp','Choose files')}</button>
                    <input ref={fileInput} type="file" multiple accept="image/*,application/pdf" onChange={e=>pickFiles(e.target.files)} style={{ display:'none' }} />
                  </div>
                </div>
              </div>
              {queue.length>0 && (
                <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Hàng đợi','Queue')}</div>
                  <div>
                    {queue.map(u => (
                      <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:44, height:44, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', overflow:'hidden', display:'grid', placeItems:'center' }}>
                            {u.dataUrl && u.mime.startsWith('image/') ? <img src={u.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span>FILE</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight:700 }}>{u.name}</div>
                            <div style={{ color:'#6b7280', fontSize:12 }}>{humanSize(u.size)} • {u.mime||'—'}</div>
                          </div>
                        </div>
                        <div>
                          {u.progress ? (
                            <div style={{ width:'100%', height:10, background:'#e5e7eb', borderRadius:999, overflow:'hidden' }}>
                              <div style={{ width:`${u.progress}%`, height:'100%' }}></div>
                            </div>
                          ) : <span style={{ color:'#6b7280' }}>—</span>}
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <span style={{ color:'#6b7280' }}>{u.progress? `${u.progress}%` : ' '}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={startUpload} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Tải & OCR','Upload & OCR')}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Review panel */}
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Kiểm tra & hiệu chỉnh','Review & correct')}</div>
              {!active ? (
                <div style={{ padding:12, color:'#6b7280' }}>{t('Chọn một biên nhận từ danh sách hoặc tải lên để OCR.','Select a receipt from the list or upload to OCR.')}</div>
              ) : (
                <div style={{ display:'grid', gridTemplateRows:'240px auto auto', gap:8 }}>
                  {/* Preview */}
                  <div style={{ background:'#f8fafc', display:'grid', placeItems:'center', position:'relative' }}>
                    {(() => {
                      // try to find the document preview via doc_id by matching receipts array docs (we only stored preview in upload)
                      const doc = (window as any)._erp_docs?.find?.((d:any)=>d.id===active.doc_id) as DocumentRow | undefined;
                      const url = doc?.preview_data_url;
                      return url ? <img src={url} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <div style={{ color:'#6b7280' }}>{t('Không có preview','No preview')}</div>;
                    })()}
                  </div>
                  {/* Fields */}
                  <div style={{ padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Nhà cung cấp','Vendor')}</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input defaultValue={active.vendor?.value||''} onBlur={e=>saveActive({ vendor: { value: e.target.value, confidence: active.vendor?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                        <span style={confidenceChip(active.vendor?.confidence)}>{Math.round((active.vendor?.confidence||0)*100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Ngày chứng từ','Date')}</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input type="date" defaultValue={active.date?.value||''} onBlur={e=>saveActive({ date: { value: e.target.value, confidence: active.date?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                        <span style={confidenceChip(active.date?.confidence)}>{Math.round((active.date?.confidence||0)*100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Tiền tệ','Currency')}</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input defaultValue={active.currency?.value||'VND'} onBlur={e=>saveActive({ currency: { value: e.target.value, confidence: active.currency?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                        <span style={confidenceChip(active.currency?.confidence)}>{Math.round((active.currency?.confidence||0)*100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Phương thức thanh toán','Payment method')}</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input defaultValue={active.payment_method?.value||'cash'} onBlur={e=>saveActive({ payment_method: { value: e.target.value, confidence: active.payment_method?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                        <span style={confidenceChip(active.payment_method?.confidence)}>{Math.round((active.payment_method?.confidence||0)*100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Danh mục','Category')}</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input defaultValue={active.category?.value||'other'} onBlur={e=>saveActive({ category: { value: e.target.value, confidence: active.category?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                        <span style={confidenceChip(active.category?.confidence)}>{Math.round((active.category?.confidence||0)*100)}%</span>
                      </div>
                    </div>
                    <div></div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Trước thuế','Subtotal')}</label>
                      <input type="number" defaultValue={active.subtotal?.value||0} onBlur={e=>saveActive({ subtotal: { value: Number(e.target.value||0), confidence: active.subtotal?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('VAT','VAT')}</label>
                      <input type="number" defaultValue={active.tax?.value||0} onBlur={e=>saveActive({ tax: { value: Number(e.target.value||0), confidence: active.tax?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#6b7280' }}>{t('Tổng tiền','Total')}</label>
                      <input type="number" defaultValue={active.total?.value||0} onBlur={e=>saveActive({ total: { value: Number(e.target.value||0), confidence: active.total?.confidence||0 } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{t('Màu độ tin cậy: xanh (cao) / vàng (trung bình) / đỏ (thấp)','Confidence colors: green / yellow / red')}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>saveActive({ status:'draft' })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu nháp','Save draft')}</button>
                      <button onClick={()=>saveActive({ status:'ready' })} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Sẵn sàng nộp','Mark ready')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Receipts List */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Biên nhận đã OCR','OCR Receipts')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{filtered.length}</div>
          </div>
          <div style={{ overflow:'auto' }}>
            {filtered.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> : filtered.map(r => {
              const get = (f:any)=> f?.value ?? '';
              return (
                <button key={r.id} onClick={()=>setActive(r)} style={{ width:'100%', textAlign:'left', border:'none', background:'#fff', borderTop:'1px solid #f1f5f9', padding:'8px 10px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
                    <div style={{ display:'grid' }}>
                      <div style={{ fontWeight:700 }}>{get(r.vendor) || '—'}</div>
                      <div style={{ color:'#6b7280', fontSize:12 }}>{get(r.date)} • {get(r.currency)} • {(get(r.total)||0).toLocaleString?.()||get(r.total)}</div>
                    </div>
                    <div>
                      <span style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', fontSize:12, background: r.status==='ready' ? '#dcfce7' : r.status==='draft' ? '#fef9c3' : '#e5e7eb' }}>{r.status}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
