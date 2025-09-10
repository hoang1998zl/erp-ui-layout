
// src/components/fin/VendorMaster.tsx — FIN-15 Vendor_Master
import React, { useEffect, useMemo, useState } from 'react';
import { seedVendorsIfEmpty, listVendors, upsertVendor, removeByCode, findByCode, importCSV, type Vendor } from '../../mock/vendors';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function emailValid(s?:string){ return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function phoneValid(s?:string){ return !s || /^[0-9+()\-\s]{6,}$/.test(s); }
function taxVNValid(s?:string){ if(!s) return true; const digits = s.replace(/[^0-9]/g,''); return digits.length===10 || digits.length===13; }

type Tab = 'all'|'active'|'inactive';

export const VendorMaster: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedVendorsIfEmpty(); }, []);

  const [rows, setRows] = useState<Vendor[]>(listVendors());
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [cur, setCur] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({ code:'', name_vi:'', currency:'VND', supplier_type:'domestic', active:true });
  const [err, setErr] = useState<string>('');
  const reload = () => setRows(listVendors());

  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(()=> rows
    .filter(r => tab==='all' ? true : tab==='active' ? r.active : !r.active)
    .filter(r => !cur || (r.currency||'').toLowerCase()===cur.toLowerCase())
    .filter(r => !type || (r.supplier_type||'')===type)
    .filter(r => {
      const s = q.toLowerCase();
      return (r.code||'').toLowerCase().includes(s)
          || (r.name_vi||'').toLowerCase().includes(s)
          || (r.name_en||'').toLowerCase().includes(s)
          || (r.tax_code||'').toLowerCase().includes(s)
          || (r.email||'').toLowerCase().includes(s);
    })
  , [rows, q, tab, cur, type]);

  const exportCSV = () => {
    const header = 'code,name_vi,name_en,tax_code,country,province,address,contact_name,email,phone,bank_name,bank_account,bank_branch,currency,payment_terms_days,supplier_type,wht_rate_pct,active';
    const lines = filtered.map(r => [r.code, r.name_vi, r.name_en||'', r.tax_code||'', r.country||'', r.province||'', (r.address||'').replace(/,/g,' '), r.contact_name||'', r.email||'', r.phone||'', r.bank_name||'', r.bank_account||'', r.bank_branch||'', r.currency||'', String(r.payment_terms_days||0), r.supplier_type||'domestic', String(r.wht_rate_pct||0), String(r.active)].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='vendors.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const onImport = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      const text = String(fr.result||'');
      const res = importCSV(text);
      alert(`${t('Đã nhập','Imported')}: ${res.inserted}; ${t('bỏ qua','skipped')}: ${res.skipped}; ${t('trùng','dups')}: ${res.duplicates.join(', ')}`);
      reload();
    };
    fr.readAsText(file);
  };

  const openNew = () => { setErr(''); setForm({ code:'', name_vi:'', currency:'VND', supplier_type:'domestic', active:true }); setDrawerOpen(true); };
  const openEdit = (v: Vendor) => { setErr(''); setForm(v); setDrawerOpen(true); };
  const onSave = () => {
    // basic validations
    const code = String(form.code||'').trim();
    const name = String(form.name_vi||'').trim();
    if (code.length<2 || !name) { setErr(t('Mã & Tên (VI) là bắt buộc','Code & Name (VI) required')); return; }
    const exists = findByCode(code);
    if (!form?.id && exists) { setErr(t('Mã đã tồn tại','Code already exists')); return; }
    if (!emailValid(form.email)) { setErr(t('Email không hợp lệ','Invalid email')); return; }
    if (!phoneValid(form.phone)) { setErr(t('Số điện thoại không hợp lệ','Invalid phone')); return; }
    if (!taxVNValid(form.tax_code)) { setErr(t('MST (VN) phải 10 hoặc 13 chữ số','VN TIN must be 10 or 13 digits')); return; }
    upsertVendor({ ...form, code, name_vi: name } as any);
    setDrawerOpen(false); reload();
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Danh mục Nhà cung cấp','Vendor Master')}</div>
          <Badge text="FIN-15" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Deferred from P0','Deferred from P0')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Import CSV','Import CSV')}
            <input type="file" accept=".csv,text/csv" onChange={e=>{ const f = e.target.files?.[0]; if (f) onImport(f); }} style={{ display:'none' }} />
          </label>
          <button onClick={openNew} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm NCC','New Vendor')}</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'grid', gridTemplateColumns:'auto auto auto 1fr', gap:8, alignItems:'end' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {(['all','active','inactive'] as Tab[]).map(s => (
            <button key={s} onClick={()=> setTab(s)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: tab===s ? '#eef2ff' : '#fff' }}>
              <b style={{ textTransform:'capitalize' }}>{t(s==='all'?'Tất cả':s==='active'?'Hoạt động':'Ngừng', s)}</b>
            </button>
          ))}
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>Currency</div>
          <select value={cur} onChange={e=> setCur(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả','All')}</option>
            {Array.from(new Set(rows.map(r => r.currency||'VND'))).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Loại NCC','Type')}</div>
          <select value={type} onChange={e=> setType(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả','All')}</option>
            <option value="domestic">{t('Trong nước','Domestic')}</option>
            <option value="foreign">{t('Nước ngoài','Foreign')}</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <input value={q} onChange={e=> setQ(e.target.value)} placeholder={t('Tìm mã/tên/MST/email','Search code/name/TIN/email')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:280 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>Code</th>
              <th style={{ padding:'6px' }}>{t('Tên NCC','Name')}</th>
              <th style={{ padding:'6px' }}>{t('MST','TIN')}</th>
              <th style={{ padding:'6px' }}>{t('Liên hệ','Contact')}</th>
              <th style={{ padding:'6px' }}>Email</th>
              <th style={{ padding:'6px' }}>{t('Điện thoại','Phone')}</th>
              <th style={{ padding:'6px' }}>Cur</th>
              <th style={{ padding:'6px', textAlign:'right' }}>{t('Điều khoản','Terms (d)')}</th>
              <th style={{ padding:'6px' }}>{t('TT','Status')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{v.code}</td>
                <td style={{ padding:'6px' }}>{v.name_vi}{v.name_en? ` / ${v.name_en}` : ''}</td>
                <td style={{ padding:'6px' }}>{v.tax_code||'—'}</td>
                <td style={{ padding:'6px' }}>{v.contact_name||'—'}</td>
                <td style={{ padding:'6px' }}>{v.email||'—'}</td>
                <td style={{ padding:'6px' }}>{v.phone||'—'}</td>
                <td style={{ padding:'6px' }}>{v.currency||'VND'}</td>
                <td style={{ padding:'6px', textAlign:'right' }}>{v.payment_terms_days||0}</td>
                <td style={{ padding:'6px' }}>{v.active ? <Badge text="ACTIVE" tone="green" /> : <Badge text="INACTIVE" tone="red" />}</td>
                <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                  <button onClick={()=> openEdit(v)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                  <button onClick={()=> { if (confirm(t('Xoá NCC này?','Delete this vendor?'))) { removeByCode(v.code); reload(); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có dữ liệu','No data')} —</div>}
      </div>

      {/* Drawer form */}
      {drawerOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(900px, 96vw)' }} onClick={()=> setDrawerOpen(false)}>
          <div />
          <div onClick={e=> e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{form?.id ? t('Sửa NCC','Edit Vendor') : t('Thêm NCC','New Vendor')}</div>
              <button onClick={()=> setDrawerOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
            <div style={{ overflow:'auto', padding:10, display:'grid', gap:10 }}>
              {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 10px', color:'#991b1b' }}>{err}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>Code *</div><input value={form.code||''} onChange={e=> setForm({ ...form, code:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Tên (VI) *','Name (VI) *')}</div><input value={form.name_vi||''} onChange={e=> setForm({ ...form, name_vi:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Tên (EN)','Name (EN)')}</div><input value={form.name_en||''} onChange={e=> setForm({ ...form, name_en:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('MST (VN)','TIN (VN)')}</div><input value={form.tax_code||''} onChange={e=> setForm({ ...form, tax_code:e.target.value })} placeholder="10 hoặc 13 chữ số" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Quốc gia','Country')}</div><input value={form.country||'VN'} onChange={e=> setForm({ ...form, country:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Tỉnh/Thành','Province')}</div><input value={form.province||''} onChange={e=> setForm({ ...form, province:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>
              <label style={{ display:'grid', gap:6 }}><div>{t('Địa chỉ','Address')}</div><input value={form.address||''} onChange={e=> setForm({ ...form, address:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('Người liên hệ','Contact')}</div><input value={form.contact_name||''} onChange={e=> setForm({ ...form, contact_name:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>Email</div><input value={form.email||''} onChange={e=> setForm({ ...form, email:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Điện thoại','Phone')}</div><input value={form.phone||''} onChange={e=> setForm({ ...form, phone:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('Ngân hàng','Bank')}</div><input value={form.bank_name||''} onChange={e=> setForm({ ...form, bank_name:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Số tài khoản','Account')}</div><input value={form.bank_account||''} onChange={e=> setForm({ ...form, bank_account:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Chi nhánh','Branch')}</div><input value={form.bank_branch||''} onChange={e=> setForm({ ...form, bank_branch:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>Currency</div><input value={form.currency||'VND'} onChange={e=> setForm({ ...form, currency:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Điều khoản (ngày)','Payment terms (days)')}</div><input type="number" value={Number(form.payment_terms_days||0)} onChange={e=> setForm({ ...form, payment_terms_days: Number(e.target.value) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}>
                  <div>{t('Loại NCC','Type')}</div>
                  <select value={form.supplier_type||'domestic'} onChange={e=> setForm({ ...form, supplier_type: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="domestic">{t('Trong nước','Domestic')}</option>
                    <option value="foreign">{t('Nước ngoài','Foreign')}</option>
                  </select>
                </label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('Thuế nhà thầu (%)','Withholding tax %')}</div><input type="number" value={Number(form.wht_rate_pct||0)} onChange={e=> setForm({ ...form, wht_rate_pct: Number(e.target.value) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="checkbox" checked={form.active!==false} onChange={e=> setForm({ ...form, active: (e.target as HTMLInputElement).checked })} />
                  <div>{t('Kích hoạt','Active')}</div>
                </label>
              </div>
            </div>
            <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={()=> setDrawerOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Huỷ','Cancel')}</button>
              <button onClick={onSave} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'8px 12px' }}>{t('Lưu','Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
