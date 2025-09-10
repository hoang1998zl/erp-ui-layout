import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== File: src/mock/users.ts ===== */
const seedUsers = (()=>{
  const given = ['An','Bảo','Chi','Dũng','Hà','Hải','Hạnh','Hùng','Hương','Khánh','Lan','Long','Minh','Nam','Ngọc','Phúc','Quân','Quỳnh','Sơn','Trang','Uyên','Vinh'];
  const surnames = ['Lê','Nguyễn','Trần','Phạm','Hoàng','Vũ','Phan','Võ','Đặng'];
  const depts = ['Finance','HR','R&D','Sales','Support'];
  const roles = ['Admin','Manager','Staff','Viewer'];
  const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});
  const users = Array.from({length:64}).map((_,i)=>{
    const name = `${surnames[i%surnames.length]} ${given[i%given.length]}`;
    const email = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'.')+'@ktest.vn';
    return {
      id: rid(),
      name,
      email,
      dept: depts[i%depts.length],
      role: roles[i%roles.length],
      status: i%7===0? 'disabled':'active',
    };
  });
  return ()=> users.slice();
})();

/* ===== File: src/components/UserFilters.tsx ===== */
function UserFilters({ q, setQ, dept, setDept, role, setRole, status, setStatus }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  const depts = ['','Finance','HR','R&D','Sales','Support'];
  const roles = ['','Admin','Manager','Staff','Viewer'];
  const statuses = ['','active','disabled'];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search (name/email)" style={{ height:36, padding:'0 10px', border:`1px solid ${colors.border}`, borderRadius:8 }} />
      <select value={dept} onChange={e=>setDept(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        {depts.map(d=> <option key={d} value={d}>{d||'Department'}</option>)}
      </select>
      <select value={role} onChange={e=>setRole(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        {roles.map(r=> <option key={r} value={r}>{r||'Role'}</option>)}
      </select>
      <select value={status} onChange={e=>setStatus(e.target.value)} style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8 }}>
        {statuses.map(s=> <option key={s} value={s}>{s||'Status'}</option>)}
      </select>
    </div>
  );
}

/* ===== File: src/components/UserTable.tsx ===== */
function StatusBadge({ s }){
  const color = s==='active'? '#16a34a':'#9ca3af';
  const bg = s==='active'? '#ecfdf5':'#f3f4f6';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:bg, color }}>{s}</span>;
}

function UserRow({ u, i, onEdit, onToggle }){
  const colors = { border:'#e5e7eb' };
  return (
    <tr style={{ background: i%2? '#fafafa':'#fff' }}>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{u.name}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}`, fontFamily:'ui-monospace' }}>{u.email}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{u.dept}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{u.role}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={u.status} /></td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
        <button onClick={()=>onEdit(u)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px', marginRight:6 }}>Edit</button>
        <button onClick={()=>onToggle(u)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px' }}>{u.status==='active'? 'Disable':'Enable'}</button>
      </td>
    </tr>
  );
}

/* ===== File: src/components/UserForm.tsx ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:420, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
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

function UserForm({ value, onChange, onSubmit }){
  const colors = { border:'#e5e7eb' };
  const [v, setV] = useState(value||{ name:'', email:'', dept:'Finance', role:'Staff', status:'active' });
  useEffect(()=> setV(value||{ name:'', email:'', dept:'Finance', role:'Staff', status:'active' }), [value]);
  const onField = (k)=> (e)=> setV(prev=> ({...prev, [k]: e.target.value }));
  const doSubmit = ()=> onSubmit?.(v);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
      <div>
        <label>Name</label>
        <input value={v.name} onChange={onField('name')} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }} />
      </div>
      <div>
        <label>Email</label>
        <input value={v.email} onChange={onField('email')} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', fontFamily:'ui-monospace' }} />
      </div>
      <div>
        <label>Department</label>
        <select value={v.dept} onChange={onField('dept')} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>
          {['Finance','HR','R&D','Sales','Support'].map(d=> <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label>Role</label>
        <select value={v.role} onChange={onField('role')} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>
          {['Admin','Manager','Staff','Viewer'].map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label>Status</label>
        <select value={v.status} onChange={onField('status')} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>
          {['active','disabled'].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={doSubmit} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 12px' }}>Save</button>
      </div>
    </div>
  );
}

/* ===== File: src/components/UserManagement.tsx ===== */
export function UserManagement(){
  const [rows, setRows] = useState(()=> seedUsers());
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(()=>{
    const ql = q.trim().toLowerCase();
    return rows.filter(u => (
      (!ql || `${u.name} ${u.email}`.toLowerCase().includes(ql)) &&
      (!dept || u.dept===dept) &&
      (!role || u.role===role) &&
      (!status || u.status===status)
    ));
  }, [rows, q, dept, role, status]);

  const onEdit = (u)=> setEditing(u);
  const onToggle = (u)=> setRows(arr=> arr.map(x=> x.id===u.id? {...x, status: x.status==='active'?'disabled':'active'}: x));
  const onSave = (v)=>{
    setRows(arr=> arr.map(x=> x.id===v.id? v: x));
    setEditing(null);
  };

  const colors = { border:'#e5e7eb' };

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <UserFilters q={q} setQ={setQ} dept={dept} setDept={setDept} role={role} setRole={setRole} status={status} setStatus={setStatus} />
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Name</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Email</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Dept</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Role</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Status</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u,i)=> <UserRow key={u.id} u={u} i={i} onEdit={onEdit} onToggle={onToggle} />)}
          </tbody>
        </table>
      </div>
      <Drawer open={!!editing} onClose={()=>setEditing(null)} title="Edit User">
        {editing && <UserForm value={editing} onChange={()=>{}} onSubmit={onSave} />}
      </Drawer>
    </div>
  );
}

/* ===== File: src/App.tsx ===== */
export default function App(){
  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'48px 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        <div style={{ fontWeight:800 }}>ADM — User Management</div>
      </div>
      <UserManagement />
    </div>
  );
}
