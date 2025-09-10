// src/components/pm/WbsEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listProjects, listTeam, listWbs, upsertNode, deleteNode, reorderUp, reorderDown, indentNode, outdentNode,
  importFromSubtask, exportCSV, exportJSON, type TreeNode, type WbsNode, type WbsType
} from '../../mock/wbs';

type WbsEditorProps = {
  projectId?: string;
  locale?: 'vi'|'en';
};

const typeLabels: Record<WbsType, { vi: string; en: string }> = {
  phase: { vi:'Giai đoạn', en:'Phase' },
  deliverable: { vi:'Sản phẩm bàn giao', en:'Deliverable' },
  work_package: { vi:'Gói công việc', en:'Work package' },
  task: { vi:'Công việc', en:'Task' },
  milestone: { vi:'Mốc', en:'Milestone' },
};

export const WbsEditor: React.FC<WbsEditorProps> = ({ projectId, locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>(projectId || '');
  const [team, setTeam] = useState<Array<{id:string;name:string}>>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(projectId || ps[0]?.id || ''); }); }, [projectId]);
  useEffect(()=>{ (async () => { if (!pid) return; setTeam((await listTeam(pid)).map(e=>({ id:e.id, name:e.name }))); setTree(await listWbs(pid)); })(); }, [pid]);

  const reload = async () => { if (!pid) return; setTree(await listWbs(pid)); };
  const saveToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 1200); };

  const filtered = useMemo(()=>{
    if (!filter.trim()) return tree;
    const kw = filter.toLowerCase();
    const match = (n: TreeNode): boolean => (n.name+' '+n.code).toLowerCase().includes(kw) || (n.children||[]).some(match);
    const prune = (arr: TreeNode[]): TreeNode[] => arr.filter(match).map(n => ({ ...n, children: prune(n.children || []) }));
    return prune(tree);
  }, [tree, filter]);

  const sumEffort = (arr: TreeNode[]) => arr.reduce((s,n)=> s + (n.rollup?.effort_hours || n.effort_hours || 0), 0);
  const sumCost = (arr: TreeNode[]) => arr.reduce((s,n)=> s + (n.rollup?.cost || n.cost || 0), 0);
  const overallPct = useMemo(()=>{
    const eff = sumEffort(tree);
    if (!eff) return 0;
    const weighted = tree.reduce((s,n)=> s + ((n.rollup?.percent_complete||n.percent_complete||0)/100) * (n.rollup?.effort_hours || n.effort_hours || 0), 0);
    return Math.round(weighted * 100 / eff);
  }, [tree]);

  const NodeRow: React.FC<{ n: TreeNode; depth: number }> = ({ n, depth }) => {
    const [name, setName] = useState(n.name);
    const [type, setType] = useState<WbsType>(n.type);
    const [owner, setOwner] = useState(n.owner_id||'');
    const [sd, setSd] = useState(n.start_date||'');
    const [fd, setFd] = useState(n.finish_date||'');
    const [eff, setEff] = useState(String(n.effort_hours||0));
    const [cost, setCost] = useState(String(n.cost||0));
    const [pct, setPct] = useState(String(n.percent_complete||0));
    const [status, setStatus] = useState(n.status || 'not_started');
    const [pred, setPred] = useState<string[]>(n.predecessors || []);

    useEffect(()=>{
      setName(n.name); setType(n.type); setOwner(n.owner_id||''); setSd(n.start_date||''); setFd(n.finish_date||'');
      setEff(String(n.effort_hours||0)); setCost(String(n.cost||0)); setPct(String(n.percent_complete||0)); setStatus(n.status||'not_started'); setPred(n.predecessors||[]);
    }, [n.id]);

    const save = async () => {
      await upsertNode(n.project_id, { id: n.id, name, type, owner_id: owner||undefined, start_date: sd||undefined, finish_date: fd||undefined, effort_hours: Number(eff||0), cost: Number(cost||0), percent_complete: Math.max(0, Math.min(100, Number(pct||0))), status: status as any, predecessors: pred });
      await reload();
      saveToast(t('Đã lưu','Saved'));
    };

    const addChild = async () => { await upsertNode(n.project_id, { parent_id: n.id, name: t('Mục con','Child item'), type: 'task' }); await reload(); };
    const addSibling = async () => { await upsertNode(n.project_id, { parent_id: n.parent_id || null, name: t('Mục ngang cấp','Sibling item'), type: 'task' }); await reload(); };

    const deleteMe = async () => { if (!confirm(t('Xoá mục này và toàn bộ cấp dưới?','Delete this and all descendants?'))) return; await deleteNode(n.project_id, n.id); await reload(); };

    const allOptions = useMemo(()=>{
      // list of all other nodes for predecessors
      const flat: Array<{id:string;label:string}> = [];
      const walk = (arr: TreeNode[]) => arr.forEach(x => { flat.push({ id: x.id, label: `${x.code} ${x.name}` }); walk(x.children||[]); });
      walk(tree);
      return flat.filter(x => x.id!==n.id);
    }, [tree, n.id]);

    const togglePred = (id: string) => setPred(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

    return (
      <div style={{ display:'grid', gridTemplateColumns:'auto auto 1fr 140px 140px 120px 120px 100px 140px auto', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9', background:'#fff' }}>
        <div style={{ width: 28, textAlign:'right' }}>{n.code}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={addChild} title={t('Thêm con','Add child')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>＋</button>
          <button onClick={addSibling} title={t('Thêm ngang cấp','Add sibling')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>＋＋</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center' }}>
          <div style={{ width: depth*16 }}></div>
          <input value={name} onChange={e=>setName(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </div>
        <select value={type} onChange={e=>{ setType(e.target.value as WbsType); }} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {(Object.keys(typeLabels) as WbsType[]).map(k => <option key={k} value={k}>{typeLabels[k][locale]}</option>)}
        </select>
        <select value={owner} onChange={e=>{ setOwner(e.target.value); }} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('— Owner —','— Owner —')}</option>
          {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date" value={sd} onChange={e=>setSd(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <input type="date" value={fd} onChange={e=>setFd(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <input type="number" min={0} step={0.5} value={eff} onChange={e=>setEff(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <input type="number" min={0} step={0.01} value={cost} onChange={e=>setCost(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'center' }}>
          <input type="number" min={0} max={100} value={pct} onChange={e=>setPct(e.target.value)} onBlur={save} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <span>%</span>
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <button onClick={async ()=>{ await reorderUp(n.project_id, n.id); await reload(); }} title="Up" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↑</button>
          <button onClick={async ()=>{ await reorderDown(n.project_id, n.id); await reload(); }} title="Down" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↓</button>
          <button onClick={async ()=>{ await indentNode(n.project_id, n.id); await reload(); }} title={t('Thụt vào','Indent')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>⮕</button>
          <button onClick={async ()=>{ await outdentNode(n.project_id, n.id); await reload(); }} title={t('Thụt ra','Outdent')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>⮔</button>
          <button onClick={deleteMe} title={t('Xoá','Delete')} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'2px 6px', background:'#fff' }}>✕</button>
        </div>

        {/* Second row: predecessors selector & rollups */}
        <div style={{ gridColumn: '1 / -1', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:8, alignItems:'center', background:'#f9fafb', borderRadius:8, padding:'6px 8px', marginTop:4 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tiền nhiệm','Predecessors')}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {allOptions.map(o => (
              <label key={o.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="checkbox" checked={pred.includes(o.id)} onChange={()=>{ togglePred(o.id); }} onBlur={save} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>
            {t('Tổng Effort','Total Effort')}: {n.rollup?.effort_hours || n.effort_hours || 0}h • {t('% HT','% Complete')}: {n.rollup?.percent_complete ?? n.percent_complete ?? 0}%
          </div>
        </div>
      </div>
    );
  };

  const renderTree = (arr: TreeNode[], depth=0) => arr.map(n => (
    <React.Fragment key={n.id}>
      <NodeRow n={n} depth={depth} />
      {(n.children||[]).length>0 && renderTree(n.children, depth+1)}
    </React.Fragment>
  ));

  const seedFromSub = async () => {
    if (!pid) return;
    const n = await importFromSubtask(pid);
    if (n>0) { await reload(); saveToast(t('Đã import từ Subtasks','Imported from Subtasks')); }
    else alert(t('Không có dữ liệu Subtasks (PM‑06) để import hoặc WBS đã tồn tại.','No Subtasks (PM‑06) data found or WBS already exists.'));
  };

  const onExportCSV = async () => { const blob = await exportCSV(pid); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='wbs.csv'; a.click(); URL.revokeObjectURL(url); };
  const onExportJSON = async () => { const blob = await exportJSON(pid); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='wbs.json'; a.click(); URL.revokeObjectURL(url); };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('WBS (Work Breakdown Structure)','WBS (Work Breakdown Structure)')}</div>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>upsertNode(pid, { parent_id: null, name: t('Mục gốc','Root item'), type: 'phase' }).then(reload)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm mục gốc','Add root')}</button>
          <button onClick={seedFromSub} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Import từ Subtasks (PM‑06)','Import from Subtasks (PM‑06)')}</button>
          <button onClick={onExportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <button onClick={onExportJSON} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button>
        </div>
      </div>

      {/* Filters and KPIs */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Tìm theo mã/tiêu đề...','Search by code/title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'#6b7280' }}>
          <div style={{ width:220, height:10, background:'#e5e7eb', borderRadius:999, overflow:'hidden' }}>
            <div style={{ width: `${overallPct}%`, height: '100%' }}></div>
          </div>
          <div>{t('% hoàn thành chung','Overall % complete')}: {overallPct}%</div>
        </div>
      </div>

      {/* Header row */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#f9fafb', display:'grid', gridTemplateColumns:'auto auto 1fr 140px 140px 120px 120px 100px 140px auto', gap:8, padding:'6px 8px' }}>
        <div style={{ fontWeight:700, textAlign:'right' }}>WBS</div>
        <div></div>
        <div style={{ fontWeight:700 }}>{t('Tên mục','Item name')}</div>
        <div style={{ fontWeight:700 }}>{t('Loại','Type')}</div>
        <div style={{ fontWeight:700 }}>{t('Owner','Owner')}</div>
        <div style={{ fontWeight:700 }}>{t('Bắt đầu','Start')}</div>
        <div style={{ fontWeight:700 }}>{t('Kết thúc','Finish')}</div>
        <div style={{ fontWeight:700 }}>{t('Effort (h)','Effort (h)')}</div>
        <div style={{ fontWeight:700 }}>{t('Chi phí','Cost')}</div>
        <div style={{ fontWeight:700, textAlign:'right' }}>{t('Thao tác','Actions')}</div>
      </div>

      {/* Body */}
      <div style={{ overflow:'auto' }}>
        {filtered.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>—</div> : renderTree(filtered, 0)}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{toast || ' '}</div>
        <div>
          {t('Tổng Effort','Total Effort')}: {sumEffort(tree)}h • {t('Tổng chi phí','Total cost')}: {sumCost(tree).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
