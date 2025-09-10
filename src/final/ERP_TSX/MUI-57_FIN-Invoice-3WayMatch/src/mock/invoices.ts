
// src/mock/invoices.ts
export type InvLine = { id: string; sku?: string; desc: string; qty: number; unit_price: number; uom?: string; tax_rate?: number; amount?: number };
export type InvStatus = 'new'|'suggested'|'approved'|'exception';
export type InvMatch = { po_id?: string; po_line_id?: string; qty_ok?: boolean; price_ok?: boolean; tax_ok?: boolean; variance?: { qty_pct:number; price_pct:number; tax_pct:number } };
export type Invoice = { id: string; inv_no: string; vendor_code: string; date: string; currency: string; status: InvStatus; contract_no?: string; po_no?: string; lines: InvLine[]; match?: InvMatch[]; note?: string };
const LS = 'erp.fin.invoices.v1';
function rid(){ return Math.random().toString(36).slice(2); }
function today(){ return new Date().toISOString(); }
export function seedInvoicesIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: Invoice[] = [
    { id: rid(), inv_no:'INV-2025-001', vendor_code:'V001', currency:'VND', date:today(), status:'new', lines:[
      { id: rid(), sku:'PAPER-A4', desc:'Giấy A4', qty:10, unit_price:56000, uom:'Ream', tax_rate:8 }, // slight price diff
      { id: rid(), sku:'PEN-BLUE', desc:'Bút bi xanh', qty:100, unit_price:3500, uom:'Piece', tax_rate:8 },
    ]},
    { id: rid(), inv_no:'INV-2025-002', vendor_code:'V002', currency:'VND', date:today(), status:'new', lines:[
      { id: rid(), sku:'HOTEL-NIGHT', desc:'Lưu trú 3 đêm', qty:3, unit_price:900000, uom:'Night', tax_rate:8 },
    ]},
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listInvoices(): Invoice[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveInvoices(a: Invoice[]){ localStorage.setItem(LS, JSON.stringify(a)); }
export function updateInvoice(inv: Invoice){ const a=listInvoices(); const i=a.findIndex(x=>x.id===inv.id); if(i>=0){ a[i]=inv; saveInvoices(a);} }
