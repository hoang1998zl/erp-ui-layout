// src/mock/delegations.ts
export type UUID = string;

export type User = {
  id: UUID;
  name: string;
  email: string;
  active: boolean;
  dept_id?: string;
};

export type Scope = {
  modules: Array<'leave'|'timesheet'|'expense'|'purchase'|'general'>; // 'general' = all
  departments?: string[];   // limit to these dept_ids (optional)
};

export type DelegationRule = {
  id: UUID;
  owner_id: UUID;          // delegator
  delegate_id: UUID;       // receiver
  scope: Scope;
  start_date: string;      // ISO YYYY-MM-DD
  end_date: string;        // ISO YYYY-MM-DD (inclusive)
  include_weekends?: boolean;
  exclude_company_holidays?: boolean;
  only_when_ooo?: boolean; // only apply if owner is OOO (future extension; mock flag only)
  comment?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export type Query = {
  owner?: string;          // name/email contains
  delegate?: string;       // name/email contains
  status?: 'active'|'upcoming'|'expired'|'';
  module?: 'leave'|'timesheet'|'expense'|'purchase'|'general'|'';
  limit?: number;
  offset?: number;
  sort?: 'start_desc'|'start_asc'|'owner_asc'|'delegate_asc';
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_EMP = 'erp.dir.emps.v1';                 // from HR-07
const LS_DEL = 'erp.approvals.delegations.v1';    // this UI
const LS_HOL = 'erp.company.holidays.vn.v1';      // holidays

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function delay(ms=110){ return new Promise(res=>setTimeout(res, ms)); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function iso(d: Date){ return d.toISOString().slice(0,10); }
function asDate(isoDate: string){ return new Date(isoDate+'T00:00:00Z'); }

// Seed holidays (Vietnam sample; demo only)
(function seedHolidays(){
  if (localStorage.getItem(LS_HOL)) return;
  const year = new Date().getUTCFullYear();
  const hol = [
    { date: `${year}-01-01`, name:'New Year' },
    { date: `${year}-04-30`, name:'Reunification Day' },
    { date: `${year}-05-01`, name:'International Workers\' Day' },
    { date: `${year}-09-02`, name:'National Day' },
  ];
  localStorage.setItem(LS_HOL, JSON.stringify(hol));
})();

// Seed sample rules (if none)
(function seedRules(){
  if (localStorage.getItem(LS_DEL)) return;
  const emps: User[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const pick = () => emps[Math.floor(Math.random() * (emps.length||1))];
  const rows: DelegationRule[] = [];
  for (let i=0;i<6;i++){
    const a = pick() || { id:'a', name:'Alice', email:'alice@company.vn', active:true };
    const b = pick() || { id:'b', name:'Bob', email:'bob@company.vn', active:true };
    const start = new Date(); start.setUTCDate(start.getUTCDate() + i*7);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 5);
    rows.push({
      id: rid(),
      owner_id: a.id, delegate_id: b.id,
      scope: { modules: ['general'] },
      start_date: iso(start), end_date: iso(end),
      include_weekends: false, exclude_company_holidays: true,
      only_when_ooo: Math.random()<0.3,
      comment: 'Auto-seeded',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      created_by: 'seed@system', updated_by: 'seed@system'
    });
  }
  localStorage.setItem(LS_DEL, JSON.stringify(rows));
})();

export async function listUsers(q?: { search?: string; active_only?: boolean, limit?: number }): Promise<User[]> {
  await delay();
  let rows: User[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(u=>u.active);
  if (q?.search){
    const s = q.search.toLowerCase();
    rows = rows.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }
  return rows.slice(0, q?.limit || 50);
}

export async function getHolidays(): Promise<Array<{ date: string; name: string }>> {
  await delay();
  return JSON.parse(localStorage.getItem(LS_HOL) || '[]');
}

export function ruleStatus(r: DelegationRule): 'active'|'upcoming'|'expired' {
  const d = todayISO();
  if (d < r.start_date) return 'upcoming';
  if (d > r.end_date) return 'expired';
  return 'active';
}

export async function listRules(q: Query): Promise<Paged<DelegationRule>> {
  await delay();
  let rows: DelegationRule[] = JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  const users: User[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const findU = (id:string) => users.find(u=>u.id===id);
  // filter
  if (q.module) rows = rows.filter(r => r.scope.modules.includes(q.module!) || r.scope.modules.includes('general'));
  if (q.owner) { const s = q.owner.toLowerCase(); rows = rows.filter(r => { const u=findU(r.owner_id); return u && (u.name.toLowerCase().includes(s)||u.email.toLowerCase().includes(s)); }); }
  if (q.delegate) { const s = q.delegate.toLowerCase(); rows = rows.filter(r => { const u=findU(r.delegate_id); return u && (u.name.toLowerCase().includes(s)||u.email.toLowerCase().includes(s)); }); }
  if (q.status) rows = rows.filter(r => ruleStatus(r)===q.status);
  // sort
  switch(q.sort){
    case 'start_asc': rows = rows.slice().sort((a,b)=> a.start_date < b.start_date ? -1 : 1); break;
    case 'owner_asc': rows = rows.slice().sort((a,b)=> (findU(a.owner_id)?.name||'').localeCompare(findU(b.owner_id)?.name||'')); break;
    case 'delegate_asc': rows = rows.slice().sort((a,b)=> (findU(a.delegate_id)?.name||'').localeCompare(findU(b.delegate_id)?.name||'')); break;
    default: rows = rows.slice().sort((a,b)=> a.start_date < b.start_date ? 1 : -1);
  }
  const total = rows.length;
  const offset = q.offset || 0;
  const limit = q.limit || 20;
  return { rows: rows.slice(offset, offset+limit), total, limit, offset };
}

export async function getRule(id: UUID): Promise<DelegationRule | null> {
  await delay();
  const rows: DelegationRule[] = JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  return rows.find(r=>r.id===id) || null;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return !(aEnd < bStart || bEnd < aStart);
}

export async function upsertRule(payload: Omit<DelegationRule, 'id'|'created_at'|'updated_at'|'created_by'|'updated_by'> & { id?: string }, actor='admin@company.vn'): Promise<DelegationRule> {
  await delay();
  const rows: DelegationRule[] = JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  // constraint: owner != delegate
  if (payload.owner_id === payload.delegate_id) throw new Error('Owner and delegate cannot be the same');
  // constraint: no overlapping for same owner + module intersection unless include 'general' which conflicts with any
  const modSet = new Set(payload.scope.modules);
  const conflict = rows.find(r => r.id !== payload.id && r.owner_id===payload.owner_id && r.scope.modules.some(m => modSet.has('general') || m==='general' || modSet.has(m)) && overlaps(payload.start_date, payload.end_date, r.start_date, r.end_date));
  if (conflict) throw new Error('Overlapping delegation for same owner & scope');
  let out: DelegationRule;
  const now = new Date().toISOString();
  if (payload.id) {
    const idx = rows.findIndex(r=>r.id===payload.id);
    if (idx<0) throw new Error('Rule not found');
    rows[idx] = { ...rows[idx], ...payload as any, updated_at: now, updated_by: actor };
    out = rows[idx];
  } else {
    out = { ...(payload as any), id: rid(), created_at: now, updated_at: now, created_by: actor, updated_by: actor };
    rows.unshift(out);
  }
  localStorage.setItem(LS_DEL, JSON.stringify(rows));
  return out;
}

export async function deleteRule(id: UUID): Promise<void> {
  await delay();
  let rows: DelegationRule[] = JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  rows = rows.filter(r=>r.id!==id);
  localStorage.setItem(LS_DEL, JSON.stringify(rows));
}

export async function exportCSV(q: Query): Promise<Blob> {
  const res = await listRules({ ...q, offset:0, limit:10000 });
  const header = ['id','owner_id','delegate_id','modules','departments','start_date','end_date','include_weekends','exclude_company_holidays','only_when_ooo','comment','created_at','updated_at','created_by','updated_by'];
  const lines = [header.join(',')];
  res.rows.forEach(r => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([
      r.id, r.owner_id, r.delegate_id, r.scope.modules.join('|'), (r.scope.departments||[]).join('|'), r.start_date, r.end_date,
      r.include_weekends?'1':'0', r.exclude_company_holidays?'1':'0', r.only_when_ooo?'1':'0', r.comment||'',
      r.created_at, r.updated_at, r.created_by, r.updated_by
    ].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}

// What-if helper: given owner & onDate, decide who receives
export async function resolveDelegate(owner_id: string, onDateISO: string, module: 'leave'|'timesheet'|'expense'|'purchase'|'general'='general'): Promise<{ to: string|null; reason: string }> {
  const rows: DelegationRule[] = JSON.parse(localStorage.getItem(LS_DEL) || '[]');
  const d = onDateISO;
  const hit = rows.find(r => r.owner_id===owner_id
    && (r.scope.modules.includes(module) || r.scope.modules.includes('general'))
    && r.start_date <= d && d <= r.end_date);
  if (!hit) return { to: null, reason: 'No matching rule' };
  return { to: hit.delegate_id, reason: `Matched rule ${hit.id}` };
}
