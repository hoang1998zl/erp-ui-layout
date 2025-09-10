
// src/mock/gl_actuals.ts — actual postings with dimensions
export type UUID = string;
export type GLEntry = {
  id: UUID;
  date: string; // ISO
  account: string;
  project_code?: string;
  dept_code?: string;
  debit: number;
  credit: number;
  memo?: string;
};
const LS = 'erp.fin.gl.actuals.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }

export function seedActualsIfEmpty() {
  try { const t = localStorage.getItem(LS); if (t) return; } catch {}
  const y = new Date().getFullYear();
  const mk = (y:number,m:number,d:number)=> new Date(Date.UTC(y,m-1,d)).toISOString();
  const rows: GLEntry[] = [
    { id: rid(), date: mk(y,1,15), account:'6421', dept_code:'HR', debit: 5000000, credit:0, memo:'HR payroll Jan' },
    { id: rid(), date: mk(y,2,15), account:'6421', dept_code:'HR', debit: 5200000, credit:0, memo:'HR payroll Feb' },
    { id: rid(), date: mk(y,3,15), account:'6421', dept_code:'HR', debit: 5300000, credit:0, memo:'HR payroll Mar' },
    { id: rid(), date: mk(y,1,20), account:'641', dept_code:'IT', debit: 1200000, credit:0, memo:'Marketing tool' },
    { id: rid(), date: mk(y,2,10), account:'632', project_code:'PRJ-001', debit: 3000000, credit:0, memo:'COGS Feb' },
    { id: rid(), date: mk(y,3,12), account:'632', project_code:'PRJ-001', debit: 3300000, credit:0, memo:'COGS Mar' },
    { id: rid(), date: mk(y,1,5), account:'511', project_code:'PRJ-001', debit:0, credit: 8000000, memo:'Revenue Jan' },
    { id: rid(), date: mk(y,2,6), account:'511', project_code:'PRJ-001', debit:0, credit: 8500000, memo:'Revenue Feb' },
    { id: rid(), date: mk(y,3,7), account:'511', project_code:'PRJ-002', debit:0, credit: 9000000, memo:'Revenue Mar' },
  ];
  localStorage.setItem(LS, JSON.stringify(rows));
}
export function listActuals(): GLEntry[] { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; } }
