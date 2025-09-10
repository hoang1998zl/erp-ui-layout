
// src/mock/coa.ts
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
  parent_code?: string;  // hierarchical by code
  is_postable: boolean;  // leaf account can post entries
  currency?: string;     // default currency if needed
  active?: boolean;
};

export type CoAVersion = {
  version: number;
  committed_at: string;
  committed_by?: string;
  notes?: string;
  accounts: CoAAccount[];
  mappings?: Record<string,string>; // our code -> external code
  status: 'draft'|'active'|'archived';
};

const LS_KEY = 'erp.fin.coa.v1';
const LS_VER = 'erp.fin.coa.versions.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export function seedTemplates(): Record<string, CoAAccount[]> {
  // A tiny subset of Vietnam VAS-style codes + common IFRS-like
  const vas: CoAAccount[] = [
    { id: rid(), code:'111', name_vi:'Tiền mặt', name_en:'Cash on hand', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1111', parent_code:'111', name_vi:'Tiền Việt Nam', name_en:'Cash - VND', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'112', name_vi:'Tiền gửi ngân hàng', name_en:'Bank deposits', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1121', parent_code:'112', name_vi:'Tiền gửi VNĐ', name_en:'Bank - VND', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'131', name_vi:'Phải thu khách hàng', name_en:'Accounts receivable', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'211', name_vi:'Tài sản cố định hữu hình', name_en:'PPE', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'2111', parent_code:'211', name_vi:'Nhà cửa, vật kiến trúc', name_en:'Buildings', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'331', name_vi:'Phải trả người bán', name_en:'Accounts payable', type:'liability', normal_side:'credit', is_postable:true },
    { id: rid(), code:'511', name_vi:'Doanh thu bán hàng', name_en:'Revenue - Sales', type:'revenue', normal_side:'credit', is_postable:true },
    { id: rid(), code:'632', name_vi:'Giá vốn hàng bán', name_en:'COGS', type:'expense', normal_side:'debit', is_postable:true },
    { id: rid(), code:'642', name_vi:'Chi phí quản lý doanh nghiệp', name_en:'G&A expense', type:'expense', normal_side:'debit', is_postable:false },
    { id: rid(), code:'6421', parent_code:'642', name_vi:'Chi phí nhân viên quản lý', name_en:'Admin staff expense', type:'expense', normal_side:'debit', is_postable:true },
    { id: rid(), code:'911', name_vi:'Xác định kết quả kinh doanh', name_en:'Profit & Loss', type:'other', normal_side:'credit', is_postable:false },
  ];
  const ifrsLite: CoAAccount[] = [
    { id: rid(), code:'1000', name_vi:'Tài sản ngắn hạn', name_en:'Current Assets', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1100', parent_code:'1000', name_vi:'Tiền và tương đương tiền', name_en:'Cash and cash equivalents', type:'asset', normal_side:'debit', is_postable:false },
    { id: rid(), code:'1110', parent_code:'1100', name_vi:'Tiền mặt', name_en:'Cash on hand', type:'asset', normal_side:'debit', is_postable:true },
    { id: rid(), code:'2000', name_vi:'Nợ phải trả', name_en:'Liabilities', type:'liability', normal_side:'credit', is_postable:false },
    { id: rid(), code:'2100', parent_code:'2000', name_vi:'Phải trả người bán', name_en:'Accounts payable', type:'liability', normal_side:'credit', is_postable:true },
    { id: rid(), code:'4000', name_vi:'Doanh thu', name_en:'Revenue', type:'revenue', normal_side:'credit', is_postable:true },
    { id: rid(), code:'5000', name_vi:'Chi phí', name_en:'Expenses', type:'expense', normal_side:'debit', is_postable:false },
    { id: rid(), code:'5100', parent_code:'5000', name_vi:'Giá vốn', name_en:'COGS', type:'expense', normal_side:'debit', is_postable:true },
  ];
  return { 'VAS (VN sample)': vas, 'IFRS-lite (sample)': ifrsLite };
}

export function getDraft(): CoAVersion | null {
  try { const txt = localStorage.getItem(LS_KEY); return txt ? JSON.parse(txt) : null; } catch { return null; }
}
export function saveDraft(ver: CoAVersion): void {
  localStorage.setItem(LS_KEY, JSON.stringify(ver));
}
export function listVersions(): CoAVersion[] {
  try { return JSON.parse(localStorage.getItem(LS_VER) || '[]'); } catch { return []; }
}
export function commitDraft(by='admin', notes?: string): CoAVersion {
  const draft = getDraft(); if (!draft) throw new Error('No draft');
  const versions = listVersions();
  const nextVer = Math.max(0, ...versions.map(v => v.version)) + 1;
  const committed: CoAVersion = { ...draft, version: nextVer, committed_at: nowISO(), committed_by: by, notes, status:'active' };
  versions.unshift(committed);
  // archive previous active
  for (let i=1; i<versions.length; i++) versions[i].status = 'archived';
  localStorage.setItem(LS_VER, JSON.stringify(versions));
  return committed;
}

export function newDraftFrom(accounts: CoAAccount[]): CoAVersion {
  return { version: 0, committed_at: '', committed_by:'', notes:'', status:'draft', accounts, mappings:{} };
}

export function validate(accounts: CoAAccount[], mappings?: Record<string,string>): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byCode: Record<string, CoAAccount> = {};
  for (const a of accounts) {
    if (!a.code) errors.push('Thiếu mã tài khoản');
    if (byCode[a.code]) errors.push(`Trùng mã: ${a.code}`);
    byCode[a.code] = a;
    if (!a.name_vi) warnings.push(`Thiếu tên VI: ${a.code}`);
    if (!['asset','liability','equity','revenue','expense','other'].includes(a.type)) errors.push(`Sai loại: ${a.code}`);
    if (!['debit','credit'].includes(a.normal_side)) errors.push(`Sai normal_side: ${a.code}`);
    if (a.parent_code && !a.code.startsWith(a.parent_code)) warnings.push(`Mã ${a.code} không theo prefix parent ${a.parent_code}`);
  }
  // parent existence
  accounts.forEach(a => {
    if (a.parent_code && !byCode[a.parent_code]) warnings.push(`Parent không tồn tại: ${a.code} -> ${a.parent_code}`);
  });
  // mapping completeness for postable
  if (mappings) {
    accounts.filter(a => a.is_postable).forEach(a => {
      if (!mappings[a.code]) warnings.push(`Chưa mapping external cho: ${a.code}`);
    });
  }
  return { ok: errors.length===0, errors, warnings };
}

export function toCSV(accounts: CoAAccount[]): string {
  const header = 'code,name_vi,name_en,type,normal_side,parent_code,is_postable,currency,active';
  const rows = accounts.map(a => [a.code, a.name_vi||'', a.name_en||'', a.type, a.normal_side, a.parent_code||'', a.is_postable?'1':'0', a.currency||'', a.active?'1':'0'].join(','));
  return [header, ...rows].join('\n');
}
export function fromCSV(text: string): CoAAccount[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length<=1) return [];
  const header = lines[0].split(',').map(s=>s.trim());
  const idx = (k:string)=> header.indexOf(k);
  const out: CoAAccount[] = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',').map(s=>s.trim());
    const get = (k:string)=> { const j = idx(k); return j>=0 ? cols[j] : ''; };
    const acc: CoAAccount = {
      id: rid(),
      code: get('code'),
      name_vi: get('name_vi'),
      name_en: get('name_en'),
      type: (get('type') as any) || 'asset',
      normal_side: (get('normal_side') as any) || 'debit',
      parent_code: get('parent_code') || undefined,
      is_postable: get('is_postable')==='1' || /true/i.test(get('is_postable')),
      currency: get('currency') || undefined,
      active: get('active')==='1' || /true/i.test(get('active')),
    };
    out.push(acc);
  }
  return out;
}

export function upsertAccount(list: CoAAccount[], acc: Partial<CoAAccount>): CoAAccount[] {
  const by = Object.fromEntries(list.map(x => [x.code, x]));
  const code = String(acc.code||'').trim();
  if (!code) return list;
  const base = by[code] || { id: rid(), code, name_vi:'', type:'asset', normal_side:'debit', is_postable:true } as CoAAccount;
  const next = { ...base, ...acc } as CoAAccount;
  const exists = by[code] ? list.map(x => x.code===code ? next : x) : [...list, next];
  return exists.sort((a,b) => a.code.localeCompare(b.code));
}

export function buildTree(accounts: CoAAccount[]): Array<{ code: string; name: string; level: number; is_postable: boolean; type: AccountType; children: any[] }> {
  const byCode: Record<string, any> = {};
  const roots: any[] = [];
  for (const a of accounts) byCode[a.code] = { code:a.code, name: a.name_vi || a.name_en || a.code, level: (a.parent_code? ((a.parent_code.match(/\d{1,}/g)?.[0]?.length||0)+1)/1 : 1), is_postable:a.is_postable, type:a.type, children: [] };
  accounts.forEach(a => {
    if (a.parent_code && byCode[a.parent_code]) byCode[a.parent_code].children.push(byCode[a.code]);
    else roots.push(byCode[a.code]);
  });
  const sortTree = (nodes:any[]) => { nodes.sort((x,y)=> x.code.localeCompare(y.code)); nodes.forEach(n => sortTree(n.children)); };
  sortTree(roots);
  return roots;
}
