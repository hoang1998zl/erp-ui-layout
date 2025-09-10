
// src/mock/kpi_tasks.ts — KPI aggregator for OpenTasksByStatus
import { listTasks, type Task, type Status, type Priority } from './tasks';

export type Filter = { year: number; project?: string; assignee?: string; only_overdue?: boolean };
export type Bucket = { key: string; count: number };
export type KPIResult = {
  scope: string;
  total_open: number;
  by_status: Bucket[];
  by_priority: Bucket[];
  overdue_top: Task[]; // top 10 overdue
};

const statusOrder: Status[] = ['todo','in_progress','review','on_hold','blocked','done'];
const openStatuses = new Set<Status>(['todo','in_progress','review','on_hold','blocked']);

export function openTasksByStatus(f: Filter): KPIResult{
  const tasks = listTasks();
  const yr = f.year;
  const filtered = tasks.filter(t => new Date(t.created_at).getUTCFullYear()===yr)
    .filter(t => !f.project || t.project===f.project)
    .filter(t => !f.assignee || t.assignee===f.assignee);

  const open = filtered.filter(t => openStatuses.has(t.status));
  const now = new Date();
  const overdue = open.filter(t => t.due_date ? (new Date(t.due_date) < now) : false)
                      .sort((a,b) => (new Date(a.due_date||0).getTime()) - (new Date(b.due_date||0).getTime()));

  const by_status = statusOrder.filter(s => openStatuses.has(s)).map(s => ({ key:s, count: open.filter(t => t.status===s).length }));
  const by_priority = ['critical','high','medium','low'].map(p => ({ key:p, count: open.filter(t => t.priority===p).length }));

  const scope = f.project ? `Project ${f.project}` : (f.assignee ? `Assignee ${f.assignee}` : 'Tổng công ty');

  return {
    scope,
    total_open: open.length,
    by_status,
    by_priority,
    overdue_top: overdue.slice(0,10)
  };
}
