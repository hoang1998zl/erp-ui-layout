
// src/mock/posting_rules.ts — configurable mapping
export type Rule = { category: string; expense_account: string; };
export type RulesPack = { rules: Rule[]; vat_account: string; default_credit: string };
const LS = 'erp.fin.posting.rules.v1';
export function loadRules(): RulesPack {
  try { return JSON.parse(localStorage.getItem(LS) || ''); } catch {}
  const def: RulesPack = {
    rules: [
      { category:'MEAL', expense_account:'6421' },
      { category:'TAXI', expense_account:'6421' },
      { category:'HOTEL', expense_account:'6421' },
      { category:'AIR',   expense_account:'6421' },
      { category:'OFFICE',expense_account:'6423' },
    ],
    vat_account: '1331',
    default_credit: '334', // Employee payable
  };
  localStorage.setItem(LS, JSON.stringify(def));
  return def;
}
export function saveRules(p: RulesPack){ localStorage.setItem(LS, JSON.stringify(p)); }
export function findAccountFor(cat: string, pack: RulesPack): string {
  const r = pack.rules.find(x => x.category===cat);
  return r ? r.expense_account : '';
}
