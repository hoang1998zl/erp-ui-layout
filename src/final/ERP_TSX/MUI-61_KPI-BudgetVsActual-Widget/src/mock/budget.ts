
// src/mock/budget.ts — monthly budgets per cost center & category
export type BudgetRow = { year: number; month: number; cost_center?: string; project?: string; category: string; amount: number };
const LS = 'erp.fin.budgets.kpi.v1';
export function seedIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const today = new Date();
  const yr = today.getFullYear();
  const cats = ['OfficeSupplies','Travel','Hotel','Software','Marketing'];
  const ccs = ['ADMIN','OPS','SALES'];
  const rows: BudgetRow[] = [];
  for (let m=1;m<=12;m++){
    ccs.forEach(cc => cats.forEach(cat => {
      const base = cc==='SALES' ? 4000000 : cc==='OPS' ? 3000000 : 2000000;
      const amount = base + Math.floor(Math.random()*1200000);
      rows.push({ year: yr, month: m, cost_center: cc, category: cat, amount });
    }));
  }
  localStorage.setItem(LS, JSON.stringify(rows));
}
export function listBudgets(): BudgetRow[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
