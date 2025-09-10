// src/mock/audit.ts
export type UUID = string;

export type AuditEvent = {
  id: UUID;
  ts: string;                 // ISO timestamp
  actor: string;              // email or name
  action: string;             // e.g., 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
  entity_type?: string;       // e.g., 'Project', 'Task', 'Expense', 'Document', 'User'
  entity_id?: string;
  ip?: string;
  meta?: Record<string, any>; // arbitrary payload
};

export type Query = {
  from?: string;              // ISO date
  to?: string;                // ISO date (inclusive end-of-day handled in code)
  actor?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  contains?: string;          // free text search on meta/json
  limit?: number;             // preview limit
  offset?: number;
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

const actors = ['ceo@ktest.vn','manager@ktest.vn','emp1@ktest.vn','emp2@ktest.vn','fin@ktest.vn','hr@ktest.vn'];
const actions = ['LOGIN','LOGOUT','CREATE','UPDATE','DELETE','UPLOAD','DOWNLOAD','SUBMIT','APPROVE','REJECT'];
const entities = ['Project','Task','Expense','Document','User','Budget'];

const logs: AuditEvent[] = [];
(function seed(){
  const now = Date.now();
  for (let i=0;i<1200;i++){
    const d = new Date(now - Math.floor(Math.random()*1000*60*60*24*120)); // last 120 days
    const actor = actors[Math.floor(Math.random()*actors.length)];
    const action = actions[Math.floor(Math.random()*actions.length)];
    const et = Math.random()<0.9 ? entities[Math.floor(Math.random()*entities.length)] : undefined;
    const eid = et ? (et.substring(0,3).toUpperCase() + '-' + (1000 + (Math.random()*9000|0))) : undefined;
    logs.push({
      id: rid(),
      ts: d.toISOString(),
      actor, action,
      entity_type: et, entity_id: eid,
      ip: `10.0.${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*255)}`,
      meta: {
        message: `${action} ${et || ''} ${eid || ''}`.trim(),
        amount: Math.random()<0.2 ? Math.floor(Math.random()*9_000_000) : undefined,
      }
    });
  }
  logs.sort((a,b)=> a.ts < b.ts ? 1 : -1);
})();

function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }

export async function listActions(): Promise<string[]> { await delay(); return Array.from(new Set(logs.map(x=>x.action))).sort(); }
export async function listEntityTypes(): Promise<string[]> { await delay(); return Array.from(new Set(logs.map(x=>x.entity_type).filter(Boolean) as string[])).sort(); }
export async function listActors(): Promise<string[]> { await delay(); return Array.from(new Set(logs.map(x=>x.actor))).sort(); }

export async function queryAudit(q: Query): Promise<Paged<AuditEvent>> {
  await delay();
  let arr = logs.slice();
  const from = q.from ? new Date(q.from) : null;
  const to = q.to ? new Date(q.to) : null;
  if (from) arr = arr.filter(x => new Date(x.ts) >= from);
  if (to) {
    const end = new Date(to); end.setHours(23,59,59,999);
    arr = arr.filter(x => new Date(x.ts) <= end);
  }
  if (q.actor) arr = arr.filter(x => x.actor === q.actor);
  if (q.action) arr = arr.filter(x => x.action === q.action);
  if (q.entity_type) arr = arr.filter(x => x.entity_type === q.entity_type);
  if (q.entity_id) arr = arr.filter(x => (x.entity_id || '').toLowerCase().includes(q.entity_id!.toLowerCase()));
  if (q.contains) {
    const s = q.contains.toLowerCase();
    arr = arr.filter(x => JSON.stringify(x).toLowerCase().includes(s));
  }
  const total = arr.length;
  const offset = q.offset || 0;
  const limit = q.limit || 50;
  const rows = arr.slice(offset, offset + limit);
  return { rows, total, limit, offset };
}

export async function exportAudit(q: Query, format: 'csv'|'json'): Promise<Blob> {
  // For demo: export full result set (no limit), but cap at 50k rows to protect browser
  const full = await queryAudit({ ...q, limit: 50000, offset: 0 });
  if (format === 'json') {
    const text = JSON.stringify(full.rows, null, 2);
    return new Blob([text], { type:'application/json' });
  } else {
    const header = ['id','ts','actor','action','entity_type','entity_id','ip','meta'];
    const lines = [header.join(',')];
    full.rows.forEach(r => {
      const meta = JSON.stringify(r.meta || {});
      const esc = (v:any) => {
        if (v === undefined || v === null) return '';
        const s = String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
      };
      lines.push([esc(r.id), esc(r.ts), esc(r.actor), esc(r.action), esc(r.entity_type), esc(r.entity_id), esc(r.ip), esc(meta)].join(','));
    });
    const text = lines.join('\n');
    return new Blob([text], { type:'text/csv' });
  }
}
