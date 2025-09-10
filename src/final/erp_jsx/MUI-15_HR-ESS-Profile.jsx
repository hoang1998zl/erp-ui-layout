import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Mock ESS Profile ===== */
const LS_KEY = 'erp.ess.profile.v1';
function deepClone(x){ return JSON.parse(JSON.stringify(x)); }
function nowISO(){ return new Date().toISOString(); }

const DEFAULT = {
  id: 'me',
  avatar_data_url: null,
  full_name: 'Nguyen Van A',
  employee_code: 'E001',
  email: 'a.nguyen@ktest.vn',
  phone: '0901234567',
  dob: '1990-01-01',
  gender: 'male',
  address_line: '123 Main St',
  district: 'Hoan Kiem',
  province: 'Hanoi',
  country: 'VN',
  emergency: { name:'Tran Thi B', phone:'0912345678', relationship:'Spouse' },
  updated_at: nowISO(),
  created_at: nowISO()
};

/* ===== Avatar Uploader ===== */
function Avatar({ value, onChange }){
  const colors = { border:'#e5e7eb' };
  const pick = (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ()=> onChange(r.result);
    r.readAsDataURL(file);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ width:96, height:96, borderRadius:'50%', overflow:'hidden', border:`2px solid ${colors.border}` }}>
        {value? <img src={value} style={{ width:'100%', height:'100%', objectFit:'cover' }} />: <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}>No photo</div>}
      </div>
      <input type='file' accept='image/*' onChange={pick} />
    </div>
  );
}

/* ===== Field ===== */
function Field({ label, value, onChange, type='text' }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

/* ===== ESS Profile Main ===== */
export function EssProfile(){
  const [profile, setProfile] = useState(()=>{
    const txt = localStorage.getItem(LS_KEY);
    return txt? JSON.parse(txt): DEFAULT;
  });
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(profile)); }, [profile]);

  const update = (k,v)=> setProfile(prev=> ({ ...prev, [k]:v, updated_at: nowISO() }));

  return (
    <div style={{ height:'100%', overflow:'auto', padding:16, background:'#f9fafb' }}>
      <h2 style={{ fontWeight:800, marginBottom:12 }}>My Profile</h2>

      <section style={{ marginBottom:20 }}>
        <Avatar value={profile.avatar_data_url} onChange={v=> update('avatar_data_url', v)} />
      </section>

      <section style={{ marginBottom:20, display:'grid', gap:12 }}>
        <Field label='Full Name' value={profile.full_name} onChange={v=> update('full_name',v)} />
        <Field label='Employee Code' value={profile.employee_code} onChange={v=> update('employee_code',v)} />
        <Field label='Email' value={profile.email} onChange={v=> update('email',v)} />
        <Field label='Phone' value={profile.phone} onChange={v=> update('phone',v)} />
        <Field label='Date of Birth' value={profile.dob} onChange={v=> update('dob',v)} type='date' />
        <Field label='Gender' value={profile.gender} onChange={v=> update('gender',v)} />
        <Field label='Address' value={profile.address_line} onChange={v=> update('address_line',v)} />
        <Field label='District' value={profile.district} onChange={v=> update('district',v)} />
        <Field label='Province' value={profile.province} onChange={v=> update('province',v)} />
        <Field label='Country' value={profile.country} onChange={v=> update('country',v)} />
      </section>

      <section style={{ marginBottom:20, display:'grid', gap:12 }}>
        <h3>Emergency Contact</h3>
        <Field label='Name' value={profile.emergency?.name} onChange={v=> update('emergency', { ...profile.emergency, name:v })} />
        <Field label='Phone' value={profile.emergency?.phone} onChange={v=> update('emergency', { ...profile.emergency, phone:v })} />
        <Field label='Relationship' value={profile.emergency?.relationship} onChange={v=> update('emergency', { ...profile.emergency, relationship:v })} />
      </section>

      <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
        <button onClick={()=> alert('Save profile to API')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px' }}>Save</button>
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <EssProfile />
    </div>
  );
}
