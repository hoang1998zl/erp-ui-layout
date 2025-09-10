import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== File: src/mock/roles.ts ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});

const seedUsers = ()=>{
  const names = ['Hieu Le','Project Manager','Finance Manager','Employee A','Employee B','Employee C','Employee D'];
  return names.map((n,i)=> ({ id:rid(), name:n, email:n.toLowerCase().replace(/\s+/g,'.')+'@ktest.vn', dept:['R&D','PM','Finance','HR'][i%4] }));
};

const seedRoles = ()=> [
  { id: rid(), key:'admin',    name:'Admin',    desc:'Full access' },
  { id: rid(), key:'manager',  name:'Manager',  desc:'Manage team & projects' },
  { id: rid(), key:'staff',    name:'Staff',    desc:'Work on assigned tasks' },
  { id: rid(), key:'viewer',   name:'Viewer',   desc:'Read-only access' },
];

/* ===== File: src/mock/perms.ts ===== */
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

/* ===== File: src/components/RoleAssignment.tsx ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:480, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function UserPicker({ users, value, onChange }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  const [q, setQ] = useState('');
  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    return users.filter(u=> !t || `${u.name} ${u.email}`.toLowerCase().includes(t));
  }, [users, q]);
  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search user" style={{ width:'100%', height:36, border:`1px solid ${colors.border}`, borderRadius:8, padding:'0 10px' }} />
      <div style={{ maxHeight:220, overflow:'auto', marginTop:8 }}>
        {filtered.map(u=> (
          <div key={u.id} onClick={()=> onChange?.(u)} style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, cursor:'pointer', background: value?.id===u.id? '#f3f4f6':'transparent' }}>
            <div style={{ fontWeight:600 }}>{u.name}</div>
            <div style={{ fontSize:12, color:colors.sub }}>{u.email} · {u.dept}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ r, onRemove }){
  const colors = { border:'#e5e7eb' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 6px', border:`1px solid ${colors.border}`, borderRadius:999, background:'#f3f4f6', margin:2 }}>
      {r.name}
      <button onClick={()=> onRemove(r)} style={{ marginLeft:4, border:'none', background:'transparent', cursor:'pointer', color:'#dc2626' }}>×</button>
    </span>
  );
}

export function RoleAssignment(){
  const [users] = useState(()=> seedUsers());
  const [roles] = useState(()=> seedRoles());
  const [assign, setAssign] = useState(new Map()); // userId -> roleIds
  const [pick, setPick] = useState(null);

  const onAddRole = (u, r)=>{
    setAssign(prev=>{
      const next = new Map(prev);
      const set = new Set(next.get(u.id)||[]);
      set.add(r.key);
      next.set(u.id, set);
      return next;
    });
  };
  const onRemoveRole = (u, r)=>{
    setAssign(prev=>{
      const next = new Map(prev);
      const set = new Set(next.get(u.id)||[]);
      set.delete(r.key);
      next.set(u.id, set);
      return next;
    });
  };

  const colors = { border:'#e5e7eb', sub:'#6b7280' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{ padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <button onClick={()=> setPick({})} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Assign Role</button>
      </div>
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>User</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Email</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Department</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=>{
              const rs = Array.from(assign.get(u.id)||[]);
              return (
                <tr key={u.id}>
                  <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{u.name}</td>
                  <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{u.email}</td>
                  <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{u.dept}</td>
                  <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
                    {rs.map(k=> <RoleBadge key={k} r={roles.find(r=>r.key===k)} onRemove={(r)=> onRemoveRole(u,r)} />)}
                    <button onClick={()=> setPick(u)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'2px 6px', marginLeft:4 }}>+ Role</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={!!pick} onClose={()=> setPick(null)} title="Assign Role">
        {pick && (
          <div>
            <UserPicker users={users} value={pick.id? pick:null} onChange={setPick} />
            {pick.id && (
              <div style={{ marginTop:12 }}>
                {roles.map(r=>{
                  const has = (assign.get(pick.id)||new Set()).has(r.key);
                  return (
                    <div key={r.key} style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 0' }}>
                      <input type="checkbox" checked={has} onChange={(e)=> e.target.checked? onAddRole(pick,r): onRemoveRole(pick,r)} />
                      <span>{r.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ===== File: src/App.tsx ===== */
export default function App(){
  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'48px 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        <div style={{ fontWeight:800 }}>ADM — Role Assignment</div>
      </div>
      <RoleAssignment />
    </div>
  );
}