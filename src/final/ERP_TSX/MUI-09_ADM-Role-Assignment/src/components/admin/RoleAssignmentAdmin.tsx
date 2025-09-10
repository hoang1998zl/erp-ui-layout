// src/components/admin/RoleAssignmentAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, type User, getDepartments } from '../../mock/users';
import { listRoles, listPermissions, getAssignments, type Role } from '../../mock/rbac';
import { getUserRoles, setUserRole, getDeptRoles, setDeptRole, exportJSON as exportAssign, importJSON as importAssign } from '../../mock/roleAssignments';

export type RoleAssignmentAdminProps = {
  locale?: 'vi'|'en';
  // adapters for real API override
  adapters?: {
    listUsers?: typeof listUsers;
    getDepartments?: typeof getDepartments;
    listRoles?: typeof listRoles;
    listPermissions?: typeof listPermissions;
    getAssignments?: typeof getAssignments;
    getUserRoles?: typeof getUserRoles;
    setUserRole?: typeof setUserRole;
    getDeptRoles?: typeof getDeptRoles;
    setDeptRole?: typeof setDeptRole;
    exportAssignments?: typeof exportAssign;
    importAssignments?: typeof importAssign;
  };
};

type AssignMap = Record<string, Set<string>>; // roleId -> permKeys

export const RoleAssignmentAdmin: React.FC<RoleAssignmentAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;

  const fns = {
    listUsers: adapters.listUsers || listUsers,
    getDepartments: adapters.getDepartments || getDepartments,
    listRoles: adapters.listRoles || listRoles,
    listPermissions: adapters.listPermissions || listPermissions,
    getAssignments: adapters.getAssignments || getAssignments,
    getUserRoles: adapters.getUserRoles || getUserRoles,
    setUserRole: adapters.setUserRole || setUserRole,
    getDeptRoles: adapters.getDeptRoles || getDeptRoles,
    setDeptRole: adapters.setDeptRole || setDeptRole,
    exportAssignments: adapters.exportAssignments || exportAssign,
    importAssignments: adapters.importAssignments || importAssign,
  };

  // Load data
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permMap, setPermMap] = useState<AssignMap>({});
  const [userRole, setUserRoleMap] = useState<Record<string,string[]>>({});
  const [deptRole, setDeptRoleMap] = useState<Record<string,string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [us, ds, rs, asn, ur, dr] = await Promise.all([
        fns.listUsers(), fns.getDepartments(), fns.listRoles(), fns.getAssignments(), fns.getUserRoles(), fns.getDeptRoles()
      ]);
      setUsers(us); setDepartments(ds); setRoles(rs);
      const pm: AssignMap = {};
      Object.entries(asn).forEach(([rid, keys]) => pm[rid] = new Set(keys));
      setPermMap(pm);
      setUserRoleMap(ur); setDeptRoleMap(dr);
      setLoading(false);
    };
    load();
  }, []);

  // UI state
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sel, setSel] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const qq = q.toLowerCase().trim();
    return users.filter(u => (!deptFilter || u.department === deptFilter) &&
      (!qq || u.full_name.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq)));
  }, [users, deptFilter, q]);

  useEffect(() => { if (filteredUsers.length && !sel) setSel(filteredUsers[0]); }, [filteredUsers.length]);

  const userDirectRoleIds = useMemo(() => new Set(sel ? (userRole[sel.id] || []) : []), [sel, userRole]);
  const deptInheritedRoleIds = useMemo(() => new Set(sel?.department ? (deptRole[sel.department] || []) : []), [sel?.department, deptRole]);
  const effectiveRoleIds = useMemo(() => {
    const set = new Set<string>();
    userDirectRoleIds.forEach(r=>set.add(r)); deptInheritedRoleIds.forEach(r=>set.add(r));
    return set;
  }, [userDirectRoleIds, deptInheritedRoleIds]);

  const effectivePermKeys = useMemo(() => {
    const s = new Set<string>();
    roles.forEach(r => {
      if (effectiveRoleIds.has(r.id)) {
        (permMap[r.id] || new Set()).forEach(k => s.add(k));
      }
    });
    return s;
  }, [roles, effectiveRoleIds, permMap]);

  const toggleUserRole = async (roleId: string) => {
    if (!sel) return;
    const allowed = !userDirectRoleIds.has(roleId);
    await fns.setUserRole(sel.id, roleId, allowed);
    const next = { ...(userRole) };
    const arr = new Set(next[sel.id] || []);
    if (allowed) arr.add(roleId); else arr.delete(roleId);
    next[sel.id] = Array.from(arr);
    setUserRoleMap(next);
  };

  const toggleDeptRole = async (roleId: string) => {
    if (!sel?.department) return;
    const dept = sel.department;
    const arr = new Set(deptRole[dept] || []);
    const allowed = !arr.has(roleId);
    await fns.setDeptRole(dept, roleId, allowed);
    const next = { ...(deptRole) };
    if (allowed) arr.add(roleId); else arr.delete(roleId);
    next[dept] = Array.from(arr);
    setDeptRoleMap(next);
  };

  const onExport = async () => {
    const text = await fns.exportAssignments();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'role_assignments.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    await fns.importAssignments(file);
    const [ur, dr] = await Promise.all([fns.getUserRoles(), fns.getDeptRoles()]);
    setUserRoleMap(ur); setDeptRoleMap(dr);
  };

  if (loading) return <div style={{ padding:12 }}>{t('Đang tải...','Loading...')}</div>;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr 380px', gap:12, padding:12 }}>
      {/* Left: Users */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm người dùng...','Search users...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="">{t('Tất cả phòng ban','All depts')}</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ maxHeight:460, overflow:'auto' }}>
          {filteredUsers.map(u => (
            <button key={u.id} onClick={()=>setSel(u)}
              style={{
                width:'100%', textAlign:'left', border:'none', borderBottom:'1px solid #f1f5f9',
                background: sel?.id===u.id ? '#eef2ff' : '#fff', padding:'8px 10px', cursor:'pointer'
              }}>
              <div style={{ fontWeight:700 }}>{u.full_name}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{u.email}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{u.department || '—'} · {u.title || '—'}</div>
            </button>
          ))}
          {filteredUsers.length === 0 && <div style={{ padding:12, color:'#6b7280' }}>{t('Không có người dùng','No users')}</div>}
        </div>
      </aside>

      {/* Middle: Role assignment */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:800 }}>{t('Gán vai trò cho','Assign roles to')}: {sel?.full_name}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{sel?.email} · {sel?.department || '—'}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
          {/* Direct roles */}
          <div style={{ borderRight:'1px solid #e5e7eb' }}>
            <div style={{ padding:'8px 10px', fontWeight:700 }}>{t('Vai trò trực tiếp','Direct roles')}</div>
            <div style={{ padding:'0 10px 10px', display:'grid', gap:6 }}>
              {roles.map(r => (
                <label key={r.id} style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <input type="checkbox" checked={userDirectRoleIds.has(r.id)} onChange={()=>toggleUserRole(r.id)} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{r.name}</div>
                    {r.description && <div style={{ fontSize:12, color:'#6b7280' }}>{r.description}</div>}
                  </div>
                  {r.active ? <span style={{ fontSize:12, color:'#16a34a' }}>●</span> : <span style={{ fontSize:12, color:'#ef4444' }}>●</span>}
                </label>
              ))}
            </div>
          </div>
          {/* Dept roles */}
          <div>
            <div style={{ padding:'8px 10px', fontWeight:700 }}>{t('Vai trò theo phòng ban','Department roles')}: {sel?.department || t('(không có)','(none)')}</div>
            <div style={{ padding:'0 10px 10px', display:'grid', gap:6 }}>
              {roles.map(r => (
                <label key={r.id} style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', opacity: sel?.department ? 1 : 0.5 }}>
                  <input type="checkbox" disabled={!sel?.department} checked={deptInheritedRoleIds.has(r.id)} onChange={()=>toggleDeptRole(r.id)} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{r.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{t('Áp dụng cho tất cả thành viên của phòng ban','Applies to all members of the department')}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Right: Effective permissions */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Quyền hiệu lực','Effective permissions')}</div>
        <div style={{ padding:10, display:'grid', gap:8 }}>
          <div>{t('Tổng số quyền','Total permissions')}: <b>{effectivePermKeys.size}</b></div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Vai trò hiệu lực','Effective roles')}: {roles.filter(r => effectiveRoleIds.has(r.id)).map(r => r.name).join(', ') || '—'}</div>
          <details>
            <summary style={{ cursor:'pointer' }}>{t('Xem danh sách quyền','View permission list')}</summary>
            <div style={{ maxHeight:260, overflow:'auto', marginTop:6, border:'1px solid #e5e7eb', borderRadius:8, padding:8 }}>
              {Array.from(effectivePermKeys).sort().map(k => (
                <div key={k} style={{ fontFamily:'monospace', fontSize:12 }}>{k}</div>
              ))}
            </div>
          </details>
          <div style={{ marginTop:8, fontSize:12, color:'#6b7280' }}>
            {t('Ghi chú: Quyền hiệu lực = Vai trò trực tiếp ∪ Vai trò theo phòng ban.','Note: Effective perms = Direct roles ∪ Department roles.')}
          </div>
        </div>
      </aside>
    </div>
  );
};
