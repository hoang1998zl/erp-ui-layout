// src/components/hr/OrgChartManager.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getOrg, addChild, updateNode, moveNode, deleteNode, searchNodes, exportJSON, importJSON, type OrgNode } from '../../mock/org';

export type OrgChartManagerProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getOrg: typeof getOrg;
    addChild: typeof addChild;
    updateNode: typeof updateNode;
    moveNode: typeof moveNode;
    deleteNode: typeof deleteNode;
    searchNodes: typeof searchNodes;
    exportJSON: typeof exportJSON;
    importJSON: typeof importJSON;
  }>;
};

export const OrgChartManager: React.FC<OrgChartManagerProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getOrg: adapters.getOrg || getOrg,
    addChild: adapters.addChild || addChild,
    updateNode: adapters.updateNode || updateNode,
    moveNode: adapters.moveNode || moveNode,
    deleteNode: adapters.deleteNode || deleteNode,
    searchNodes: adapters.searchNodes || searchNodes,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };

  const [root, setRoot] = useState<OrgNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [currentId, setCurrentId] = useState<string>('root');
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const o = await fns.getOrg!();
    setRoot(o);
    if (!o) return;
    if (!currentId) setCurrentId(o.id);
  };
  useEffect(()=>{ reload(); }, []);

  useEffect(()=>{
    let active = true;
    (async () => {
      if (!search) { setHits([]); return; }
      const ids = await fns.searchNodes!(search);
      if (active) setHits(ids);
    })();
    return () => { active=false; };
  }, [search]);

  const findNode = (n: OrgNode | null, id: string, path: OrgNode[] = []): { node: OrgNode | null; path: OrgNode[] } => {
    if (!n) return { node: null, path: [] };
    if (n.id === id) return { node: n, path: path.concat([n]) };
    for (const ch of n.children) {
      const res = findNode(ch, id, path.concat([n]));
      if (res.node) return res;
    }
    return { node: null, path: [] };
  };

  const current = useMemo(()=> findNode(root, currentId), [root, currentId]);
  const breadcrumbs = current.path;

  const toggleExpand = (id: string) => {
    setExpanded(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const expandAll = () => {
    // expand all nodes in current subtree
    const ids: string[] = [];
    const walk = (n: OrgNode) => { ids.push(n.id); n.children.forEach(walk); };
    if (current.node) walk(current.node);
    setExpanded(new Set(ids));
  };
  const collapseAll = () => { setExpanded(new Set(current.node ? [current.node.id] : [])); };

  const onAdd = async (parentId: string) => {
    const name = prompt(t('Tên đơn vị mới:','New unit name:')); if (!name) return;
    const code = prompt(t('Mã (tuỳ chọn):','Code (optional):')) || undefined;
    await fns.addChild!(parentId, { name, code });
    setExpanded(s => new Set([...Array.from(s), parentId]));
    await reload();
  };

  const onRename = async (id: string, curName?: string) => {
    const name = prompt(t('Đổi tên:','Rename:'), curName || ''); if (!name) return;
    await fns.updateNode!(id, { name });
    await reload();
  };

  const onMove = async (id: string) => {
    if (!root) return;
    const dest = prompt(t('Nhập ID cha mới (xem ID bằng hover vào tên).','Enter new parent ID (hover name to see id).'));
    if (!dest) return;
    try { await fns.moveNode!(id, dest); await reload(); }
    catch(e:any){ setErr(e.message || String(e)); setTimeout(()=>setErr(null), 3000); }
  };

  const onDelete = async (id: string, name?: string) => {
    if (!confirm(t('Xoá đơn vị','Delete unit') + ` "${name||''}"?`)) return;
    await fns.deleteNode!(id);
    if (currentId===id) setCurrentId('root');
    await reload();
  };

  const onExport = async () => {
    const text = await fns.exportJSON!();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='orgchart.json'; a.click(); URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    try { await fns.importJSON!(file); await reload(); }
    catch(e:any){ setErr(e.message || String(e)); setTimeout(()=>setErr(null), 3000); }
  };

  const setMeta = async (field: keyof Pick<OrgNode,'code'|'manager'|'headcount'>, value: any) => {
    if (!current.node) return;
    setBusy(true);
    await fns.updateNode!(current.node.id, { [field]: field==='headcount' ? (value?Number(value):undefined) : (value||undefined) } as any);
    await reload();
    setBusy(false);
  };

  const LevelChart: React.FC<{ root: OrgNode }> = ({ root }) => {
    // Build levels with BFS starting from 'root'
    const levels: OrgNode[][] = [];
    const q: Array<{ n: OrgNode, d: number }> = [{ n: root, d: 0 }];
    while (q.length) {
      const { n, d } = q.shift()!;
      if (!levels[d]) levels[d] = [];
      levels[d].push(n);
      n.children.forEach(c => q.push({ n: c, d: d+1 }));
    }
    return (
      <div style={{ display:'grid', gap:16 }}>
        {levels.map((nodes, i) => (
          <div key={i} style={{ display:'flex', gap:12, alignItems:'stretch', flexWrap:'wrap' }}>
            {nodes.map(n => (
              <div key={n.id} onClick={()=>setCurrentId(n.id)}
                   style={{ minWidth:220, flex:'1 1 220px', cursor:'pointer', border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #f1f5f9', fontWeight:700 }} title={n.id}>
                  {n.name}{showCodes && n.code ? ` — ${n.code}` : ''}
                </div>
                <div style={{ padding:10, color:'#6b7280', fontSize:13, display:'flex', justifyContent:'space-between' }}>
                  <span>{t('Quản lý','Manager')}: <b style={{ color:'#111827' }}>{n.manager || '—'}</b></span>
                  <span>{t('Headcount','Headcount')}: <b style={{ color:'#111827' }}>{n.headcount ?? '—'}</b></span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const Tree: React.FC<{ n: OrgNode, depth: number }> = ({ n, depth }) => {
    const isOpen = expanded.has(n.id);
    const isHit = hits.includes(n.id);
    return (
      <div style={{ marginLeft: depth*12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 6px', background: currentId===n.id ? '#eef2ff' : (isHit ? '#fef9c3' : 'transparent'), borderRadius:8 }}>
          <button onClick={()=>toggleExpand(n.id)} title={isOpen? t('Đóng','Collapse') : t('Mở','Expand')} style={{ width:22, height:22, border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>
            {n.children.length>0 ? (isOpen ? '▾' : '▸') : '·'}
          </button>
          <div onClick={()=>setCurrentId(n.id)} title={n.id} style={{ cursor:'pointer', flex:1 }}>
            <b>{n.name}</b>{showCodes && n.code ? <span style={{ color:'#6b7280' }}> — {n.code}</span> : null}
            {typeof n.headcount==='number' && <span style={{ marginLeft:6, fontSize:12, color:'#6b7280' }}>({t('SL','HC')}: {n.headcount})</span>}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>onAdd(n.id)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#fff' }}>＋</button>
            {n.id!=='root' && <button onClick={()=>onRename(n.id, n.name)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#fff' }}>{t('Sửa','Edit')}</button>}
            {n.id!=='root' && <button onClick={()=>onMove(n.id)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#fff' }}>{t('Chuyển','Move')}</button>}
            {n.id!=='root' && <button onClick={()=>onDelete(n.id, n.name)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'2px 6px', background:'#fff' }}>{t('Xoá','Del')}</button>}
          </div>
        </div>
        {isOpen && n.children.map(ch => <Tree key={ch.id} n={ch} depth={depth+1} />)}
      </div>
    );
  };

  if (!root) return <div style={{ padding:12 }}>{t('Đang tải...','Loading...')}</div>;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:12, padding:12 }}>
      {/* Left: Tree + search */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden', height:'calc(100vh - 160px)' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Sơ đồ tổ chức','Org chart')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#6b7280' }}>
              <input type="checkbox" checked={showCodes} onChange={e=>setShowCodes(e.target.checked)} /> {t('Hiện mã','Show codes')}
            </label>
          </div>
        </div>
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:8 }}>
          <input value={search} onChange={e=>{ setSearch(e.target.value); if (e.target.value) expandAll(); }} placeholder={t('Tìm tên/mã/quản lý...','Search name/code/manager...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={expandAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Mở tất cả','Expand all')}</button>
            <button onClick={collapseAll} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Đóng tất cả','Collapse all')}</button>
          </div>
        </div>
        <div style={{ padding:10, overflow:'auto', height:'calc(100% - 116px)' }}>
          <Tree n={current.path[0] || root} depth={0} />
        </div>
      </aside>

      {/* Right: Details + Chart */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        {/* Breadcrumbs & actions */}
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {breadcrumbs.map((b, idx) => (
              <span key={b.id} onClick={()=>setCurrentId(b.id)} style={{ cursor:'pointer', color: idx===breadcrumbs.length-1 ? '#111827' : '#4f46e5', fontWeight: idx===breadcrumbs.length-1 ? 800 : 600 }}>
                {b.name}{showCodes && b.code ? ` (${b.code})` : ''}
                {idx < breadcrumbs.length-1 && <span style={{ color:'#6b7280' }}> / </span>}
              </span>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:12, padding:12 }}>
          {/* Details card */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Chi tiết đơn vị','Unit details')}</div>
            <div style={{ padding:10, display:'grid', gap:10 }}>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tên đơn vị','Name')}</div>
                <input defaultValue={current.node?.name || ''} onBlur={e=>setMeta('name' as any, e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mã','Code')}</div>
                <input defaultValue={current.node?.code || ''} onBlur={e=>setMeta('code' as any, e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Quản lý','Manager')}</div>
                <input defaultValue={current.node?.manager || ''} onBlur={e=>setMeta('manager' as any, e.target.value)} placeholder="Name/Email" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Headcount','Headcount')}</div>
                <input type="number" min={0} defaultValue={current.node?.headcount ?? ''} onBlur={e=>setMeta('headcount' as any, e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'space-between' }}>
                <button onClick={()=>onAdd(current.node!.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Thêm đơn vị con','Add child')}</button>
                {current.node?.id!=='root' && <button onClick={()=>onMove(current.node!.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Chuyển cha','Change parent')}</button>}
                {current.node?.id!=='root' && <button onClick={()=>onDelete(current.node!.id, current.node?.name)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>}
              </div>
              {busy && <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đang lưu...','Saving...')}</div>}
            </div>
          </div>

          {/* Chart */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Sơ đồ (subtree)','Chart (subtree)')}</div>
            <div style={{ padding:10 }}>
              {current.node && <LevelChart root={current.node} />}
            </div>
          </div>
        </div>

        {err && <div style={{ padding:'8px 10px', color:'#ef4444' }}>{err}</div>}
      </section>
    </div>
  );
};
