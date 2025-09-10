
// src/integrations/webhooks/mockStore.ts — localStorage-based store + simulated deliveries & HMAC preview
import type { WebhookSubscription, Delivery, UUID, EventType, Entity } from './types';

const LS_SUBS = 'erp.int.webhooks.subs.v1';
const LS_LOGS = 'erp.int.webhooks.logs.v1';

function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }

export const Entities: Entity[] = ['Expense','Requisition','PurchaseOrder','Invoice','Payment','Task','Project','Employee','Customer','Vendor'];

export function loadSubs(): WebhookSubscription[] {
  try { return JSON.parse(localStorage.getItem(LS_SUBS)||'[]'); } catch { return []; }
}
export function saveSubs(arr: WebhookSubscription[]){
  localStorage.setItem(LS_SUBS, JSON.stringify(arr));
}

export function listSubs(): WebhookSubscription[] { return loadSubs(); }

export function createSub(partial?: Partial<WebhookSubscription>): WebhookSubscription {
  const s: WebhookSubscription = {
    id: rid(), name: 'New subscription', active: true, targetUrl: 'https://example.com/webhooks/erp',
    secret: '', events: ['entity.created','entity.updated'], entity: 'Expense', filters: [], headers: [],
    contentType: 'application/json', version: '1.0', retry: { maxAttempts: 5, backoffSeconds: 30 },
    createdAt: nowISO(), updatedAt: nowISO()
  };
  const arr = loadSubs(); arr.unshift({ ...s, ...(partial||{}) }); saveSubs(arr); return arr[0];
}

export function updateSub(s: WebhookSubscription){
  const arr = loadSubs();
  const i = arr.findIndex(x => x.id===s.id);
  if (i>=0){ s.updatedAt = nowISO(); arr[i] = s; saveSubs(arr); }
}
export function deleteSub(id: UUID){
  const arr = loadSubs().filter(x => x.id!==id); saveSubs(arr);
  const logs = loadLogs().filter(x => x.subId!==id); saveLogs(logs);
}

export function loadLogs(): Delivery[] {
  try { return JSON.parse(localStorage.getItem(LS_LOGS)||'[]'); } catch { return []; }
}
export function saveLogs(arr: Delivery[]){
  localStorage.setItem(LS_LOGS, JSON.stringify(arr));
}

async function hmacSHA256(secret: string, payload: string): Promise<string>{
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
  // Stripe-like: t=timestamp,v1=signature
  const t = Math.floor(Date.now()/1000);
  return `t=${t},v1=${hex}`;
}

export function samplePayload(sub: WebhookSubscription, event: EventType){
  const body = {
    id: rid(),
    type: event,
    entity: sub.entity,
    occurred_at: nowISO(),
    data: {
      id: 'EX-' + Math.floor(Math.random()*9000+1000),
      amount: Math.floor(Math.random()*5_000_000+200_000),
      currency: 'VND',
      status: 'submitted',
      project: 'PRJ-A'
    }
  };
  return body;
}

export async function simulateDeliver(sub: WebhookSubscription, event: EventType): Promise<Delivery>{
  const t0 = performance.now();
  const payload = samplePayload(sub, event);
  const raw = JSON.stringify(payload);
  // compute signature if secret
  const signature = sub.secret ? await hmacSHA256(sub.secret, raw) : undefined;

  // Simulate network: random status & latency
  const latency = 80 + Math.floor(Math.random()*400);
  await new Promise(res => setTimeout(res, latency));
  const ok = Math.random() < 0.8; // 80% success
  const status = ok ? 200 : (Math.random()<0.5 ? 500 : 429);
  const durationMs = Math.round(performance.now() - t0);

  const d: Delivery = { id: rid(), subId: sub.id, at: nowISO(), durationMs, status, attempts: ok?1:Math.min(sub.retry.maxAttempts, 1 + Math.floor(Math.random()*sub.retry.maxAttempts)), event, payload, signature };
  const logs = loadLogs(); logs.unshift(d); saveLogs(logs);
  return d;
}

export function listLogsBySub(subId: UUID): Delivery[]{
  return loadLogs().filter(l => l.subId===subId);
}
