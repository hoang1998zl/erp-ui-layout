// src/mock/wbs.ts
export type UUID = string;

export type Employee = { id: UUID; name: string; email?: string; title?: string; active: boolean };
export type TeamEntry = { employee_id: UUID; role: 'Owner'|'Manager'|'Member'; allocation_pct?: number };
export type Project = {
  id: UUID;
  general: { name: string; code?: string; };
  team?: TeamEntry[];
};

export type WbsType = 'phase' | 'deliverable' | 'work_package' | 'task' | 'milestone';

export type WbsNode = {
  id: UUID;
  project_id: UUID;
  parent_id: UUID | null;
  order: number;
  code: string;                 // auto numbering like 1.2.3
  name: string;
  type: WbsType;
  owner_id?: UUID;
  start_date?: string;          // YYYY-MM-DD
  finish_date?: string;         // YYYY-MM-DD
  effort_hours?: number;        // planned effort
  cost?: number;                // planned cost in project currency
  percent_complete?: number;    // 0..100
  status?: 'not_started' | 'in_progress' | 'done';
  predecessors?: UUID[];        // simple Finish-to-Start by default
  created_at: string;
  updated_at: string;
};

export type TreeNode = WbsNode & {
  children: TreeNode[];
  rollup?: {
    effort_hours: number;
    cost: number;
    percent_complete: number; // weighted by effort
    start_date?: string;      // min of subtree
    finish_date?: string;     // max of subtree
  };
};

const LS_WBS   = 'erp.pm.wbs.v1';        // Map<project_id, WbsNode[]>
const LS_PROJ  = 'erp.pm.projects.v1';   // from PM-01
const LS_EMPS  = 'erp.dir.emps.v1';      // from HR-07

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=80){ return new Promise(res=>setTimeout(res, ms)); }

function getMap(): Record<string, WbsNode[]> {
  try { return JSON.parse(localStorage.getItem(LS_WBS) || '{}'); } catch { return {}; }
}
function setMap(map: Record<string, WbsNode[]>) {
  localStorage.setItem(LS_WBS, JSON.stringify(map));
}

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
}
export async function listTeam(project_id: string): Promise<Employee[]> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMPS) || '[]');
  const p = rows.find(x => x.id===project_id);
  if (!p || !p.team || !emps.length) return [];
  const byId = new Map(emps.map(e => [e.id, e] as const));
  return p.team.map(t => byId.get(t.employee_id)).filter(Boolean) as Employee[];
}

function buildTree(rows: WbsNode[]): TreeNode[] {
  const byParent = new Map<string|null, WbsNode[]>();
  rows.forEach(r => {
    const k = (r.parent_id as any) || null;
    const arr = byParent.get(k) || [];
    arr.push(r);
    byParent.set(k, arr);
  });
  const attach = (parent_id: string|null, prefix: string): TreeNode[] => {
    const arr = (byParent.get(parent_id) || []).slice().sort((a,b)=> a.order - b.order);
    const out: TreeNode[] = [];
    arr.forEach((n, idx) => {
      const code = (prefix ? `${prefix}.${idx+1}` : `${idx+1}`);
      const ch = attach(n.id, code);
      const withCode: TreeNode = { ...n, code, children: ch };
      out.push(withCode);
    });
    return out;
  };
  // root has prefix ''
  const roots = attach(null, '');
  // compute rollups
  const compute = (arr: TreeNode[]) => {
    arr.forEach(n => {
      compute(n.children);
      const childRoll = n.children.reduce((acc, c) => ({
        effort_hours: acc.effort_hours + (c.rollup?.effort_hours || c.effort_hours || 0),
        cost: acc.cost + (c.rollup?.cost || c.cost || 0),
        start_date: minDate(acc.start_date, (c.rollup?.start_date || c.start_date)),
        finish_date: maxDate(acc.finish_date, (c.rollup?.finish_date || c.finish_date)),
        weight: acc.weight + (c.rollup?.effort_hours || c.effort_hours || 0)
      }), { effort_hours: 0, cost: 0, start_date: undefined as string|undefined, finish_date: undefined as string|undefined, weight: 0 });
      const selfEff = n.effort_hours || 0;
      const selfCost = n.cost || 0;
      const totalEff = selfEff + childRoll.effort_hours;
      const totalCost = selfCost + childRoll.cost;
      const pct = totalEff>0
        ? Math.round((( (n.percent_complete||0)/100 * selfEff ) + n.children.reduce((s,c)=> s + ((c.rollup?.percent_complete||c.percent_complete||0)/100) * (c.rollup?.effort_hours || c.effort_hours || 0), 0)) * 100 / totalEff)
        : 0;
      const sd = minDate(childRoll.start_date, n.start_date);
      const fd = maxDate(childRoll.finish_date, n.finish_date);
      n.rollup = { effort_hours: totalEff, cost: totalCost, percent_complete: pct, start_date: sd, finish_date: fd };
    });
  };
  compute(roots);
  return roots;
}
function minDate(a?: string, b?: string){ if (!a) return b; if (!b) return a; return a<b?a:b; }
function maxDate(a?: string, b?: string){ if (!a) return b; if (!b) return a; return a>b?a:b; }

export async function listWbs(project_id: string): Promise<TreeNode[]> {
  await delay();
  const map = getMap();
  const rows = (map[project_id] || []);
  return buildTree(rows);
}

export async function upsertNode(project_id: string, payload: Partial<WbsNode> & { id?: string; parent_id?: string | null }): Promise<WbsNode> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const now = nowISO();
  if (payload.id) {
    const i = rows.findIndex(n => n.id===payload.id);
    if (i<0) throw new Error('Node not found');
    rows[i] = { ...rows[i], ...payload, updated_at: now } as WbsNode;
  } else {
    const order = (rows.filter(r => (r.parent_id||null)===(payload.parent_id||null)).reduce((m,r)=>Math.max(m, r.order), 0)) + 1;
    const n: WbsNode = {
      id: rid(),
      project_id,
      parent_id: payload.parent_id || null,
      order,
      code: '', // regenerated in build
      name: payload.name || 'New item',
      type: (payload.type as any) || 'work_package',
      owner_id: payload.owner_id,
      start_date: payload.start_date,
      finish_date: payload.finish_date,
      effort_hours: payload.effort_hours || 0,
      cost: payload.cost || 0,
      percent_complete: payload.percent_complete || 0,
      status: payload.status || 'not_started',
      predecessors: payload.predecessors || [],
      created_at: now, updated_at: now
    };
    rows.push(n);
  }
  map[project_id] = rows; setMap(map);
  return rows.find(n=>n.id===(payload.id||'')) || rows[rows.length-1];
}

export async function deleteNode(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const toDelete = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop() as string;
    toDelete.add(cur);
    rows.filter(r => r.parent_id===cur).forEach(ch => stack.push(ch.id));
  }
  map[project_id] = rows.filter(r => !toDelete.has(r.id));
  setMap(map);
}

export async function reorderUp(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<=0) return;
  const prev = sibs[idx-1];
  const tmp = me.order; me.order = prev.order; prev.order = tmp;
  me.updated_at = nowISO(); prev.updated_at = nowISO();
  setMap({ ...map, [project_id]: rows });
}
export async function reorderDown(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<0 || idx>=sibs.length-1) return;
  const next = sibs[idx+1];
  const tmp = me.order; me.order = next.order; next.order = tmp;
  me.updated_at = nowISO(); next.updated_at = nowISO();
  setMap({ ...map, [project_id]: rows });
}

export async function indentNode(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<=0) return;
  const newParent = sibs[idx-1].id;
  me.parent_id = newParent;
  me.order = rows.filter(r => (r.parent_id||null)===newParent).reduce((m,r)=>Math.max(m,r.order),0)+1;
  me.updated_at = nowISO();
  setMap({ ...map, [project_id]: rows });
}
export async function outdentNode(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const parent = rows.find(r => r.id===me.parent_id);
  if (!parent) return;
  me.parent_id = parent.parent_id || null;
  me.order = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).reduce((m,r)=>Math.max(m,r.order),0)+1;
  me.updated_at = nowISO();
  setMap({ ...map, [project_id]: rows });
}

export async function importFromSubtask(project_id: string): Promise<number> {
  await delay();
  const SUBTREE = 'erp.pm.task.subtree.v1'; // from PM-06
  const map = getMap();
  const rows = map[project_id] || [];
  if (rows.length) return 0; // avoid overriding existing WBS
  const sub: Record<string, any[]> = JSON.parse(localStorage.getItem(SUBTREE) || '{}');
  const taskIds = Object.keys(sub);
  if (!taskIds.length) return 0;
  const task_id = taskIds[0];
  const flat: any[] = sub[task_id] || [];
  // Convert flat with parent_id/order preserved
  const convert = (arr: any[]) => arr.map((n:any) => ({
    id: n.id,
    project_id,
    parent_id: n.parent_id || null,
    order: n.order || 1,
    code: '',
    name: n.title || 'Item',
    type: 'work_package',
    owner_id: n.assignee_id,
    start_date: n.due_date, // best-effort
    finish_date: n.due_date,
    effort_hours: n.estimate_hours || 0,
    cost: 0,
    percent_complete: n.done ? 100 : 0,
    status: n.done ? 'done' : 'not_started',
    predecessors: [],
    created_at: n.created_at || nowISO(),
    updated_at: n.updated_at || nowISO()
  }));
  const converted = convert(flat);
  map[project_id] = converted;
  setMap(map);
  return converted.length;
}

export async function exportCSV(project_id: string): Promise<Blob> {
  await delay();
  const tree = await listWbs(project_id);
  const header = ['code','name','type','owner','start_date','finish_date','effort_hours','cost','percent_complete','status','predecessors'];
  const lines = [header.join(',')];
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMPS) || '[]');
  const byId = new Map(emps.map(e=>[e.id, e.name||e.id] as const));
  const walk = (arr: TreeNode[]) => arr.forEach(n => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([n.code, n.name, n.type, (n.owner_id? byId.get(n.owner_id) : ''), n.start_date||'', n.finish_date||'', n.effort_hours||0, n.cost||0, n.percent_complete||0, n.status||'', (n.predecessors||[]).join('|')].map(esc).join(','));
    walk(n.children||[]);
  });
  walk(tree);
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}

export async function exportJSON(project_id: string): Promise<Blob> {
  await delay();
  const tree = await listWbs(project_id);
  const clean = (arr: TreeNode[]) => arr.map(n => ({ code: n.code, name: n.name, type: n.type, owner_id: n.owner_id, start_date: n.start_date, finish_date: n.finish_date, effort_hours: n.effort_hours||0, cost: n.cost||0, percent_complete: n.percent_complete||0, status: n.status, predecessors: n.predecessors||[], children: clean(n.children) }));
  return new Blob([JSON.stringify(clean(tree), null, 2)], { type:'application/json' });
}
