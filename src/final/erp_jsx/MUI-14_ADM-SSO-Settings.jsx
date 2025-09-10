import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock SSO Settings ===== */
const defaultSSO = {
  enabled: true,
  providers: [
    { key:'google', name:'Google', client_id:'', client_secret:'', issuer:'https://accounts.google.com', discovery:'', mapped_groups: ['viewer'], allow_signup:true },
    { key:'microsoft', name:'Microsoft', client_id:'', client_secret:'', issuer:'https://login.microsoftonline.com', discovery:'', mapped_groups: ['staff'], allow_signup:false },
    { key:'okta', name:'Okta', client_id:'', client_secret:'', issuer:'https://example.okta.com', discovery:'', mapped_groups: [], allow_signup:false },
  ],
  domain_whitelist: ['ktest.vn'],
  enforce_sso: false,
  jit_provisioning: true,   // create user on first login
  jit_default_roles: ['Viewer'],
};

/* ===== UI Primitives ===== */
function Switch({ label, value, onChange }){
  return (
    <label style={{ display:'flex', alignItems:'center', gap:8 }}>
      <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} /> {label}
    </label>
  );
}

function Field({ label, value, onChange, placeholder }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px', minHeight:72 }} />
    </div>
  );
}

/* ===== Provider Row ===== */
function ProviderRow({ p, onChange, onRemove }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  const update = (k, v)=> onChange({ ...p, [k]: v });
  return (
    <div style={{ border:`1px solid ${colors.border}`, borderRadius:10, padding:12, background:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontWeight:800 }}>{p.name}</div>
        <div style={{ display:'flex', gap:6 }}>
          <Switch label="Allow Signup" value={!!p.allow_signup} onChange={v=>update('allow_signup', v)} />
          <button onClick={onRemove} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'4px 8px', color:'#dc2626' }}>Remove</button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Client ID" value={p.client_id} onChange={v=>update('client_id', v)} />
        <Field label="Client Secret" value={p.client_secret} onChange={v=>update('client_secret', v)} />
        <Field label="Issuer" value={p.issuer} onChange={v=>update('issuer', v)} placeholder="https://..." />
        <Field label="OIDC Discovery URL" value={p.discovery} onChange={v=>update('discovery', v)} placeholder="https://.../.well-known/openid-configuration" />
      </div>
      <div style={{ marginTop:8 }}>
        <Field label="Mapped Groups (comma separated)" value={(p.mapped_groups||[]).join(',')} onChange={v=> update('mapped_groups', v.split(',').map(x=>x.trim()).filter(Boolean))} />
      </div>
      <div style={{ marginTop:8, fontSize:12, color:colors.sub }}>
        Callback URL: <code style={{ fontFamily:'ui-monospace' }}>/auth/callback/{p.key}</code>
      </div>
    </div>
  );
}

/* ===== Domain Tag ===== */
function DomainTag({ d, onRemove }){
  const colors = { border:'#e5e7eb' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px', border:`1px solid ${colors.border}`, borderRadius:999, background:'#f3f4f6', marginRight:6, marginBottom:6 }}>
      {d}
      <button onClick={onRemove} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#dc2626' }}>×</button>
    </span>
  );
}

/* ===== SSO Settings Main ===== */
export function SsoSettings(){
  const [cfg, setCfg] = useState(defaultSSO);
  const colors = { border:'#e5e7eb', sub:'#6b7280', bg:'#f9fafb' };

  const addDomain = (d)=> setCfg(prev=> ({ ...prev, domain_whitelist: [...prev.domain_whitelist, d] }));
  const removeDomain = (d)=> setCfg(prev=> ({ ...prev, domain_whitelist: prev.domain_whitelist.filter(x=>x!==d) }));

  const addProvider = ()=> setCfg(prev=> ({ ...prev, providers: [...prev.providers, { key:'custom_'+prev.providers.length, name:'Custom IdP', client_id:'', client_secret:'', issuer:'', discovery:'', mapped_groups:[], allow_signup:false }] }));
  const updateProvider = (idx, p)=> setCfg(prev=>{ const arr = prev.providers.slice(); arr[idx]=p; return { ...prev, providers: arr }; });
  const removeProvider = (idx)=> setCfg(prev=> ({ ...prev, providers: prev.providers.filter((_,i)=> i!==idx) }));

  const save = ()=> alert('Save SSO settings to API');

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr', background:colors.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:`1px solid ${colors.border}`, background:'#fff' }}>
        <Switch label="Enable SSO" value={cfg.enabled} onChange={v=> setCfg(prev=> ({ ...prev, enabled:v }))} />
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Switch label="Enforce SSO" value={cfg.enforce_sso} onChange={v=> setCfg(prev=> ({ ...prev, enforce_sso:v }))} />
          <Switch label="JIT Provisioning" value={cfg.jit_provisioning} onChange={v=> setCfg(prev=> ({ ...prev, jit_provisioning:v }))} />
          <button onClick={save} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Save</button>
        </div>
      </div>

      <div style={{ overflow:'auto', padding:12 }}>
        <section style={{ marginBottom:16 }}>
          <h3 style={{ margin:'8px 0' }}>Domain Whitelist</h3>
          <DomainWhitelist value={cfg.domain_whitelist} onAdd={addDomain} onRemove={removeDomain} />
        </section>

        <section style={{ marginBottom:16 }}>
          <h3 style={{ margin:'8px 0' }}>Providers</h3>
          <div style={{ display:'grid', gap:12 }}>
            {cfg.providers.map((p, i)=> (
              <ProviderRow key={p.key} p={p} onChange={(np)=> updateProvider(i, np)} onRemove={()=> removeProvider(i)} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
            <button onClick={addProvider} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>+ Add Provider</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DomainWhitelist({ value, onAdd, onRemove }){
  const colors = { border:'#e5e7eb', sub:'#6b7280' };
  const [txt, setTxt] = useState('');
  const add = ()=>{ if(!txt) return; onAdd?.(txt); setTxt(''); };
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input value={txt} onChange={e=>setTxt(e.target.value)} placeholder="example.com" style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }} />
        <button onClick={add} style={{ border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 10px' }}>Add</button>
      </div>
      <div>
        {value.map(d=> <DomainTag key={d} d={d} onRemove={()=> onRemove?.(d)} />)}
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <SsoSettings />
    </div>
  );
}
