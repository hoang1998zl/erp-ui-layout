
// src/mock/kpi_expense_pending.ts — KPI aggregator for Expense Pending Approval
import { listExpenses, amountGross, type Expense } from './expense_pending';

export type Filter = { year: number; approver?: string; cost_center?: string; min_amount?: number };
export type Bucket = { label: string; count: number; amount: number };
export type KPIResult = {
  scope: string;
  total_pending: number;
  amount_pending: number;
  avg_age_days: number;
  median_age_days: number;
  max_age_days: number;
  buckets_by_age: Bucket[];
  by_cost_center: { key: string; count: number; amount: number }[];
  by_requester: { key: string; count: number; amount: number }[];
  list: (Expense & { age_days: number; total_amount: number })[];
};

function daysDiff(a: Date, b: Date){ return Math.floor((a.getTime()-b.getTime())/(1000*3600*24)); }

export function expensePendingKPI(f: Filter): KPIResult {
  const now = new Date();
  const rows = listExpenses().filter(e => new Date(e.created_at).getUTCFullYear()===f.year);
  const pending = rows.filter(e => e.status==='pending')
    .filter(e => !f.approver || e.approver===f.approver)
    .filter(e => !f.cost_center || e.cost_center===f.cost_center);
  const withAmt = pending.map(e => ({ ...e, total_amount: amountGross(e), age_days: e.submitted_at ? daysDiff(now, new Date(e.submitted_at)) : daysDiff(now, new Date(e.created_at)) }))
                         .filter(e => !f.min_amount || e.total_amount >= (f.min_amount||0));
  const total_pending = withAmt.length;
  const amount_pending = withAmt.reduce((s,x)=> s + x.total_amount, 0);
  const ages = withAmt.map(x => x.age_days).sort((a,b)=> a-b);
  const avg = total_pending ? ages.reduce((s,x)=>s+x,0)/total_pending : 0;
  const med = total_pending ? ages[Math.floor((total_pending-1)/2)] : 0;
  const max = total_pending ? Math.max(...ages) : 0;

  const specs = [
    { label:'0–3', from:0, to:3 },
    { label:'4–7', from:4, to:7 },
    { label:'8–14', from:8, to:14 },
    { label:'15–30', from:15, to:30 },
    { label:'>30', from:31, to:10000 },
  ];
  const buckets_by_age = specs.map(s => ({
    label: s.label,
    count: withAmt.filter(x => x.age_days>=s.from && x.age_days<=s.to).length,
    amount: withAmt.filter(x => x.age_days>=s.from && x.age_days<=s.to).reduce((sum,x)=> sum+x.total_amount, 0)
  }));

  const ccKeys = Array.from(new Set(withAmt.map(x => x.cost_center||'—')));
  const by_cost_center = ccKeys.map(k => ({ key:k, count: withAmt.filter(x => (x.cost_center||'—')===k).length, amount: withAmt.filter(x => (x.cost_center||'—')===k).reduce((s,x)=> s+x.total_amount,0) }))
                               .sort((a,b)=> b.amount - a.amount);

  const reqKeys = Array.from(new Set(withAmt.map(x => x.requester)));
  const by_requester = reqKeys.map(k => ({ key:k, count: withAmt.filter(x => x.requester===k).length, amount: withAmt.filter(x => x.requester===k).reduce((s,x)=> s+x.total_amount,0) }))
                              .sort((a,b)=> b.amount - a.amount);

  const scope = f.approver ? `Approver ${f.approver}` : (f.cost_center ? `Cost Center ${f.cost_center}` : 'Tổng công ty');

  const list = withAmt.sort((a,b)=> b.total_amount - a.total_amount).slice(0,50);

  return { scope, total_pending, amount_pending, avg_age_days: avg, median_age_days: med, max_age_days: max, buckets_by_age, by_cost_center, by_requester, list };
}
