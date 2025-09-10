
// src/mock/tasks.ts — tasks per dept
export type UUID = string;
export type Status = 'todo'|'in_progress'|'blocked'|'review'|'on_hold'|'done';
export type Priority = 'low'|'medium'|'high'|'critical';
export type Task = { id: UUID; code: string; title: string; dept: string; assignee?: string; status: Status; priority: Priority; created_at: string; due_date?: string };
const LS = 'erp.pm.tasks.v3';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d)).toISOString(); }
export function seedTasksIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const depts = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const prios: Priority[] = ['low','medium','high','critical'];
  const arr: Task[] = []; let seq=1;
  for (let m=0;m<12;m++){
    const n = 40 + Math.floor(Math.random()*30);
    for (let i=0;i<n;i++){
      const dept = depts[Math.floor(Math.random()*depts.length)];
      const created = iso(yr,m,1+Math.floor(Math.random()*27));
      const due = iso(yr,m,Math.min(28, 10+Math.floor(Math.random()*18)));
      const statusPool: Status[] = ['todo','in_progress','review','on_hold','blocked','done'];
      const status = statusPool[Math.floor(Math.random()*statusPool.length)];
      const priority = prios[Math.floor(Math.random()*prios.length)];
      arr.push({ id: rid(), code:`T-${String(seq).padStart(4,'0')}`, title:`Task ${seq}`, dept, assignee: `${dept.toLowerCase()}_${1+Math.floor(Math.random()*50)}`, status, priority, created_at: created, due_date: due });
      seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listTasks(): Task[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
