
// src/mock/coa.ts — reused & trimmed from FIN‑01
export type UUID = string;
export type AccountType = 'asset'|'liability'|'equity'|'revenue'|'expense'|'other';
export type NormalSide = 'debit'|'credit';

export type CoAAccount = {
  id: UUID;
  code: string;
  name_vi: string;
  name_en?: string;
  type: AccountType;
  normal_side: NormalSide;
  parent_code?: string;
  is_postable: boolean;
  currency?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

const LS_COA = 'erp.fin.coa.v1'; // draft from FIN‑01

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export type CoADraft = { accounts: CoAAccount[], mappings?: Record<string,string> };

export function getDraft(): CoADraft | null {
  try { const txt = localStorage.getItem(LS_COA); return txt ? JSON.parse(txt) : null; } catch { return null; }
}
export function saveDraft(d: CoADraft) { localStorage.setItem(LS_COA, JSON.stringify(d)); }

export function listAccounts(): CoAAccount[] {
  const d = getDraft();
  return d?.accounts || [];
}
export function getAccount(code: string): CoAAccount | undefined {
  return listAccounts().find(a => a.code===code);
}
export function upsertAccount(acc: CoAAccount): CoAAccount {
  const d = getDraft() || { accounts: [] };
  const i = d.accounts.findIndex(a => a.code===acc.code);
  acc.updated_at = nowISO();
  if (i>=0) d.accounts[i] = acc; else { acc.created_at = nowISO(); d.accounts.push(acc); }
  // sort by code
  d.accounts.sort((a,b)=> a.code.localeCompare(b.code));
  saveDraft(d);
  return acc;
}
export function deleteAccount(code: string) {
  const d = getDraft() || { accounts: [] };
  d.accounts = d.accounts.filter(a => a.code!==code);
  saveDraft(d);
}

export function ensureSeed() {
  if (listAccounts().length>0) return;
  const seed: CoAAccount[] = [
    { id: rid(), code:'111', name_vi:'Tiền mặt', name_en:'Cash on hand', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1111', parent_code:'111', name_vi:'Tiền Việt Nam', name_en:'Cash - VND', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'112', name_vi:'Tiền gửi ngân hàng', name_en:'Bank deposits', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1121', parent_code:'112', name_vi:'Tiền gửi VNĐ', name_en:'Bank - VND', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'131', name_vi:'Phải thu khách hàng', name_en:'Accounts receivable', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'331', name_vi:'Phải trả người bán', name_en:'Accounts payable', type:'liability', normal_side:'credit', is_postable:true },
    { id: rid(), code:'511', name_vi:'Doanh thu bán hàng', name_en:'Revenue - Sales', type:'revenue', normal_side:'credit', is_postable:true },
    { id: rid(), code:'632', name_vi:'Giá vốn hàng bán', name_en:'COGS', type:'expense', normal_side:'debit', is_postable:true },
  ];
  saveDraft({ accounts: seed, mappings: {} });
}

export function validateAccount(acc: CoAAccount, existing: CoAAccount[]): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!acc.code) errors.push('Thiếu mã tài khoản');
  if (!acc.name_vi) errors.push('Thiếu tên VI');
  if (!['asset','liability','equity','revenue','expense','other'].includes(acc.type)) errors.push('Sai loại');
  if (!['debit','credit'].includes(acc.normal_side)) errors.push('Sai normal_side');
  if (acc.parent_code && acc.code && !acc.code.startsWith(acc.parent_code)) warnings.push(`Mã ${acc.code} không theo prefix parent ${acc.parent_code}`);
  // unique code (except self)
  if (existing.filter(x => x.code===acc.code && x.id!==acc.id).length>0) errors.push('Trùng mã tài khoản');
  // warn if parent is postable (still allowed per catalog note)
  const parent = existing.find(x => x.code===acc.parent_code);
  if (parent && parent.is_postable) warnings.push('Parent đang postable (vẫn cho phép)');
  return { ok: errors.length===0, errors, warnings };
}
