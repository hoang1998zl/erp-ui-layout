
// src/mock/tasks.ts — simple task dataset for KPI widgets
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

const LS = 'erp.pm.tasks.kpi.v1';

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
    const count = 25 + Math.floor(Math.random()*25); // 25-50 tasks per month
    for (let i=0;i<count;i++){
      const created = iso(yr,m,1 + Math.floor(Math.random()*26));
      const dur = 3 + Math.floor(Math.random()*20);
      const due = iso(yr,m,Math.min(28, 1+dur+Math.floor(Math.random()*12)));
      const s = statuses[Math.floor(Math.random()*statuses.length)];
      const p = prios[Math.floor(Math.random()*prios.length)];
      const assignee = people[Math.floor(Math.random()*people.length)];
      const project = projs[Math.floor(Math.random()*projs.length)];
      const doneBias = Math.random() < 0.45;
      const status = doneBias ? (Math.random()<0.8 ? 'done' : s) : s;
      arr.push({
        id: rid(),
        code: `T-${seq.toString().padStart(4,'0')}`,
        title: `Task ${seq}`,
        project,
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
