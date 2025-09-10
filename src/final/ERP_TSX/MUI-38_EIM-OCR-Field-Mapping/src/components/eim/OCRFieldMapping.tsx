// src/components/eim/OCRFieldMapping.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  listProfiles, saveProfile, deleteProfile, exportProfile, importProfile, defaultProfile,
  listReceipts, listVendorAliases, saveVendorAliases, applyMapping,
  type MappingProfile, type Rule, type TransformType
} from '../../mock/ocr_mapping';

const TARGET_FIELDS = ['vendor','date','currency','subtotal','tax','total','payment_method','category'] as const;
const TRANSFORMS: TransformType[] = ['raw','trim','upper','lower','toDate','toNumber','regex','vendorNormalize'];

export const OCRFieldMapping: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [profiles, setProfiles] = useState<MappingProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [profile, setProfile] = useState<MappingProfile | null>(null);
  const [aliases, setAliases] = useState<Array<{ alias:string; canonical:string }>>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [pickId, setPickId] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    const arr = listProfiles(); setProfiles(arr);
    if (!activeId) setActiveId(arr[0]?.id || '');
    const recs = listReceipts(); setReceipts(recs);
    setAliases(listVendorAliases());
  };
  useEffect(()=>{ reload(); }, []);
  useEffect(()=>{
    const p = profiles.find(p => p.id===activeId) || null;
    setProfile(p ? JSON.parse(JSON.stringify(p)) : null); // clone
    if (receipts.length>0 && !pickId) setPickId(receipts[0].id);
  }, [profiles, activeId, receipts]);

  // seed default if empty
  useEffect(()=>{
    if (profiles.length===0) {
      try { (window as any).setTimeout(() => { const dp = defaultProfile(); saveProfile(dp); reload(); }, 0); } catch {}
    }
  }, [profiles.length]);

  const selectedReceipt = useMemo(()=> receipts.find(r => r.id===pickId) || null, [receipts, pickId]);
  const testResult = useMemo(()=> profile && selectedReceipt ? applyMapping(profile, selectedReceipt) : null, [profile, selectedReceipt]);

  const addRule = () => {
    if (!profile) return;
    const missing = (TARGET_FIELDS as any as string[]).find(f => !(profile.rules||[]).some(r => r.target===f));
    const newRule: Rule = { target: missing || 'vendor', sourcePath: 'vendor.value', transform: { type:'raw' }, threshold: 0.6 };
    const next = { ...profile, rules: [...(profile.rules||[]), newRule] };
    setProfile(next);
  };
  const removeRule = (i: number) => {
    if (!profile) return;
    const next = { ...profile, rules: profile.rules.filter((_, idx) => idx!==i) };
    setProfile(next);
  };
  const changeRule = (i: number, patch: Partial<Rule>) => {
    if (!profile) return;
    const rules = profile.rules.slice(); rules[i] = { ...rules[i], ...patch } as Rule;
    setProfile({ ...profile, rules });
  };

  const onSave = () => { if (!profile) return; saveProfile(profile); setProfiles(listProfiles()); alert(t('Đã lưu mapping','Mapping saved')); };
  const onDelete = () => { if (!profile) return; if (!confirm(t('Xoá profile này?','Delete this profile?'))) return; deleteProfile(profile.id); setProfiles(listProfiles()); setActiveId(listProfiles()[0]?.id || ''); };
  const onExport = () => { if (!profile) return; const blob = exportProfile(profile); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=(profile.name||'mapping')+'.json'; a.click(); URL.revokeObjectURL(url); };
  const onImport = (txt: string) => { importProfile(txt); setImportOpen(false); setProfiles(listProfiles()); };

  const addAlias = () => setAliases(arr => [...arr, { alias:'', canonical:'' }]);
  const saveAliases = () => { saveVendorAliases(aliases); alert(t('Đã lưu vendor alias','Vendor aliases saved')); };

  const sourceFieldOptions = [
    'vendor.value','vendor.confidence',
    'date.value','date.confidence',
    'currency.value','currency.confidence',
    'subtotal.value','subtotal.confidence',
    'tax.value','tax.confidence',
    'total.value','total.confidence',
    'payment_method.value','payment_method.confidence',
    'category.value','category.confidence'
  ];

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Mapping trường OCR → ERP','OCR → ERP field mapping')}</div>
          <select value={activeId} onChange={e=>setActiveId(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {profile && <input value={profile.name} onChange={e=>setProfile({ ...profile, name: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:280 }} />}
          {profile && (
            <select value={profile.scope} onChange={e=>setProfile({ ...profile, scope: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="global">{t('Toàn hệ thống','Global')}</option>
              <option value="vendor">{t('Theo Vendor','By Vendor')}</option>
              <option value="project">{t('Theo Project','By Project')}</option>
            </select>
          )}
          {profile?.scope==='vendor' && <input placeholder={t('Vendor áp dụng','Vendor scope')} value={profile.vendor||''} onChange={e=>setProfile({ ...profile, vendor: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />}
          {profile?.scope==='project' && <input placeholder="project_id" value={profile.project_id||''} onChange={e=>setProfile({ ...profile, project_id: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={()=>setProfiles(p => [...p, { ...(defaultProfile() as any), id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name: 'New mapping' }])} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Profile mới','New profile')}</button>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          <button onClick={()=>setImportOpen(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Import</button>
          <button onClick={onDelete} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>
          <button onClick={onSave} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
        </div>
      </div>

      {/* Main panels */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Rules table */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Quy tắc mapping','Mapping rules')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 180px 120px 1fr 80px', gap:8, padding:'6px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>
            <div>{t('ERP field','ERP field')}</div>
            <div>{t('Nguồn OCR (path)','OCR source (path)')}</div>
            <div>{t('Transform','Transform')}</div>
            <div>{t('Threshold','Threshold')}</div>
            <div>{t('Giá trị mặc định','Default value')}</div>
            <div></div>
          </div>
          <div style={{ overflow:'auto' }}>
            {!profile ? <div style={{ padding:12, color:'#6b7280' }}>—</div> :
              (profile.rules||[]).map((r, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr 180px 120px 1fr 80px', gap:8, alignItems:'center', padding:'6px 10px', borderTop:'1px solid #f1f5f9' }}>
                  <select value={r.target} onChange={e=>changeRule(i,{ target: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    {(TARGET_FIELDS as any as string[]).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input list="srcPaths" value={r.sourcePath} onChange={e=>changeRule(i,{ sourcePath: e.target.value })} placeholder="e.g., vendor.value" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                  <datalist id="srcPaths">
                    {sourceFieldOptions.map(s => <option key={s} value={s} />)}
                  </datalist>
                  <select value={r.transform?.type||'raw'} onChange={e=>changeRule(i,{ transform: { ...(r.transform||{}), type: e.target.value as any } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    {TRANSFORMS.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                  {r.transform?.type==='regex' ? (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:6 }}>
                      <input placeholder={t('RegExp','RegExp')} defaultValue={r.transform?.pattern||''} onBlur={e=>changeRule(i,{ transform: { ...(r.transform||{}), pattern: e.target.value } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                      <input type="number" min={0} max={10} placeholder="group" defaultValue={r.transform?.group||0} onBlur={e=>changeRule(i,{ transform: { ...(r.transform||{}), group: Number(e.target.value||0) } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    </div>
                  ) : <div></div>}
                  <input type="number" step="0.05" min={0} max={1} value={r.threshold ?? 0} onChange={e=>changeRule(i,{ threshold: Number(e.target.value) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:100 }} />
                  <input value={r.defaultValue ?? ''} onChange={e=>changeRule(i,{ defaultValue: e.target.value })} placeholder={t('fallback khi thiếu/thấp','fallback if missing/low')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={()=>removeRule(i)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
            <button onClick={addRule} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Thêm rule','Add rule')}</button>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tip: dùng transform','Tip: use transform')}: <code>toDate</code>, <code>toNumber</code>, <code>regex</code>, <code>vendorNormalize</code></div>
          </div>
        </div>

        {/* Test & Aliases */}
        <div style={{ display:'grid', gridTemplateRows:'auto 1fr auto', gap:12 }}>
          {/* Test */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Kiểm thử mapping','Test mapping')}</div>
            <div style={{ padding:'6px 10px', display:'flex', gap:8, alignItems:'center' }}>
              <select value={pickId} onChange={e=>setPickId(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                {receipts.map(r => <option key={r.id} value={r.id}>{r.id.slice(0,6)} — {(r.vendor?.value||'—')} — {(r.total?.value||'')}</option>)}
              </select>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chọn một biên nhận đã OCR (EIM‑04)','Pick an OCR’d receipt (EIM‑04)')}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'6px 10px', overflow:'hidden' }}>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr' }}>
                <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>{t('Nguồn OCR','OCR source')}</div>
                <pre style={{ margin:0, padding:10, overflow:'auto' }}>{selectedReceipt ? JSON.stringify(selectedReceipt, null, 2) : '—'}</pre>
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
                <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>{t('Kết quả mapping','Mapped result')}</div>
                <pre style={{ margin:0, padding:10, overflow:'auto' }}>{testResult ? JSON.stringify(testResult.output, null, 2) : '—'}</pre>
                <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#b45309', fontSize:12 }}>
                  {testResult && testResult.warnings.length>0 ? testResult.warnings.join(' • ') : t('Không có cảnh báo','No warnings')}
                </div>
              </div>
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
              {t('Lưu ý: ngưỡng (threshold) so sánh với confidence của OCR; dưới ngưỡng sẽ dùng mặc định nếu cấu hình.','Note: threshold compared against OCR confidence; below threshold uses default if configured.')}
            </div>
          </div>

          {/* Aliases */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Bảng alias Vendor','Vendor alias table')}</div>
            <div style={{ overflow:'auto' }}>
              {aliases.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> :
                aliases.map((row, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px', gap:8, alignItems:'center', padding:'6px 10px', borderTop:'1px solid #f1f5f9' }}>
                    <input value={row.alias} onChange={e=>setAliases(a => a.map((r,idx)=> idx===i ? { ...r, alias: e.target.value } : r))} placeholder={t('Alias (tên trên hóa đơn)','Alias (on receipt)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    <input value={row.canonical} onChange={e=>setAliases(a => a.map((r,idx)=> idx===i ? { ...r, canonical: e.target.value } : r))} placeholder={t('Tên chuẩn (ERP)','Canonical (ERP)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={()=>setAliases(a => a.filter((_,idx)=> idx!==i))} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
              <button onClick={addAlias} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Thêm alias','Add alias')}</button>
              <button onClick={saveAliases} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu alias','Save aliases')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Import modal */}
      {importOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center' }} onClick={()=>setImportOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ width:600, background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>{t('Import profile JSON','Import profile JSON')}</div>
            <div style={{ padding:10 }}>
              <textarea id="imp" placeholder="{...json...}" style={{ width:'100%', minHeight:200, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}></textarea>
            </div>
            <div style={{ padding:'8px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={()=>setImportOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Huỷ','Cancel')}</button>
              <button onClick={()=>{ const txt = (document.getElementById('imp') as HTMLTextAreaElement).value; onImport(txt); }} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Import','Import')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
