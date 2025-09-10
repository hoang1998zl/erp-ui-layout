
// src/mock/delegation.ts
export type UUID = string;
export type PrincipalType = 'user'|'role';
export type TargetType = 'user'|'role';

export type Scope = {
  entity_types?: string[];        // e.g., ['expense_claim','purchase_request']
  stages?: string[];              // e.g., ['Finance Review']
  projects?: string[];            // optional
};

export type DelegationRule = {
  id: UUID;
  principal: { type: PrincipalType; ref: string }; // who is delegating (original approver or role)
  delegate_to: { type: TargetType; ref: string };  // new assignee
  scope?: Scope;                    // when to apply (entities/stages/projects)
  start_at?: string;                // ISO datetime
  end_at?: string;                  // ISO datetime
  active: boolean;                  // quick toggle
  priority?: number;                // larger wins
  reason?: string;
  notify?: boolean;                 // notify both sides on change/hit
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

export type SimPrincipal = { userId?: string; roles?: string[] };
export type SimTask = { entity_type?: string; stage_name?: string; project_id?: string; at?: string };

const LS = 'erp.app.delegations.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=40){ return new Promise(res=>setTimeout(res, ms)); }

export function seedIfEmpty() {
  try { const txt = localStorage.getItem(LS); if (txt) return; } catch {}
  const now = new Date();
  const addDays = (d:number)=> new Date(now.getTime()+d*86400000).toISOString();
  const rows: DelegationRule[] = [
    {
      id: rid(),
      principal: { type:'user', ref:'manager@corp.com' },
      delegate_to: { type:'user', ref:'backup@corp.com' },
      scope: { entity_types:['expense_claim','purchase_request'] },
      start_at: addDays(-1),
      end_at: addDays(5),
      active: true,
      priority: 100,
      reason: 'Annual leave',
      notify: true,
      created_by: 'admin', created_at: nowISO(), updated_at: nowISO()
    },
    {
      id: rid(),
      principal: { type:'role', ref:'Finance' },
      delegate_to: { type:'user', ref:'fin.approver@corp.com' },
      scope: { entity_types:['purchase_request'], stages:['Finance Review'] },
      active: true, priority: 50, reason: 'Month-end surge', notify: false,
      created_by: 'admin', created_at: nowISO(), updated_at: nowISO()
    }
  ];
  localStorage.setItem(LS, JSON.stringify(rows));
}

export function listRules(): DelegationRule[] {
  try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; }
}
export function saveRule(rule: DelegationRule): DelegationRule {
  const arr = listRules();
  const i = arr.findIndex(x => x.id===rule.id);
  rule.updated_at = nowISO();
  if (i>=0) arr[i] = rule; else { rule.created_at = nowISO(); arr.push(rule); }
  localStorage.setItem(LS, JSON.stringify(arr));
  return rule;
}
export function deleteRule(id: string): void {
  const arr = listRules().filter(x => x.id!==id);
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function newRule(): DelegationRule {
  return { id: rid(), principal:{ type:'user', ref:'' }, delegate_to:{ type:'user', ref:'' }, active:true, priority:10, scope:{ entity_types:[], stages:[], projects:[] }, start_at:'', end_at:'', reason:'', notify:true };
}

function withinWindow(r: DelegationRule, atISO?: string): boolean {
  const t = atISO ? new Date(atISO).getTime() : Date.now();
  const s = r.start_at ? new Date(r.start_at).getTime() : -Infinity;
  const e = r.end_at ? new Date(r.end_at).getTime() : Infinity;
  return t>=s && t<=e;
}
function matchesScope(r: DelegationRule, task: SimTask): boolean {
  const sc = r.scope || {};
  const okEntity = !sc.entity_types || sc.entity_types.length===0 || (task.entity_type && sc.entity_types.includes(task.entity_type));
  const okStage = !sc.stages || sc.stages.length===0 || (task.stage_name && sc.stages.includes(task.stage_name));
  const okProj = !sc.projects || sc.projects.length===0 || (task.project_id && sc.projects.includes(task.project_id));
  return okEntity && okStage && okProj;
}
function appliesToPrincipal(r: DelegationRule, p: SimPrincipal): boolean {
  if (r.principal.type==='user') return !!p.userId && p.userId.toLowerCase()===r.principal.ref.toLowerCase();
  // role
  const roles = (p.roles||[]).map(x => x.toLowerCase());
  return roles.includes(r.principal.ref.toLowerCase());
}
function specificityScore(r: DelegationRule): number {
  const sc = r.scope || {};
  const scopePoints = (sc.entity_types?.length||0) + (sc.stages?.length||0) + (sc.projects?.length||0);
  const principalPoints = r.principal.type==='user' ? 1000 : 100; // user‑specific outranks role
  return principalPoints + scopePoints*10 + (r.priority||0);
}

export type ResolveResult = { rule?: DelegationRule; to?: { type: TargetType; ref: string } | null; reason: string; candidates?: DelegationRule[] };

export function resolveDelegate(p: SimPrincipal, task: SimTask): ResolveResult {
  const at = task.at || nowISO();
  const candidates = listRules().filter(r => r.active && withinWindow(r, at) && appliesToPrincipal(r, p) && matchesScope(r, task));
  if (candidates.length===0) return { rule: undefined, to: null, reason: 'No matching rule', candidates: [] };
  candidates.sort((a,b) => specificityScore(b) - specificityScore(a));
  const best = candidates[0];
  return { rule: best, to: best.delegate_to, reason: 'Matched', candidates };
}

export function checkConflicts(rule: DelegationRule, ignoreId?: string): DelegationRule[] {
  // Conflict = same principal & overlapping time window & overlapping scope (entity or stage overlap)
  const arr = listRules().filter(r => r.id!==ignoreId);
  function overlap(a: DelegationRule, b: DelegationRule): boolean {
    if (a.principal.type!==b.principal.type || a.principal.ref.toLowerCase()!==b.principal.ref.toLowerCase()) return false;
    const sa = a.start_at? new Date(a.start_at).getTime(): -Infinity;
    const ea = a.end_at? new Date(a.end_at).getTime(): Infinity;
    const sb = b.start_at? new Date(b.start_at).getTime(): -Infinity;
    const eb = b.end_at? new Date(b.end_at).getTime(): Infinity;
    const timeOk = sa<=eb && sb<=ea;
    const sca = a.scope||{}, scb = b.scope||{};
    const entOk = (!sca.entity_types?.length || !scb.entity_types?.length) ? true
                  : sca.entity_types.some(x => scb.entity_types!.includes(x));
    const stageOk = (!sca.stages?.length || !scb.stages?.length) ? true
                  : sca.stages.some(x => scb.stages!.includes(x));
    return timeOk && (entOk || stageOk);
  }
  return arr.filter(r => overlap(rule, r));
}

// Optional: stub hook to HR‑09 Out‑of‑Office
export function hrIsOOO(userId: string, atISO?: string): boolean {
  // Mock: users containing "manager" are OOO during weekends
  const at = atISO ? new Date(atISO) : new Date();
  const isWeekend = [0,6].includes(at.getDay());
  return isWeekend && /manager/i.test(userId);
}
