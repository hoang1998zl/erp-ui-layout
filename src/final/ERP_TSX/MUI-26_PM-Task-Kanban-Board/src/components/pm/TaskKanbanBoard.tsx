// src/components/pm/TaskKanbanBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  listTasks, moveTask, upsertTask, deleteTask, listEmployees, listProjects, getBoardConfig, saveBoardConfig, exportCSV,
  type Task, type Employee, type Project, type BoardConfig, statuses
} from '../../mock/tasks';

type SwimKey = BoardConfig['swimlane'];
type StatusKey = Task['status'];

const statusMeta: Record<StatusKey, { vi: string; en: string; color: string }> = {
  backlog:     { vi:'Backlog',     en:'Backlog',     color:'#e5e7eb' },
  todo:        { vi:'To do',       en:'To do',       color:'#bfdbfe' },
  in_progress: { vi:'Đang làm',    en:'In progress', color:'#fde68a' },
  review:      { vi:'Review',      en:'Review',      color:'#c7d2fe' },
  done:        { vi:'Hoàn tất',    en:'Done',        color:'#bbf7d0' },
};

const priMeta: Record<NonNullable<Task['priority']>, { vi: string; en: string }> = {
  low: { vi: 'Thấp', en: 'Low' },
  medium: { vi: 'Trung bình', en: 'Medium' },
  high: { vi: 'Cao', en: 'High' },
  urgent: { vi: 'Khẩn', en: 'Urgent' },
};

export const TaskKanbanBoard: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  // data
  const [emps, setEmps] = useState<Employee[]>([]);
  const [projs, setProjs] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cfg, setCfg] = useState<BoardConfig | null>(null);
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('');
  const [project, setProject] = useState('');
  const [prio, setPrio] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refresh, setRefresh] = useState(0);

  const load = async () => {
    const res = await listTasks({ search: search||undefined, assignee_id: assignee||undefined, project_id: project||undefined, priority: prio? [prio as any] : undefined, due_from: dateFrom||undefined, due_to: dateTo||undefined });
    setTasks(res.rows);
  };
  const loadMeta = async () => {
    setEmps(await listEmployees({ active_only: true }));
    setProjs(await listProjects());
    setCfg(await getBoardConfig());
  }
  useEffect(()=>{ loadMeta(); }, []);
  useEffect(()=>{ load(); }, [search, assignee, project, prio, dateFrom, dateTo, refresh]);

  const swim: SwimKey = cfg?.swimlane || 'none';

  // swimlane buckets
  const swimBuckets = useMemo(()=>{
    const none = { key:'__none__', label: t('Tất cả','All') };
    if (swim==='assignee') {
      const uniq = new Map<string, string>();
      tasks.forEach(tk => { if (tk.assignee_id) uniq.set(tk.assignee_id, emps.find(e=>e.id===tk.assignee_id)?.name || tk.assignee_id); });
      return [none, ...Array.from(uniq.entries()).map(([k,v])=>({ key:k, label:v }))];
    }
    if (swim==='priority') {
      const uniq = new Set(tasks.map(tk => tk.priority || 'medium'));
      return [none, ...Array.from(uniq).map(k => ({ key: String(k), label: priMeta[k as keyof typeof priMeta]?.[locale] || String(k) }))];
    }
    if (swim==='project') {
      const uniq = new Map<string, string>();
      tasks.forEach(tk => { if (tk.project_id) uniq.set(tk.project_id, projs.find(p=>p.id===tk.project_id)?.name || tk.project_id); });
      return [none, ...Array.from(uniq.entries()).map(([k,v])=>({ key:k, label:v }))];
    }
    return [none];
  }, [swim, tasks, emps, projs, locale]);

  const filteredBySwim = (laneKey: string) => (tk: Task) => {
    if (laneKey==='__none__') return true;
    if (swim==='assignee') return tk.assignee_id===laneKey;
    if (swim==='priority') return (tk.priority||'')===laneKey;
    if (swim==='project') return (tk.project_id||'')===laneKey;
    return true;
  };

  // WIP helpers
  const wip = cfg?.wip || { backlog:null,todo:null,in_progress:null,review:null,done:null };
  const hardBlock = !!cfg?.hard_block;
  const countIn = (status: StatusKey, laneKey: string) => tasks.filter(tk => tk.status===status && filteredBySwim(laneKey)(tk)).length;
  const overWIP = (status: StatusKey, laneKey: string) => (wip[status]!==null && countIn(status, laneKey) > (wip[status]||0));

  // DnD
  const dragged = useRef<Task | null>(null);
  const onDragStart = (e: React.DragEvent, tk: Task) => { dragged.current = tk; e.dataTransfer.setData('text/plain', tk.id); e.dataTransfer.effectAllowed='move'; };
  const onDropTo = async (e: React.DragEvent, toStatus: StatusKey, laneKey: string) => {
    e.preventDefault();
    if (!dragged.current) return;
    if (hardBlock && wip[toStatus]!==null && countIn(toStatus, laneKey) >= (wip[toStatus]||0)) {
      alert(t('Vượt WIP limit của cột','Exceeds column WIP limit'));
      return;
    }
    await moveTask(dragged.current.id, toStatus, Date.now());
    dragged.current = null;
    setRefresh(x=>x+1);
  };
  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect='move'; };

  // Card helpers
  const assName = (id?:string) => emps.find(e=>e.id===id)?.name || (id ? id : t('Chưa giao','Unassigned'));
  const projName = (id?:string) => projs.find(p=>p.id===id)?.name || (id ? id : '—');
  const dueStyle = (iso?:string) => {
    if (!iso) return { color:'#6b7280' };
    const today = new Date().toISOString().slice(0,10);
    if (iso < today) return { color:'#ef4444' };
    return { color:'#111827' };
  };

  // CRUD
  const quickAdd = async (status: StatusKey) => {
    const title = prompt(t('Tiêu đề công việc','Task title'));
    if (!title) return;
    await upsertTask({ title, status });
    setRefresh(x=>x+1);
  };
  const openEdit = async (tk?: Task) => {
    const title = prompt(t('Tiêu đề','Title'), tk?.title || '');
    if (!title) return;
    const descr = prompt(t('Mô tả','Description'), tk?.description || '');
    const pr = prompt(t('Ưu tiên (low|medium|high|urgent)','Priority (low|medium|high|urgent)'), tk?.priority || 'medium') as Task['priority'];
    const due = prompt(t('Hạn (YYYY-MM-DD)','Due (YYYY-MM-DD)'), tk?.due_date || '');
    const ass = prompt(t('Assignee_id (demo nhập id)','Assignee_id (demo id)'), tk?.assignee_id || '');
    await upsertTask({ id: tk?.id, title, description: descr||'', priority: pr, due_date: due||undefined, assignee_id: ass||undefined });
    setRefresh(x=>x+1);
  };
  const delTask = async (id: string) => {
    if (!confirm(t('Xoá công việc này?','Delete this task?'))) return;
    await deleteTask(id); setRefresh(x=>x+1);
  };

  const onExport = async () => {
    const blob = await exportCSV({ search: search||undefined, assignee_id: assignee||undefined, project_id: project||undefined, priority: prio? [prio as any] : undefined, due_from: dateFrom||undefined, due_to: dateTo||undefined });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='tasks.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const saveWip = async (status: StatusKey, value: string) => {
    const lim = value==='' ? null : Math.max(0, Number(value));
    const next = { ...(cfg||{ swimlane:'none', wip: { backlog:null,todo:null,in_progress:null,review:null,done:null }, hard_block:false }) };
    next.wip[status] = (Number.isNaN(lim) ? null : lim) as any;
    await saveBoardConfig(next); setCfg(next);
  };
  const setSwim = async (key: SwimKey) => { const next = { ...(cfg||{ swimlane:'none', wip: { backlog:null,todo:null,in_progress:null,review:null,done:null }, hard_block:false }) }; next.swimlane = key; await saveBoardConfig(next); setCfg(next); };
  const toggleHard = async (v: boolean) => { const next = { ...(cfg||{ swimlane:'none', wip: { backlog:null,todo:null,in_progress:null,review:null,done:null }, hard_block:false }) }; next.hard_block = v; await saveBoardConfig(next); setCfg(next); };

  // Layout: grid with swimlanes vertically and statuses as columns
  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:800 }}>{t('Bảng Kanban công việc','Task Kanban board')}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Filters & Config */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gap:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(4, 1fr) 1fr auto', gap:8 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm tiêu đề/mô tả/nhãn...','Search title/description/labels...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <select value={assignee} onChange={e=>setAssignee(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Assignee','Assignee')}</option>
            {emps.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={project} onChange={e=>setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Dự án','Project')}</option>
            {projs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={prio} onChange={e=>setPrio(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Ưu tiên','Priority')}</option>
            {(['low','medium','high','urgent'] as const).map(k => <option key={k} value={k}>{priMeta[k][locale]}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span>{t('Swimlane','Swimlane')}:</span>
              <select value={swim} onChange={e=>setSwim(e.target.value as SwimKey)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="none">{t('Không','None')}</option>
                <option value="assignee">{t('Theo người phụ trách','By assignee')}</option>
                <option value="priority">{t('Theo ưu tiên','By priority')}</option>
                <option value="project">{t('Theo dự án','By project')}</option>
              </select>
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6 }} title={t('Chặn kéo nếu vượt WIP','Block move if exceeding WIP')}>
              <input type="checkbox" checked={hardBlock} onChange={e=>toggleHard(e.target.checked)} />
              {t('Hard WIP','Hard WIP')}
            </label>
          </div>
        </div>
        {/* WIP controls */}
        <div style={{ display:'flex', gap:8, alignItems:'center', color:'#6b7280' }}>
          <span>{t('Giới hạn WIP (mỗi cột)','WIP limits (per column)')}:</span>
          {(Object.keys(statusMeta) as StatusKey[]).map(st => (
            <label key={st} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:100 }}>{statusMeta[st][locale]}</span>
              <input type="number" min={0} placeholder="∞" value={wip[st]===null?'':String(wip[st]||0)} onChange={e=>saveWip(st, e.target.value)} style={{ width:80, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px' }} />
            </label>
          ))}
        </div>
      </div>

      {/* Board */}
      <section style={{ display:'grid', gap:12, gridAutoRows:'minmax(220px, auto)' }}>
        {swimBuckets.map(lane => (
          <div key={lane.key} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:800 }}>{t('Lane','Lane')}: {lane.label}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Kéo‑thả thẻ giữa các cột','Drag cards between columns')}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, padding:12, overflowX:'auto' }}>
              {(Object.keys(statusMeta) as StatusKey[]).map(st => {
                const colTasks = tasks.filter(tk => tk.status===st && filteredBySwim(lane.key)(tk));
                const over = overWIP(st, lane.key);
                return (
                  <div key={st} onDragOver={allowDrop} onDrop={e=>onDropTo(e, st, lane.key)}
                       style={{ border:'1px solid #e5e7eb', borderRadius:12, background: over? '#fff1f2' : '#f8fafc', minHeight:220, display:'grid', gridTemplateRows:'auto 1fr auto' }}>
                    <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', background: statusMeta[st].color }}>
                      <div style={{ fontWeight:800 }}>{statusMeta[st][locale]}</div>
                      <div style={{ color:'#374151' }}>{colTasks.length}{wip[st]!==null?`/${wip[st]}`:''}</div>
                    </div>
                    <div style={{ padding:10, display:'grid', gap:8, alignContent:'start' }}>
                      {colTasks.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>—</div>}
                      {colTasks.map(tk => (
                        <div key={tk.id} draggable onDragStart={e=>onDragStart(e, tk)}
                             style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                            <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tk.title}</div>
                            <div style={{ display:'flex', gap:6 }}>
                              {tk.priority && <span title={priMeta[tk.priority][locale]} style={{ fontSize:12, border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 6px' }}>{priMeta[tk.priority][locale][0]}</span>}
                              <button onClick={()=>openEdit(tk)} title={t('Sửa','Edit')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>✎</button>
                              <button onClick={()=>delTask(tk.id)} title={t('Xoá','Delete')} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'2px 6px', background:'#fff' }}>✕</button>
                            </div>
                          </div>
                          <div style={{ color:'#6b7280', fontSize:12, display:'flex', gap:8, marginTop:4 }}>
                            <span title={t('Người phụ trách','Assignee')}>{assName(tk.assignee_id)}</span>
                            <span>•</span>
                            <span title={t('Dự án','Project')}>{projName(tk.project_id)}</span>
                          </div>
                          <div style={{ color:'#6b7280', fontSize:12, display:'flex', gap:8, marginTop:4 }}>
                            <span title={t('Hạn','Due')} style={dueStyle(tk.due_date)}>{tk.due_date || '—'}</span>
                            <span>•</span>
                            <span title={t('Ước tính','Estimate')}>{tk.estimate_hours||0}h</span>
                            <span>•</span>
                            <span title={t('Đã log','Logged')}>{tk.logged_hours||0}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:10, borderTop:'1px solid #e5e7eb' }}>
                      <button onClick={()=>quickAdd(st)} style={{ border:'1px dashed #9ca3af', borderRadius:8, padding:'6px 8px', background:'#fff', width:'100%' }}>＋ {t('Thêm công việc','Add task')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
