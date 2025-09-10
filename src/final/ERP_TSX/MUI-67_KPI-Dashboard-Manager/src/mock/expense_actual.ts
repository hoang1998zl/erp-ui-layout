
// src/mock/expense_actual.ts — approved expenses per dept (actuals)
export type UUID = string;
export type Expense = { id: UUID; dept: string; date: string; amount: number };
const LS = 'erp.fin.expenses.approved.v2';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d)).toISOString(); }
export function seedActualsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const depts = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const arr: Expense[] = [];
  for (let m=0;m<12;m++){
    const n = 20 + Math.floor(Math.random()*20);
    for (let i=0;i<n;i++){
      const d = iso(yr, m, 1+Math.floor(Math.random()*27));
      const dept = depts[Math.floor(Math.random()*depts.length)];
      const amount = 100000 + Math.floor(Math.random()*4000000);
      arr.push({ id: rid(), dept, date: d, amount });
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listActuals(): Expense[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
