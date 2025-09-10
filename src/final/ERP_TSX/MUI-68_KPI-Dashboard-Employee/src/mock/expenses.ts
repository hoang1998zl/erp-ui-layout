
// src/mock/expenses.ts — personal expenses dataset for Dashboard_Employee
export type UUID = string;
export type Status = 'draft'|'submitted'|'pending'|'approved'|'rejected'|'paid';
export type Line = { id: UUID; category: string; amount: number; tax_code?: string; tax_amount?: number; };
export type Expense = {
  id: UUID;
  code: string;
  title: string;
  requester: string;
  approver?: string;
  project?: string;
  status: Status;
  created_at: string;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  currency: string;
  lines: Line[];
};

const LS = 'erp.fin.expenses.personal.v1';

function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d,0,0,0)).toISOString(); }

export function seedExpensesIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const people = ['lan','minh','an','john','hana','cuong','tuan'];
  const projs = ['PRJ-A','PRJ-B','PRJ-C', ''];
  const statuses: Status[] = ['draft','submitted','pending','approved','rejected','paid'];
  const arr: Expense[] = [];
  let seq=1;
  for (let m=0;m<12;m++){
    const n = 15 + Math.floor(Math.random()*20);
    for (let i=0;i<n;i++){
      const requester = people[Math.floor(Math.random()*people.length)];
      const created = iso(yr,m,1 + Math.floor(Math.random()*24));
      const submitted = Math.random()<0.8 ? iso(yr,m,Math.min(28, 2 + Math.floor(Math.random()*20))) : undefined;
      let status: Status = statuses[Math.floor(Math.random()*statuses.length)];
      if (!submitted && (status!=='draft')) status='draft';
      const lineCount = 1 + Math.floor(Math.random()*3);
      const lines: Line[] = [];
      for (let k=0;k<lineCount;k++){
        const amt = 200_000 + Math.floor(Math.random()*5_000_000);
        const rate = [0,8,10][Math.floor(Math.random()*3)];
        const tax = Math.round(amt*rate/100);
        lines.push({ id: rid(), category: ['Travel','Meal','Hotel','Supplies'][Math.floor(Math.random()*4)], amount: amt, tax_code: rate?`VAT${rate}`:'NONVAT', tax_amount: tax });
      }
      const e: Expense = {
        id: rid(),
        code: `EXP-${String(seq).padStart(5,'0')}`,
        title: `Expense ${seq}`,
        requester,
        approver: ['manager01','finance01','finance02'][Math.floor(Math.random()*3)],
        project: projs[Math.floor(Math.random()*projs.length)] || undefined,
        status,
        created_at: created,
        submitted_at: submitted,
        approved_at: status==='approved' || status==='paid' ? iso(yr,m,Math.min(28, 20+Math.floor(Math.random()*5))) : undefined,
        paid_at: status==='paid' ? iso(yr,m,Math.min(28, 24+Math.floor(Math.random()*3))) : undefined,
        currency: 'VND',
        lines
      };
      arr.push(e); seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}

export function listExpenses(): Expense[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function amountGross(e: Expense): number {
  return (e.lines||[]).reduce((s,l)=> s + Number(l.amount||0) + Number(l.tax_amount||0), 0);
}
