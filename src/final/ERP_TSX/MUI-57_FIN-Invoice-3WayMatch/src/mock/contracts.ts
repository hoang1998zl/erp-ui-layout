
// src/mock/contracts.ts
export type ContractLine = { id: string; sku: string; desc: string; unit_price: number; uom: string; tax_rate?: number };
export type Contract = { id: string; contract_no: string; vendor_code: string; currency: string; start_date: string; end_date?: string; lines: ContractLine[] };
const LS = 'erp.fin.contracts.v1';
function rid(){ return Math.random().toString(36).slice(2); }
export function seedContractsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: Contract[] = [
    { id: rid(), contract_no:'CT-2025-001', vendor_code:'V001', currency:'VND', start_date:new Date().toISOString(), lines:[
      { id: rid(), sku:'PAPER-A4', desc:'Giấy A4', unit_price:55000, uom:'Ream', tax_rate:8 },
      { id: rid(), sku:'PEN-BLUE', desc:'Bút bi xanh', unit_price:3500, uom:'Piece', tax_rate:8 },
    ]},
    { id: rid(), contract_no:'CT-2025-010', vendor_code:'V003', currency:'USD', start_date:new Date().toISOString(), lines:[
      { id: rid(), sku:'LAP-14', desc:'Laptop 14"', unit_price:799, uom:'Unit', tax_rate:0 },
    ]},
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listContracts(): Contract[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
