// src/components/admin/RBACMatrixAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listPermissions, listRoles, listGroups, getAssignments,
  setAssignment, setGroupForRole,
  createRole, updateRole, deleteRole,
  exportJSON, importJSON,
  type Permission, type Role
} from '../../mock/rbac';

export type RBACMatrixAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listPermissions?: typeof listPermissions;
    listRoles?: typeof listRoles;
    listGroups?: typeof listGroups;
    getAssignments?: typeof getAssignments;
    setAssignment?: typeof setAssignment;
    setGroupForRole?: typeof setGroupForRole;
    createRole?: typeof createRole;
    updateRole?: typeof updateRole;
    deleteRole?: typeof deleteRole;
    exportJSON?: typeof exportJSON;
    importJSON?: typeof importJSON;
  }
};

type AssignMap = Record<string, Set<string>>; // roleId -> Set<permKey>

const useAsync = <T,>(fn: () => Promise<T>, deps: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let mounted = true;
    setLoading(true); setError(null);
    fn().then(d => { if (mounted) setData(d); }).catch(e => setError(e)).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, deps);
  return { data, loading, error, setData };
};

export const RBACMatrixAdmin: React.FC<RBACMatrixAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale === 'vi' ? vi : en;
  const fns = {
    listPermissions: adapters.listPermissions || listPermissions,
    listRoles: adapters.listRoles || listRoles,
    listGroups: adapters.listGroups || listGroups,
    getAssignments: adapters.getAssignments || getAssignments,
    setAssignment: adapters.setAssignment || setAssignment,
    setGroupForRole: adapters.setGroupForRole || setGroupForRole,
    createRole: adapters.createRole || createRole,
    updateRole: adapters.updateRole || updateRole,
    deleteRole: adapters.deleteRole || deleteRole,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };

  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  const { data: permsRaw, loading: loadingPerms } = useAsync<Permission[]>(() => fns.listPermissions(), []);
  const { data: rolesRaw, loading: loadingRoles, setData: setRolesRaw } = useAsync<Role[]>(() => fns.listRoles(), []);
  const { data: groups } = useAsync<string[]>(() => fns.listGroups(), []);
  const { data: assignRaw, loading: loadingMap, setData: setAssignRaw } = useAsync<Record<string,string[]>>(() => fns.getAssignments(), []);

  const perms = permsRaw || [];
  const roles = rolesRaw || [];
  const assign: AssignMap = useMemo(() => {
    const m: AssignMap = {};
    Object.entries(assignRaw || {}).forEach(([rid, arr]) => m[rid] = new Set(arr));
    return m;
  }, [assignRaw]);

  const filteredPerms = useMemo(() => {
    const qq = q.toLowerCase().trim();
    return perms.filter(p => (group==='all' || p.group === group) &&
      (!qq || p.label.toLowerCase().includes(qq) || p.key.toLowerCase().includes(qq)));
  }, [perms, q, group]);

  const grouped = useMemo(() => {
    const g: Record<string, Permission[]> = {};
    filteredPerms.forEach(p => { (g[p.group] ||= []).push(p); });
    return g;
  }, [filteredPerms]);

  const toggleCell = async (roleId: string, permKey: string) => {
    const allowed = !(assign[roleId]?.has(permKey));
    await fns.setAssignment(roleId, permKey, allowed);
    // optimistic update
    const next = { ...(assignRaw || {}) };
    const arr = new Set(next[roleId] || []);
    if (allowed) arr.add(permKey); else arr.delete(permKey);
    next[roleId] = Array.from(arr);
    setAssignRaw(next);
  };

  const toggleGroup = async (roleId: string, grp: string, value: boolean) => {
    await fns.setGroupForRole(roleId, grp, value);
    const keys = perms.filter(p => p.group === grp).map(p => p.key);
    const next = { ...(assignRaw || {}) };
    const arr = new Set(next[roleId] || []);
    for (const k of keys) { if (value) arr.add(k); else arr.delete(k); }
    next[roleId] = Array.from(arr);
    setAssignRaw(next);
  };

  const onCreateRole = async () => {
    const name = prompt(t('Tên vai trò mới','New role name'));
    if (!name) return;
    const r = await fns.createRole({ name });
    setRolesRaw([...(rolesRaw || []), r]);
    setToast(t('Đã tạo vai trò','Role created'));
  };

  const onRenameRole = async (r: Role) => {
    const name = prompt(t('Tên vai trò','Role name'), r.name);
    if (!name) return;
    const out = await fns.updateRole(r.id, { name });
    setRolesRaw((rolesRaw || []).map(x => x.id === r.id ? out : x));
    setToast(t('Đã cập nhật vai trò','Role updated'));
  };

  const onToggleActive = async (r: Role) => {
    const out = await fns.updateRole(r.id, { active: !r.active });
    setRolesRaw((rolesRaw || []).map(x => x.id === r.id ? out : x));
  };

  const onDeleteRole = async (r: Role) => {
    if (!confirm(t('Xóa vai trò này?','Delete this role?'))) return;
    try {
      await fns.deleteRole(r.id);
      setRolesRaw((rolesRaw || []).filter(x => x.id !== r.id));
      const next = { ...(assignRaw || {}) }; delete next[r.id]; setAssignRaw(next);
      setToast(t('Đã xóa vai trò','Role deleted'));
    } catch (e:any) {
      alert(e.message || 'Error');
    }
  };

  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rbac_export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    await fns.importJSON(file);
    // reload everything
    const [r, p, a] = await Promise.all([fns.listRoles(), fns.listPermissions(), fns.getAssignments()]);
    setRolesRaw(r); setAssignRaw(a);
    setToast(t('Đã nhập cấu hình RBAC','RBAC imported'));
  };

  const roleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    roles.forEach(r => m[r.id] = (assign[r.id]?.size || 0));
    return m;
  }, [roles, assign]);

  const loading = loadingPerms || loadingRoles || loadingMap;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12, padding:12 }}>
      {/* Left: Role management */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Vai trò','Roles')}</div>
          <button onClick={onCreateRole} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Thêm','Add')}</button>
        </div>
        <div style={{ maxHeight:420, overflow:'auto', padding:8, display:'flex', flexDirection:'column', gap:8 }}>
          {roles.map(r => (
            <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{r.name} {!r.active && <span style={{ fontSize:12, color:'#ef4444' }}>({t('ngưng','inactive')})</span>}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{t('Số quyền','Perms')}: {roleCounts[r.id] ?? 0}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <button onClick={()=>onRenameRole(r)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                  <button onClick={()=>onToggleActive(r)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{r.active ? t('Vô hiệu','Disable') : t('Kích hoạt','Enable')}</button>
                  {!r.built_in && <button onClick={()=>onDeleteRole(r)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'6px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>}
                </div>
              </div>
            </div>
          ))}
          {roles.length === 0 && <div style={{ color:'#6b7280' }}>{t('Chưa có vai trò','No roles')}</div>}
        </div>

        <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'space-between' }}>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Nhập JSON','Import JSON')}
            <input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
          </label>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
        </div>
      </aside>

      {/* Right: Matrix */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm quyền theo tên/khóa...','Search permissions by label/key...')} style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <select value={group} onChange={e=>setGroup(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="all">{t('Nhóm (tất cả)','Group (all)')}</option>
            {(groups || []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {loading && <span style={{ color:'#6b7280' }}>{t('Đang tải...','Loading...')}</span>}
        </div>

        {/* Matrix Table */}
        <div style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ position:'sticky', left:0, zIndex:1, background:'#f9fafb', textAlign:'left', padding:10, borderBottom:'1px solid #e5e7eb', minWidth:320 }}>{t('Quyền','Permission')}</th>
                {roles.map(r => (
                  <th key={r.id} style={{ textAlign:'center', padding:10, borderBottom:'1px solid #e5e7eb' }} title={r.name}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([grp, list]) => (
                <React.Fragment key={grp}>
                  {/* Group row with "toggle all" */}
                  <tr style={{ background:'#f3f4f6', borderTop:'1px solid #e5e7eb' }}>
                    <td style={{ position:'sticky', left:0, zIndex:1, padding:10, fontWeight:800 }}>{grp}</td>
                    {roles.map(r => {
                      const allOn = list.every(p => assign[r.id]?.has(p.key));
                      const anyOn = list.some(p => assign[r.id]?.has(p.key));
                      return (
                        <td key={r.id} style={{ textAlign:'center', padding:8 }}>
                          <input type="checkbox" checked={allOn} ref={el => { if (el) el.indeterminate = !allOn && anyOn; }} onChange={e=>toggleGroup(r.id, grp, e.currentTarget.checked)} />
                        </td>
                      );
                    })}
                  </tr>
                  {list.map(p => (
                    <tr key={p.key} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ position:'sticky', left:0, background:'#fff', zIndex:1, padding:10 }}>
                        <div style={{ fontWeight:600 }}>{p.label}</div>
                        <div style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{p.key}</div>
                      </td>
                      {roles.map(r => (
                        <td key={r.id} style={{ textAlign:'center', padding:8 }}>
                          <input type="checkbox" checked={assign[r.id]?.has(p.key) || false} onChange={()=>toggleCell(r.id, p.key)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {filteredPerms.length === 0 && (
                <tr><td colSpan={1 + roles.length} style={{ padding:14, color:'#6b7280' }}>{t('Không có quyền phù hợp','No permissions')}</td></tr>
              )}
            </tbody>
          </table>
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
