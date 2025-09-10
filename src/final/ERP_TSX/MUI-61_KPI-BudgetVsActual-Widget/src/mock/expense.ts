
// src/mock/expense.ts — simplified expenses used for KPI actuals
export type UUID = string;
export type ExpenseLine = { id: UUID; category: string; amount: number; description?: string };
export type Expense = { id: UUID; title: string; date: string; status: 'draft'|'submitted'|'approved'|'rejected'; cost_center?: string; project?: string; lines: ExpenseLine[] };
const LS = 'erp.fin.expenses.kpi.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }
export function seedIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const today = new Date();
  const yr = today.getFullYear();
  function d(y:number,m:number,day:number){ return new Date(Date.UTC(y,m,Math.min(day,28))).toISOString(); }
  const cats = ['OfficeSupplies','Travel','Hotel','Software','Marketing'];
  const ccs = ['ADMIN','OPS','SALES'];
  const projs = ['PRJ-A','PRJ-B',''];
  const arr: Expense[] = [];
  let idc=1;
  for (let m=0;m<12;m++){
    // generate 6-10 expenses per month
    const n = 6 + Math.floor(Math.random()*5);
    for (let i=0;i<n;i++){
      const cc = ccs[Math.floor(Math.random()*ccs.length)];
      const pr = projs[Math.floor(Math.random()*projs.length)];
      const cat = cats[Math.floor(Math.random()*cats.length)];
      const amt = 200000 + Math.floor(Math.random()*2000000);
      arr.push({
        id: rid(),
        title: `Expense ${idc++}`,
        date: d(yr, m, 7 + Math.floor(Math.random()*20)),
        status: 'approved',
        cost_center: cc,
        project: pr || undefined,
        lines: [{ id: rid(), category: cat, amount: amt, description: `${cat} month ${m+1}` }]
      });
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listApproved(): Expense[]{ try { return (JSON.parse(localStorage.getItem(LS)||'[]') as Expense[]).filter(x => x.status==='approved'); } catch { return []; } }
