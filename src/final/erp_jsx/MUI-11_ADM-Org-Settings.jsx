import React, { useEffect, useState } from 'react';

/* ===== Mock Org Settings ===== */
const defaultSettings = {
  company: {
    name: 'KTEST Corp',
    tax_code: '123456789',
    address: '123 Main St, Hanoi',
    country: 'VN',
    phone: '+84 24 1234 5678',
    email: 'info@ktest.vn',
    website: 'https://ktest.vn'
  },
  finance: {
    timeZone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    vat_rates: [0, 8, 10],
    fiscal_year_start_month: 1,
    rounding: 'round'
  },
  approvals: {
    levels: 2,
    thresholds: [
      { level: 1, amount: 5000 },
      { level: 2, amount: 20000 }
    ],
    auto_escalation: true,
    purchase: { enabled: true, min_quotes: 2 }
  },
  security: {
    password_require_mixed: true,
    mfa_required: false,
    session_timeout_minutes: 30,
    allow_sso: true,
    sso_providers: ['Google','Microsoft']
  },
  integrations: {
    sharepoint_site: '',
    sso_tenant_id: ''
  }
};

/* ===== Editable Input Components ===== */
function Field({ label, value, onChange, type='text' }){
  const colors = { border:'#e5e7eb' };
  return (
    <div style={{ display:'grid', gap:4 }}>
      <label style={{ fontSize:12, color:'#6b7280' }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{ border:`1px solid ${colors.border}`, borderRadius:6, padding:'6px 10px' }} />
    </div>
  );
}

function Switch({ label, value, onChange }){
  return (
    <label style={{ display:'flex', alignItems:'center', gap:8 }}>
      <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} /> {label}
    </label>
  );
}

/* ===== Org Settings Component ===== */
export function OrgSettings(){
  const [s, setS] = useState(defaultSettings);

  const update = (path, val)=>{
    setS(prev=>{
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = copy;
      while(parts.length>1){ obj = obj[parts.shift()]; }
      obj[parts[0]] = val;
      return copy;
    });
  };

  return (
    <div style={{ height:'100%', overflow:'auto', padding:16, background:'#f9fafb' }}>
      <h2 style={{ fontWeight:800, marginBottom:12 }}>Org Settings</h2>

      <section style={{ marginBottom:20 }}>
        <h3>Company</h3>
        <Field label="Name" value={s.company.name} onChange={v=>update('company.name',v)} />
        <Field label="Tax Code" value={s.company.tax_code} onChange={v=>update('company.tax_code',v)} />
        <Field label="Address" value={s.company.address} onChange={v=>update('company.address',v)} />
        <Field label="Country" value={s.company.country} onChange={v=>update('company.country',v)} />
        <Field label="Phone" value={s.company.phone} onChange={v=>update('company.phone',v)} />
        <Field label="Email" value={s.company.email} onChange={v=>update('company.email',v)} />
        <Field label="Website" value={s.company.website} onChange={v=>update('company.website',v)} />
      </section>

      <section style={{ marginBottom:20 }}>
        <h3>Finance</h3>
        <Field label="Time Zone" value={s.finance.timeZone} onChange={v=>update('finance.timeZone',v)} />
        <Field label="Currency" value={s.finance.currency} onChange={v=>update('finance.currency',v)} />
        <Field label="VAT Rates" value={s.finance.vat_rates.join(',')} onChange={v=>update('finance.vat_rates',v.split(',').map(Number))} />
        <Field label="Fiscal Year Start Month" value={s.finance.fiscal_year_start_month} onChange={v=>update('finance.fiscal_year_start_month',v)} />
        <Field label="Rounding" value={s.finance.rounding} onChange={v=>update('finance.rounding',v)} />
      </section>

      <section style={{ marginBottom:20 }}>
        <h3>Approvals</h3>
        <Field label="Levels" value={s.approvals.levels} onChange={v=>update('approvals.levels',v)} />
        <Switch label="Auto Escalation" value={s.approvals.auto_escalation} onChange={v=>update('approvals.auto_escalation',v)} />
        <Switch label="Purchase Enabled" value={s.approvals.purchase.enabled} onChange={v=>update('approvals.purchase.enabled',v)} />
        <Field label="Min Quotes" value={s.approvals.purchase.min_quotes} onChange={v=>update('approvals.purchase.min_quotes',v)} />
      </section>

      <section style={{ marginBottom:20 }}>
        <h3>Security</h3>
        <Switch label="Require Mixed Password" value={s.security.password_require_mixed} onChange={v=>update('security.password_require_mixed',v)} />
        <Switch label="MFA Required" value={s.security.mfa_required} onChange={v=>update('security.mfa_required',v)} />
        <Field label="Session Timeout (minutes)" value={s.security.session_timeout_minutes} onChange={v=>update('security.session_timeout_minutes',v)} />
        <Switch label="Allow SSO" value={s.security.allow_sso} onChange={v=>update('security.allow_sso',v)} />
        <Field label="SSO Providers" value={s.security.sso_providers.join(',')} onChange={v=>update('security.sso_providers',v.split(','))} />
      </section>

      <section style={{ marginBottom:20 }}>
        <h3>Integrations</h3>
        <Field label="SharePoint Site" value={s.integrations.sharepoint_site} onChange={v=>update('integrations.sharepoint_site',v)} />
        <Field label="SSO Tenant ID" value={s.integrations.sso_tenant_id} onChange={v=>update('integrations.sso_tenant_id',v)} />
      </section>

      <div style={{ marginTop:24 }}>
        <button onClick={()=> alert('Save settings to API') } style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px' }}>Save</button>
      </div>
    </div>
  );
}

/* ===== App Runner ===== */
export default function App(){
  return (
    <div style={{ height:'100vh' }}>
      <OrgSettings />
    </div>
  );
}
