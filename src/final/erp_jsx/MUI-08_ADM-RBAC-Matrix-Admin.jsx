import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== File: src/mock/rbac.ts ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});

const seedRoles = ()=> [
  { id: rid(), key:'admin',    name:'Admin',    desc:'Full access' },
  { id: rid(), key:'manager',  name:'Manager',  desc:'Manage team & projects' },
  { id: rid(), key:'staff',    name:'Staff',    desc:'Work on assigned tasks' },
  { id: rid(), key:'viewer',   name:'Viewer',   desc:'Read-only access' },
];

const seedPerms = ()=>{
  const groups = ['Project','Task','Document','User','Finance','HR','Audit'];
  const make = (group, label)=> ({ key: `${group.toLowerCase()}.${label.toLowerCase().replace(/\s+/g,'_')}`, group, label});
  const list = [];
  groups.forEach(g=>{
    list.push(make(g,'View'));
    list.push(make(g,'Create'));
    list.push(make(g,'Update'));
    list.push(make(g,'Delete'));
    if (g==='Audit') list.push(make(g,'Export'));
  });
  return list;
};

/* ===== File: src/components/RbacMatrix.tsx ===== */
function Checkbox({ checked, onChange }){
  return (
    <input type="checkbox" checked={!!checked} onChange={e=>onChange?.(e.target.checked)} />
  );
}

function PermRow({ p, roles, matrix, setMatrix }){
  const colors = { border:'#e5e7eb' };
  const onTick = (roleKey, checked)=>{
    setMatrix(prev=>{
      const next = new Map(prev);
      const role = next.get(roleKey) || new Set();
      const set = new Set(role);
      if (checked) set.add(p.key); else set.delete(p.key);
      next.set(roleKey, set);
      return next;
    });
  };
  return (
    <tr>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
        <div style={{ fontWeight:600 }}>{p.group}</div>
        <div style={{ fontSize:12, color:'#6b7280' }}>{p.label}</div>
      </td>
      {roles.map(r=>{
        const set = matrix.get(r.key) || new Set();
        const checked = set.has(p.key);
        return (
          <td key={r.key} style={{ textAlign:'center', borderBottom:`1px solid ${colors.border}` }}>
            <Checkbox checked={checked} onChange={(v)=> onTick(r.key, v)} />
          </td>
        );
      })}
    </tr>
  );
}

function RoleHeader({ roles, onAdd, onRename, onRemove }){
  const colors = { border:'#e5e7eb' };
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
      <button onClick={onAdd} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>+ Role</button>
      <div style={{ display:'flex', gap:8, overflow:'auto' }}>
        {roles.map(r=> (
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', border:`1px solid ${colors.border}`, borderRadius:999, background:'#f9fafb' }}>
            {editing===r.id ? (
              <>
                <input value={name} onChange={e=>setName(e.target.value)} style={{ height:28, border:`1px solid ${colors.border}`, borderRadius:6, padding:'0 8px' }} />
                <button onClick={()=>{ onRename(r.id, name); setEditing(null); }} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 8px' }}>Save</button>
              </>
            ) : (
              <>
                <b>{r.name}</b>
                <button onClick={()=>{ setEditing(r.id); setName(r.name); }} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 8px' }}>Rename</button>
                <button onClick={()=> onRemove(r.id)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 8px', color:'#dc2626' }}>Remove</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RbacMatrixAdmin(){
  const [roles, setRoles] = useState(()=> seedRoles());
  const [perms] = useState(()=> seedPerms());
  const [matrix, setMatrix] = useState(()=>{
    const m = new Map();
    // Seed some defaults
    m.set('admin', new Set(perms.map(p=>p.key)));
    m.set('manager', new Set(perms.filter(p=> p.group!=='Audit' || p.label!=='Delete').map(p=>p.key)));
    m.set('staff', new Set(perms.filter(p=> p.label==='View' || p.label==='Update').map(p=>p.key)));
    m.set('viewer', new Set(perms.filter(p=> p.label==='View').map(p=>p.key)));
    return m;
  });

  const addRole = ()=> setRoles(rs=> [...rs, { id:rid(), key:`role_${rs.length+1}`, name:`Role ${rs.length+1}`, desc:'' }]);
  const renameRole = (id, name)=> setRoles(rs=> rs.map(r=> r.id===id? { ...r, name }: r));
  const removeRole = (id)=>{
    setRoles(rs=> rs.filter(r=> r.id!==id));
  };

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#ffffff' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <RoleHeader roles={roles} onAdd={addRole} onRename={renameRole} onRemove={removeRole} />
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Permission</th>
              {roles.map(r=> <th key={r.id} style={{ textAlign:'center', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {perms.map(p=> <PermRow key={p.key} p={p} roles={roles} matrix={matrix} setMatrix={setMatrix} />)}
          </tbody>
        </table>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderTop:`1px solid ${colors.border}`, background:'#fff' }}>
        <div style={{ color:colors.sub }}>Click to toggle grants per role. Add/rename/remove roles on the header.</div>
        <button onClick={()=> alert('Save matrix to server')} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Save</button>
      </div>
    </div>
  );
}

/* ===== File: src/App.tsx ===== */
export default function App(){
  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'48px 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        <div style={{ fontWeight:800 }}>ADM — RBAC Matrix</div>
      </div>
      <RbacMatrixAdmin />
    </div>
  );
}
