
// src/mock/kpis.ts — build KPI Budget vs Actual from budgets + approved expenses
import { listBudgets, type BudgetRow } from './budget';
import { listApproved, type Expense } from './expense';

export type Period = { year: number; month?: number }; // year view or monthly breakdown
export type KPIInput = { year: number; dim?: 'overall'|'cost_center'|'project'; key?: string }; // key is cc or project
export type KPIBucket = { month: number; budget: number; actual: number };
export type KPIResult = {
  scope: string;           // description of current scope
  year: number;
  series: KPIBucket[];     // 12 buckets
  total_budget: number;
  total_actual: number;
  variance: number;        // actual - budget
  variance_pct: number;    // (actual/budget -1)*100
  by_dim: { key: string; budget: number; actual: number; variance: number; variance_pct: number }[]; // for top overspend
};

function monthIdx(d: string){ const dt = new Date(d); return dt.getUTCMonth()+1; }
function sum(arr:number[]){ return arr.reduce((a,b)=>a+b,0); }

export function budgetVsActual(input: KPIInput): KPIResult {
  const year = input.year;
  const budgets = listBudgets().filter(b => b.year === year);
  const exps = listApproved().filter(e => new Date(e.date).getUTCFullYear() === year);
  const buckets: KPIBucket[] = Array.from({length:12}, (_,i)=> ({ month:i+1, budget:0, actual:0 }));

  const scopeStr = (() => {
    if (input.dim==='cost_center' && input.key) return `Cost Center ${input.key}`;
    if (input.dim==='project' && input.key) return `Project ${input.key}`;
    return 'Tổng công ty';
  })();

  // Aggregate budgets
  budgets.forEach(b => {
    if (input.dim==='cost_center' && input.key && b.cost_center!==input.key) return;
    if (input.dim==='project' && input.key && b.project!==input.key) return;
    buckets[b.month-1].budget += b.amount;
  });

  // Aggregate actuals from expenses lines
  exps.forEach(e => {
    if (input.dim==='cost_center' && input.key && e.cost_center!==input.key) return;
    if (input.dim==='project' && input.key && e.project!==input.key) return;
    const m = monthIdx(e.date)-1;
    const amt = (e.lines||[]).reduce((s,l)=> s + Number(l.amount||0), 0);
    if (m>=0 && m<12) buckets[m].actual += amt;
  });

  const total_budget = sum(buckets.map(b => b.budget));
  const total_actual = sum(buckets.map(b => b.actual));
  const variance = total_actual - total_budget;
  const variance_pct = total_budget>0 ? ((total_actual/total_budget)-1)*100 : 0;

  // by dimension for "top overspend" (cost_center breakdown)
  const dimAgg = new Map<string, { budget:number; actual:number }>();
  const ccKeys = Array.from(new Set(budgets.map(b => b.cost_center).filter(Boolean))) as string[];
  ccKeys.forEach(k => dimAgg.set(k, { budget:0, actual:0 }));
  budgets.forEach(b => { const k = b.cost_center || '—'; const v = dimAgg.get(k) || { budget:0, actual:0 }; v.budget += b.amount; dimAgg.set(k, v); });
  exps.forEach(e => { const k = e.cost_center || '—'; const v = dimAgg.get(k) || { budget:0, actual:0 }; const amt=(e.lines||[]).reduce((s,l)=>s+Number(l.amount||0),0); v.actual += amt; dimAgg.set(k, v); });
  const by_dim = Array.from(dimAgg.entries()).map(([key, v]) => ({ key, budget:v.budget, actual:v.actual, variance:v.actual-v.budget, variance_pct: v.budget>0? ((v.actual/v.budget)-1)*100 : 0 }))
    .sort((a,b)=> (b.variance) - (a.variance));

  return { scope: scopeStr, year, series: buckets, total_budget, total_actual, variance, variance_pct, by_dim };
}
