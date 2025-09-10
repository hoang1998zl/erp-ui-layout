
// src/mock/expense_pending.ts — dataset for KPI-04 Expense Pending Approval
export type UUID = string;
export type Status = 'draft'|'submitted'|'pending'|'approved'|'rejected';
export type Line = { id: UUID; category: string; amount: number; tax_code?: string; tax_amount?: number; };
export type Expense = {
  id: UUID;
  code: string;
  title: string;
  requester: string;         // employee code/name
  approver?: string;         // current approver (Finance, Manager, etc.)
  cost_center?: string;
  project?: string;
  status: Status;
  created_at: string;        // created
  submitted_at?: string;     // when moved to 'submitted' or 'pending'
  approved_at?: string;
  rejected_at?: string;
  currency: string;          // VND by default
  lines: Line[];
  attachments?: number;      // count
};

const LS = 'erp.fin.expense.approvals.v1';

function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d,0,0,0)).toISOString(); }

export function seedIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const yr = new Date().getUTCFullYear();
  const categories = ['Travel','Hotel','Meals','OfficeSupplies','Software','Marketing'];
  const ccs = ['ADMIN','OPS','SALES'];
  const projs = ['PRJ-A','PRJ-B',''];
  const requesters = ['lan','minh','an','john','hana','cuong','tuan'];
  const approvers = ['finance01','finance02','manager01','manager02'];
  const arr: Expense[] = [];
  let seq=1;
  for (let m=0;m<12;m++){
    const n = 18 + Math.floor(Math.random()*22); // 18-40 expenses per month
    for (let i=0;i<n;i++){
      const created = iso(yr,m,1 + Math.floor(Math.random()*25));
      const subDelay = Math.floor(Math.random()*8);
      const submitted = iso(yr,m,Math.min(28, 1+subDelay+Math.floor(Math.random()*10)));
      const lineCount = 1 + Math.floor(Math.random()*3);
      const lines: Line[] = [];
      let total=0, totalTax=0;
      for (let k=0;k<lineCount;k++){
        const cat = categories[Math.floor(Math.random()*categories.length)];
        const amt = 200_000 + Math.floor(Math.random()*5_000_000);
        const rate = [0,8,10][Math.floor(Math.random()*3)];
        const tax = Math.round(amt*rate/100);
        total += amt; totalTax += tax;
        lines.push({ id: rid(), category: cat, amount: amt, tax_code: rate? `VAT${rate}` : 'NONVAT', tax_amount: tax });
      }
      const statusPool: Status[] = ['pending','approved','rejected'];
      const status = statusPool[Math.floor(Math.random()*statusPool.length)];
      const approver = approvers[Math.floor(Math.random()*approvers.length)];
      const e: Expense = {
        id: rid(),
        code: `EXP-${String(seq).padStart(5,'0')}`,
        title: `Expense ${seq}`,
        requester: requesters[Math.floor(Math.random()*requesters.length)],
        approver,
        cost_center: ccs[Math.floor(Math.random()*ccs.length)],
        project: projs[Math.floor(Math.random()*projs.length)] || undefined,
        status,
        created_at: created,
        submitted_at: submitted,
        approved_at: status==='approved' ? iso(yr,m,Math.min(28, 20+Math.floor(Math.random()*8))) : undefined,
        rejected_at: status==='rejected' ? iso(yr,m,Math.min(28, 18+Math.floor(Math.random()*8))) : undefined,
        currency: 'VND',
        lines,
        attachments: Math.floor(Math.random()*4)
      };
      arr.push(e); seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}

export function listExpenses(): Expense[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveExpenses(a: Expense[]){ localStorage.setItem(LS, JSON.stringify(a)); }

export function updateStatus(code: string, status: Status, actor: string, note?: string){
  const a = listExpenses(); const i=a.findIndex(x=>x.code===code); if (i<0) return;
  const now = new Date().toISOString();
  const e = a[i];
  if (status==='approved'){ e.status='approved'; e.approved_at=now; }
  else if (status==='rejected'){ e.status='rejected'; e.rejected_at=now; }
  else { e.status=status; }
  // naive: clear approver once approved/rejected
  if (status==='approved' || status==='rejected') e.approver=undefined;
  a[i]=e; saveExpenses(a);
}

export function amountGross(e: Expense): number {
  const sum = (e.lines||[]).reduce((s,l)=> s + Number(l.amount||0) + Number(l.tax_amount||0), 0);
  return sum;
}
