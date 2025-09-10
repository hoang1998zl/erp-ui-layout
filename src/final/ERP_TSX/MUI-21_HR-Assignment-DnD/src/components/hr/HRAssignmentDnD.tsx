// src/components/hr/HRAssignmentDnD.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDepartments, listEmployees, assignEmployees, unassignEmployees, getHistory, exportHistoryCSV,
  type DeptNode, type Employee, type AssignEvent
} from '../../mock/assignment';

export type HRAssignmentDnDProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getDepartments: typeof getDepartments;
    listEmployees: typeof listEmployees;
    assignEmployees: typeof assignEmployees;
    unassignEmployees: typeof unassignEmployees;
    getHistory: typeof getHistory;
    exportHistoryCSV: typeof exportHistoryCSV;
  }>;
};

export const HRAssignmentDnD: React.FC<HRAssignmentDnDProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getDepartments: adapters.getDepartments || getDepartments,
    listEmployees: adapters.listEmployees || listEmployees,
    assignEmployees: adapters.assignEmployees || assignEmployees,
    unassignEmployees: adapters.unassignEmployees || unassignEmployees,
    getHistory: adapters.getHistory || getHistory,
    exportHistoryCSV: adapters.exportHistoryCSV || exportHistoryCSV,
  };

  // Left: employees
  const [empSearch, setEmpSearch] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [empRows, setEmpRows] = useState<Employee[]>([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empOffset, setEmpOffset] = useState(0);
  const [empLimit, setEmpLimit] = useState(20);

  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // Right: departments tree
  const [deptRoot, setDeptRoot] = useState<DeptNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [currentDeptId, setCurrentDeptId] = useState<string>('root');

  // Bottom-right: history
  const [histRows, setHistRows] = useState<AssignEvent[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histOffset, setHistOffset] = useState(0);
  const [histLimit, setHistLimit] = useState(15);

  // Loaders
  const loadEmployees = async () => {
    const res = await fns.listEmployees!({ search: empSearch || undefined, unassigned_only: unassignedOnly || undefined, limit: empLimit, offset: empOffset });
    setEmpRows(res.rows); setEmpTotal(res.total);
  };
  const loadDepts = async () => { const r = await fns.getDepartments!(); setDeptRoot(r); };
  const loadHistory = async () => { const res = await fns.getHistory!(histLimit, histOffset); setHistRows(res.rows); setHistTotal(res.total); };

  useEffect(()=>{ loadEmployees(); }, [empSearch, unassignedOnly, empLimit, empOffset]);
  useEffect(()=>{ loadDepts(); }, []);
  useEffect(()=>{ loadHistory(); }, [histLimit, histOffset]);

  // Helpers
  const toggleEmp = (id: string, checked: boolean) => setSelectedEmpIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x!==id));
  const toggleAllEmp = (checked:boolean) => setSelectedEmpIds(checked ? empRows.map(e=>e.id) : []);

  const flattenDepts = (n: DeptNode | null): DeptNode[] => {
    const out: DeptNode[] = [];
    const walk = (x:DeptNode) => { out.push(x); x.children.forEach(walk); };
    if (n) walk(n);
    return out;
  };
  const allDepts = useMemo(()=> flattenDepts(deptRoot), [deptRoot]);
  const deptName = (id?:string) => allDepts.find(d=>d.id===id)?.name || (id==='root' ? t('Công ty','Company') : '—');

  const countPerDept = useMemo(()=>{
    const map: Record<string, number> = {};
    empRows.forEach(e => {
      const key = e.dept_id || 'unassigned';
      map[key] = (map[key]||0)+1;
    });
    return map;
  }, [empRows]);

  // Drag & Drop
  const dragIds = useRef<string[] | null>(null);
  const onDragStartCard = (ev: React.DragEvent, id: string) => {
    const withShift = ev.shiftKey;
    const ids = withShift ? Array.from(new Set([...selectedEmpIds, id])) : [id];
    dragIds.current = ids;
    ev.dataTransfer.setData('text/plain', JSON.stringify({ type:'emp', ids }));
    ev.dataTransfer.effectAllowed = 'move';
  };
  const onDropDept = async (ev: React.DragEvent, deptId: string) => {
    ev.preventDefault();
    try {
      const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
      if (data.type==='emp') {
        const ids: string[] = data.ids || dragIds.current || [];
        if (ids.length>0) {
          await fns.assignEmployees!(ids, deptId);
          setSelectedEmpIds([]);
          await Promise.all([loadEmployees(), loadHistory()]);
        }
      }
    } catch {}
  };
  const allowDrop = (ev: React.DragEvent) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; };

  const bulkAssign = async () => {
    const deptId = prompt(t('Nhập ID phòng ban đích (hover tên để xem ID).','Enter destination department ID (hover name to see ID).'));
    if (!deptId) return;
    await fns.assignEmployees!(selectedEmpIds, deptId);
    setSelectedEmpIds([]);
    await Promise.all([loadEmployees(), loadHistory()]);
  };
  const bulkUnassign = async () => {
    await fns.unassignEmployees!(selectedEmpIds);
    setSelectedEmpIds([]);
    await Promise.all([loadEmployees(), loadHistory()]);
  };

  const onExportHistory = async () => {
    const blob = await fns.exportHistoryCSV!();
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='assignment_history.csv'; a.click(); URL.revokeObjectURL(url);
  };

  // Dept tree UI
  const toggleExpand = (id: string) => setExpanded(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const DeptTree: React.FC<{ n: DeptNode, depth: number }> = ({ n, depth }) => {
    const isOpen = expanded.has(n.id);
    const isCurrent = currentDeptId===n.id;
    return (
      <div style={{ marginLeft: depth*12 }} onDragOver={allowDrop} onDrop={e=>onDropDept(e, n.id)}>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 6px', borderRadius:8, background: isCurrent ? '#eef2ff' : '#fff', border: '1px solid #e5e7eb' }}
             title={n.id}>
          <button onClick={()=>toggleExpand(n.id)} style={{ width:22, height:22, border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>
            {n.children.length>0 ? (isOpen ? '▾' : '▸') : '·'}
          </button>
          <div style={{ cursor:'pointer', flex:1 }} onClick={()=>setCurrentDeptId(n.id)}>
            <b>{n.name}</b>{n.code ? <span style={{ color:'#6b7280' }}> — {n.code}</span> : null}
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('SL','Cnt')}: {countPerDept[n.id] || '-'}</div>
        </div>
        {isOpen && n.children.map(ch => <DeptTree key={ch.id} n={ch} depth={depth+1} />)}
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:12, padding:12 }}>
      {/* Left: Employees */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Nhân sự','Employees')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#6b7280' }}>
              <input type="checkbox" checked={unassignedOnly} onChange={e=>{ setUnassignedOnly(e.target.checked); setEmpOffset(0); }} /> {t('Chưa gán','Unassigned only')}
            </label>
          </div>
        </div>

        {/* Filters & actions */}
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <input value={empSearch} onChange={e=>{ setEmpSearch(e.target.value); setEmpOffset(0); }} placeholder={t('Tìm tên/email/chức danh...','Search name/email/title...')}
                   style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={bulkUnassign} disabled={selectedEmpIds.length===0} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff', opacity:selectedEmpIds.length===0?0.6:1 }}>{t('Bỏ gán','Unassign')}</button>
              <button onClick={bulkAssign} disabled={selectedEmpIds.length===0} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 8px', opacity:selectedEmpIds.length===0?0.6:1 }}>{t('Gán vào...','Assign to...')}</button>
            </div>
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mẹo: giữ Shift khi kéo để kéo nhiều (theo danh sách đã chọn).','Tip: hold Shift while dragging to move multiple (selected list).')}</div>
        </div>

        {/* List */}
        <div style={{ overflow:'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:8, width:34 }}>
                  <input type="checkbox" onChange={e=>toggleAllEmp(e.target.checked)} checked={selectedEmpIds.length>0 && empRows.every(r=>selectedEmpIds.includes(r.id))} />
                </th>
                <th style={{ textAlign:'left', padding:8 }}>{t('Họ tên','Name')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Email','Email')}</th>
                <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Chức danh','Title')}</th>
                <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Phòng ban','Department')}</th>
              </tr>
            </thead>
            <tbody>
              {empRows.length===0 && <tr><td colSpan={5} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
              {empRows.map(e => (
                <tr key={e.id} draggable onDragStart={ev=>onDragStartCard(ev, e.id)} style={{ borderTop:'1px solid #f1f5f9', background: selectedEmpIds.includes(e.id) ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding:8 }}>
                    <input type="checkbox" checked={selectedEmpIds.includes(e.id)} onChange={ev=>toggleEmp(e.id, ev.target.checked)} />
                  </td>
                  <td style={{ padding:8 }}>
                    <div style={{ fontWeight:700 }}>{e.name}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{e.active ? t('Đang làm','Active') : t('Nghỉ việc','Inactive')}</div>
                  </td>
                  <td style={{ padding:8 }}>{e.email}</td>
                  <td style={{ padding:8 }}>{e.title || '—'}</td>
                  <td style={{ padding:8 }}>
                    <span title={e.dept_id || ''}>{deptName(e.dept_id) || <i style={{ color:'#6b7280' }}>{t('Chưa gán','Unassigned')}</i>}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
          <div>{t('Trang','Page')} {Math.floor(empOffset/empLimit)+1}/{Math.max(1, Math.ceil(empTotal/empLimit))} — {t('Tổng','Total')}: {empTotal}</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <label>{t('Hiển thị','Show')}</label>
            <select value={empLimit} onChange={e=>{ setEmpLimit(Number(e.target.value)); setEmpOffset(0); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
            <button onClick={()=>setEmpOffset(o=>Math.max(0, o - empLimit))} disabled={empOffset===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: empOffset===0?0.5:1 }}>Prev</button>
            <button onClick={()=>setEmpOffset(o=>Math.min((Math.max(1, Math.ceil(empTotal/empLimit))-1)*empLimit, o + empLimit))} disabled={empOffset + empLimit >= empTotal} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: empOffset+empLimit>=empTotal?0.5:1 }}>Next</button>
          </div>
        </div>
      </section>

      {/* Right: Departments + History */}
      <section style={{ display:'grid', gridTemplateRows:'1fr 260px', gap:12 }}>
        {/* Departments */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>{t('Phòng ban (Drop vào đây để gán)','Departments (Drop here to assign)')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mẹo: thả vào bất kỳ node để gán vào node đó.','Tip: drop onto any node to assign to that node.')}</div>
          </div>
          <div style={{ padding:10, overflow:'auto', maxHeight:'calc(100vh - 280px)' }}>
            {deptRoot && <DeptTree n={deptRoot} depth={0} />}
          </div>
        </div>

        {/* History */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>{t('Lịch sử gán phòng ban','Assignment history')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onExportHistory} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
            </div>
          </div>
          <div style={{ overflow:'auto', maxHeight: 220 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Thời gian','Time')}</th>
                  <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Người thao tác','Actor')}</th>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Nhân viên','Employee')}</th>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Từ','From')}</th>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Đến','To')}</th>
                </tr>
              </thead>
              <tbody>
                {histRows.length===0 && <tr><td colSpan={5} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                {histRows.map(h => (
                  <tr key={h.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:8 }}>{new Date(h.ts).toLocaleString()}</td>
                    <td style={{ padding:8 }}>{h.actor}</td>
                    <td style={{ padding:8 }}>{h.employee_name}</td>
                    <td style={{ padding:8 }}>{deptName(h.from_dept)}</td>
                    <td style={{ padding:8 }}>{deptName(h.to_dept)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* History pagination */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
            <div>{t('Trang','Page')} {Math.floor(histOffset/histLimit)+1}/{Math.max(1, Math.ceil(histTotal/histLimit))} — {t('Tổng','Total')}: {histTotal}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <label>{t('Hiển thị','Show')}</label>
              <select value={histLimit} onChange={e=>{ setHistLimit(Number(e.target.value)); setHistOffset(0); }}>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <button onClick={()=>setHistOffset(o=>Math.max(0, o - histLimit))} disabled={histOffset===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: histOffset===0?0.5:1 }}>Prev</button>
              <button onClick={()=>setHistOffset(o=>Math.min((Math.max(1, Math.ceil(histTotal/histLimit))-1)*histLimit, o + histLimit))} disabled={histOffset + histLimit >= histTotal} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: histOffset+histLimit>=histTotal?0.5:1 }}>Next</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
