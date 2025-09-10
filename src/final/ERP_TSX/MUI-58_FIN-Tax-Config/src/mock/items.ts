
// src/mock/items.ts — minimal items with categories & tax_code
export type UUID = string;
export type Item = { id: UUID; sku: string; name: string; category: string; tax_code?: string; active: boolean };
const LS = 'erp.inv.items.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }
export function seedItemsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: Item[] = [
    { id: rid(), sku:'PAPER-A4', name:'Giấy A4', category:'STATIONERY', tax_code:'VAT8-IN', active:true },
    { id: rid(), sku:'PEN-BLUE', name:'Bút bi xanh', category:'STATIONERY', tax_code:'VAT8-IN', active:true },
    { id: rid(), sku:'LAP-14',   name:'Laptop 14"', category:'EQUIPMENT', tax_code:'VAT10-IN', active:true },
    { id: rid(), sku:'CONSULT',  name:'Dịch vụ tư vấn', category:'SERVICE', tax_code:'NONVAT', active:true },
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listItems(): Item[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveItems(a: Item[]){ localStorage.setItem(LS, JSON.stringify(a)); }
export function updateItemTax(id: string, tax_code?: string){
  const a = listItems(); const i=a.findIndex(x=>x.id===id); if(i>=0){ a[i].tax_code = tax_code; saveItems(a); }
}
export function bulkApplyByCategory(category: string, tax_code: string, onlyEmpty=false){
  const a = listItems(); a.forEach(it => {
    if (it.category===category){
      if (!onlyEmpty || !it.tax_code) it.tax_code = tax_code;
    }
  });
  saveItems(a);
}
export function categories(): string[]{ return Array.from(new Set(listItems().map(i=>i.category))); }
