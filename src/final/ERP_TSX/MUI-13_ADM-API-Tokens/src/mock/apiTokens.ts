// src/mock/apiTokens.ts
export type UUID = string;

export type Scope = {
  key: string;       // e.g., 'projects:read'
  label: string;
  group: string;     // e.g., 'Projects'
};

export type ApiToken = {
  id: UUID;
  name: string;
  prefix: string;           // showable id prefix, e.g., 'tok_3x4y...'
  scopes: string[];
  ip_whitelist: string[];   // CIDR or IPs
  active: boolean;
  created_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
};

export type CreateTokenInput = {
  name: string;
  scopes: string[];
  ip_whitelist?: string[];
  expires_in_days?: number | null; // null = never
};

export type CreateTokenResult = {
  token: ApiToken;
  plaintext: string; // show once
};

export type WebhookEndpoint = {
  id: UUID;
  url: string;
  events: string[];            // e.g., ['expense.submitted','task.completed']
  secret_prefix: string;       // e.g., 'whsec_...'
  active: boolean;
  created_at: string;
  last_delivery_status?: 'success'|'fail'|'none';
  last_delivery_at?: string | null;
  deliveries?: Array<{
    id: UUID;
    ts: string;
    event: string;
    status: number;            // http status
    duration_ms: number;
    success: boolean;
  }>;
};

export type CreateWebhookInput = {
  url: string;
  events: string[];
};

export type CreateWebhookResult = {
  endpoint: WebhookEndpoint;
  plaintext_secret: string; // show once
};

const delay = (ms=140)=> new Promise(res=>setTimeout(res, ms));

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function genToken(prefix='tok'): { plaintext: string; prefix: string } {
  const b = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('');
  const plain = `${prefix}_${b}`;
  return { plaintext: plain, prefix: plain.slice(0, 12) + '…' };
}
function genSecret(prefix='whsec'): { plaintext: string; prefix: string } {
  const b = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('');
  const plain = `${prefix}_${b}`;
  return { plaintext: plain, prefix: plain.slice(0, 14) + '…' };
}

const scopes: Scope[] = [
  { key:'projects:read', label:'Read projects', group:'Projects' },
  { key:'projects:write', label:'Write projects', group:'Projects' },
  { key:'tasks:read', label:'Read tasks', group:'Tasks' },
  { key:'tasks:write', label:'Write tasks', group:'Tasks' },
  { key:'documents:read', label:'Read documents', group:'Documents' },
  { key:'documents:write', label:'Write documents', group:'Documents' },
  { key:'finance:read', label:'Read finance', group:'Finance' },
  { key:'finance:write', label:'Write finance', group:'Finance' },
  { key:'users:read', label:'Read users', group:'Admin' },
  { key:'rbac:admin', label:'RBAC admin', group:'Admin' },
];

const tokens: ApiToken[] = [];
const webhooks: WebhookEndpoint[] = [];

// Seed data
(function seed(){
  const { plaintext, prefix } = genToken();
  tokens.push({
    id: rid(), name:'Integration Bot', prefix, scopes:['projects:read','tasks:read','documents:read'], ip_whitelist:[], active:true,
    created_at: new Date(Date.now()-1000*60*60*24*60).toISOString(),
    last_used_at: new Date(Date.now()-1000*60*60*2).toISOString(),
    expires_at: null,
  });
  const { plaintext: s1, prefix: p1 } = genSecret();
  webhooks.push({
    id: rid(), url:'https://example.com/webhooks/erp', events:['expense.submitted','task.completed'], secret_prefix: p1,
    active:true, created_at: new Date(Date.now()-1000*60*60*24*15).toISOString(), last_delivery_status:'success', last_delivery_at: new Date(Date.now()-1000*60*30).toISOString(),
    deliveries: []
  });
})();

export async function listScopes(): Promise<Scope[]> { await delay(); return scopes; }
export async function listTokens(): Promise<ApiToken[]> { await delay(); return tokens.slice().sort((a,b)=>a.created_at < b.created_at ? 1 : -1); }
export async function createToken(input: CreateTokenInput): Promise<CreateTokenResult> {
  await delay();
  const { plaintext, prefix } = genToken();
  const now = new Date();
  const expires_at = input.expires_in_days ? new Date(now.getTime()+input.expires_in_days*86400000).toISOString() : null;
  const t: ApiToken = {
    id: rid(),
    name: input.name,
    prefix,
    scopes: input.scopes,
    ip_whitelist: input.ip_whitelist || [],
    active: true,
    created_at: now.toISOString(),
    last_used_at: null,
    expires_at,
  };
  tokens.push(t);
  return { token: t, plaintext };
}
export async function revokeToken(id: UUID): Promise<void> {
  await delay();
  const t = tokens.find(x => x.id === id); if (!t) return;
  t.active = false;
}
export async function rotateToken(id: UUID): Promise<{ plaintext: string; prefix: string }> {
  await delay();
  const t = tokens.find(x => x.id === id); if (!t) throw new Error('Not found');
  const { plaintext, prefix } = genToken();
  t.prefix = prefix;
  return { plaintext, prefix };
}
export async function deleteToken(id: UUID): Promise<void> {
  await delay();
  const idx = tokens.findIndex(x => x.id === id);
  if (idx >= 0) tokens.splice(idx,1);
}

export async function listWebhooks(): Promise<WebhookEndpoint[]> { await delay(); return webhooks.slice().sort((a,b)=>a.created_at < b.created_at ? 1 : -1); }
export async function createWebhook(input: CreateWebhookInput): Promise<CreateWebhookResult> {
  await delay();
  const { plaintext, prefix } = genSecret();
  const ep: WebhookEndpoint = {
    id: rid(), url: input.url, events: input.events, secret_prefix: prefix, active: true, created_at: new Date().toISOString(),
    last_delivery_status: 'none', last_delivery_at: null, deliveries: []
  };
  webhooks.push(ep);
  return { endpoint: ep, plaintext_secret: plaintext };
}
export async function rotateWebhookSecret(id: UUID): Promise<{ plaintext: string; prefix: string }> {
  await delay();
  const ep = webhooks.find(x => x.id === id); if (!ep) throw new Error('Not found');
  const { plaintext, prefix } = genSecret();
  ep.secret_prefix = prefix;
  return { plaintext, prefix };
}
export async function toggleWebhook(id: UUID, active: boolean): Promise<void> {
  await delay();
  const ep = webhooks.find(x => x.id === id); if (!ep) return;
  ep.active = active;
}
export async function deleteWebhook(id: UUID): Promise<void> {
  await delay();
  const idx = webhooks.findIndex(x => x.id === id);
  if (idx >= 0) webhooks.splice(idx,1);
}
export async function sendTestDelivery(id: UUID, event='test.ping'): Promise<void> {
  await delay();
  const ep = webhooks.find(x => x.id === id); if (!ep) return;
  const ok = Math.random() > 0.15;
  const status = ok ? 200 : 500;
  const d = { id: rid(), ts: new Date().toISOString(), event, status, duration_ms: Math.floor(50+Math.random()*350), success: ok };
  ep.deliveries = [...(ep.deliveries || []), d].slice(-20);
  ep.last_delivery_status = ok ? 'success' : 'fail';
  ep.last_delivery_at = d.ts;
}

export async function exportJSON(): Promise<string> {
  await delay();
  const payload = {
    tokens: tokens.map(t => ({ ...t })),               // no plaintext secrets
    webhooks: webhooks.map(w => ({ ...w })),           // no plaintext secrets
  };
  return JSON.stringify(payload, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.tokens || !data.webhooks) throw new Error('Invalid JSON');
  (tokens as any).length = 0; data.tokens.forEach((t:any)=>tokens.push(t));
  (webhooks as any).length = 0; data.webhooks.forEach((w:any)=>webhooks.push({ ...w, deliveries: w.deliveries || [] }));
}
