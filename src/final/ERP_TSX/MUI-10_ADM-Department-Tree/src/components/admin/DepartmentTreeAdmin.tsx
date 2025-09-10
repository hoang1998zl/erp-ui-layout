// src/components/admin/DepartmentTreeAdmin.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  listTree, getById, createDept, updateDept, deleteDept, moveDept, reorderSibling, exportJSON, importJSON,
  type Dept
} from '../../mock/departments';

export type DepartmentTreeAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listTree?: typeof listTree;
    getById?: typeof getById;
    createDept?: typeof createDept;
    updateDept?: typeof updateDept;
    deleteDept?: typeof deleteDept;
    moveDept?: typeof moveDept;
    reorderSibling?: typeof reorderSibling;
    exportJSON?: typeof exportJSON;
    importJSON?: typeof importJSON;
  };
};

type NodeRef = { id: string; parent_id: string | null };

const indent = (level:number) => ({ paddingLeft: 12 + level*18 });

export const DepartmentTreeAdmin: React.FC<DepartmentTreeAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listTree: adapters.listTree || listTree,
    getById: adapters.getById || getById,
    createDept: adapters.createDept || createDept,
    updateDept: adapters.updateDept || updateDept,
    deleteDept: adapters.deleteDept || deleteDept,
    moveDept: adapters.moveDept || moveDept,
    reorderSibling: adapters.reorderSibling || reorderSibling,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };

  const [tree, setTree] = useState<Dept[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fns.listTree();
    setTree(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flat = useMemo(() => {
    const arr: Array<{ node: Dept; level: number; path: string[] }> = [];
    const walk = (nodes: Dept[], level: number, path: string[]) => {
      nodes.forEach(n => {
        arr.push({ node: n, level, path: [...path, n.id] });
        if (n.children && (expanded[n.id] || q)) walk(n.children, level+1, [...path, n.id]);
      });
    };
    walk(tree, 0, []);
    return arr;
  }, [tree, expanded, q]);

  // Filtering: only show nodes that match or are ancestors of matches
  const visible = useMemo(() => {
    if (!q.trim()) return flat;
    const qq = q.toLowerCase();
    const matches = new Set<string>();
    flat.forEach(r => {
      const name = r.node.name.toLowerCase();
      const code = (r.node.code || '').toLowerCase();
      if (name.includes(qq) || code.includes(qq)) r.path.forEach(id => matches.add(id));
    });
    return flat.filter(r => matches.has(r.node.id));
  }, [flat, q]);

  const expandAll = () => {
    const m: Record<string, boolean> = {};
    flat.forEach(r => { m[r.node.id] = true; });
    setExpanded(m);
  };
  const collapseAll = () => setExpanded({});

  // Details state
  const [details, setDetails] = useState<Dept | null>(null);
  useEffect(() => {
    if (!selected) { setDetails(null); return; }
    fns.getById(selected).then(setDetails);
  }, [selected]);

  const onAdd = async (parent: NodeRef | null) => {
    const name = prompt(t('Tên phòng ban','Department name'));
    if (!name) return;
    const out = await fns.createDept({ name, parent_id: parent?.id || null });
    setToast(t('Đã tạo phòng ban','Department created'));
    setExpanded(e => ({ ...e, [parent?.id || '']: true }));
    load();
  };

  const onRename = async (node: NodeRef) => {
    const name = prompt(t('Đổi tên','Rename'), details?.name || '');
    if (!name) return;
    await fns.updateDept(node.id, { name });
    setToast(t('Đã cập nhật','Updated'));
    load();
  };

  const onDelete = async (node: NodeRef) => {
    if (!confirm(t('Xóa phòng ban này? (phải rỗng)','Delete this department? (must be empty)'))) return;
    try {
      await fns.deleteDept(node.id);
      setToast(t('Đã xóa','Deleted'));
      if (selected === node.id) setSelected(null);
      load();
    } catch (e:any) {
      alert(e.message || 'Error');
    }
  };

  const onDragStart = (e: React.DragEvent, node: Dept) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropAsChild = async (target: Dept, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || id === target.id) return;
    await fns.moveDept(id, target.id);
    setToast(t('Đã di chuyển','Moved'));
    setExpanded(m => ({ ...m, [target.id]: true }));
    load();
  };

  const onReorder = async (node: Dept, dir: 'up'|'down') => {
    await fns.reorderSibling(node.id, dir);
    load();
  };

  const onSaveDetails = async () => {
    if (!details) return;
    await fns.updateDept(details.id, { name: details.name, code: details.code, head: details.head });
    setToast(t('Đã lưu thông tin','Saved'));
    load();
  };

  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'departments.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    await fns.importJSON(file);
    load();
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:12, padding:12 }}>
      {/* Left: Tree & toolbar */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:8, alignItems:'center' }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm theo tên/mã...','Search by name/code...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
          <button onClick={expandAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Mở tất cả','Expand all')}</button>
          <button onClick={collapseAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thu tất cả','Collapse')}</button>
          <button onClick={()=>onAdd(null)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Thêm cấp 1','Add top level')}</button>
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          </div>
        </div>

        <div style={{ maxHeight:520, overflow:'auto' }}>
          {loading && <div style={{ padding:12, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</div>}
          {!loading && visible.map(({ node, level }) => {
            const isOpen = !!expanded[node.id];
            const hasChildren = (node.children || []).length > 0;
            return (
              <div key={node.id}
                   onDragOver={onDragOver}
                   onDrop={(e)=>onDropAsChild(node, e)}
                   style={{ display:'grid', gridTemplateColumns:'28px 1fr auto', alignItems:'center', borderBottom:'1px solid #f1f5f9', padding:'4px 6px', background: selected===node.id ? '#eef2ff' : '#fff' }}>
                {/* Toggle */}
                <button onClick={()=>setExpanded(m => ({ ...m, [node.id]: !isOpen }))}
                        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 4px', background:'#fff', fontSize:12 }}>
                  {hasChildren ? (isOpen ? '–' : '+') : '•'}
                </button>

                {/* Node row */}
                <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', ...indent(level) }}
                     draggable
                     onDragStart={(e)=>onDragStart(e, node)}
                     onClick={()=>setSelected(node.id)}>
                  <span title="drag" style={{ cursor:'grab' }}>↕</span>
                  <div>
                    <div style={{ fontWeight:600 }}>{node.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{node.code || '—'}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <button onClick={()=>onReorder(node, 'up')} title={t('Lên','Up')} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', background:'#fff' }}>↑</button>
                  <button onClick={()=>onReorder(node, 'down')} title={t('Xuống','Down')} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', background:'#fff' }}>↓</button>
                  <button onClick={()=>onAdd({ id: node.id, parent_id: node.parent_id })} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', background:'#fff' }}>{t('Thêm con','Add child')}</button>
                  <button onClick={()=>onRename({ id: node.id, parent_id: node.parent_id })} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px', background:'#fff' }}>{t('Đổi tên','Rename')}</button>
                  <button onClick={()=>onDelete({ id: node.id, parent_id: node.parent_id })} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 6px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                </div>
              </div>
            );
          })}
          {!loading && visible.length === 0 && <div style={{ padding:12, color:'#6b7280' }}>{t('Không có kết quả','No results')}</div>}
        </div>
      </section>

      {/* Right: Details panel */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Chi tiết phòng ban','Department details')}</div>
        {!selected && <div style={{ padding:12, color:'#6b7280' }}>{t('Chọn một phòng ban để xem/sửa','Select a department to view/edit')}</div>}
        {selected && details && (
          <div style={{ padding:12, display:'grid', gridTemplateColumns:'140px 1fr', gap:10, alignItems:'center' }}>
            <label style={{ color:'#6b7280' }}>{t('Tên','Name')}</label>
            <input value={details.name} onChange={e=>setDetails({ ...details, name:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            <label style={{ color:'#6b7280' }}>{t('Mã','Code')}</label>
            <input value={details.code || ''} onChange={e=>setDetails({ ...details, code:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            <label style={{ color:'#6b7280' }}>{t('Trưởng bộ phận','Head')}</label>
            <input value={details.head || ''} onChange={e=>setDetails({ ...details, head:e.target.value })} placeholder="email@company.com" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={onSaveDetails} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>{t('Lưu','Save')}</button>
            </div>
          </div>
        )}
      </aside>

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
