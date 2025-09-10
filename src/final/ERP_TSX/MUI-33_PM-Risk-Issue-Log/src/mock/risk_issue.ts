// src/mock/risk_issue.ts
export type UUID = string;

export type Employee = { id: UUID; name: string; email?: string; title?: string; active: boolean };
export type Project = { id: UUID; general: { name: string; code?: string } };

export type RiiType = 'risk'|'issue';
export type RiiStatus = 'open'|'in_progress'|'mitigated'|'resolved'|'closed';
export type SeverityBand = 'low'|'medium'|'high'|'critical';

export type RiskIssue = {
  id: UUID;
  project_id: UUID;
  type: RiiType;
  title: string;
  description?: string;
  category?: string;
  owner_id?: UUID;
  status: RiiStatus;
  identified_on?: string;  // YYYY-MM-DD
  due_date?: string;       // target/resolve date
  likelihood: number;      // 1..5
  impact: number;          // 1..5
  score: number;           // computed = likelihood * impact
  severity: SeverityBand;  // computed from score
  related_wbs_id?: UUID;
  related_task_id?: UUID;
  labels?: string[];
  created_at: string;
  updated_at: string;
};

const LS_PROJ = 'erp.pm.projects.v1';     // PM-01
const LS_EMP  = 'erp.dir.emps.v1';        // HR directory
const LS_RI   = 'erp.pm.risk_issue.v1';   // Map<project_id, RiskIssue[]>

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

function getMap(): Record<string, RiskIssue[]> {
  try { return JSON.parse(localStorage.getItem(LS_RI) || '{}'); } catch { return {}; }
}
function setMap(map: Record<string, RiskIssue[]>) {
  localStorage.setItem(LS_RI, JSON.stringify(map));
}

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
}

export async function listEmployees(): Promise<Employee[]> {
  await delay();
  try { return JSON.parse(localStorage.getItem(LS_EMP) || '[]'); } catch { return []; }
}

export function bandFromScore(score: number): SeverityBand {
  if (score >= 17) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5)  return 'medium';
  return 'low';
}

export async function listItems(project_id: string): Promise<RiskIssue[]> {
  await delay();
  const map = getMap();
  const rows = (map[project_id] || []).slice().sort((a,b)=> (a.score===b.score ? (a.created_at > b.created_at ? -1:1) : b.score - a.score));
  return rows;
}

export async function upsertItem(project_id: string, payload: Partial<RiskIssue> & { id?: string }): Promise<RiskIssue> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  const now = nowISO();
  const compute = (l: number|undefined, i: number|undefined) => {
    const likelihood = Math.max(1, Math.min(5, Math.round(l||1)));
    const impact = Math.max(1, Math.min(5, Math.round(i||1)));
    const score = likelihood * impact;
    const severity = bandFromScore(score);
    return { likelihood, impact, score, severity };
  };
  if (payload.id) {
    const i = rows.findIndex(r => r.id===payload.id);
    if (i<0) throw new Error('Item not found');
    const cur = rows[i];
    const calc = compute(payload.likelihood ?? cur.likelihood, payload.impact ?? cur.impact);
    rows[i] = { ...cur, ...payload, ...calc, updated_at: now } as RiskIssue;
  } else {
    const calc = compute(payload.likelihood, payload.impact);
    const n: RiskIssue = {
      id: rid(),
      project_id,
      type: (payload.type as any) || 'risk',
      title: payload.title || 'New item',
      description: payload.description || '',
      category: payload.category || '',
      owner_id: payload.owner_id,
      status: (payload.status as any) || 'open',
      identified_on: payload.identified_on || now.slice(0,10),
      due_date: payload.due_date,
      likelihood: calc.likelihood,
      impact: calc.impact,
      score: calc.score,
      severity: calc.severity,
      related_wbs_id: payload.related_wbs_id,
      related_task_id: payload.related_task_id,
      labels: payload.labels || [],
      created_at: now, updated_at: now
    };
    rows.push(n);
  }
  map[project_id] = rows; setMap(map);
  return rows.find(r => r.id===(payload.id||'')) || rows[rows.length-1];
}

export async function deleteItem(project_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[project_id] || [];
  map[project_id] = rows.filter(r => r.id!==id);
  setMap(map);
}

export async function exportCSV(project_id: string): Promise<Blob> {
  await delay();
  const rows = await listItems(project_id);
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const byId = new Map(emps.map(e => [e.id, e.name||e.id] as const));
  const header = ['id','type','title','status','owner','identified_on','due_date','likelihood','impact','score','severity','category','labels'];
  const lines = [header.join(',')];
  const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
  rows.forEach(r => {
    lines.push([r.id, r.type, r.title, r.status, (r.owner_id? byId.get(r.owner_id) : ''), r.identified_on||'', r.due_date||'', r.likelihood, r.impact, r.score, r.severity, r.category||'', (r.labels||[]).join('|')].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}

export async function exportJSON(project_id: string): Promise<Blob> {
  await delay();
  const rows = await listItems(project_id);
  return new Blob([JSON.stringify(rows, null, 2)], { type:'application/json' });
}

export type HeatCell = { likelihood: number; impact: number; score: number; severity: SeverityBand; count: number };
export async function heatmap(project_id: string): Promise<HeatCell[]> {
  await delay();
  const rows = await listItems(project_id);
  const grid: HeatCell[] = [];
  for (let l=1; l<=5; l++) for (let i=1; i<=5; i++) {
    const score = l*i; const severity = bandFromScore(score);
    const count = rows.filter(r => r.likelihood===l && r.impact===i && r.type==='risk').length;
    grid.push({ likelihood: l, impact: i, score, severity, count });
  }
  return grid;
}
