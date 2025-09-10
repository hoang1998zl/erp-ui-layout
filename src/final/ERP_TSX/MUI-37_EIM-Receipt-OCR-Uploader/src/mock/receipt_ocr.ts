// src/mock/receipt_ocr.ts — stub OCR provider + storage
import { listDocuments, type DocumentRow } from './documents';

export type UUID = string;
export type OCRProvider = 'mock';
export type ReceiptStatus = 'pending_ocr'|'ocr_done'|'draft'|'ready'|'submitted';

export type LineItem = { description: string; qty: number; unit_price: number; amount: number; vat_rate?: number; };
export type FieldConfidence = { value: any; confidence: number }; // 0..1

export type ExpenseReceipt = {
  id: UUID;
  doc_id: string;
  project_id?: string;
  vendor?: FieldConfidence;
  date?: FieldConfidence;              // YYYY-MM-DD
  currency?: FieldConfidence;          // VND/USD/..
  total?: FieldConfidence;             // gross
  tax?: FieldConfidence;               // VAT amount
  subtotal?: FieldConfidence;          // net
  payment_method?: FieldConfidence;    // cash/card/transfer
  category?: FieldConfidence;          // meals/taxi/hotel/other
  line_items?: Array<{ data: LineItem; confidence: number }>;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
};

const LS_REC = 'erp.fin.receipts.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=80){ return new Promise(res=>setTimeout(res, ms)); }

function getRows(): ExpenseReceipt[] { try { return JSON.parse(localStorage.getItem(LS_REC) || '[]'); } catch { return []; } }
function setRows(rows: ExpenseReceipt[]){ localStorage.setItem(LS_REC, JSON.stringify(rows)); }

export async function listReceipts(project_id?: string): Promise<ExpenseReceipt[]> {
  await delay();
  const rows = getRows();
  return project_id ? rows.filter(r => r.project_id===project_id) : rows;
}

export async function getByDocId(doc_id: string): Promise<ExpenseReceipt | undefined> {
  await delay();
  return getRows().find(r => r.doc_id===doc_id);
}

export async function upsertReceipt(rec: Partial<ExpenseReceipt> & { id?: string, doc_id: string }): Promise<ExpenseReceipt> {
  await delay();
  const rows = getRows();
  const now = nowISO();
  if (rec.id) {
    const i = rows.findIndex(r => r.id===rec.id);
    if (i>=0) { rows[i] = { ...rows[i], ...rec, updated_at: now } as ExpenseReceipt; setRows(rows); return rows[i]; }
  }
  const n: ExpenseReceipt = {
    id: rid(), doc_id: rec.doc_id, project_id: rec.project_id,
    vendor: rec.vendor, date: rec.date, currency: rec.currency||{ value:'VND', confidence:.5 },
    total: rec.total, tax: rec.tax, subtotal: rec.subtotal, payment_method: rec.payment_method, category: rec.category,
    line_items: rec.line_items || [], status: rec.status || 'draft', created_at: now, updated_at: now
  };
  rows.push(n); setRows(rows); return n;
}

function guessCurrencyFromName(name: string): string | undefined {
  if (/usd|\\$/.test(name)) return 'USD';
  if (/eur|€/.test(name)) return 'EUR';
  if (/jpy|¥/.test(name)) return 'JPY';
  if (/cny|rmb|元|¥/.test(name)) return 'CNY';
  return undefined;
}

export async function runOCRMock(doc: DocumentRow): Promise<ExpenseReceipt> {
  // Heuristic OCR stub based on file_name/title/vendor/amount
  await delay(300);
  const low = (v:any)=>({ value:v, confidence:0.55 });
  const mid = (v:any)=>({ value:v, confidence:0.78 });
  const hi  = (v:any)=>({ value:v, confidence:0.92 });

  const name = (doc.title||doc.file_name||'').toLowerCase();
  const vendor = doc.vendor || (name.match(/[a-z]+/g)?.slice(0,2).join(' ').toUpperCase()) || 'VENDOR';
  const date  = doc.doc_date || new Date().toISOString().slice(0,10);
  const cur   = doc.currency || guessCurrencyFromName(doc.file_name.toLowerCase()) || 'VND';
  const total = doc.amount || (Math.round((Math.random()*400+60))*1000);
  const vat   = Math.round(total * 0.08); // 8% VAT as default
  const subtotal = total - vat;

  const li: LineItem[] = [
    { description: 'Item A', qty: 1, unit_price: subtotal*0.6, amount: subtotal*0.6, vat_rate: 8 },
    { description: 'Item B', qty: 1, unit_price: subtotal*0.4, amount: subtotal*0.4, vat_rate: 8 },
  ];

  const rec: Partial<ExpenseReceipt> = {
    doc_id: doc.id,
    project_id: doc.project_id,
    vendor: hi(vendor),
    date: mid(date),
    currency: mid(cur),
    total: hi(total),
    tax: mid(vat),
    subtotal: mid(subtotal),
    payment_method: low('cash'),
    category: low('other'),
    line_items: li.map(x => ({ data: x, confidence: 0.75 })),
    status: 'ocr_done'
  };
  return await upsertReceipt(rec as any);
}

export async function exportCSV(project_id?: string): Promise<Blob> {
  await delay();
  const rows = await listReceipts(project_id);
  const header = ['id','doc_id','project_id','vendor','date','currency','subtotal','tax','total','payment_method','category','status'];
  const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"`+String(v).replace(/"/g,'""')+`"` : String(v);
  const lines = [header.join(',')];
  rows.forEach(r => {
    const get = (f:any)=> f?.value ?? '';
    lines.push([r.id,r.doc_id,r.project_id,get(r.vendor),get(r.date),get(r.currency),get(r.subtotal),get(r.tax),get(r.total),get(r.payment_method),get(r.category),r.status].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}
