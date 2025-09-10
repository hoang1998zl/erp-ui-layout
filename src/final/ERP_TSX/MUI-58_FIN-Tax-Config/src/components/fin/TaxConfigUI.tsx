
// src/components/fin/TaxConfigUI.tsx — FIN-14 Tax_Config_UI
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listTaxes, upsertTax, removeTax, type TaxCode, type TaxType, type CalcMethod } from '../../mock/tax';
import { seedItemsIfEmpty, listItems, categories, bulkApplyByCategory, updateItemTax } from '../../mock/items';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString(); }

type Tab = 'tax'|'apply';

export const TaxConfigUI: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedIfEmpty(); seedItemsIfEmpty(); }, []);

  const [tab, setTab] = useState<Tab>('tax');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<TaxCode[]>(listTaxes());
  const reload = () => setRows(listTaxes());

  // form drawer
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<TaxCode>>({ code:'', name_vi:'', name_en:'', rate_pct:10, type:'VAT_IN' as TaxType, method:'exclusive' as CalcMethod, vat_account:'1331', active:true });

  const onSave = () => {
    if (!form.code || String(form.code).length<2) { alert(t('Mã không hợp lệ','Invalid code')); return; }
    if (form.rate_pct! < 0 || form.rate_pct! > 100) { alert(t('Thuế suất 0..100%','Rate 0..100%')); return; }
    if (form.type==='VAT_IN' && !form.vat_account) form.vat_account='1331';
    if (form.type==='VAT_OUT' && !form.vat_account) form.vat_account='3331';
    upsertTax(form as any);
    setOpen(false); reload();
  };

  const filtered = useMemo(()=> rows.filter(r => {
    const s = q.toLowerCase();
    return r.code.toLowerCase().includes(s) || (r.name_vi||'').toLowerCase().includes(s) || (r.name_en||'').toLowerCase().includes(s) || (r.vat_account||'').toLowerCase().includes(s);
  }), [rows, q]);

  // apply tab data
  const itemRows = useMemo(()=> listItems(), [rows]);
  const cats = useMemo(()=> categories(), [rows]);
  const [cat, setCat] = useState<string>('');
  const [taxCode, setTaxCode] = useState<string>('');
  const [onlyEmpty, setOnlyEmpty] = useState<boolean>(false);
  const doApply = () => {
    if (!cat || !taxCode) { alert(t('Chọn category và tax code','Pick category and tax code')); return; }
    bulkApplyByCategory(cat, taxCode, onlyEmpty);
    alert(t('Đã áp dụng','Applied'));
  };

  const exportCSV = () => {
    const header = 'code,name_vi,name_en,rate_pct,type,method,vat_account,effective_from,effective_to,active';
    const lines = rows.map(r => [r.code, r.name_vi, r.name_en||'', String(r.rate_pct), r.type, r.method, r.vat_account||'', r.effective_from||'', r.effective_to||'', String(r.active)].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='tax_codes.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Cấu hình thuế suất','Tax settings')}</div>
          <Badge text="FIN-14" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Áp dụng cho vật tư/hàng hoá (items)','Apply to items')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <button onClick={()=> { setForm({ code:'', name_vi:'', name_en:'', rate_pct:10, type:'VAT_IN', method:'exclusive', vat_account:'1331', active:true }); setOpen(true); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm thuế','New tax')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['tax', t('Thuế','Tax')], ['apply', t('Áp dụng item','Apply to items')]].map(([k, label]) => (
          <button key={k} onClick={()=> setTab(k as Tab)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: tab===k ? '#eef2ff' : '#fff' }}>
            <b>{label}</b>
          </button>
        ))}
        {tab==='tax' && (
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <input value={q} onChange={e=> setQ(e.target.value)} placeholder={t('Tìm mã/ten/acc','Search code/name/acc')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:260 }} />
          </div>
        )}
      </div>

      {/* Content */}
      {tab==='tax' ? (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>Code</th>
              <th style={{ padding:'6px' }}>{t('Tên (VI/EN)','Name (VI/EN)')}</th>
              <th style={{ padding:'6px', textAlign:'right' }}>{t('Thuế suất %','Rate %')}</th>
              <th style={{ padding:'6px' }}>{t('Loại','Type')}</th>
              <th style={{ padding:'6px' }}>{t('PP tính','Method')}</th>
              <th style={{ padding:'6px' }}>{t('TK thuế','VAT acc')}</th>
              <th style={{ padding:'6px' }}>{t('Hiệu lực','Effective')}</th>
              <th style={{ padding:'6px' }}>{t('TT','Active')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px', fontFamily:'monospace' }}>{r.code}</td>
                  <td style={{ padding:'6px' }}>{r.name_vi}{r.name_en? ` / ${r.name_en}` : ''}</td>
                  <td style={{ padding:'6px', textAlign:'right' }}>{r.rate_pct}</td>
                  <td style={{ padding:'6px' }}>{r.type}</td>
                  <td style={{ padding:'6px' }}>{r.method}</td>
                  <td style={{ padding:'6px' }}>{r.vat_account||'—'}</td>
                  <td style={{ padding:'6px', fontSize:12, color:'#6b7280' }}>{(r.effective_from||'—').slice(0,10)} → {(r.effective_to||'—').slice(0,10)}</td>
                  <td style={{ padding:'6px' }}>{r.active ? <Badge text="ON" tone="green" /> : <Badge text="OFF" tone="red" />}</td>
                  <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                    <button onClick={()=> { setForm(r); setOpen(true); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                    <button onClick={()=> { const copy = { ...r, id: undefined, code: r.code+'-COPY', name_vi: r.name_vi+' (copy)' } as any; setForm(copy); setOpen(true);} } style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff', marginLeft:6 }}>{t('Nhân bản','Duplicate')}</button>
                    <button onClick={()=> { if (confirm(t('Xoá thuế?','Delete tax?'))) { removeTax(r.code); reload(); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có dữ liệu','No data')} —</div>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(320px, 420px) 1fr', gap:12 }}>
          {/* Left apply panel */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:10, alignContent:'start' }}>
            <div style={{ fontWeight:700 }}>{t('Áp dụng theo Category','Apply by Category')}</div>
            <label style={{ display:'grid', gap:6 }}>
              <div>Category</div>
              <select value={cat} onChange={e=> setCat(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="">{t('— Chọn —','— Pick —')}</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display:'grid', gap:6 }}>
              <div>Tax code</div>
              <select value={taxCode} onChange={e=> setTaxCode(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="">{t('— Chọn —','— Pick —')}</option>
                {rows.map(tax => <option key={tax.code} value={tax.code}>{tax.code} — {tax.name_vi} ({tax.rate_pct}%)</option>)}
              </select>
            </label>
            <label style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="checkbox" checked={onlyEmpty} onChange={e=> setOnlyEmpty((e.target as HTMLInputElement).checked)} />
              <div>{t('Chỉ áp dụng cho item chưa có thuế','Only items without tax')}</div>
            </label>
            <button onClick={doApply} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Áp dụng','Apply')}</button>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Áp dụng tức thời (demo). Sản phẩm thật cần batch job/audit.','Applies immediately (demo). In production use batch/audit.')}</div>
          </div>

          {/* Right item table */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>SKU</th>
                <th style={{ padding:'6px' }}>{t('Tên','Name')}</th>
                <th style={{ padding:'6px' }}>{t('Nhóm','Category')}</th>
                <th style={{ padding:'6px' }}>{t('Thuế','Tax')}</th>
                <th style={{ padding:'6px' }}></th>
              </tr></thead>
              <tbody>
                {itemRows.map(it => (
                  <tr key={it.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{it.sku}</td>
                    <td style={{ padding:'6px' }}>{it.name}</td>
                    <td style={{ padding:'6px' }}>{it.category}</td>
                    <td style={{ padding:'6px' }}>{it.tax_code||'—'}</td>
                    <td style={{ padding:'6px' }}>
                      <select defaultValue={it.tax_code||''} onChange={e=> { updateItemTax(it.id, e.target.value || undefined); alert('Updated'); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px' }}>
                        <option value="">{t('— Không —','— None —')}</option>
                        {rows.map(tax => <option key={tax.code} value={tax.code}>{tax.code}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemRows.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có item','No items')} —</div>}
          </div>
        </div>
      )}

      {/* Drawer for add/edit */}
      {open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(620px, 96vw)' }} onClick={()=> setOpen(false)}>
          <div />
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{form?.id ? t('Sửa thuế','Edit tax') : t('Thêm thuế','New tax')}</div>
              <button onClick={()=> setOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
            <div style={{ padding:10, display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
              <label style={{ display:'grid', gap:6 }}><div>Code</div><input value={form.code||''} onChange={e=> setForm({ ...form, code:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}><div>{t('Thuế suất %','Rate %')}</div><input type="number" value={Number(form.rate_pct||0)} onChange={e=> setForm({ ...form, rate_pct: Number(e.target.value) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6, gridColumn:'1 / span 2' }}><div>{t('Tên (VI)','Name (VI)')}</div><input value={form.name_vi||''} onChange={e=> setForm({ ...form, name_vi:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6, gridColumn:'1 / span 2' }}><div>{t('Tên (EN)','Name (EN)')}</div><input value={form.name_en||''} onChange={e=> setForm({ ...form, name_en:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Loại','Type')}</div>
                <select value={form.type||'VAT_IN'} onChange={e=> setForm({ ...form, type:e.target.value as TaxType })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option value="VAT_IN">VAT_IN</option>
                  <option value="VAT_OUT">VAT_OUT</option>
                  <option value="NONE">NONE</option>
                </select>
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Phương pháp tính','Calc method')}</div>
                <select value={form.method||'exclusive'} onChange={e=> setForm({ ...form, method:e.target.value as CalcMethod })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option value="exclusive">{t('Ngoài giá (cộng thêm)','Exclusive (add-on)')}</option>
                  <option value="inclusive">{t('Đã gồm thuế','Inclusive')}</option>
                </select>
              </label>
              <label style={{ display:'grid', gap:6 }}><div>{t('TK thuế','VAT account')}</div><input value={form.vat_account||''} onChange={e=> setForm({ ...form, vat_account:e.target.value })} placeholder={t('VD: 1331, 3331','e.g., 1331, 3331')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}><div>{t('Hiệu lực từ','Effective from')}</div><input type="date" value={(form.effective_from||'').slice(0,10)} onChange={e=> setForm({ ...form, effective_from: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}><div>{t('Hiệu lực đến','Effective to')}</div><input type="date" value={(form.effective_to||'').slice(0,10)} onChange={e=> setForm({ ...form, effective_to: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="checkbox" checked={form.active!==false} onChange={e=> setForm({ ...form, active: (e.target as HTMLInputElement).checked })} />
                <div>{t('Kích hoạt','Active')}</div>
              </label>
            </div>
            <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={()=> setOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Huỷ','Cancel')}</button>
              <button onClick={onSave} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'8px 12px' }}>{t('Lưu','Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
