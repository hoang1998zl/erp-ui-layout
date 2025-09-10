// src/components/admin/UserFormModal.tsx
import React, { useEffect, useState } from 'react';
import type { User } from '../../mock/users';

export type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; full_name: string; department?: string; title?: string }) => Promise<void> | void;
  initial?: Partial<User>;
  locale?: 'vi'|'en';
  departments?: string[];
};

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSubmit, initial={}, locale='vi', departments=[] }) => {
  const [email, setEmail] = useState(initial.email || '');
  const [full_name, setFullName] = useState(initial.full_name || '');
  const [department, setDepartment] = useState(initial.department || '');
  const [title, setTitle] = useState(initial.title || '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initial.email || '');
      setFullName(initial.full_name || '');
      setDepartment(initial.department || '');
      setTitle(initial.title || '');
      setError(null);
    }
  }, [open, initial.email, initial.full_name, initial.department, initial.title]);

  if (!open) return null;
  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;

  const submit = async () => {
    try {
      setBusy(true);
      await onSubmit({ email, full_name, department, title });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ width:560, background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Người dùng','User')}</div>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>✕</button>
        </div>
        <div style={{ padding:12, display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center' }}>
          <label style={{ color:'#6b7280' }}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <label style={{ color:'#6b7280' }}>{t('Họ tên','Full name')}</label>
          <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder={t('Ví dụ: Nguyễn Văn A','e.g., John Doe')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <label style={{ color:'#6b7280' }}>{t('Phòng ban','Department')}</label>
          <select value={department} onChange={e=>setDepartment(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="">{t('— Chọn —','— Select —')}</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label style={{ color:'#6b7280' }}>{t('Chức danh','Title')}</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t('VD: Manager','e.g., Manager')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          {error && <div style={{ gridColumn:'1 / -1', color:'#ef4444' }}>{error}</div>}
        </div>
        <div style={{ padding:12, display:'flex', gap:8, justifyContent:'flex-end', borderTop:'1px solid #e5e7eb' }}>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Hủy','Cancel')}</button>
          <button onClick={submit} disabled={busy} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', opacity: busy ? 0.7 : 1 }}>
            {t('Lưu','Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
