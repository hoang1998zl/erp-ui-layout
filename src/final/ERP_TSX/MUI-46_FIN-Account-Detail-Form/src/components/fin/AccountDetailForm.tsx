
// src/components/fin/AccountDetailForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ensureSeed, listAccounts, getAccount, upsertAccount, deleteAccount, validateAccount, type CoAAccount } from '../../mock/coa';
import { seedGLIfEmpty, hasPostings } from '../../mock/gl';

type Mode = 'create'|'edit';

function Field({ label, children }: { label:string, children:any }){
  return <label style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:8, alignItems:'center' }}><div style={{ color:'#6b7280', fontSize:12 }}>{label}</div><div>{children}</div></label>;
}
function Pill({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const AccountDetailForm: React.FC<{ locale?: 'vi'|'en', codeParam?: string }> = ({ locale='vi', codeParam }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [mode, setMode] = useState<Mode>('create');
  const [list, setList] = useState<CoAAccount[]>([]);
  const [code, setCode] = useState<string>(codeParam||'');
  const [acc, setAcc] = useState<CoAAccount | null>(null);
  const [lockType, setLockType] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  useEffect(()=>{ ensureSeed(); seedGLIfEmpty(); setList(listAccounts()); }, []);

  useEffect(()=>{
    const urlCode = new URLSearchParams(window.location.search).get('code');
    const c = codeParam || urlCode || code;
    if (!c) { setMode('create'); setAcc({
      id: Math.random().toString(36).slice(2),
      code: '', name_vi:'', name_en:'',
      type:'asset', normal_side:'debit', parent_code:'', is_postable:true, currency:'VND', active:true
    } as any); setLockType(false); return; }
    const a = getAccount(c);
    if (a) { setMode('edit'); setAcc({ ...a }); setLockType(hasPostings(c)); }
  }, [codeParam]);

  const parentOptions = useMemo(()=> list.filter(x => x.code!==acc?.code).map(x => ({ value:x.code, label: `${x.code} — ${x.name_vi}` })), [list, acc?.code]);

  const { ok, errors, warnings } = useMemo(()=> acc ? validateAccount(acc, list) : { ok:false, errors:[], warnings:[] }, [acc, list]);

  const onSave = () => {
    if (!acc) return;
    if (!ok) { alert(t('Vui lòng sửa lỗi trước khi lưu','Please fix errors before saving')); return; }
    // Lock logic: if has postings, do not allow changing "type" and "normal_side"
    if (lockType) {
      const stored = getAccount(acc.code);
      if (stored) {
        acc.type = stored.type;
        acc.normal_side = stored.normal_side;
      }
    }
    upsertAccount(acc);
    setList(listAccounts());
    setMode('edit');
    setDirty(false);
    alert(t('Đã lưu','Saved'));
  };

  const onDelete = () => {
    if (!acc) return;
    if (hasPostings(acc.code)) { alert(t('Không thể xoá: đã có bút toán liên quan','Cannot delete: account has postings')); return; }
    if (!confirm(t('Xoá tài khoản này?','Delete this account?'))) return;
    deleteAccount(acc.code);
    setList(listAccounts());
    setAcc(null);
    setMode('create');
    setCode('');
  };

  const Header = () => (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ fontWeight:800 }}>{t('Tài khoản kế toán — Chi tiết','Account — Detail')}</div>
        {acc?.code && <Pill text={mode.toUpperCase()} tone={mode==='edit'?'violet':'slate'} />}
        {lockType && <Pill text={t('Đang khoá loại & side (đã có bút toán)','Type & side locked (has postings)')} tone="amber" />}
        {acc?.active ? <Pill text={t('Đang hoạt động','Active')} tone="green" /> : <Pill text={t('Ngưng','Inactive')} tone="red" />}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onSave} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
        {mode==='edit' && <button onClick={onDelete} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>}
      </div>
    </div>
  );

  const Sidebar = () => (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Danh sách tài khoản','Accounts')}</div>
        <div style={{ padding:10, maxHeight:420, overflow:'auto', display:'grid', gap:6 }}>
          {list.map(a => (
            <button key={a.code} onClick={()=>{ setCode(a.code); const aa = getAccount(a.code)!; setAcc({ ...aa }); setMode('edit'); setLockType(hasPostings(a.code)); }} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background: acc?.code===a.code ? '#eef2ff' : '#fff' }}>
              <div style={{ fontFamily:'monospace' }}>{a.code}</div>
              <div style={{ color:'#111827' }}>{a.name_vi}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{a.type} • {a.is_postable? 'postable':'header'}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ border:'1px solid #fde68a', background:'#fffbeb', borderRadius:12, padding:10, color:'#92400e' }}>
        <div style={{ fontWeight:700 }}>{t('Quy tắc khoá','Lock rule')}</div>
        <div style={{ fontSize:13 }}>{t('Khi tài khoản đã có bút toán, không được đổi "Loại" và "Normal side". Có thể đổi tên, parent, postable, trạng thái.','Once postings exist, "Type" and "Normal side" cannot be changed. Other fields remain editable.')}</div>
      </div>
    </div>
  );

  const Form = () => {
    if (!acc) return <div style={{ color:'#6b7280' }}>—</div>;
    const set = (patch: Partial<CoAAccount>) => { setAcc({ ...acc, ...patch }); setDirty(true); };
    const disabledType = lockType && mode==='edit';
    return (
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Code">
            <input value={acc.code} onChange={e=>set({ code: e.target.value })} disabled={mode==='edit'} placeholder="VD: 6421" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:180 }} />
          </Field>
          <Field label={t('Mã cha','Parent')}>
            <select value={acc.parent_code||''} onChange={e=>set({ parent_code: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Không có —','— None —')}</option>
              {parentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('Tên (VI)','Name (VI)')}>
            <input value={acc.name_vi} onChange={e=>set({ name_vi: e.target.value })} placeholder="Tên tiếng Việt" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </Field>
          <Field label={t('Tên (EN)','Name (EN)')}>
            <input value={acc.name_en||''} onChange={e=>set({ name_en: e.target.value })} placeholder="English name (optional)" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </Field>
          <Field label={t('Loại','Type')}>
            <select value={acc.type} onChange={e=>set({ type: e.target.value as any })} disabled={disabledType} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              {['asset','liability','equity','revenue','expense','other'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Normal side">
            <select value={acc.normal_side} onChange={e=>set({ normal_side: e.target.value as any })} disabled={disabledType} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              {['debit','credit'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </Field>
          <Field label={t('Cho phép hạch toán','Postable')}>
            <input type="checkbox" checked={acc.is_postable} onChange={e=>set({ is_postable: e.target.checked })} />
          </Field>
          <Field label={t('Tiền tệ mặc định','Default currency')}>
            <input value={acc.currency||''} onChange={e=>set({ currency: e.target.value })} placeholder="VD: VND" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
          </Field>
          <Field label={t('Trạng thái','Status')}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!acc.active} onChange={e=>set({ active: e.target.checked })} /><span>{t('Hoạt động','Active')}</span>
            </label>
          </Field>
        </div>

        {/* Validation */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Lỗi','Errors')}</div>
            {errors.length===0 ? <div style={{ color:'#16a34a' }}>{t('Không có lỗi','No errors')}</div> : <ul>{errors.map((e,i)=><li key={i} style={{ color:'#ef4444' }}>{e}</li>)}</ul>}
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Cảnh báo','Warnings')}</div>
            {warnings.length===0 ? <div style={{ color:'#16a34a' }}>{t('Không có cảnh báo','No warnings')}</div> : <ul>{warnings.map((w,i)=><li key={i} style={{ color:'#b45309' }}>{w}</li>)}</ul>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      <Header />
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr', gap:12 }}>
        <Sidebar />
        <Form />
      </div>
    </div>
  );
};
