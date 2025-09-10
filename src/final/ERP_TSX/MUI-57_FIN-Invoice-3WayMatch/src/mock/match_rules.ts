
// src/mock/match_rules.ts
export type MatchRules = {
  qty_tolerance_pct: number;   // allowed diff vs PO remaining
  price_tolerance_pct: number; // allowed unit price diff vs PO
  tax_tolerance_pct: number;   // allowed tax rate diff
  auto_approve_enabled: boolean;
  auto_approve_cap: number;    // max invoice total for auto approve
};
const LS = 'erp.fin.match.rules.v1';
export function loadRules(): MatchRules {
  try { return JSON.parse(localStorage.getItem(LS)||''); } catch {}
  const def: MatchRules = { qty_tolerance_pct:5, price_tolerance_pct:2, tax_tolerance_pct:0.5, auto_approve_enabled:true, auto_approve_cap: 20000000 };
  localStorage.setItem(LS, JSON.stringify(def)); return def;
}
export function saveRules(r: MatchRules){ localStorage.setItem(LS, JSON.stringify(r)); }
