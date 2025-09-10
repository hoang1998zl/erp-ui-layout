
// src/integrations/accounting/mockData.ts — generate accounting data (FIN-10/11)
export type Currency = 'VND'|'USD';
export type Branch = 'HCM'|'HN';
export type Line = { account: string; debit: number; credit: number; desc?: string };
export type Journal = {
  id: string;
  date: string; // ISO
  branch: Branch;
  project?: string;
  currency: Currency;
  rate: number;
  lines: Line[];
  ref?: string;
  vendor?: string;
  customer?: string;
  module: 'AP'|'AR'|'JV'|'EXP';
};

const LS = 'erp.fin.mock.journals.v1';

function rid(){ return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number){ return new Date(Date.UTC(y,m,d,9,0,0)).toISOString(); }
function round2(n:number){ return Math.round(n*100)/100; }

export function seedIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const now = new Date();
  const yr = now.getUTCFullYear();
  const arr: Journal[] = [];

  const projects = ['PRJ-A','PRJ-B','PRJ-C', undefined];
  const vendors = ['V001','V002','V003', undefined];
  const customers = ['C001','C002','C003', undefined];
  const branches: Branch[] = ['HCM','HN'];
  const currencies: Currency[] = ['VND','USD'];

  let seq = 1;
  for (let m=0;m<12;m++){
    const n = 40 + Math.floor(Math.random()*40);
    for (let i=0;i<n;i++){
      const currency = currencies[Math.floor(Math.random()*currencies.length)];
      const rate = currency==='USD' ? 24500 + Math.floor(Math.random()*1000) : 1;
      const amount = 1_000_000 + Math.floor(Math.random()*20_000_000);
      const isAP = Math.random()<0.35;
      const isAR = !isAP && Math.random()<0.3;
      const module: Journal['module'] = isAP ? 'AP' : isAR ? 'AR' : (Math.random()<0.5? 'EXP':'JV');
      const j: Journal = {
        id: rid(),
        date: iso(yr, m, 1 + Math.floor(Math.random()*27)),
        branch: branches[Math.floor(Math.random()*branches.length)],
        project: projects[Math.floor(Math.random()*projects.length)],
        currency, rate,
        lines: [],
        ref: `${module}-${String(seq).padStart(5,'0')}`,
        vendor: isAP? vendors[Math.floor(Math.random()*vendors.length)] : undefined,
        customer: isAR? customers[Math.floor(Math.random()*customers.length)] : undefined,
        module
      };
      // simple double entry: expense (debit expense, credit payable/cash) or revenue (debit receivable/cash, credit revenue)
      if (module==='AP' || module==='EXP'){
        const debitAcc = ['6421','6422','627','154'][Math.floor(Math.random()*4)];
        j.lines.push({ account: debitAcc, debit: amount, credit: 0, desc: 'Expense' });
        j.lines.push({ account: '331', debit: 0, credit: amount, desc: 'A/P' });
      } else if (module==='AR'){
        j.lines.push({ account: '131', debit: amount, credit: 0, desc: 'A/R' });
        j.lines.push({ account: '511', debit: 0, credit: amount, desc: 'Revenue' });
      } else {
        // JV random
        const a1 = ['111','112','152','153','156','211'][Math.floor(Math.random()*6)];
        const a2 = ['331','131','338','333'][Math.floor(Math.random()*4)];
        j.lines.push({ account: a1, debit: amount, credit: 0, desc: 'JV' });
        j.lines.push({ account: a2, debit: 0, credit: amount, desc: 'JV' });
      }
      arr.push(j); seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}

export function listJournals(): Journal[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
