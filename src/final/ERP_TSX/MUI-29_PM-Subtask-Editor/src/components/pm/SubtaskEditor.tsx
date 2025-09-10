// src/components/pm/SubtaskEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listTree, upsertNode, deleteNode, moveNode, reorderUp, reorderDown, indentNode, outdentNode, toggleDone,
  listEmployees, migrateFromFlat, importJSON, exportJSON, bulkAdd, type TreeNode
} from '../../mock/subtree';

type SubtaskEditorProps = {
  taskId: string;
  locale?: 'vi'|'en';
};

export const SubtaskEditor: React.FC<SubtaskEditorProps> = ({ taskId, locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [emps, setEmps] = useState<Array<{id:string;name:string}>>([]);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const load = async () => {
    const rows = await listTree(taskId);
    setTree(rows);
  };
  const loadMeta = async () => {
    const es = await listEmployees();
    setEmps(es.map(e => ({ id:e.id, name:e.name })));
  };
  useEffect(()=>{ loadMeta(); }, []);
  useEffect(()=>{ load(); }, [taskId]);

  const filtered = useMemo(()=>{
    if (!filter.trim()) return tree;
    const kw = filter.toLowerCase();
    const match = (n: TreeNode): boolean => n.title.toLowerCase().includes(kw) || (n.children||[]).some(match);
    const prune = (arr: TreeNode[]): TreeNode[] => arr.filter(match).map(n => ({ ...n, children: prune(n.children || []) }));
    return prune(tree);
  }, [tree, filter]);

  const progress = useMemo(()=>{
    let total=0, done=0;
    const walk = (arr: TreeNode[]) => arr.forEach(n=>{ total++; if (n.done) done++; walk(n.children||[]); });
    walk(tree);
    const pct = total? Math.round(done*100/total) : 0;
    return { total, done, pct };
  }, [tree]);

  // helpers
  const saveToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 1200); };

  const NodeRow: React.FC<{ n: TreeNode; depth: number; index: number; parentId: string | null }> = ({ n, depth, index, parentId }) => {
    const [title, setTitle] = useState(n.title);
    useEffect(()=>{ setTitle(n.title); }, [n.title]);

    const onBlurTitle = async () => {
      if (title!==n.title) { await upsertNode(n.task_id, { id: n.id, title }); await load(); saveToast(t('Đã lưu','Saved')); }
    };
    const onChangeAss = async (id: string) => { await upsertNode(n.task_id, { id: n.id, assignee_id: id||undefined }); await load(); };
    const onChangeDue = async (d: string) => { await upsertNode(n.task_id, { id: n.id, due_date: d||undefined }); await load(); };
    const onChangeEst = async (v: string) => { await upsertNode(n.task_id, { id: n.id, estimate_hours: Number(v||0) }); await load(); };

    return (
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 170px 120px 120px auto', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9', background: n.done ? '#f0fdf4' : '#fff' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={async ()=>{ await upsertNode(n.task_id, { parent_id: n.id, title: t('Mục con','Child item') }); await load(); }} title={t('Thêm con','Add child')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>＋</button>
          <input type="checkbox" checked={n.done} onChange={async e=>{ await toggleDone(n.task_id, n.id, e.target.checked); await load(); }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center' }}>
          <div style={{ width: depth*16 }}></div>
          <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={onBlurTitle}
                 style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', textDecoration: n.done ? 'line-through' : 'none' }} />
        </div>
        <select value={n.assignee_id||''} onChange={e=>onChangeAss(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          <option value="">{t('Assignee','Assignee')}</option>
          {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={n.due_date||''} onChange={e=>onChangeDue(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <input type="number" min={0} step={0.5} value={n.estimate_hours||0} onChange={e=>onChangeEst(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <button onClick={async ()=>{ await reorderUp(n.task_id, n.id); await load(); }} title="Up" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↑</button>
          <button onClick={async ()=>{ await reorderDown(n.task_id, n.id); await load(); }} title="Down" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↓</button>
          <button onClick={async ()=>{ await indentNode(n.task_id, n.id); await load(); }} title={t('Thụt vào (làm con của mục trước)','Indent (child of previous)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>⮕</button>
          <button onClick={async ()=>{ await outdentNode(n.task_id, n.id); await load(); }} title={t('Thụt ra (đưa lên cấp trên)','Outdent (move up one level)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>⮔</button>
          <button onClick={async ()=>{ if(confirm(t('Xoá mục này và mọi mục con?','Delete this and its children?'))) { await deleteNode(n.task_id, n.id); await load(); } }} title={t('Xoá','Delete')} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'2px 6px', background:'#fff' }}>✕</button>
        </div>
      </div>
    );
  };

  const renderTree = (arr: TreeNode[], depth=0, parentId: string | null = null) => {
    return arr.map((n, idx) => (
      <React.Fragment key={n.id}>
        <NodeRow n={n} depth={depth} index={idx} parentId={parentId} />
        {(n.children||[]).length>0 && renderTree(n.children, depth+1, n.id)}
      </React.Fragment>
    ));
  };

  const expandAll = async () => { setCollapsed(false); };
  const collapseAll = async () => { setCollapsed(true); };

  const onBulkAdd = async () => {
    const text = prompt(t('Nhập danh sách (mỗi dòng một mục, dùng tab hoặc 2 spaces để thụt vào)','Enter list (one per line, use tab or 2 spaces to indent)'));
    if (!text) return;
    const n = await bulkAdd(taskId, text);
    await load();
    saveToast(t('Đã thêm','Added') + ` ${n}`);
  };

  const onImport = async () => {
    const json = prompt(t('Dán JSON tree (mảng các node: {title, children})','Paste JSON tree (array of nodes: {title, children})'));
    if (!json) return;
    try {
      const n = await importJSON(taskId, json);
      await load();
      saveToast(t('Đã nhập','Imported') + ` ${n}`);
    } catch (e:any) {
      alert('Invalid JSON');
    }
  };
  const onExport = async () => {
    const blob = await exportJSON(taskId);
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='subtasks.json'; a.click(); URL.revokeObjectURL(url);
  };

  const migrate = async () => {
    const n = await migrateFromFlat(taskId);
    if (n>0) { await load(); saveToast(t('Đã migrate từ Subtasks cũ','Migrated from old Subtasks')); }
    else alert(t('Không có dữ liệu subtask cũ để migrate','No old subtasks to migrate'));
  };

  const sumEstimate = (arr: TreeNode[]): number => arr.reduce((s,n)=> s + (n.estimate_hours||0) + sumEstimate(n.children||[]), 0);

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr auto', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800 }}>{t('Trình soạn Subtasks (lồng N cấp)','Subtask Editor (nested N levels)')}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onBulkAdd} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Bulk add','Bulk add')}</button>
          <button onClick={migrate} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Migrate từ PM‑04','Migrate from PM‑04')}</button>
          <button onClick={onImport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Import JSON</button>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Lọc theo tiêu đề...','Filter by title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:220, height:10, background:'#e5e7eb', borderRadius:999, overflow:'hidden' }}>
            <div style={{ width: `${progress.pct}%`, height: '100%', background:'#22c55e' }}></div>
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{progress.done}/{progress.total} • {progress.pct}%</div>
          <button onClick={expandAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Mở hết','Expand')}</button>
          <button onClick={collapseAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thu gọn','Collapse')}</button>
          <button onClick={async ()=>{ await upsertNode(taskId, { parent_id: null, title: t('Mục mới','New item') }); await load(); }} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm mục gốc','Add root')}</button>
        </div>
      </div>

      {/* Header row */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 170px 120px 120px auto', gap:8, padding:'6px 8px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
        <div></div>
        <div style={{ fontWeight:700 }}>{t('Tiêu đề','Title')}</div>
        <div style={{ fontWeight:700 }}>{t('Assignee','Assignee')}</div>
        <div style={{ fontWeight:700 }}>{t('Hạn','Due')}</div>
        <div style={{ fontWeight:700 }}>{t('Ước tính (h)','Estimate (h)')}</div>
        <div style={{ fontWeight:700, textAlign:'right' }}>{t('Thao tác','Actions')}</div>
      </div>

      {/* Body */}
      <div style={{ overflow:'auto' }}>
        {filtered.length===0
          ? <div style={{ padding:12, color:'#6b7280' }}>—</div>
          : renderTree(filtered, 0, null)
        }
      </div>

      {/* Footer */}
      <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#6b7280' }}>
        <div>{t('Tổng ước tính','Total estimate')}: {sumEstimate(tree)}h</div>
        <div>{toast || ' '}</div>
      </div>
    </div>
  );
};
