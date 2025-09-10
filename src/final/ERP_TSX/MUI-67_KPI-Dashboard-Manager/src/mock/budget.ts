
// src/mock/budget.ts — monthly budgets per dept
export type BudgetRow = { year: number; month: number; dept: string; amount: number };
const LS = 'erp.fin.budgets.v2';
export function seedBudgetsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const depts = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const rows: BudgetRow[] = [];
  for (let m=1;m<=12;m++){
    depts.forEach(d => {
      const base = d==='SALES' ? 8000000 : d==='OPS' ? 6000000 : 3000000;
      const amount = base + Math.floor(Math.random()*2000000);
      rows.push({ year: yr, month: m, dept: d, amount });
    });
  }
  localStorage.setItem(LS, JSON.stringify(rows));
}
export function listBudgets(): BudgetRow[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
