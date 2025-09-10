
// src/mock/tax.ts — tax code configuration store
export type UUID = string;
export type TaxType = 'VAT_IN'|'VAT_OUT'|'NONE';
export type CalcMethod = 'exclusive'|'inclusive';
export type TaxCode = {
  id: UUID;
  code: string;
  name_vi: string;
  name_en?: string;
  rate_pct: number;       // e.g., 8, 10
  type: TaxType;          // VAT_IN (input), VAT_OUT (output), NONE
  method: CalcMethod;     // exclusive (add on top) or inclusive (price includes VAT)
  vat_account?: string;   // e.g., 1331 for input VAT; 3331 for output VAT
  effective_from?: string;// ISO date
  effective_to?: string;  // ISO date
  active: boolean;
  created_at?: string;
  updated_at?: string;
};
const LS = 'erp.fin.tax.codes.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }

export function listTaxes(): TaxCode[] { try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveTaxes(arr: TaxCode[]){ localStorage.setItem(LS, JSON.stringify(arr)); }
export function seedIfEmpty(){
  if (listTaxes().length) return;
  const arr: TaxCode[] = [
    { id: rid(), code:'VAT0-IN', name_vi:'VAT đầu vào 0%', name_en:'VAT input 0%', rate_pct:0, type:'VAT_IN', method:'exclusive', vat_account:'1331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'VAT8-IN', name_vi:'VAT đầu vào 8%', name_en:'VAT input 8%', rate_pct:8, type:'VAT_IN', method:'exclusive', vat_account:'1331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'VAT10-IN', name_vi:'VAT đầu vào 10%', name_en:'VAT input 10%', rate_pct:10, type:'VAT_IN', method:'exclusive', vat_account:'1331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'VAT0-OUT', name_vi:'VAT đầu ra 0%', name_en:'VAT output 0%', rate_pct:0, type:'VAT_OUT', method:'exclusive', vat_account:'3331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'VAT8-OUT', name_vi:'VAT đầu ra 8%', name_en:'VAT output 8%', rate_pct:8, type:'VAT_OUT', method:'exclusive', vat_account:'3331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'VAT10-OUT', name_vi:'VAT đầu ra 10%', name_en:'VAT output 10%', rate_pct:10, type:'VAT_OUT', method:'exclusive', vat_account:'3331', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'NONVAT', name_vi:'Không chịu thuế', name_en:'No VAT', rate_pct:0, type:'NONE', method:'exclusive', vat_account:'', active:true, created_at: nowISO(), updated_at: nowISO() },
  ];
  saveTaxes(arr);
}
export function upsertTax(input: Partial<TaxCode> & { code: string }){
  const arr = listTaxes();
  const i = arr.findIndex(x => x.code.toLowerCase() === input.code.toLowerCase());
  const full: TaxCode = {
    id: input.id || rid(),
    code: input.code.trim(),
    name_vi: input.name_vi || input.code,
    name_en: input.name_en || input.name_vi || input.code,
    rate_pct: Number(input.rate_pct||0),
    type: (input.type||'VAT_IN') as TaxType,
    method: (input.method||'exclusive') as CalcMethod,
    vat_account: input.vat_account||'',
    effective_from: input.effective_from,
    effective_to: input.effective_to,
    active: input.active!==false,
    created_at: input.created_at || nowISO(),
    updated_at: nowISO(),
  };
  if (i>=0) arr[i] = { ...arr[i], ...full, id: arr[i].id, created_at: arr[i].created_at, updated_at: nowISO() };
  else arr.unshift(full);
  saveTaxes(arr);
  return full;
}
export function removeTax(code: string){
  const arr = listTaxes().filter(x => x.code !== code);
  saveTaxes(arr);
}
