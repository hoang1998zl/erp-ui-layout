
// src/mock/kpi_overdue.ts — KPI aggregator for Overdue Tasks
import { listTasks, type Task, type Status } from './tasks';

const openStatuses = new Set<Status>(['todo','in_progress','blocked','review','on_hold']);

export type Filter = { year: number; project?: string; assignee?: string; priority?: string };
export type Bucket = { label: string; count: number };
export type OverdueRow = Task & { days_overdue: number };
export type KPIResult = {
  scope: string;
  total_overdue: number;
  avg_days: number;
  median_days: number;
  max_days: number;
  counts_by_priority: { key: string; count: number }[];
  counts_by_project: { key: string; count: number }[];
  counts_by_assignee: { key: string; count: number }[];
  buckets: Bucket[]; // 0-7, 8-14, 15-30, 31-60, >60
  list: OverdueRow[]; // sorted desc by days_overdue
};

function daysDiff(a: Date, b: Date){ return Math.floor((a.getTime() - b.getTime())/(1000*3600*24)); }

export function overdueKPI(f: Filter): KPIResult {
  const now = new Date();
  const tasks = listTasks().filter(t => new Date(t.created_at).getUTCFullYear() === f.year);
  const filtered = tasks
    .filter(t => openStatuses.has(t.status))
    .filter(t => !!t.due_date)
    .filter(t => new Date(t.due_date!) < now)
    .filter(t => !f.project || t.project===f.project)
    .filter(t => !f.assignee || t.assignee===f.assignee)
    .filter(t => !f.priority || t.priority===f.priority);
  const list = filtered.map(t => ({ ...t, days_overdue: daysDiff(now, new Date(t.due_date!)) }))
                       .sort((a,b) => b.days_overdue - a.days_overdue);
  const total_overdue = list.length;
  const days = list.map(x => x.days_overdue).sort((a,b)=>a-b);
  const avg = total_overdue ? (days.reduce((s,x)=>s+x,0)/total_overdue) : 0;
  const med = total_overdue ? (days[Math.floor((total_overdue-1)/2)]) : 0;
  const max = total_overdue ? days[days.length-1] : 0;

  const prios = ['critical','high','medium','low'];
  const counts_by_priority = prios.map(p => ({ key:p, count: list.filter(x => x.priority===p).length }));
  const projKeys = Array.from(new Set(list.map(x => x.project)));
  const counts_by_project = projKeys.map(k => ({ key:k, count: list.filter(x => x.project===k).length }))
                                    .sort((a,b)=> b.count - a.count);
  const people = Array.from(new Set(list.map(x => x.assignee||'—')));
  const counts_by_assignee = people.map(k => ({ key:k, count: list.filter(x => (x.assignee||'—')===k).length }))
                                   .sort((a,b)=> b.count - a.count);

  const bucketsSpec = [
    { label:'0–7', from:0, to:7 },
    { label:'8–14', from:8, to:14 },
    { label:'15–30', from:15, to:30 },
    { label:'31–60', from:31, to:60 },
    { label:'>60', from:61, to:10000 },
  ];
  const buckets = bucketsSpec.map(b => ({ label:b.label, count: list.filter(x => x.days_overdue>=b.from && x.days_overdue<=b.to).length }));

  const scope = f.project ? `Project ${f.project}` : (f.assignee ? `Assignee ${f.assignee}` : 'Tổng công ty');

  return { scope, total_overdue, avg_days: avg, median_days: med, max_days: max, counts_by_priority, counts_by_project, counts_by_assignee, buckets, list };
}
