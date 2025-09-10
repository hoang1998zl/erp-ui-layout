
// src/mock/vendors.ts — FIN-15 Vendor master store
export type UUID = string;
export type Vendor = {
  id: UUID;
  code: string;        // unique
  name_vi: string;
  name_en?: string;
  tax_code?: string;   // VN MST (10 or 13 digits)
  country?: string;    // default VN
  province?: string;
  address?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
  currency?: string;   // default VND
  payment_terms_days?: number; // e.g., 0, 15, 30
  supplier_type?: 'domestic'|'foreign';
  wht_rate_pct?: number;       // withholding tax, optional
  active: boolean;
  created_at?: string;
  updated_at?: string;
};
const LS = 'erp.fin.vendors.master.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }

export function listVendors(): Vendor[] { try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveVendors(arr: Vendor[]){ localStorage.setItem(LS, JSON.stringify(arr)); }

export function seedVendorsIfEmpty(){
  if (listVendors().length) return;
  const arr: Vendor[] = [
    { id: rid(), code:'V001', name_vi:'ABC Stationery', name_en:'ABC Stationery', tax_code:'0311111111', country:'VN', province:'HCM', address:'123 Đường A, Quận 1', contact_name:'Ms. Lan', email:'lan@abc.vn', phone:'+84 28 1234 5678', bank_name:'VCB', bank_account:'0123456789', bank_branch:'HCM', currency:'VND', payment_terms_days:15, supplier_type:'domestic', wht_rate_pct:0, active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'V002', name_vi:'Hotel ABC', name_en:'Hotel ABC', tax_code:'0302222222', country:'VN', province:'HCM', address:'456 Đường B, Q3', contact_name:'Mr. Minh', email:'minh@hotelabc.vn', phone:'+84 28 2222 3333', bank_name:'ACB', bank_account:'9876543210', bank_branch:'HCM', currency:'VND', payment_terms_days:7, supplier_type:'domestic', wht_rate_pct:0, active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'V003', name_vi:'Tech World LLC', name_en:'Tech World LLC', tax_code:'US-99-9999999', country:'US', province:'CA', address:'1 Market St', contact_name:'John', email:'sales@techworld.com', phone:'+1 415 555 1212', bank_name:'Chase', bank_account:'***', bank_branch:'SF', currency:'USD', payment_terms_days:30, supplier_type:'foreign', wht_rate_pct:5, active:true, created_at: nowISO(), updated_at: nowISO() },
  ];
  saveVendors(arr);
}

export function findByCode(code: string): Vendor | undefined {
  return listVendors().find(v => v.code.toLowerCase() === code.toLowerCase());
}

export function upsertVendor(input: Partial<Vendor> & { code: string; name_vi: string }){
  const arr = listVendors();
  const i = arr.findIndex(v => v.code.toLowerCase() === input.code.toLowerCase());
  const base = i>=0 ? arr[i] : { id: rid(), created_at: nowISO(), active: true } as Vendor;
  const v: Vendor = {
    ...base,
    ...input,
    code: String(input.code).trim(),
    name_vi: String(input.name_vi).trim(),
    updated_at: nowISO(),
  };
  if (i>=0) arr[i] = v; else arr.unshift(v);
  saveVendors(arr);
  return v;
}

export function removeByCode(code: string){
  const arr = listVendors().filter(v => v.code.toLowerCase() !== code.toLowerCase());
  saveVendors(arr);
}

export function importCSV(text: string): { inserted: number; skipped: number; duplicates: string[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return { inserted:0, skipped:0, duplicates:[] };
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const arr = listVendors();
  let inserted=0, skipped=0; const dups: string[] = [];
  for (const line of lines.slice(1)){
    const cols = line.split(',').map(v => v.trim());
    const code = cols[idx('code')];
    if (!code) { skipped++; continue; }
    if (arr.some(v => v.code.toLowerCase() === code.toLowerCase())) { dups.push(code); skipped++; continue; }
    const v: Vendor = {
      id: rid(),
      code,
      name_vi: cols[idx('name_vi')] || code,
      name_en: cols[idx('name_en')] || cols[idx('name_vi')] || code,
      tax_code: cols[idx('tax_code')] || '',
      country: cols[idx('country')] || 'VN',
      province: cols[idx('province')] || '',
      address: cols[idx('address')] || '',
      contact_name: cols[idx('contact_name')] || '',
      email: cols[idx('email')] || '',
      phone: cols[idx('phone')] || '',
      bank_name: cols[idx('bank_name')] || '',
      bank_account: cols[idx('bank_account')] || '',
      bank_branch: cols[idx('bank_branch')] || '',
      currency: cols[idx('currency')] || 'VND',
      payment_terms_days: Number(cols[idx('payment_terms_days')] || 0),
      supplier_type: (cols[idx('supplier_type')] as any) || 'domestic',
      wht_rate_pct: Number(cols[idx('wht_rate_pct')] || 0),
      active: (String(cols[idx('active')]||'true').toLowerCase()!=='false'),
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    arr.unshift(v); inserted++;
  }
  saveVendors(arr);
  return { inserted, skipped, duplicates: dups };
}
