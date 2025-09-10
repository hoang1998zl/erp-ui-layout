// src/mock/workflow.ts
export type UUID = string;

export type Category3 = 'todo'|'in_progress'|'done';

export type WFStatus = {
  id: UUID;
  name: string;         // e.g., Backlog, In progress, Review, Done
  category: Category3;  // map to canonical (for metrics & reporting)
  color?: string;       // hex
  wip?: number | null;  // null = ∞
  is_default?: boolean; // default status for new task
  order: number;        // for column ordering
};

export type WFTransition = {
  from: UUID;
  to: UUID;
};

export type Workflow = {
  id: UUID;               // workflow id (project_id or 'default')
  project_id?: UUID|null; // undefined/null => default
  statuses: WFStatus[];
  transitions: WFTransition[];
  rules?: {
    require_comment_to_done?: boolean;
    lock_after_done?: boolean;
  };
  updated_at: string;
  created_at: string;
};

export type Project = { id: UUID; name: string; code?: string };

const LS_WF   = 'erp.pm.workflows.v1';     // Map<id, Workflow> where id = project_id or 'default'
const LS_PROJ = 'erp.pm.projects.v1';
const LS_TASK = 'erp.pm.tasks.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

function getWFMap(): Record<string, Workflow> {
  try { return JSON.parse(localStorage.getItem(LS_WF) || '{}'); } catch { return {}; }
}
function setWFMap(map: Record<string, Workflow>) {
  localStorage.setItem(LS_WF, JSON.stringify(map));
}

function defaultStatuses(): WFStatus[] {
  return [
    { id: rid(), name:'Backlog',     category:'todo',         color:'#e5e7eb', wip: null, is_default:true,  order: 1 },
    { id: rid(), name:'To do',       category:'todo',         color:'#bfdbfe', wip: 10,   is_default:false, order: 2 },
    { id: rid(), name:'In progress', category:'in_progress',  color:'#fde68a', wip: 5,    is_default:false, order: 3 },
    { id: rid(), name:'Review',      category:'in_progress',  color:'#c7d2fe', wip: 3,    is_default:false, order: 4 },
    { id: rid(), name:'Done',        category:'done',         color:'#bbf7d0', wip: null, is_default:false, order: 5 },
  ];
}
function defaultTransitions(statuses: WFStatus[]): WFTransition[] {
  // Allow move forward/backward adjacent + any -> Done
  const id = (name:string) => statuses.find(s=>s.name.toLowerCase()===name.toLowerCase())?.id || statuses[0].id;
  const flow = ['Backlog','To do','In progress','Review','Done'].map(id);
  const ts: WFTransition[] = [];
  for (let i=0;i<flow.length;i++){
    for (let j=0;j<flow.length;j++){
      if (i===j) continue;
      if (Math.abs(i-j)===1 || j===flow.length-1) ts.push({ from: flow[i], to: flow[j] });
    }
  }
  return ts;
}

export async function listProjects(): Promise<Project[]> {
  await delay();
  const rows = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map((p:any)=>({ id:p.id, name:p.general?.name||'Project', code:p.general?.code||'' }));
}

export async function getWorkflow(project_id?: string | null): Promise<Workflow> {
  await delay();
  const map = getWFMap();
  const key = project_id || 'default';
  let wf = map[key];
  if (!wf) {
    // fall back to default, or seed a new default
    wf = map['default'];
    if (!wf) {
      const sts = defaultStatuses();
      wf = { id: 'default', project_id: null, statuses: sts, transitions: defaultTransitions(sts), rules: { require_comment_to_done: false, lock_after_done: true }, created_at: nowISO(), updated_at: nowISO() };
      map['default'] = wf; setWFMap(map);
    }
    if (project_id) {
      // Create project-specific by copying default
      const dup: Workflow = { ...wf, id: project_id, project_id, statuses: wf.statuses.map(s=>({ ...s, id: rid() })), transitions: wf.transitions.map(t=>({ from: wf.statuses.findIndex(s=>s.id===t.from), to: wf.statuses.findIndex(s=>s.id===t.to) })).map(idx => ({ from: dupIndex(idx.from), to: dupIndex(idx.to) })), created_at: nowISO(), updated_at: nowISO() };
      function dupIndex(i:number){ return (dup.statuses[i]||dup.statuses[0]).id; }
      map[project_id] = dup; setWFMap(map);
      wf = dup;
    }
  }
  return wf;
}

export async function saveWorkflow(wf: Workflow): Promise<Workflow> {
  await delay();
  wf.updated_at = nowISO();
  const map = getWFMap();
  map[wf.id] = wf;
  setWFMap(map);
  return wf;
}

export type TaskRow = { id:string; project_id?:string; status?:string; title:string };
export async function suggestFromTasks(project_id?: string | null): Promise<{ statuses: WFStatus[], map: Record<string,string> }> {
  await delay();
  const tasks: TaskRow[] = JSON.parse(localStorage.getItem(LS_TASK) || '[]');
  const filtered = project_id ? tasks.filter(t=>t.project_id===project_id) : tasks;
  const uniq = Array.from(new Set(filtered.map(t => (t.status||'todo').toLowerCase())));
  const sts: WFStatus[] = (uniq.length? uniq : ['backlog','todo','in_progress','review','done']).map((name, idx) => ({
    id: rid(),
    name: beautify(name),
    category: mapTo3(name),
    color: pickColor(mapTo3(name)),
    wip: name==='in_progress'?5 : name==='review'?3 : null,
    is_default: name==='backlog' || name==='todo',
    order: idx+1,
  }));
  const map: Record<string,string> = {};
  uniq.forEach(u => { const target = sts.find(s => s.name.toLowerCase()===beautify(u).toLowerCase()); if (target) map[u] = target.id; });
  return { statuses: sts, map };
}
function beautify(k:string){ return k.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase()); }
function mapTo3(name:string): Category3 {
  const n = name.toLowerCase();
  if (n.includes('done')||n.includes('closed')||n==='resolved') return 'done';
  if (n.includes('progress')||n==='review'||n.includes('qa')) return 'in_progress';
  return 'todo';
}
function pickColor(cat: Category3): string {
  switch(cat){
    case 'done': return '#bbf7d0';
    case 'in_progress': return '#fde68a';
    default: return '#bfdbfe';
  }
}

// Migration (optional): remap existing tasks' status to first matching status name
export async function migrateTaskStatuses(project_id: string | null, mapping: Record<string, string>): Promise<number> {
  await delay();
  let rows: any[] = JSON.parse(localStorage.getItem(LS_TASK) || '[]');
  let count = 0;
  rows = rows.map(t => {
    if (project_id && t.project_id!==project_id) return t;
    const k = (t.status||'').toLowerCase();
    if (mapping[k]) { count++; return { ...t, status: mapping[k] }; }
    return t;
  });
  localStorage.setItem(LS_TASK, JSON.stringify(rows));
  return count;
}
