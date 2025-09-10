import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock & Utils ===== */
const rid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);});
const fmt = (ts)=> new Intl.DateTimeFormat('vi', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(ts));

function seedTokens(){
  const scopes = ['read:projects','write:projects','read:finance','write:finance','read:hr'];
  return Array.from({length:8}).map((_,i)=> ({
    id: rid(),
    label: `Service ${i+1}`,
    created_at: Date.now()-i*86400000,
    last_used_at: Date.now()-i*3600000,
    status: i%5===0? 'revoked':'active',
    scopes: scopes.filter((_,k)=> (k+i)%2===0)
  }));
}

/* ===== Drawer ===== */
function Drawer({ open, onClose, title, children }){
  const colors = { border:'#e5e7eb', bg:'#ffffff', bgAlt:'#f9fafb' };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64 }} onClick={onClose}>
      <div style={{ width:520, background:colors.bg, borderLeft:`1px solid ${colors.border}`, height:'calc(100vh - 64px)', boxShadow:'-10px 0 30px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}` }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px', background:colors.bgAlt }}>Esc</button>
        </div>
        <div style={{ padding:12 }}>{children}</div>
      </div>
    </div>
  );
}

/* ===== Token List UI ===== */
function StatusBadge({ s }){
  const color = s==='active'? '#16a34a' : '#dc2626';
  const bg = s==='active'? '#ecfdf5':'#fef2f2';
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, background:bg, color }}>{s}</span>;
}

function TokenRow({ t, onView, onRevoke }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  return (
    <tr>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{t.label}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{fmt(t.created_at)}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>{fmt(t.last_used_at)}</td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}><StatusBadge s={t.status} /></td>
      <td style={{ padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>
        <button onClick={()=> onView(t)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px', marginRight:6 }}>View</button>
        {t.status==='active' && <button onClick={()=> onRevoke(t)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px', color:'#dc2626' }}>Revoke</button>}
      </td>
    </tr>
  );
}

function TokenCreateForm({ onCreate }){
  const colors = { border:'#e5e7eb' };
  const [label, setLabel] = useState('');
  const [scopes, setScopes] = useState([]);
  const allScopes = ['read:projects','write:projects','read:finance','write:finance','read:hr'];
  const toggle = (s)=> setScopes(arr=> arr.includes(s)? arr.filter(x=>x!==s): [...arr, s]);
  const submit = ()=> onCreate?.({ id:rid(), value:'ktest_'+rid().slice(0,8), label, scopes, created_at:Date.now(), last_used_at:null, status:'active' });
  return (
    <div style={{ display:'grid', gap:8 }}>
      <div>
        <label>Label</label>
        <input value={label} onChange={e=>setLabel(e.target.value)} style={{ width:'100%', border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }} />
      </div>
      <div>
        <label>Scopes</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {allScopes.map(s=> (
            <label key={s} style={{ border:`1px solid ${colors.border}`, borderRadius:999, padding:'4px 8px' }}>
              <input checked={scopes.includes(s)} onChange={()=>toggle(s)} type='checkbox'/> {s}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button onClick={submit} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Create</button>
      </div>
    </div>
  );
}

/* ===== API Tokens main ===== */
export function ApiTokens(){
  const [rows, setRows] = useState(()=> seedTokens());
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    return rows.filter(x=> !t || `${x.label} ${x.scopes.join(' ')}`.toLowerCase().includes(t));
  }, [rows, q]);

  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  const onCreate = (tok)=>{ setRows(arr=> [tok, ...arr]); setCreating(false); setViewing(tok); };
  const onRevoke = (tok)=> setRows(arr=> arr.map(x=> x.id===tok.id? { ...x, status:'revoked' }: x));

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto auto 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder='Search label or scope' style={{ height:36, border:`1px solid ${colors.border}`, borderRadius:8, padding:'0 10px', width:320 }} />
        <button onClick={()=> setCreating(true)} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>+ New Token</button>
      </div>

      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Label</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Created</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Last Used</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Status</th>
              <th style={{ textAlign:'left', padding:'8px 10px', borderBottom:`1px solid ${colors.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=> <TokenRow key={t.id} t={t} onView={setViewing} onRevoke={onRevoke} />)}
          </tbody>
        </table>
      </div>

      <Drawer open={creating} onClose={()=> setCreating(false)} title='Create API Token'>
        <TokenCreateForm onCreate={onCreate} />
      </Drawer>

      <Drawer open={!!viewing} onClose={()=> setViewing(null)} title='Token Value'>
        {viewing && (
          <div style={{ display:'grid', gap:8 }}>
            <div><b>Label:</b> {viewing.label}</div>
            <div><b>Scopes:</b> {viewing.scopes.join(', ')}</div>
            <div><b>Status:</b> {viewing.status}</div>
            <div style={{ display:'grid', gap:6 }}>
              <label>Copy this token now — you won't be able to see it again:</label>
              <code style={{ padding:'10px 12px', background:'#0b1020', color:'#b4f5ff', borderRadius:6, overflow:'auto' }}>ktest_{rid().slice(0,24)}</code>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <ApiTokens />
    </div>
  );
}
