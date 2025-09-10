
// src/mock/expense.ts — expense drafts storage (mobile‑first form)
export type UUID = string;
export type Currency = 'VND'|'USD'|'EUR'|'JPY'|'KRW'|'CNY';

export type ExpenseLine = {
  id: UUID;
  category: string;     // e.g., MEAL, TAXI, HOTEL, OFFICE
  description?: string;
  amount?: number;      // gross amount (includes tax)
  tax_rate?: number;    // percent, e.g., 8, 10
  receipt_image?: string; // dataURL
  project_code?: string;
};

export type ExpenseDraft = {
  id: UUID;
  employee_code: string;
  title: string;
  date: string;          // ISO date
  currency: Currency;
  dept_code?: string;
  project_code?: string; // header default
  status: 'draft'|'submitted';
  lines: ExpenseLine[];
  created_at?: string;
  updated_at?: string;
};

const LS = 'erp.fin.expense.drafts.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export function listDrafts(): ExpenseDraft[] {
  try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; }
}
export function saveDrafts(arr: ExpenseDraft[]){ localStorage.setItem(LS, JSON.stringify(arr)); }

export function newDraft(emp: { code:string, dept_code?:string, default_project?:string }): ExpenseDraft {
  const d: ExpenseDraft = {
    id: rid(), employee_code: emp.code, title: '', date: new Date().toISOString(),
    currency:'VND', dept_code: emp.dept_code, project_code: emp.default_project,
    status:'draft', lines: [], created_at: nowISO(), updated_at: nowISO()
  };
  const arr = listDrafts(); arr.unshift(d); saveDrafts(arr); return d;
}
export function getDraft(id: string): ExpenseDraft | null {
  return listDrafts().find(x => x.id===id) || null;
}
export function upsert(d: ExpenseDraft){
  const arr = listDrafts();
  const i = arr.findIndex(x => x.id===d.id);
  d.updated_at = nowISO();
  if (i>=0) arr[i] = d; else arr.unshift(d);
  saveDrafts(arr);
}
export function deleteDraft(id: string){
  const arr = listDrafts().filter(x => x.id!==id); saveDrafts(arr);
}
export function addLine(d: ExpenseDraft, partial?: Partial<ExpenseLine>): ExpenseLine {
  const l: ExpenseLine = { id: rid(), category:'MEAL', amount: 0, tax_rate: 10, ...partial };
  d.lines.push(l); upsert(d); return l;
}
export function removeLine(d: ExpenseDraft, id: string){
  d.lines = d.lines.filter(l => l.id!==id); upsert(d);
}
export function setReceipt(l: ExpenseLine, dataURL: string){ l.receipt_image = dataURL; }

export function totals(d: ExpenseDraft): { gross:number; tax:number; net:number } {
  let gross = 0, tax = 0;
  d.lines.forEach(l => {
    const amt = Number(l.amount||0);
    const rate = Number(l.tax_rate||0)/100;
    gross += amt;
    const inc_tax = amt - (amt/(1+rate)); // tax included in gross
    tax += isFinite(inc_tax) ? inc_tax : 0;
  });
  const net = gross - tax;
  return { gross, tax, net };
}

export function validate(d: ExpenseDraft): { ok:boolean; errors:string[] } {
  const errors: string[] = [];
  if (!d.title || d.title.trim().length<3) errors.push('Thiếu tiêu đề (>=3 ký tự)');
  if (!d.date) errors.push('Thiếu ngày chứng từ');
  if (!d.currency) errors.push('Thiếu tiền tệ');
  if (d.lines.length===0) errors.push('Cần ít nhất 1 dòng chi phí');
  d.lines.forEach((l, idx) => {
    if (!l.category) errors.push(`Dòng ${idx+1}: thiếu category`);
    if (!l.amount || Number(l.amount)<=0) errors.push(`Dòng ${idx+1}: số tiền phải > 0`);
  });
  return { ok: errors.length===0, errors };
}

export function submit(d: ExpenseDraft): { ok:boolean; errors:string[] } {
  const v = validate(d);
  if (!v.ok) return v;
  d.status = 'submitted';
  upsert(d);
  return { ok:true, errors:[] };
}

export function seedDemo(emp: { code:string }){
  const exist = listDrafts().some(x => x.employee_code===emp.code);
  if (exist) return;
  const d = newDraft({ code: emp.code, default_project: 'PRJ-001' });
  d.title = 'Taxi + ăn trưa';
  d.lines = [
    { id: rid(), category:'TAXI', description:'Grab từ VP → KH', amount: 150000, tax_rate: 0 },
    { id: rid(), category:'MEAL', description:'Ăn trưa với KH', amount: 320000, tax_rate: 8 },
  ];
  upsert(d);
}
