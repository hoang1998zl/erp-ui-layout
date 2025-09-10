// src/components/admin/UserManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, getDepartments, createUser, updateUser, setUserStatus, deleteUser, importCSV, type User } from '../../mock/users';
import { UserFormModal } from './UserFormModal';

export type UserManagementProps = {
  locale?: 'vi'|'en';
  pageSize?: number;
  // optional adapters
  adapters?: {
    listUsers?: typeof listUsers;
    getDepartments?: typeof getDepartments;
    createUser?: typeof createUser;
    updateUser?: typeof updateUser;
    setUserStatus?: typeof setUserStatus;
    deleteUser?: typeof deleteUser;
    importCSV?: typeof importCSV;
  }
};

const statusColors: Record<User['status'], string> = {
  active: '#16a34a', inactive: '#6b7280', invited: '#f59e0b'
};

export const UserManagement: React.FC<UserManagementProps> = ({ locale='vi', pageSize=20, adapters={} }) => {
  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'inactive'|'invited'>('all');
  const [dept, setDept] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const listFn = adapters.listUsers || listUsers;
  const deptFn = adapters.getDepartments || getDepartments;
  const createFn = adapters.createUser || createUser;
  const updateFn = adapters.updateUser || updateUser;
  const statusFn = adapters.setUserStatus || setUserStatus;
  const deleteFn = adapters.deleteUser || deleteUser;
  const importFn = adapters.importCSV || importCSV;

  const load = async () => {
    setLoading(true);
    const res = await listFn({ q, status, department: dept, page, pageSize });
    setRows(res.rows); setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => { deptFn().then(setDepartments); }, []);
  useEffect(() => { load(); }, [q, status, dept, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const clearFilters = () => { setQ(''); setStatus('all'); setDept(''); setPage(1); };

  const onCreate = async (payload: { email: string; full_name: string; department?: string; title?: string }) => {
    await createFn(payload);
    setToast(t('Đã tạo người dùng mới','User created'));
    load();
  };

  const onUpdate = async (u: User, patch: Partial<User>) => {
    setBusyRow(u.id);
    await updateFn(u.id, patch);
    setBusyRow(null);
    setToast(t('Đã cập nhật','Updated'));
    load();
  };

  const onToggle = async (u: User) => {
    setBusyRow(u.id);
    const next = u.status === 'active' ? 'inactive' : 'active';
    await statusFn(u.id, next as any);
    setBusyRow(null);
    setToast(next === 'active' ? t('Đã kích hoạt','Activated') : t('Đã vô hiệu hóa','Deactivated'));
    load();
  };

  const onDelete = async (u: User) => {
    if (!confirm(t('Xóa người dùng này?','Delete this user?'))) return;
    setBusyRow(u.id);
    await deleteFn(u.id);
    setBusyRow(null);
    setToast(t('Đã xóa','Deleted'));
    load();
  };

  const onImport = async (file: File) => {
    const res = await importFn(file);
    setToast(t(`Đã nhập ${res.inserted} — bỏ qua ${res.skipped}`, `Imported ${res.inserted} — skipped ${res.skipped}`));
    load();
  };

  return (
    <div style={{ display:'grid', gap:10, padding:12 }}>
      {/* Toolbar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} placeholder={t('Tìm theo tên/email/phòng ban...','Search name/email/department...')} style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <select value={status} onChange={e=>{ setStatus(e.target.value as any); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="all">{t('Tất cả','All')}</option>
            <option value="active">{t('Đang hoạt động','Active')}</option>
            <option value="inactive">{t('Ngưng','Inactive')}</option>
            <option value="invited">{t('Đã mời','Invited')}</option>
          </select>
          <select value={dept} onChange={e=>{ setDept(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="">{t('Phòng ban (tất cả)','Department (all)')}</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={clearFilters} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Xóa lọc','Clear')}</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Nhập CSV','Import CSV')}
            <input type="file" accept=".csv" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); e.currentTarget.value=''; }} />
          </label>
          <button onClick={()=>{ setEditUser(null); setShowForm(true); }} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>{t('Tạo người dùng','New user')}</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', background:'#fff' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ textAlign:'left', padding:10 }}>User</th>
              <th style={{ textAlign:'left', padding:10, width:160 }}>{t('Phòng ban','Department')}</th>
              <th style={{ textAlign:'left', padding:10, width:140 }}>{t('Chức danh','Title')}</th>
              <th style={{ textAlign:'left', padding:10, width:120 }}>{t('Trạng thái','Status')}</th>
              <th style={{ textAlign:'left', padding:10, width:180 }}>{t('Hoạt động gần đây','Recent activity')}</th>
              <th style={{ textAlign:'left', padding:10, width:200 }}>{t('Thao tác','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>{t('Không có dữ liệu','No data')}</td></tr>}
            {!loading && rows.map(u => (
              <tr key={u.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:10 }}>
                  <div style={{ fontWeight:700 }}>{u.full_name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{u.email}</div>
                </td>
                <td style={{ padding:10 }}>{u.department || '—'}</td>
                <td style={{ padding:10 }}>{u.title || '—'}</td>
                <td style={{ padding:10 }}>
                  <span style={{ background: '#f3f4f6', border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 8px' }}>
                    <span style={{ display:'inline-block', width:8, height:8, borderRadius:999, background: statusColors[u.status], marginRight:6 }} />
                    {u.status}
                  </span>
                </td>
                <td style={{ padding:10, fontSize:12, color:'#6b7280' }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</td>
                <td style={{ padding:10 }}>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button onClick={()=>{ setEditUser(u); setShowForm(true); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                    <button onClick={()=>onToggle(u)} disabled={busyRow===u.id} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>
                      {u.status==='active' ? t('Vô hiệu hóa','Deactivate') : t('Kích hoạt','Activate')}
                    </button>
                    <button onClick={()=>onDelete(u)} disabled={busyRow===u.id} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                    <button onClick={()=>alert(t('Đã gửi email đặt lại mật khẩu (mock)','Password reset email sent (mock)'))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{t('Đặt lại mật khẩu','Reset password')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{t('Tổng','Total')}: {total}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: page===1?0.5:1 }}>Prev</button>
          <span>Page {page}/{totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: page===totalPages?0.5:1 }}>Next</button>
        </div>
      </div>

      {/* Form modal */}
      <UserFormModal
        open={showForm}
        onClose={()=>setShowForm(false)}
        initial={editUser || undefined}
        departments={departments}
        locale={locale}
        onSubmit={async (data) => {
          if (editUser) await onUpdate(editUser, data);
          else await onCreate(data);
        }}
      />

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
