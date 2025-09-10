// src/components/pm/TeamAssignmentDnD.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listEmployees, listProjects, getTeam, saveTeam, normalizeTeam, exportCSV, type TeamEntry } from '../../mock/team_assign';

type RoleKey = 'Owner'|'Manager'|'Member';

type DragData = { employee_id: string; from: 'pool'|RoleKey };

export const TeamAssignmentDnD: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>('');
  const [pool, setPool] = useState<any[]>([]);
  const [team, setTeam] = useState<TeamEntry[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dragRef = useRef<DragData | null>(null);

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(ps[0]?.id || ''); }); }, []);

  const reload = async () => {
    if (!pid) return;
    const emps = await listEmployees({ active_only: true, search, department: dept||undefined });
    setPool(emps);
    setTeam(await getTeam(pid));
  };
  useEffect(()=>{ reload(); }, [pid, search, dept]);

  const owner = team.find(t => t.role==='Owner');
  const managers = team.filter(t => t.role==='Manager');
  const members = team.filter(t => t.role==='Member');
  const inTeamIds = new Set(team.map(t => t.employee_id));
  const poolList = pool.filter(e => !inTeamIds.has(e.id));

  const startDrag = (e: React.DragEvent, d: DragData) => { dragRef.current = d; e.dataTransfer.setData('text/plain', JSON.stringify(d)); e.dataTransfer.effectAllowed='move'; };
  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect='move'; };
  const dropTo = (role: RoleKey | 'pool') => async (e: React.DragEvent) => {
    e.preventDefault();
    const data: DragData = dragRef.current || JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    if (!data || !data.employee_id) return;
    if (role==='pool') {
      setTeam(prev => prev.filter(t => t.employee_id!==data.employee_id));
      return;
    }
    // enforce constraints: one Owner
    setTeam(prev => {
      const without = prev.filter(t => t.employee_id!==data.employee_id);
      if (role==='Owner') {
        const removedOwners = without.filter(t => t.role==='Owner');
        return normalizeTeam([{ employee_id: data.employee_id, role }, ...without]);
      } else if (role==='Manager') {
        return normalizeTeam([{ employee_id: data.employee_id, role }, ...without]);
      } else {
        return normalizeTeam([{ employee_id: data.employee_id, role, allocation_pct: 100 }, ...without]);
      }
    });
  };

  const setAlloc = (id: string, pct: number) => setTeam(prev => prev.map(t => t.employee_id===id ? { ...t, allocation_pct: Math.max(0, Math.min(100, Math.round(pct))) } : t));
  const removeFrom = (id: string) => setTeam(prev => prev.filter(t => t.employee_id!==id));

  const onSave = async () => {
    if (!pid) return;
    setBusy(true);
    await saveTeam(pid, normalizeTeam(team));
    setBusy(false);
    setToast(t('Đã lưu team','Team saved')); setTimeout(()=>setToast(null), 1500);
  };

  const onExport = async () => {
    const blob = await exportCSV(pid);
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='team.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const RoleCard: React.FC<{ title: string; role: RoleKey; single?: boolean; footer?: React.ReactNode }> = ({ title, role, single=false, footer }) => {
    const entries = role==='Owner' ? (owner ? [owner] : []) : role==='Manager' ? managers : members;
    const hint = role==='Member' ? t('Kéo nhân sự vào đây, đặt % allocation','Drag here and set allocation %') : t('Kéo nhân sự vào đây','Drag people here');
    return (
      <div onDragOver={allowDrop} onDrop={dropTo(role)} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#f9fafb', display:'grid', gridTemplateRows:'auto 1fr auto', minHeight: 220 }}>
        <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{entries.length}{single?'/1':''}</div>
        </div>
        <div style={{ padding:10, display:'grid', gap:8 }}>
          {entries.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>{hint}</div>}
          {entries.map(en => (
            <div key={en.employee_id} draggable onDragStart={e=>startDrag(e, { employee_id: en.employee_id, from: role })}
                 style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 8px', display:'grid', gridTemplateColumns: role==='Member' ? '1fr 120px auto' : '1fr auto', gap:8, alignItems:'center' }}>
              <div style={{ display:'grid' }}>
                <div style={{ fontWeight:700 }}>{(pool.find(p=>p.id===en.employee_id)?.name)||en.employee_id}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{(pool.find(p=>p.id===en.employee_id)?.title)||'—'}</div>
              </div>
              {role==='Member' && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input type="number" min={0} max={100} value={en.allocation_pct||0} onChange={e=>setAlloc(en.employee_id, Number(e.target.value||0))}
                         style={{ width:70, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px' }} />
                  <span>%</span>
                </div>
              )}
              <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                <button onClick={()=>removeFrom(en.employee_id)} title={t('Loại khỏi team','Remove from team')} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb' }}>{footer}</div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Gán thành viên dự án','Team Assignment')}</div>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <button onClick={onSave} disabled={busy} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', opacity: busy?0.7:1 }}>{t('Lưu team','Save team')}</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:8, alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm tên/email/chức danh...','Search name/email/title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <select value={dept} onChange={e=>setDept(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('Phòng ban','Department')}</option>
          {['ENG','QA','PMO','UI/UX','OPS'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ color:'#6b7280' }}>{t('Kéo thả để gán vai trò','Drag & drop to assign')}</div>
      </div>

      {/* Body */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr', gap:12 }}>
        {/* Pool */}
        <div onDragOver={allowDrop} onDrop={dropTo('pool')} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>{t('Nhân sự khả dụng','Available employees')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{poolList.length}</div>
          </div>
          <div style={{ padding:10, display:'grid', gap:8, overflow:'auto' }}>
            {poolList.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>—</div>}
            {poolList.map(e => (
              <div key={e.id} draggable onDragStart={ev=>startDrag(ev, { employee_id: e.id, from: 'pool' })}
                   style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 8px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
                <div style={{ display:'grid' }}>
                  <div style={{ fontWeight:700 }}>{e.name}</div>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{e.title || '—'} • {e.department || '—'}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setTeam(prev => normalizeTeam([{ employee_id: e.id, role:'Member', allocation_pct: 100 }, ...prev]))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Thêm','Add')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div style={{ display:'grid', gridTemplateRows:'1fr 1fr 2fr', gap:12 }}>
          <RoleCard title={t('Owner (1)','Owner (1)')} role="Owner" single footer={<span style={{ color:'#6b7280', fontSize:12 }}>{t('Chỉ 1 Owner. Kéo người vào để đặt làm Owner.','Single Owner. Drag to set Owner.')}</span>} />
          <RoleCard title={t('Manager(s)','Manager(s)')} role="Manager" footer={<span style={{ color:'#6b7280', fontSize:12 }}>{t('Có thể có nhiều Manager tuỳ theo quy định RBAC.','Multiple managers allowed per RBAC.')}</span>} />
          <RoleCard title={t('Members (% allocation)','Members (% allocation)')} role="Member" footer={<span style={{ color:'#6b7280', fontSize:12 }}>{t('Nhập % phân bổ cho từng thành viên.','Set allocation % per member.')}</span>} />
        </div>
      </section>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{toast || ' '}</div>
        <div>
          <span style={{ marginRight:8 }}>{t('Mẹo: kéo nhân sự từ team trả về Pool để gỡ khỏi dự án.','Tip: drag from team back to Pool to remove.')}</span>
        </div>
      </div>
    </div>
  );
};
