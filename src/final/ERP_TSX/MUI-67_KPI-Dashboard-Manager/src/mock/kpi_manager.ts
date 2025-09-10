
// src/mock/kpi_manager.ts — compute KPIs for Manager dashboard
import { listBudgets } from './budget';
import { listActuals } from './expense_actual';
import { listPending } from './expense_pending';
import { listTasks, type Status } from './tasks';
import { listActivity } from './activity';

export type Filter = { year: number; dept: string; anchorISO?: string; approver?: string; assignee?: string };
export type KPI = {
  scope: string;
  budget: { total_budget: number; total_actual: number; util_pct: number; series: { month:number; budget:number; actual:number }[] };
  tasks: { total_open: number; by_status: { key:string; count:number }[]; overdue: number; overdue_top: { code:string; title:string; priority:string; due_date?:string; days_overdue:number }[] };
  pending: { count:number; amount:number; avg_age:number; top: { code:string; title:string; amount:number; age_days:number; approver:string }[] };
  active: { dau_series: { date:string; dau:number; wau:number }[]; active_7d:number };
};

const openStatuses = new Set<Status>(['todo','in_progress','review','on_hold','blocked']);

function startOfDayUTC(date: Date){ return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
function dateKey(d: Date){ return d.toISOString().slice(0,10); }
function daysDiff(a: Date, b: Date){ return Math.floor((a.getTime()-b.getTime())/(1000*3600*24)); }

export function kpiManager(f: Filter): KPI {
  const year = f.year;
  const dept = f.dept;
  // Budget vs Actual
  const budgets = listBudgets().filter(b => b.year===year && b.dept===dept);
  const actuals = listActuals().filter(a => new Date(a.date).getUTCFullYear()===year && a.dept===dept);
  const series = Array.from({length:12}, (_,i)=> ({ month:i+1, budget:0, actual:0 }));
  budgets.forEach(b => { series[b.month-1].budget += b.amount; });
  actuals.forEach(a => { const m = new Date(a.date).getUTCMonth()+1; series[m-1].actual += a.amount; });
  const total_budget = series.reduce((s,x)=> s+x.budget, 0);
  const total_actual = series.reduce((s,x)=> s+x.actual, 0);
  const util_pct = total_budget>0 ? (total_actual/total_budget)*100 : 0;

  // Tasks open & overdue
  const tasks = listTasks().filter(t => t.dept===dept && new Date(t.created_at).getUTCFullYear()===year);
  const open = tasks.filter(t => openStatuses.has(t.status));
  const now = new Date();
  const overdueList = open.filter(t => t.due_date && new Date(t.due_date) < now)
                          .map(t => ({ ...t, days_overdue: daysDiff(now, new Date(t.due_date!)) }))
                          .sort((a,b)=> b.days_overdue - a.days_overdue);
  const by_status_map = new Map<string, number>();
  ['todo','in_progress','review','on_hold','blocked'].forEach(s => by_status_map.set(s, 0));
  open.forEach(t => by_status_map.set(t.status, (by_status_map.get(t.status)||0)+1));
  const by_status = Array.from(by_status_map.entries()).map(([key,count])=> ({ key, count }));

  // Pending approvals
  const pend = listPending().filter(p => new Date(p.submitted_at).getUTCFullYear()===year && p.dept===dept)
                             .filter(p => !f.approver || p.approver===f.approver);
  const amount = pend.reduce((s,x)=> s+x.amount, 0);
  const ages = pend.map(p => daysDiff(now, new Date(p.submitted_at)));
  const avg_age = pend.length ? ages.reduce((s,x)=>s+x,0)/pend.length : 0;
  const topPend = [...pend].sort((a,b)=> b.amount - a.amount).slice(0,10)
    .map(p => ({ code:p.code, title:p.title, amount:p.amount, age_days: daysDiff(now, new Date(p.submitted_at)), approver:p.approver }));

  // Active users (DAU & WAU for last 30 days)
  const anchor = f.anchorISO ? new Date(f.anchorISO) : startOfDayUTC(new Date());
  const events = listActivity().filter(e => e.dept===dept);
  const seriesAU: { date:string; dau:number; wau:number }[] = [];
  const days=30;
  for (let i=days-1; i>=0; i--){
    const d = startOfDayUTC(new Date(anchor.getTime() - i*24*3600*1000));
    const dNext = new Date(d.getTime()+24*3600*1000-1);
    const wFrom = new Date(d.getTime()-6*24*3600*1000);
    const dayEvents = events.filter(e => { const t = new Date(e.ts); return t>=d && t<=dNext; });
    const dau = new Set(dayEvents.map(e => e.user)).size;
    const wau = new Set(events.filter(e => { const t=new Date(e.ts); return t>=wFrom && t<=dNext; }).map(e=>e.user)).size;
    seriesAU.push({ date: dateKey(d), dau, wau });
  }
  const windowFrom = new Date(anchor.getTime()-6*24*3600*1000);
  const active_7d = new Set(events.filter(e => { const t=new Date(e.ts); return t>=windowFrom && t<=new Date(anchor.getTime()+24*3600*1000-1); }).map(e=>e.user)).size;

  return {
    scope: `${dept}`,
    budget: { total_budget, total_actual, util_pct, series },
    tasks: { total_open: open.length, by_status, overdue: overdueList.length, overdue_top: overdueList.slice(0,10).map(t => ({ code:t.code, title:t.title, priority:t.priority, due_date:t.due_date, days_overdue:t.days_overdue })) },
    pending: { count: pend.length, amount, avg_age, top: topPend },
    active: { dau_series: seriesAU, active_7d }
  };
}
