
// src/mock/kpi_employee.ts — compute "My dashboard" KPIs
import { listTasks, type Status } from './tasks';
import { listExpenses, amountGross } from './expenses';

const openStatuses = new Set<Status>(['todo','in_progress','review','on_hold','blocked']);

export type Filter = { user: string; year: number; project?: string };
export type KPI = {
  scope: string;
  tasks: {
    open: number;
    by_status: { key:string; count:number }[];
    overdue: number;
    due_next7: number;
    done_last7: number;
    upcoming: { code:string; title:string; due_date?:string; days_left:number; priority:string }[];
    overdue_top: { code:string; title:string; due_date?:string; days_overdue:number; priority:string }[];
  };
  expenses: {
    count: number;
    by_status: { key:string; count:number; amount:number }[];
    pending_amount: number;
    approved_amount: number;
    paid_amount: number;
    pending_top: { code:string; title:string; amount:number; age_days:number; approver?:string }[];
    last10: { code:string; title:string; status:string; amount:number; updated_at?:string }[];
  };
};

function daysDiff(a: Date, b: Date){ return Math.floor((a.getTime()-b.getTime())/(1000*3600*24)); }

export function employeeDashboard(f: Filter): KPI {
  const now = new Date();
  // Tasks
  const tasks = listTasks().filter(t => t.assignee===f.user && new Date(t.created_at).getUTCFullYear()===f.year)
                           .filter(t => !f.project || t.project===f.project);
  const open = tasks.filter(t => openStatuses.has(t.status));
  const overdue = open.filter(t => t.due_date && new Date(t.due_date) < now);
  const next7 = open.filter(t => t.due_date && new Date(t.due_date) >= now && daysDiff(new Date(t.due_date), now) <= 7);
  const done7 = tasks.filter(t => t.status==='done' && t.due_date && daysDiff(now, new Date(t.due_date)) <= 7);
  const by_status_keys = ['todo','in_progress','review','on_hold','blocked'];
  const by_status = by_status_keys.map(k => ({ key:k, count: open.filter(t => t.status===k).length }));
  const upcoming = open.filter(t => t.due_date && new Date(t.due_date) >= now).map(t => ({ ...t, days_left: daysDiff(new Date(t.due_date!), now) }))
                       .sort((a,b)=> a.days_left - b.days_left).slice(0,10)
                       .map(t => ({ code:t.code, title:t.title, due_date:t.due_date, days_left: t.days_left, priority: t.priority }));
  const overdue_top = overdue.map(t => ({ ...t, days_overdue: daysDiff(now, new Date(t.due_date!)) }))
                             .sort((a,b)=> b.days_overdue - a.days_overdue).slice(0,10)
                             .map(t => ({ code:t.code, title:t.title, due_date:t.due_date, days_overdue: t.days_overdue, priority: t.priority }));
  // Expenses
  const exps = listExpenses().filter(e => e.requester===f.user && new Date(e.created_at).getUTCFullYear()===f.year);
  const by_status_map = new Map<string, { count:number; amount:number }>();
  ['draft','submitted','pending','approved','rejected','paid'].forEach(s => by_status_map.set(s, { count:0, amount:0 }));
  exps.forEach(e => {
    const g = by_status_map.get(e.status)!;
    g.count += 1; g.amount += amountGross(e);
  });
  const by_status_exp = Array.from(by_status_map.entries()).map(([key, v]) => ({ key, count:v.count, amount:v.amount }));
  const pending = exps.filter(e => e.status==='pending' || e.status==='submitted');
  const pending_amount = pending.reduce((s,x)=> s+amountGross(x), 0);
  const approved_amount = exps.filter(e => e.status==='approved').reduce((s,x)=> s+amountGross(x), 0);
  const paid_amount = exps.filter(e => e.status==='paid').reduce((s,x)=> s+amountGross(x), 0);
  const pending_top = [...pending].sort((a,b)=> amountGross(b)-amountGross(a)).slice(0,10)
    .map(e => ({ code:e.code, title:e.title, amount: amountGross(e), age_days: e.submitted_at? daysDiff(now, new Date(e.submitted_at)) : 0, approver: e.approver }));
  const last10 = [...exps].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,10)
    .map(e => ({ code:e.code, title:e.title, status:e.status, amount: amountGross(e), updated_at: e.paid_at || e.approved_at || e.submitted_at || e.created_at }));

  return {
    scope: f.user,
    tasks: { open: open.length, by_status, overdue: overdue.length, due_next7: next7.length, done_last7: done7.length, upcoming, overdue_top },
    expenses: { count: exps.length, by_status: by_status_exp, pending_amount, approved_amount, paid_amount, pending_top, last10 }
  };
}
