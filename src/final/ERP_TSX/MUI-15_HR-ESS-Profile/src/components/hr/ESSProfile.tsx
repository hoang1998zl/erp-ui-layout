// src/components/hr/ESSProfile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getMyProfile, saveMyProfile, setAvatar, clearAvatar, exportJSON, importJSON,
  type Profile
} from '../../mock/essProfile';

export type ESSProfileProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getMyProfile: typeof getMyProfile;
    saveMyProfile: typeof saveMyProfile;
    setAvatar: typeof setAvatar;
    clearAvatar: typeof clearAvatar;
    exportJSON: typeof exportJSON;
    importJSON: typeof importJSON;
  }>;
};

export const ESSProfile: React.FC<ESSProfileProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getMyProfile: adapters.getMyProfile || getMyProfile,
    saveMyProfile: adapters.saveMyProfile || saveMyProfile,
    setAvatar: adapters.setAvatar || setAvatar,
    clearAvatar: adapters.clearAvatar || clearAvatar,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };
  const [data, setData] = useState<Profile | null>(null);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => { fns.getMyProfile().then(setData); }, []);

  const validate = (p: Profile) => {
    const e: Record<string,string> = {};
    if (!p.full_name.trim()) e.full_name = t('Bắt buộc','Required');
    if (p.phone && !/^0\d{9,10}$/.test(p.phone)) e.phone = t('Số điện thoại VN không hợp lệ','Invalid VN phone');
    if (p.dob) {
      const d = new Date(p.dob);
      const now = new Date();
      if (isNaN(d.getTime())) e.dob = t('Ngày không hợp lệ','Invalid date');
      else if (d > now) e.dob = t('Không được ở tương lai','Cannot be in the future');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!data) return;
    if (!validate(data)) return;
    setBusy(true);
    const saved = await fns.saveMyProfile(data);
    setData(saved);
    setBusy(false);
    setEdit(false);
    setToast(t('Đã lưu hồ sơ','Profile saved'));
  };

  const onCancel = async () => {
    const latest = await fns.getMyProfile();
    setData(latest);
    setEdit(false);
    setErrors({});
  };

  const onAvatarUpload = async (file: File) => {
    const url = await fns.setAvatar(file);
    setData(d => d ? { ...d, avatar_data_url: url } : d);
  };

  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='profile.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    const p = await fns.importJSON(file);
    setData(p);
    setToast(t('Đã nhập hồ sơ','Imported'));
  };

  if (!data) return <div style={{ padding:12 }}>{t('Đang tải...','Loading...')}</div>;

  const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
    <div>
      <div style={{ color:'#6b7280', fontSize:12, marginBottom:4 }}>{label}</div>
      {children}
      {error && <div style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>{error}</div>}
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:12, padding:12 }}>
      {/* Left: Profile card */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Hồ sơ cá nhân','My Profile')}</div>
        <div style={{ padding:12, display:'grid', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:12, alignItems:'center' }}>
            <div style={{ width:120, height:120, borderRadius:'50%', background:'#f3f4f6', overflow:'hidden', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {data.avatar_data_url ? <img src={data.avatar_data_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'#9ca3af' }}>No avatar</span>}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
                {t('Tải ảnh','Upload')}<input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onAvatarUpload(f); (e.currentTarget as HTMLInputElement).value=''; }} />
              </label>
              {data.avatar_data_url && <button onClick={()=>{ fns.clearAvatar().then(()=>setData({ ...data, avatar_data_url:null })); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xóa ảnh','Clear')}</button>}
            </div>
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>{data.full_name}</div>
            <div style={{ color:'#6b7280' }}>{data.email}</div>
            {data.employee_code && <div style={{ color:'#6b7280', fontFamily:'monospace', fontSize:12 }}>{data.employee_code}</div>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setEdit(e=>!e)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{edit ? t('Thoát sửa','Exit edit') : t('Chỉnh sửa','Edit')}</button>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          </div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Dùng thông tin này cho ký tên tài liệu, liên hệ nội bộ và các form xin nghỉ/chi phí.','Used for document signing, internal contact, and leave/expense forms.')}</div>
        </div>
      </aside>

      {/* Right: Details form */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Thông tin chi tiết','Details')}</div>
        <div style={{ padding:12, display:'grid', gap:12 }}>
          {/* Basic info */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            <Field label={t('Họ và tên','Full name')} error={errors.full_name}>
              <input disabled={!edit} value={data.full_name} onChange={e=>setData({ ...data, full_name:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
            <Field label="Email">
              <input disabled value={data.email} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#f9fafb' }} />
            </Field>
            <Field label={t('Mã nhân viên','Employee code')}>
              <input disabled value={data.employee_code || ''} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#f9fafb' }} />
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
            <Field label={t('Điện thoại','Phone')} error={errors.phone}>
              <input disabled={!edit} value={data.phone || ''} onChange={e=>setData({ ...data, phone:e.target.value })} placeholder="0xxxxxxxxx" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
            <Field label={t('Ngày sinh','Date of birth')} error={errors.dob}>
              <input disabled={!edit} type="date" value={data.dob || ''} onChange={e=>setData({ ...data, dob:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
            <Field label={t('Giới tính','Gender')}>
              <select disabled={!edit} value={data.gender || ''} onChange={e=>setData({ ...data, gender: (e.target.value || null) as any })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }}>
                <option value="">{t('Không xác định','Unspecified')}</option>
                <option value="male">{t('Nam','Male')}</option>
                <option value="female">{t('Nữ','Female')}</option>
                <option value="other">{t('Khác','Other')}</option>
              </select>
            </Field>
            <Field label={t('Tỉnh/Thành','Province/City')}>
              <input disabled={!edit} value={data.province || ''} onChange={e=>setData({ ...data, province:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12 }}>
            <Field label={t('Địa chỉ','Address')}>
              <input disabled={!edit} value={data.address_line || ''} onChange={e=>setData({ ...data, address_line:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
            <Field label={t('Quận/Huyện','District')}>
              <input disabled={!edit} value={data.district || ''} onChange={e=>setData({ ...data, district:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
            <Field label={t('Quốc gia','Country')}>
              <input disabled={!edit} value={data.country || ''} onChange={e=>setData({ ...data, country:e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
            </Field>
          </div>

          {/* Emergency contact */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#f9fafb' }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>{t('Người liên hệ khẩn cấp','Emergency contact')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
              <Field label={t('Họ và tên','Full name')}>
                <input disabled={!edit} value={data.emergency?.name || ''} onChange={e=>setData({ ...data, emergency: { ...(data.emergency||{ name:'', phone:'' }), name:e.target.value } })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
              </Field>
              <Field label={t('Điện thoại','Phone')}>
                <input disabled={!edit} value={data.emergency?.phone || ''} onChange={e=>setData({ ...data, emergency: { ...(data.emergency||{ name:'', phone:'' }), phone:e.target.value } })} placeholder="0xxxxxxxxx" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
              </Field>
              <Field label={t('Quan hệ','Relationship')}>
                <input disabled={!edit} value={data.emergency?.relationship || ''} onChange={e=>setData({ ...data, emergency: { ...(data.emergency||{ name:'', phone:'' }), relationship:e.target.value } })} placeholder={t('Vợ/Chồng, Cha/Mẹ...','Spouse, Parent...')} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: edit?'#fff':'#f9fafb' }} />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onCancel} disabled={!edit} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff', opacity: edit?1:0.6 }}>{t('Hủy','Cancel')}</button>
            <button onClick={onSave} disabled={!edit || busy} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', opacity: (!edit||busy)?0.7:1 }}>{t('Lưu','Save')}</button>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:999, fontSize:13 }}
             onAnimationEnd={()=>setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
};
