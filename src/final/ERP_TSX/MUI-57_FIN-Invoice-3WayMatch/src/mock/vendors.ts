
// src/mock/vendors.ts
export type Vendor = { code: string; name: string; tax_code?: string; currency?: string };
const LS = 'erp.fin.vendors.v1';
export function seedVendorsIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: Vendor[] = [
    { code:'V001', name:'ABC Stationery', currency:'VND' },
    { code:'V002', name:'Hotel ABC', currency:'VND' },
    { code:'V003', name:'Tech World', currency:'USD' },
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listVendors(): Vendor[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
