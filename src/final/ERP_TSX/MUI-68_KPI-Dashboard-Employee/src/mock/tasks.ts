
// src/mock/tasks.ts — personal tasks dataset for Dashboard_Employee
export type UUID = string;
export type Status = 'todo'|'in_progress'|'blocked'|'review'|'on_hold'|'done';
export type Priority = 'low'|'medium'|'high'|'critical';
export type Task = {
  id: UUID;
  code: string;
  title: string;
  project: string;
  assignee: string;
  reporter?: string;
  status: Status;
  priority: Priority;
  created_at: string;
  due_date?: string;
};

const LS = 'erp.pm.tasks.personal.v1';

function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d,0,0,0)).toISOString(); }

export function seedTasksIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const projs = ['PRJ-A','PRJ-B','PRJ-C'];
  const people = ['lan','minh','an','john','hana','cuong','tuan'];
  const statuses: Status[] = ['todo','in_progress','blocked','review','on_hold','done'];
  const prios: Priority[] = ['low','medium','high','critical'];
  const arr: Task[] = [];
  let seq=1;
  for (let m=0;m<12;m++){
    const count = 30 + Math.floor(Math.random()*30); // 30-60 tasks per month
    for (let i=0;i<count;i++){
      const created = iso(yr,m,1 + Math.floor(Math.random()*26));
      const dur = 3 + Math.floor(Math.random()*20);
      const due = iso(yr,m,Math.min(28, 1+dur+Math.floor(Math.random()*10)));
      const status = statuses[Math.floor(Math.random()*statuses.length)];
      const priority = prios[Math.floor(Math.random()*prios.length)];
      const assignee = people[Math.floor(Math.random()*people.length)];
      arr.push({
        id: rid(),
        code: `T-${seq.toString().padStart(4,'0')}`,
        title: `Task ${seq}`,
        project: projs[Math.floor(Math.random()*projs.length)],
        assignee,
        reporter: 'pm',
        status,
        priority,
        created_at: created,
        due_date: due
      });
      seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listTasks(): Task[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
