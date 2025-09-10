
// src/mock/corp_card.ts — corporate card import & match store
export type UUID = string;
export type CardTxnStatus = 'new'|'review'|'matched';
export type MatchInfo = { expense_id: string; line_id?: string; score: number; decided_by?: string; decided_at?: string };
export type CardTxn = {
  id: UUID;
  ext_id?: string;          // external transaction id if present
  hash?: string;            // dedupe hash from fields
  date: string;             // ISO date
  amount: number;
  currency: string;
  merchant: string;
  card_last4?: string;
  description?: string;
  source_file?: string;     // original filename
  status: CardTxnStatus;
  match?: MatchInfo;
  created_at?: string;
  updated_at?: string;
};
const LS = 'erp.fin.corp_card.txns.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }
export function listTxns(): CardTxn[] { try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveTxns(arr: CardTxn[]){ localStorage.setItem(LS, JSON.stringify(arr)); }
export function upsertMany(items: CardTxn[]){
  const arr = listTxns();
  const byHash = new Map(arr.map(x => [x.hash || (x.ext_id||x.id), x]));
  items.forEach(it => {
    const key = it.hash || (it.ext_id||it.id);
    if (byHash.has(key)) {
      // skip (duplicate)
    } else {
      arr.unshift({ ...it, id: rid(), status: it.status||'new', created_at: nowISO(), updated_at: nowISO() });
    }
  });
  saveTxns(arr);
}
export function updateTxn(id: string, patch: Partial<CardTxn>){
  const arr = listTxns();
  const i = arr.findIndex(x => x.id===id);
  if (i>=0) { arr[i] = { ...arr[i], ...patch, updated_at: nowISO() }; saveTxns(arr); }
}
export function removeAll(){ saveTxns([]); }
