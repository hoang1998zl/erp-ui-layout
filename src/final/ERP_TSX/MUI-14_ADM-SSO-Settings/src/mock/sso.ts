// src/mock/sso.ts
export type UUID = string;

export type ProviderType = 'Microsoft'|'Google'|'Okta'|'OIDC';

export type OIDCProvider = {
  id: UUID;
  type: ProviderType;
  name: string;                // display name
  issuer?: string;             // OIDC discovery
  client_id: string;
  client_secret_set: boolean;  // never expose plaintext; indicates set or not
  scopes: string[];            // e.g., ['openid','profile','email']
  redirect_uris: string[];
  claim_map: {
    email: string;             // e.g., 'email'
    name?: string;             // e.g., 'name' or 'preferred_username'
    groups?: string;           // e.g., 'groups'
  };
  domain_allowlist?: string[]; // optional list of allowed email domains
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SSOSettings = {
  enforce_sso: boolean;         // force SSO except super admins
  allow_password_login_for_admins: boolean;
  jit_provisioning: boolean;    // create user on first login
  jit_default_role?: string;    // e.g., 'Employee'
  role_mapping?: Array<{ group: string; role: string }>; // group->role map
  default_provider_id?: UUID | null;
  providers: OIDCProvider[];
};

const LS_KEY = 'erp.sso.settings.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function nowISO(){ return new Date().toISOString(); }

const DEFAULTS: SSOSettings = {
  enforce_sso: false,
  allow_password_login_for_admins: true,
  jit_provisioning: true,
  jit_default_role: 'Employee',
  role_mapping: [{ group:'Finance', role:'Finance' }, { group:'Managers', role:'Manager' }],
  default_provider_id: null,
  providers: [{
    id: rid(),
    type: 'Microsoft',
    name: 'Microsoft Entra ID',
    issuer: 'https://login.microsoftonline.com/common/v2.0',
    client_id: '00000000-0000-0000-0000-000000000000',
    client_secret_set: false,
    scopes: ['openid','profile','email'],
    redirect_uris: ['https://erp.example.com/auth/callback/oidc'],
    claim_map: { email:'email', name:'name', groups:'groups' },
    domain_allowlist: ['example.com'],
    active: true,
    created_at: nowISO(),
    updated_at: nowISO(),
  }],
};

function deepClone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
function delay(ms=140){ return new Promise(res=>setTimeout(res,ms)); }

export async function getSettings(): Promise<SSOSettings> {
  await delay();
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return deepClone(DEFAULTS);
  return JSON.parse(raw);
}

export async function saveSettings(payload: SSOSettings): Promise<void> {
  await delay();
  localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

export async function exportJSON(): Promise<string> {
  await delay();
  const cur = await getSettings();
  // never export secrets; only metadata
  return JSON.stringify(cur, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.providers) throw new Error('Invalid settings JSON');
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export async function addProvider(t: ProviderType): Promise<OIDCProvider> {
  await delay();
  const base: OIDCProvider = {
    id: rid(), type: t, name: t==='OIDC'?'Custom OIDC':t,
    issuer: t==='Google' ? 'https://accounts.google.com' :
            t==='Okta' ? 'https://example.okta.com' :
            t==='Microsoft' ? 'https://login.microsoftonline.com/common/v2.0' : '',
    client_id: '',
    client_secret_set: false,
    scopes: ['openid','profile','email'],
    redirect_uris: ['https://erp.example.com/auth/callback/oidc'],
    claim_map: { email:'email', name:'name', groups: t==='Microsoft'?'groups':'groups' },
    domain_allowlist: [],
    active: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  const s = await getSettings();
  s.providers.unshift(base);
  await saveSettings(s);
  return base;
}

export async function updateProvider(id: UUID, patch: Partial<OIDCProvider>): Promise<OIDCProvider> {
  await delay();
  const s = await getSettings();
  const i = s.providers.findIndex(p => p.id===id);
  if (i<0) throw new Error('Not found');
  s.providers[i] = { ...s.providers[i], ...patch, id, updated_at: nowISO() };
  await saveSettings(s);
  return s.providers[i];
}

export async function deleteProvider(id: UUID): Promise<void> {
  await delay();
  const s = await getSettings();
  s.providers = s.providers.filter(p => p.id !== id);
  if (s.default_provider_id === id) s.default_provider_id = null;
  await saveSettings(s);
}

export async function setClientSecret(id: UUID, plaintext: string): Promise<void> {
  // For mock: do not store plaintext; only mark as set
  await delay();
  const s = await getSettings();
  const p = s.providers.find(x => x.id===id); if (!p) throw new Error('Not found');
  p.client_secret_set = true; p.updated_at = nowISO();
  await saveSettings(s);
}

export async function toggleProvider(id: UUID, active: boolean): Promise<void> {
  await delay();
  const s = await getSettings();
  const p = s.providers.find(x => x.id===id); if (!p) return;
  p.active = active; p.updated_at = nowISO();
  await saveSettings(s);
}

export async function setDefaultProvider(id: UUID | null): Promise<void> {
  await delay();
  const s = await getSettings();
  s.default_provider_id = id;
  await saveSettings(s);
}
