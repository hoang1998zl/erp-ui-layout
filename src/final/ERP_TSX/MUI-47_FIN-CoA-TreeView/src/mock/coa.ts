
// src/mock/coa.ts — CoA draft store (shared with FIN‑01/02)
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
export function upsertAccount(acc: CoAAccount): CoAAccount {
  const d = getDraft() || { accounts: [] };
  const i = d.accounts.findIndex(a => a.code===acc.code);
  acc.updated_at = nowISO();
  if (i>=0) d.accounts[i] = acc; else { acc.created_at = nowISO(); d.accounts.push(acc); }
  d.accounts.sort((a,b)=> a.code.localeCompare(b.code));
  saveDraft(d);
  return acc;
}
export function setParent(code: string, parent_code?: string) {
  const d = getDraft() || { accounts: [] };
  const i = d.accounts.findIndex(a => a.code===code);
  if (i>=0) { d.accounts[i].parent_code = parent_code||undefined; d.accounts[i].updated_at = nowISO(); saveDraft(d); }
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
    { id: rid(), code:'642', name_vi:'Chi phí quản lý doanh nghiệp', name_en:'G&A expense', type:'expense', normal_side:'debit', is_postable:false },
    { id: rid(), code:'6421', parent_code:'642', name_vi:'Chi phí nhân viên quản lý', name_en:'Admin staff expense', type:'expense', normal_side:'debit', is_postable:true },
  ];
  saveDraft({ accounts: seed, mappings: {} });
}

// Build tree structure
export type TreeNode = { code:string; name:string; is_postable:boolean; type:AccountType; parent_code?:string; children: TreeNode[] };
export function buildTree(): TreeNode[] {
  const accs = listAccounts();
  const by: Record<string, TreeNode> = {};
  const roots: TreeNode[] = [];
  accs.forEach(a => by[a.code] = { code:a.code, name:a.name_vi||a.name_en||a.code, is_postable:a.is_postable, type:a.type, parent_code:a.parent_code, children:[] });
  accs.forEach(a => {
    const node = by[a.code];
    if (a.parent_code && by[a.parent_code]) by[a.parent_code].children.push(node);
    else roots.push(node);
  });
  const sortTree = (ns:TreeNode[]) => { ns.sort((x,y)=> x.code.localeCompare(y.code)); ns.forEach(n => sortTree(n.children)); };
  sortTree(roots);
  return roots;
}
