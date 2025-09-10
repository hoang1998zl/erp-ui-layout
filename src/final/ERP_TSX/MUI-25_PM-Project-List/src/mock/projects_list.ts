// src/mock/projects_list.ts
export type UUID = string;

export type ProjectDraft = {
  id?: UUID;
  status: 'draft'|'submitted';
  general: {
    name: string;
    code?: string;
    client_id?: UUID;
    start_date?: string;
    end_date?: string;
    description?: string;
    project_type?: string;
    currency?: string;
  };
  wbs: Array<{ id: UUID; name: string; estimate_hours?: number; children: any[] }>;
  team: Array<{ employee_id: UUID; role: string; allocation_pct?: number; }>;
  budget: Array<{ category: string; description?: string; amount: number; }>;
  created_at: string;
  updated_at: string;
};

export type Employee = { id: UUID; name: string; email: string; title?: string; active: boolean; };
export type Client = { id: UUID; name: string; code?: string };

export type Query = {
  search?: string;           // name/code
  status?: 'draft'|'submitted'|'';
  client_id?: string;
  project_type?: string;     // Internal/External/Non-billable
  currency?: string;
  date_from?: string;        // overlaps [start,end]
  date_to?: string;
  pm_id?: string;
  sort?: 'updated_desc'|'start_asc'|'start_desc'|'name_asc'|'budget_desc';
  limit?: number;
  offset?: number;
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_PROJ = 'erp.pm.projects.v1';   // from UI #24
const LS_EMP  = 'erp.dir.emps.v1';      // from HR-07
const LS_CLIENTS = 'erp.crm.clients.v1';// from UI #24

export function sumHours(wbs: ProjectDraft['wbs']): number {
  const rec = (nodes: any[]): number => nodes.reduce((s,n)=> s + (n.estimate_hours||0) + rec(n.children||[]), 0);
  return rec(wbs as any);
}
export function sumBudget(budget: ProjectDraft['budget']): number {
  return (budget||[]).reduce((s,b)=> s + (Number(b.amount)||0), 0);
}
export function getPMId(team: ProjectDraft['team']): string|undefined {
  const pm = (team||[]).find(m => m.role==='Project Manager');
  return pm?.employee_id;
}

export async function listProjects(q: Query): Promise<Paged<ProjectDraft & { totals: { budget: number; hours: number }, pm_id?: string }>> {
  await new Promise(r=>setTimeout(r,110));
  let rows: ProjectDraft[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  // filter
  if (q.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(p => (p.general.name+' '+(p.general.code||'')).toLowerCase().includes(s));
  }
  if (q.status) rows = rows.filter(p => p.status===q.status);
  if (q.client_id) rows = rows.filter(p => p.general.client_id===q.client_id);
  if (q.project_type) rows = rows.filter(p => (p.general.project_type||'')===q.project_type);
  if (q.currency) rows = rows.filter(p => (p.general.currency||'')===q.currency);
  if (q.date_from || q.date_to) {
    const from = q.date_from || '0000-01-01';
    const to = q.date_to || '9999-12-31';
    rows = rows.filter(p => {
      const s = p.general.start_date || '9999-01-01';
      const e = p.general.end_date || '0000-01-01';
      // overlap check
      return !(e < from || to < s);
    });
  }
  if (q.pm_id) rows = rows.filter(p => getPMId(p.team)===q.pm_id);
  // sort
  switch (q.sort) {
    case 'start_asc': rows = rows.slice().sort((a,b)=> (a.general.start_date||'') < (b.general.start_date||'') ? -1 : 1); break;
    case 'start_desc': rows = rows.slice().sort((a,b)=> (a.general.start_date||'') < (b.general.start_date||'') ? 1 : -1); break;
    case 'name_asc': rows = rows.slice().sort((a,b)=> (a.general.name||'').localeCompare(b.general.name||'')); break;
    case 'budget_desc': rows = rows.slice().sort((a,b)=> sumBudget(b.budget) - sumBudget(a.budget)); break;
    default: rows = rows.slice().sort((a,b)=> (a.updated_at||'') < (b.updated_at||'') ? 1 : -1); // updated_desc
  }
  const total = rows.length;
  const offset = q.offset || 0;
  const limit = q.limit || 20;
  const out = rows.slice(offset, offset+limit).map(p => ({ ...p, totals: { budget: sumBudget(p.budget), hours: sumHours(p.wbs) }, pm_id: getPMId(p.team) }));
  return { rows: out, total, limit, offset };
}

export async function listClients(): Promise<Client[]> {
  await new Promise(r=>setTimeout(r,80));
  return JSON.parse(localStorage.getItem(LS_CLIENTS) || '[]');
}

export async function listEmployees(q?: { active_only?: boolean }): Promise<Employee[]> {
  await new Promise(r=>setTimeout(r,80));
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(e=>e.active);
  return rows;
}

export async function exportCSV(q: Query): Promise<Blob> {
  const res = await listProjects({ ...q, limit: 10000, offset: 0 });
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const clients: Client[] = JSON.parse(localStorage.getItem(LS_CLIENTS) || '[]');
  const findEmp = (id?:string) => emps.find(e=>e.id===id);
  const findClient = (id?:string) => clients.find(c=>c.id===id);
  const header = ['id','name','code','client','pm','status','start','end','currency','project_type','total_budget','total_hours','updated_at'];
  const lines = [header.join(',')];
  res.rows.forEach(p => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([
      p.id, p.general.name, p.general.code||'', findClient(p.general.client_id||'')?.name||'', findEmp(p.pm_id||'')?.name||'', p.status,
      p.general.start_date||'', p.general.end_date||'', p.general.currency||'', p.general.project_type||'',
      p.totals.budget, p.totals.hours, p.updated_at
    ].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}

// Saved views
export type SavedView = {
  id: UUID;
  name: string;
  query: Query;
  created_at: string;
  is_default?: boolean;
  pinned?: boolean;
};
const LS_VIEWS = 'erp.pm.project.views.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

export async function getViews(): Promise<SavedView[]> {
  await new Promise(r=>setTimeout(r,60));
  try { return JSON.parse(localStorage.getItem(LS_VIEWS) || '[]'); } catch { return []; }
}

export async function saveView(name: string, query: Query, makeDefault=false, pin=false): Promise<SavedView> {
  const views = await getViews();
  const v: SavedView = { id: rid(), name, query, created_at: new Date().toISOString(), is_default: makeDefault, pinned: pin };
  const rows = views.concat([v]);
  if (makeDefault) rows.forEach(x => { if (x.id!==v.id) x.is_default = false; });
  localStorage.setItem(LS_VIEWS, JSON.stringify(rows));
  return v;
}

export async function setDefault(viewId: string): Promise<void> {
  const rows = await getViews();
  rows.forEach(v => v.is_default = (v.id===viewId));
  localStorage.setItem(LS_VIEWS, JSON.stringify(rows));
}

export async function deleteView(viewId: string): Promise<void> {
  const rows = (await getViews()).filter(v => v.id!==viewId);
  localStorage.setItem(LS_VIEWS, JSON.stringify(rows));
}
