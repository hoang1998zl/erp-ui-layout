
// src/mock/gl.ts — minimal mock to know if an account has postings
export type JournalLine = { id: string; date: string; account: string; debit: number; credit: number; memo?: string };
const LS_GL = 'erp.fin.gl.lines.v1';

function rid(){ return Math.random().toString(36).slice(2,10); }
function nowISO(){ return new Date().toISOString(); }

export function seedGLIfEmpty() {
  try {
    const txt = localStorage.getItem(LS_GL);
    if (txt) return;
  } catch {}
  const rows: JournalLine[] = [
    { id: rid(), date: nowISO(), account: '1111', debit: 1000000, credit: 0, memo: 'Seed cash' },
    { id: rid(), date: nowISO(), account: '632', debit: 500000, credit: 0, memo: 'Seed cogs' },
  ];
  localStorage.setItem(LS_GL, JSON.stringify(rows));
}
export function listLines(): JournalLine[] {
  try { return JSON.parse(localStorage.getItem(LS_GL) || '[]'); } catch { return []; }
}
export function hasPostings(account: string): boolean {
  return listLines().some(l => l.account===account);
}
