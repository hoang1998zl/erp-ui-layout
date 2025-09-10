
// src/mock/expense_pending.ts — pending approvals per dept
export type UUID = string;
export type Pending = { id: UUID; code: string; title: string; dept: string; requester: string; approver: string; submitted_at: string; amount: number; };
const LS = 'erp.fin.expenses.pending.v2';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d)).toISOString(); }
export function seedPendingIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const depts = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const approvers = ['finance01','finance02','manager01','manager02'];
  const requesters = ['lan','minh','an','john','hana','cuong','tuan'];
  const arr: Pending[] = [];
  let seq=1;
  for (let m=0;m<12;m++){
    const n = 10 + Math.floor(Math.random()*16);
    for (let i=0;i<n;i++){
      const dept = depts[Math.floor(Math.random()*depts.length)];
      const sub = iso(yr,m,1+Math.floor(Math.random()*27));
      const amount = 300000 + Math.floor(Math.random()*6000000);
      arr.push({ id: rid(), code:`EXP-${String(seq).padStart(5,'0')}`, title:`Expense ${seq}`, dept, requester: requesters[Math.floor(Math.random()*requesters.length)], approver: approvers[Math.floor(Math.random()*approvers.length)], submitted_at: sub, amount });
      seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listPending(): Pending[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
