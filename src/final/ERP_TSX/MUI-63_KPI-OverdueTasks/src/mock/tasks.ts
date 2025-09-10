
// src/mock/tasks.ts — dataset for KPI Overdue Tasks
export type UUID = string;
export type Status = 'todo'|'in_progress'|'blocked'|'review'|'on_hold'|'done';
export type Priority = 'low'|'medium'|'high'|'critical';
export type Task = {
  id: UUID;
  code: string;
  title: string;
  project: string;
  assignee?: string;
  reporter?: string;
  status: Status;
  priority: Priority;
  created_at: string;
  due_date?: string;
  tags?: string[];
};
const LS = 'erp.pm.tasks.kpi.v2';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d,0,0,0)).toISOString(); }
export function seedIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const now = new Date();
  const yr = now.getUTCFullYear();
  const projs = ['PRJ-A','PRJ-B','PRJ-C'];
  const people = ['lan','minh','an','john','hana'];
  const statuses: Status[] = ['todo','in_progress','blocked','review','on_hold','done'];
  const prios: Priority[] = ['low','medium','high','critical'];
  const arr: Task[] = [];
  let seq = 1;
  for (let m=0;m<12;m++){
    const count = 35 + Math.floor(Math.random()*25); // 35-60 tasks per month
    for (let i=0;i<count;i++){
      const created = iso(yr,m,1 + Math.floor(Math.random()*26));
      const duration = 5 + Math.floor(Math.random()*20);
      const dueDay = Math.min(28, 1 + duration + Math.floor(Math.random()*10));
      const due = iso(yr,m,dueDay);
      const s = statuses[Math.floor(Math.random()*statuses.length)];
      const p = prios[Math.floor(Math.random()*prios.length)];
      const assignee = people[Math.floor(Math.random()*people.length)];
      // push more open tasks than done, and ensure many past due
      const doneBias = Math.random() < 0.35;
      const status = doneBias ? 'done' : s;
      arr.push({
        id: rid(),
        code: `T-${seq.toString().padStart(4,'0')}`,
        title: `Task ${seq}`,
        project: projs[Math.floor(Math.random()*projs.length)],
        assignee,
        reporter: 'pm',
        status,
        priority: p,
        created_at: created,
        due_date: due,
        tags: []
      });
      seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listTasks(): Task[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveTasks(arr: Task[]){ localStorage.setItem(LS, JSON.stringify(arr)); }
export function updateTask(id: string, patch: Partial<Task>){
  const arr = listTasks(); const i = arr.findIndex(x=>x.id===id); if (i>=0){ arr[i] = { ...arr[i], ...patch }; saveTasks(arr); }
}
