
// src/mock/gl.ts — simple GL Journal store for simulator
export type UUID = string;
export type GLLine = {
  id: UUID;
  account: string;
  debit: number;
  credit: number;
  project_code?: string;
  dept_code?: string;
  memo?: string;
  expense_id?: string;
  expense_line_id?: string;
};
export type GLJournal = {
  id: UUID;
  date: string; // ISO
  currency: string;
  source: 'expense';
  expense_ids: string[];
  lines: GLLine[];
  created_at?: string;
};
const LS = 'erp.fin.gl.journals.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }
export function listJournals(): GLJournal[] { try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveJournals(a: GLJournal[]){ localStorage.setItem(LS, JSON.stringify(a)); }
export function addJournal(j: Omit<GLJournal,'id'|'created_at'>): GLJournal {
  const full: GLJournal = { ...j, id: rid(), created_at: nowISO() };
  const arr = listJournals(); arr.unshift(full); saveJournals(arr); return full;
}
export function totals(lines: GLLine[]){ 
  return lines.reduce((s,l)=> ({ debit: s.debit + (Number(l.debit)||0), credit: s.credit + (Number(l.credit)||0) }), { debit:0, credit:0 });
}
