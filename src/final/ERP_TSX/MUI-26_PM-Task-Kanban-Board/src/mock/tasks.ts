// src/mock/tasks.ts
export type UUID = string;

export type Employee = {
  id: UUID;
  name: string;
  email: string;
  title?: string;
  active: boolean;
};

export type Project = {
  id: UUID;
  name: string;
  code?: string;
};

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
  order?: number; // for sorting within column
};

export type Query = {
  search?: string;
  status?: Task['status'][];
  assignee_id?: string;
  project_id?: string;
  priority?: Task['priority'][];
  due_from?: string;
  due_to?: string;
  limit?: number;
  offset?: number;
};

export type BoardConfig = {
  swimlane: 'none'|'assignee'|'priority'|'project';
  wip: Record<Task['status'], number | null>;   // null = unlimited
  hard_block?: boolean; // block moves exceeding WIP
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_TASKS = 'erp.pm.tasks.v1';
const LS_PROJ  = 'erp.pm.projects.v1';
const LS_EMP   = 'erp.dir.emps.v1';
const LS_BOARD = 'erp.pm.kanban.board.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

const statuses: Task['status'][] = ['backlog','todo','in_progress','review','done'];

function seed() {
  if (!localStorage.getItem(LS_TASKS)) {
    const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
    const projs = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
    const pick = <T,>(arr:T[]): T|undefined => arr.length?arr[Math.floor(Math.random()*arr.length)]:undefined;
    const titles = [
      'Phân tích yêu cầu','Thiết kế UI','Xây dựng API','Viết test','Triển khai DevOps',
      'Tích hợp thanh toán','Tối ưu hiệu năng','Sửa lỗi đăng nhập','Refactor module',
      'Tạo tài liệu hướng dẫn','Họp khách hàng','Nghiệm thu sprint','Thiết lập CI/CD',
      'Thiết kế database','Phân quyền RBAC','Tối ưu truy vấn','Sửa xung đột merge'
    ];
    const prios: Task['priority'][] = ['low','medium','high','urgent'];
    const rows: Task[] = [];
    const now = new Date();
    for (let i=0;i<40;i++){
      const p = pick(projs);
      const a = pick(emps.filter(e=>e.active)) as Employee | undefined;
      const s = statuses[Math.floor(Math.random()*statuses.length)];
      const due = new Date(now); due.setDate(due.getDate() + Math.floor(Math.random()*30)-10);
      rows.push({
        id: rid(),
        project_id: p?.id,
        title: titles[Math.floor(Math.random()*titles.length)],
        description: 'Auto-seeded task',
        status: s,
        assignee_id: a?.id,
        priority: prios[Math.floor(Math.random()*prios.length)],
        due_date: due.toISOString().slice(0,10),
        estimate_hours: Math.floor(Math.random()*20)+1,
        logged_hours: Math.floor(Math.random()*10),
        labels: Math.random()<0.3 ? ['frontend'] : Math.random()<0.6 ? ['backend'] : ['ops'],
        created_at: nowISO(),
        updated_at: nowISO(),
        order: Math.floor(Math.random()*1000),
      });
    }
    localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  }
  if (!localStorage.getItem(LS_BOARD)) {
    const cfg: BoardConfig = {
      swimlane: 'none',
      wip: { backlog: null, todo: 8, in_progress: 5, review: 3, done: null },
      hard_block: false,
    };
    localStorage.setItem(LS_BOARD, JSON.stringify(cfg));
  }
}
seed();

export async function getBoardConfig(): Promise<BoardConfig> {
  await delay();
  try { return JSON.parse(localStorage.getItem(LS_BOARD) || '{}'); } catch { return { swimlane:'none', wip: { backlog:null,todo:null,in_progress:null,review:null,done:null }, hard_block:false }; }
}
export async function saveBoardConfig(cfg: BoardConfig): Promise<void> {
  await delay();
  localStorage.setItem(LS_BOARD, JSON.stringify(cfg));
}

export async function listTasks(q: Query): Promise<Paged<Task>> {
  await delay();
  let rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  // filter
  if (q.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(t => (t.title+' '+(t.description||'')+' '+(t.labels||[]).join(' ')).toLowerCase().includes(s));
  }
  if (q.status && q.status.length) rows = rows.filter(t => q.status!.includes(t.status));
  if (q.assignee_id) rows = rows.filter(t => t.assignee_id===q.assignee_id);
  if (q.project_id) rows = rows.filter(t => t.project_id===q.project_id);
  if (q.priority && q.priority.length) rows = rows.filter(t => q.priority!.includes(t.priority||'low'));
  if (q.due_from || q.due_to) {
    const from = q.due_from || '0000-01-01';
    const to = q.due_to || '9999-12-31';
    rows = rows.filter(t => {
      const d = t.due_date || '9999-12-31';
      return from <= d && d <= to;
    });
  }
  // sort by order within status, then updated_at desc
  rows = rows.slice().sort((a,b)=> (a.status===b.status ? (a.order||0)-(b.order||0) : 0) || ((a.updated_at||'') < (b.updated_at||'') ? 1 : -1));
  const total = rows.length;
  const offset = q.offset || 0;
  const limit = q.limit || 9999;
  return { rows: rows.slice(offset, offset+limit), total, limit, offset };
}

export async function moveTask(taskId: UUID, toStatus: Task['status'], newOrder?: number): Promise<Task | null> {
  await delay();
  const rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const idx = rows.findIndex(t => t.id===taskId);
  if (idx<0) return null;
  rows[idx].status = toStatus;
  rows[idx].order = newOrder ?? Date.now();
  rows[idx].updated_at = nowISO();
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[idx];
}

export async function upsertTask(payload: Partial<Task> & { id?: string }): Promise<Task> {
  await delay();
  let rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const now = nowISO();
  if (payload.id) {
    const i = rows.findIndex(t=>t.id===payload.id);
    if (i<0) throw new Error('Task not found');
    rows[i] = { ...rows[i], ...payload, updated_at: now } as Task;
  } else {
    const t: Task = {
      id: rid(),
      project_id: payload.project_id,
      title: payload.title || 'New task',
      description: payload.description || '',
      status: (payload.status as any) || 'todo',
      assignee_id: payload.assignee_id,
      priority: (payload.priority as any) || 'medium',
      due_date: payload.due_date,
      estimate_hours: payload.estimate_hours || 0,
      logged_hours: payload.logged_hours || 0,
      labels: payload.labels || [],
      created_at: now, updated_at: now, order: Date.now()
    };
    rows.unshift(t);
  }
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows.find(t=>t.id===payload.id) || rows[0];
}

export async function deleteTask(id: UUID): Promise<void> {
  await delay();
  let rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  rows = rows.filter(t=>t.id!==id);
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
}

export async function listEmployees(q?: { active_only?: boolean }): Promise<Employee[]> {
  await delay();
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(e=>e.active);
  return rows.slice(0, 200);
}

export async function listProjects(): Promise<Project[]> {
  await delay();
  const rows = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map((p:any)=>({ id:p.id, name:p.general?.name||'Project', code:p.general?.code||'' }));
}

export async function exportCSV(q: Query): Promise<Blob> {
  const res = await listTasks({ ...q, limit: 10000, offset: 0 });
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const projs: Project[] = await listProjects();
  const findEmp = (id?:string) => emps.find(e=>e.id===id);
  const findProj = (id?:string) => projs.find(p=>p.id===id);
  const header = ['id','project','title','status','assignee','priority','due_date','estimate_hours','logged_hours','labels','updated_at'];
  const lines = [header.join(',')];
  res.rows.forEach(t => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([
      t.id, (findProj(t.project_id)?.name||''), t.title, t.status, (findEmp(t.assignee_id||'')?.name||''), t.priority||'',
      t.due_date||'', t.estimate_hours||0, t.logged_hours||0, (t.labels||[]).join('|'), t.updated_at
    ].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}

export { statuses };
