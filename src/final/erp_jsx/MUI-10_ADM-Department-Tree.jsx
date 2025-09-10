import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== File: src/mock/departments.ts ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});

function seedTree(){
  const mk = (name, children=[])=> ({ id:rid(), name, children });
  return mk('KTEST', [
    mk('Finance', [ mk('Accounts Payable'), mk('Accounts Receivable') ]),
    mk('HR', [ mk('Recruitment'), mk('Payroll') ]),
    mk('R&D', [ mk('Platform'), mk('Data'), mk('QA') ]),
    mk('Sales', [ mk('Domestic'), mk('International') ]),
    mk('Support')
  ]);
}

/* ===== utilities ===== */
function walk(node, fn){ fn(node); (node.children||[]).forEach(ch=> walk(ch, fn)); }
function clone(node){ return JSON.parse(JSON.stringify(node)); }
function findNode(node, id){ let hit=null; walk(node, n=>{ if(n.id===id) hit=n; }); return hit; }
function removeNode(root, id){
  function rec(n){
    if(!n.children) return false;
    const i = n.children.findIndex(c=> c.id===id);
    if(i>=0){ n.children.splice(i,1); return true; }
    return n.children.some(rec);
  }
  const copy = clone(root);
  if(copy.id===id) return copy; // don't remove root
  rec(copy);
  return copy;
}
function insertChild(root, parentId, child){
  const copy = clone(root);
  walk(copy, n=>{ if(n.id===parentId){ n.children = n.children||[]; n.children.push(child);} });
  return copy;
}
function renameNode(root, id, name){
  const copy = clone(root);
  walk(copy, n=>{ if(n.id===id) n.name=name; });
  return copy;
}

/* ===== Tree Node Row ===== */
function Row({ n, level, onAdd, onRename, onRemove, selected, setSelected }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'6px 8px', borderBottom:`1px solid ${colors.border}`, background: selected? '#f3f4f6':'#fff' }}>
      <div style={{ paddingLeft: level*16 }}>
        <span style={{ marginRight:6 }}>{n.children?.length? '▸': '•'}</span>
        <b>{n.name}</b>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={()=> setSelected(n)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 6px' }}>Select</button>
        <button onClick={()=> onAdd(n)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 6px' }}>+ Child</button>
        <button onClick={()=> onRename(n)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 6px' }}>Rename</button>
        <button onClick={()=> onRemove(n)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 6px', color:'#dc2626' }}>Remove</button>
      </div>
    </div>
  );
}

function FlatTree({ root, onAdd, onRename, onRemove, selected, setSelected }){
  const rows = [];
  function build(n, level){ rows.push({ n, level }); (n.children||[]).forEach(ch=> build(ch, level+1)); }
  build(root, 0);
  return (
    <div>
      {rows.map(({n, level})=> (
        <Row key={n.id} n={n} level={level} onAdd={onAdd} onRename={onRename} onRemove={onRemove} selected={selected?.id===n.id} setSelected={setSelected} />
      ))}
    </div>
  );
}

/* ===== Drawer ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:460, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>{children}</div>
      </div>
    </div>
  );
}

/* ===== Department Tree (main) ===== */
export function DepartmentTree(){
  const [root, setRoot] = useState(()=> seedTree());
  const [selected, setSelected] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [renaming, setRenaming] = useState(null);

  const onAdd = (node)=> setAddingFor(node);
  const onRename = (node)=> setRenaming(node);
  const onRemove = (node)=> setRoot(prev=> removeNode(prev, node.id));

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'48px 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <div style={{ fontWeight:800 }}>Department Tree</div>
        <div style={{ color:colors.sub }}>{selected? `Selected: ${selected.name}`: 'No selection'}</div>
      </div>

      <div style={{ overflow:'auto', background:'#fff' }}>
        <FlatTree root={root} onAdd={onAdd} onRename={onRename} onRemove={onRemove} selected={selected} setSelected={setSelected} />
      </div>

      {/* Add child */}
      <Drawer open={!!addingFor} onClose={()=> setAddingFor(null)} title={`Add Child to ${addingFor?.name||''}`}>
        {addingFor && (
          <AddChildForm onSubmit={(name)=>{ setRoot(prev=> insertChild(prev, addingFor.id, { id:rid(), name })); setAddingFor(null); }} />
        )}
      </Drawer>

      {/* Rename */}
      <Drawer open={!!renaming} onClose={()=> setRenaming(null)} title={`Rename ${renaming?.name||''}`}>
        {renaming && (
          <RenameForm defaultValue={renaming.name} onSubmit={(name)=>{ setRoot(prev=> renameNode(prev, renaming.id, name)); setRenaming(null); }} />
        )}
      </Drawer>
    </div>
  );
}

function AddChildForm({ onSubmit }){
  const colors = { border:'#e5e7eb' };
  const [name, setName] = useState('');
  return (
    <div style={{ display:'grid', gap:8 }}>
      <label>Child name</label>
      <input value={name} onChange={e=>setName(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }} />
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={()=> onSubmit?.(name)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Add</button>
      </div>
    </div>
  );
}

function RenameForm({ defaultValue, onSubmit }){
  const colors = { border:'#e5e7eb' };
  const [name, setName] = useState(defaultValue||'');
  useEffect(()=> setName(defaultValue||''), [defaultValue]);
  return (
    <div style={{ display:'grid', gap:8 }}>
      <label>New name</label>
      <input value={name} onChange={e=>setName(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }} />
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={()=> onSubmit?.(name)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Rename</button>
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <DepartmentTree />
    </div>
  );
}
