
// src/mock/pos.ts
export type POLine = { id: string; sku: string; desc: string; qty_ordered: number; qty_received: number; qty_invoiced: number; unit_price: number; uom: string; tax_rate?: number };
export type PO = { id: string; po_no: string; vendor_code: string; currency: string; date: string; project_code?: string; lines: POLine[] };
const LS = 'erp.fin.pos.v1';
function rid(){ return Math.random().toString(36).slice(2); }
export function seedPOsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: PO[] = [
    { id: rid(), po_no:'PO-2025-001', vendor_code:'V001', currency:'VND', date:new Date().toISOString(), lines:[
      { id: rid(), sku:'PAPER-A4', desc:'Giấy A4', qty_ordered:50, qty_received:50, qty_invoiced:10, unit_price:55000, uom:'Ream', tax_rate:8 },
      { id: rid(), sku:'PEN-BLUE', desc:'Bút bi xanh', qty_ordered:500, qty_received:500, qty_invoiced:200, unit_price:3500, uom:'Piece', tax_rate:8 },
    ]},
    { id: rid(), po_no:'PO-2025-015', vendor_code:'V002', currency:'VND', date:new Date().toISOString(), lines:[
      { id: rid(), sku:'HOTEL-NIGHT', desc:'Công tác phí khách sạn', qty_ordered:10, qty_received:8, qty_invoiced:8, unit_price:900000, uom:'Night', tax_rate:8 },
    ]},
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listPOs(): PO[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function updatePO(po: PO){
  const arr = listPOs(); const i = arr.findIndex(x => x.id===po.id); if (i>=0) { arr[i]=po; localStorage.setItem(LS, JSON.stringify(arr)); }
}
