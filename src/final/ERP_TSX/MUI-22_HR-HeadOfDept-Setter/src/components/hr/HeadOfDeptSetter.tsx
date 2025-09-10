// src/components/hr/HeadOfDeptSetter.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getDepartments, listEmployeesByDept, getHeads, setHead, clearHead, exportHeadsCSV, type DeptNode, type Employee, type HeadsMap } from '../../mock/heads';

export type HeadOfDeptSetterProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getDepartments: typeof getDepartments;
    listEmployeesByDept: typeof listEmployeesByDept;
    getHeads: typeof getHeads;
    setHead: typeof setHead;
    clearHead: typeof clearHead;
    exportHeadsCSV: typeof exportHeadsCSV;
  }>;
};

export const HeadOfDeptSetter: React.FC<HeadOfDeptSetterProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getDepartments: adapters.getDepartments || getDepartments,
    listEmployeesByDept: adapters.listEmployeesByDept || listEmployeesByDept,
    getHeads: adapters.getHeads || getHeads,
    setHead: adapters.setHead || setHead,
    clearHead: adapters.clearHead || clearHead,
    exportHeadsCSV: adapters.exportHeadsCSV || exportHeadsCSV,
  };

  const [root, setRoot] = useState<DeptNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [currentDeptId, setCurrentDeptId] = useState<string>('root');
  const [heads, setHeads] = useState<HeadsMap>({});
  const [emps, setEmps] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<{ from?: string; to?: string }>({});

  const reload = async () => {
    const r = await fns.getDepartments!();
    setRoot(r);
    setHeads(await fns.getHeads!());
  };
  useEffect(()=>{ reload(); }, []);
  useEffect(()=>{
    (async ()=>{
      if (!currentDeptId || currentDeptId==='root') { setEmps([]); return; }
      const rows = await fns.listEmployeesByDept!(currentDeptId);
      setEmps(rows);
    })();
  }, [currentDeptId]);

  const flatten = (n: DeptNode | null): DeptNode[] => {
    const out: DeptNode[] = [];
    const walk = (x:DeptNode) => { out.push(x); x.children.forEach(walk); };
    if (n) walk(n);
    return out;
  };
  const allDepts = useMemo(()=> flatten(root), [root]);
  const deptById = (id?:string) => allDepts.find(d=>d.id===id);
  const currentHead = heads[currentDeptId || '']?.employee_id;
  const currentHeadEmp = useMemo(()=> emps.find(e=>e.id===currentHead), [emps, currentHead]);

  const filteredEmps = useMemo(()=>{
    const s = search.toLowerCase().trim();
    if (!s) return emps;
    return emps.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || (e.title||'').toLowerCase().includes(s));
  }, [emps, search]);

  const toggleExpand = (id: string) => setExpanded(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const DeptTree: React.FC<{ n: DeptNode, depth: number }> = ({ n, depth }) => {
    const isOpen = expanded.has(n.id);
    const isCurrent = currentDeptId===n.id;
    return (
      <div style={{ marginLeft: depth*12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 6px', borderRadius:8, background: isCurrent ? '#eef2ff' : '#fff', border: '1px solid #e5e7eb' }}
             title={n.id}>
          <button onClick={()=>toggleExpand(n.id)} style={{ width:22, height:22, border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>
            {n.children.length>0 ? (isOpen ? '▾' : '▸') : '·'}
          </button>
          <div style={{ cursor:'pointer', flex:1 }} onClick={()=>setCurrentDeptId(n.id)}>
            <b>{n.name}</b>{n.code ? <span style={{ color:'#6b7280' }}> — {n.code}</span> : null}
          </div>
          <div style={{ fontSize:12, color:'#6b7280' }}>
            {heads[n.id]?.employee_id ? <span>★ {t('Trưởng phòng','Head')}</span> : <span style={{ opacity:0.6 }}>—</span>}
          </div>
        </div>
        {isOpen && n.children.map(ch => <DeptTree key={ch.id} n={ch} depth={depth+1} />)}
      </div>
    );
  };

  const doSetHead = async (empId: string) => {
    const from = acting.from || undefined, to = acting.to || undefined;
    await fns.setHead!(currentDeptId, empId, from, to);
    setHeads(await fns.getHeads!());
  };
  const doClear = async () => {
    await fns.clearHead!(currentDeptId);
    setHeads(await fns.getHeads!());
  };
  const onExport = async () => {
    const blob = await fns.exportHeadsCSV!();
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='dept_heads.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:12, padding:12 }}>
      {/* Left: Departments */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden', height:'calc(100vh - 160px)' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Phòng ban','Departments')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          </div>
        </div>
        <div style={{ padding:10, overflow:'auto', height:'calc(100% - 42px)' }}>
          {root && <DeptTree n={root} depth={0} />}
        </div>
      </aside>

      {/* Right: Head setter */}
      <section style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
        {/* Current head card */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:800 }}>{t('Thiết lập Trưởng phòng','Set Head of Department')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ảnh hưởng route phê duyệt (Leave/Timesheet/Expense, v.v.)','Affects approval routing')}</div>
          </div>
          <div style={{ padding:10, display:'grid', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center' }}>
              <div style={{ color:'#6b7280' }}>{t('Phòng ban','Department')}</div>
              <div><b>{deptById(currentDeptId)?.name || '—'}</b> {deptById(currentDeptId)?.code && <span style={{ color:'#6b7280' }}>({deptById(currentDeptId)?.code})</span>}</div>

              <div style={{ color:'#6b7280' }}>{t('Trưởng phòng hiện tại','Current head')}</div>
              <div>
                {currentHeadEmp ? (
                  <div>
                    <div style={{ fontWeight:700 }}>{currentHeadEmp.name}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{currentHeadEmp.email} {currentHeadEmp.title ? ' — '+currentHeadEmp.title : ''}</div>
                    {heads[currentDeptId]?.acting_from && heads[currentDeptId]?.acting_to && (
                      <div style={{ color:'#6b7280', fontSize:12 }}>{t('Quyền thay mặt','Acting')}: {heads[currentDeptId]?.acting_from} → {heads[currentDeptId]?.acting_to}</div>
                    )}
                  </div>
                ) : <i style={{ color:'#6b7280' }}>{t('Chưa thiết lập','Not set')}</i>}
              </div>

              <div style={{ color:'#6b7280' }}>{t('Thiết lập tạm quyền','Acting (optional)')}</div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="date" value={acting.from || ''} onChange={e=>setActing(a=>({...a, from: e.target.value||undefined}))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                <span>→</span>
                <input type="date" value={acting.to || ''} onChange={e=>setActing(a=>({...a, to: e.target.value||undefined}))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </div>
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={doClear} disabled={!currentHead} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 10px', background:'#fff', opacity: !currentHead?0.6:1 }}>{t('Bỏ thiết lập','Clear')}</button>
            </div>
          </div>
        </div>

        {/* Candidates list */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>{t('Ứng viên (nhân sự thuộc phòng ban)','Candidates (employees in department)')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chỉ hiện nhân sự ACTIVE đã gán vào phòng ban này (HR‑07).','Only ACTIVE employees already assigned to this department (HR‑07).')}</div>
          </div>
          <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:8 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm tên/email/chức danh...','Search name/email/title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          <div style={{ overflow:'auto', maxHeight: 'calc(100vh - 360px)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Họ tên','Name')}</th>
                  <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Email','Email')}</th>
                  <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Chức danh','Title')}</th>
                  <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Hành động','Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmps.length===0 && <tr><td colSpan={4} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                {filteredEmps.map(e => (
                  <tr key={e.id} style={{ borderTop:'1px solid #f1f5f9', background: e.id===currentHead ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding:8 }}>
                      <div style={{ fontWeight:700 }}>{e.name}</div>
                      <div style={{ color:'#6b7280', fontSize:12 }}>{e.active ? t('Đang làm','Active') : t('Nghỉ việc','Inactive')}</div>
                    </td>
                    <td style={{ padding:8 }}>{e.email}</td>
                    <td style={{ padding:8 }}>{e.title || '—'}</td>
                    <td style={{ padding:8 }}>
                      <button onClick={()=>doSetHead(e.id)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>
                        {e.id===currentHead ? t('Đang là Trưởng phòng','Current Head') : t('Đặt làm Trưởng phòng','Set as Head')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
