// src/mock/task_detail.ts
export type UUID = string;

export type Task = {
  id: UUID;
  project_id?: UUID;
  title: string;
  description?: string;
  status: 'backlog'|'todo'|'in_progress'|'review'|'done';
  assignee_id?: UUID;
  priority?: 'low'|'medium'|'high'|'urgent';
  due_date?: string; // YYYY-MM-DD
  estimate_hours?: number;
  logged_hours?: number;
  labels?: string[];
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: UUID;
  task_id: UUID;
  title: string;
  done: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: UUID;
  task_id: UUID;
  author_id: UUID;
  author_name: string;
  body: string;
  created_at: string;
};

export type Attachment = {
  id: UUID;
  task_id: UUID;
  filename: string;
  size: number;
  mime?: string;
  url?: string; // blob url (demo)
  uploaded_by: string;
  uploaded_at: string;
};

export type Employee = {
  id: UUID; name: string; email: string; title?: string; active: boolean;
};

const LS_TASKS = 'erp.pm.tasks.v1';         // from PM-03
const LS_SUB   = 'erp.pm.task.subtasks.v1'; // { [task_id]: Subtask[] }
const LS_CMT   = 'erp.pm.task.comments.v1'; // { [task_id]: Comment[] }
const LS_ATT   = 'erp.pm.task.attach.v1';   // { [task_id]: Attachment[] }
const LS_EMP   = 'erp.dir.emps.v1';         // from HR-07
const LS_PROJ  = 'erp.pm.projects.v1';      // from PM-01

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

function getMap<T>(key: string): Record<string, T[]> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function setMap<T>(key: string, map: Record<string, T[]>) {
  localStorage.setItem(key, JSON.stringify(map));
}

// --- Tasks ---
export async function getTask(id: string): Promise<Task | null> {
  await delay();
  const rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  return rows.find(t => t.id===id) || null;
}
export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  await delay();
  let rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const i = rows.findIndex(t => t.id===id);
  if (i<0) throw new Error('Task not found');
  rows[i] = { ...rows[i], ...patch, updated_at: nowISO() };
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[i];
}
export async function listEmployees(q?: { active_only?: boolean }): Promise<Employee[]> {
  await delay();
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(e=>e.active);
  return rows.slice(0, 200);
}
export async function listProjects(): Promise<Array<{ id: string; name: string }>> {
  await delay();
  const rows = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map((p:any)=>({ id:p.id, name:p.general?.name || p.id }));
}

// --- Subtasks ---
export async function listSubtasks(task_id: string): Promise<Subtask[]> {
  await delay();
  const map = getMap<Subtask>(LS_SUB);
  const arr = (map[task_id] || []).slice().sort((a,b)=> a.order - b.order);
  return arr;
}
export async function upsertSubtask(task_id: string, payload: Partial<Subtask> & { id?: string }): Promise<Subtask> {
  await delay();
  const map = getMap<Subtask>(LS_SUB);
  const rows = map[task_id] || [];
  const now = nowISO();
  if (payload.id) {
    const i = rows.findIndex(s=>s.id===payload.id);
    if (i<0) throw new Error('Subtask not found');
    rows[i] = { ...rows[i], ...payload, updated_at: now } as Subtask;
  } else {
    const s: Subtask = { id: rid(), task_id, title: payload.title || 'New subtask', done: !!payload.done, order: (rows[rows.length-1]?.order||0)+1, created_at: now, updated_at: now };
    rows.push(s);
  }
  map[task_id] = rows;
  setMap(LS_SUB, map);
  return rows.find(s=>s.id===payload.id) || rows[rows.length-1];
}
export async function reorderSubtasks(task_id: string, orderedIds: string[]): Promise<void> {
  await delay();
  const map = getMap<Subtask>(LS_SUB);
  const rows = map[task_id] || [];
  const id2 = new Map(rows.map(r => [r.id, r] as const));
  const now = nowISO();
  map[task_id] = orderedIds.map((id, idx) => ({ ...(id2.get(id) as Subtask), order: idx+1, updated_at: now }));
  setMap(LS_SUB, map);
}
export async function deleteSubtask(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap<Subtask>(LS_SUB);
  map[task_id] = (map[task_id] || []).filter(s => s.id!==id);
  setMap(LS_SUB, map);
}

// --- Comments ---
export async function listComments(task_id: string): Promise<Comment[]> {
  await delay();
  const map = getMap<Comment>(LS_CMT);
  return (map[task_id] || []).slice().sort((a,b)=> a.created_at < b.created_at ? -1 : 1);
}
export async function addComment(task_id: string, author: { id: string; name: string }, body: string): Promise<Comment> {
  await delay();
  const map = getMap<Comment>(LS_CMT);
  const rows = map[task_id] || [];
  const c: Comment = { id: rid(), task_id, author_id: author.id, author_name: author.name, body, created_at: nowISO() };
  rows.push(c); map[task_id]=rows; setMap(LS_CMT, map);
  return c;
}
export async function deleteComment(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap<Comment>(LS_CMT);
  map[task_id] = (map[task_id] || []).filter(c => c.id!==id);
  setMap(LS_CMT, map);
}

// --- Attachments (demo) ---
export async function listAttachments(task_id: string): Promise<Attachment[]> {
  await delay();
  const map = getMap<Attachment>(LS_ATT);
  return (map[task_id] || []).slice().sort((a,b)=> a.uploaded_at < b.uploaded_at ? 1 : -1);
}
export async function addAttachment(task_id: string, file: File, uploaded_by='demo@company.vn'): Promise<Attachment> {
  await delay();
  const map = getMap<Attachment>(LS_ATT);
  const rows = map[task_id] || [];
  const url = URL.createObjectURL(file);
  const a: Attachment = { id: rid(), task_id, filename: file.name, size: file.size, mime: file.type, url, uploaded_by, uploaded_at: nowISO() };
  rows.unshift(a); map[task_id]=rows; setMap(LS_ATT, map);
  return a;
}
export async function deleteAttachment(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap<Attachment>(LS_ATT);
  map[task_id] = (map[task_id] || []).filter(a => a.id!==id);
  setMap(LS_ATT, map);
}
