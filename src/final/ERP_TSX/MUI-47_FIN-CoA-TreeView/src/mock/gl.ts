
// src/mock/gl.ts — simple GL lines and usage counts
export type JournalLine = { id: string; date: string; account: string; debit: number; credit: number; memo?: string };
const LS_GL = 'erp.fin.gl.lines.v1';

function rid(){ return Math.random().toString(36).slice(2,10); }
function nowISO(){ return new Date().toISOString(); }

export function seedGLIfEmpty() {
  try { const txt = localStorage.getItem(LS_GL); if (txt) return; } catch {}
  const rows: JournalLine[] = [
    { id: rid(), date: nowISO(), account: '1111', debit: 1000000, credit: 0, memo: 'Seed cash' },
    { id: rid(), date: nowISO(), account: '1111', debit: 0, credit: 200000, memo: 'Pay out' },
    { id: rid(), date: nowISO(), account: '632', debit: 500000, credit: 0, memo: 'COGS' },
  ];
  localStorage.setItem(LS_GL, JSON.stringify(rows));
}
export function listLines(): JournalLine[] {
  try { return JSON.parse(localStorage.getItem(LS_GL) || '[]'); } catch { return []; }
}
export function usageCountMap(): Record<string, number> {
  const m: Record<string, number> = {};
  listLines().forEach(l => { m[l.account] = (m[l.account]||0) + 1; });
  return m;
}
