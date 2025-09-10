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
  // include approval outcomes so UI can read/write legacy status values
  status: 'draft'|'submitted'|'approved'|'rejected';
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

// Seed sample data for Expense Approval demo
export function seedExpenseApprovalData() {
  const existing = listDrafts();
  if (existing.length > 0) return; // Already has data
  
  const sampleExpenses: ExpenseDraft[] = [
    {
      id: rid(),
      employee_code: 'E0001',
      title: 'Chuyến công tác Hà Nội',
      date: '2024-12-08',
      currency: 'VND',
      dept_code: 'IT',
      project_code: 'PRJ-001',
      status: 'submitted',
      lines: [
        { id: rid(), category: 'TAXI', description: 'Taxi sân bay', amount: 200000, tax_rate: 0 },
        { id: rid(), category: 'HOTEL', description: 'Khách sạn 2 đêm', amount: 1800000, tax_rate: 10 },
        { id: rid(), category: 'MEAL', description: 'Ăn uống 3 ngày', amount: 450000, tax_rate: 8 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0002',
      title: 'Mua vật tư văn phòng',
      date: '2024-12-07',
      currency: 'VND',
      dept_code: 'HR',
      project_code: 'PRJ-002',
      status: 'submitted',
      lines: [
        { id: rid(), category: 'OFFICE', description: 'Giấy A4, bút', amount: 350000, tax_rate: 10 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0003',
      title: 'Training khóa học online',
      date: '2024-12-09',
      currency: 'USD',
      dept_code: 'FINANCE',
      project_code: 'PRJ-003',
      status: 'submitted',
      lines: [
        { id: rid(), category: 'TRAINING', description: 'Financial modeling course', amount: 199, tax_rate: 0 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0004',
      title: 'Marketing event tại TP.HCM',
      date: '2024-12-06',
      currency: 'VND',
      dept_code: 'SALES',
      project_code: 'PRJ-004',
      status: 'submitted',
      lines: [
        { id: rid(), category: 'TRAVEL', description: 'Vé máy bay HN-SGN', amount: 2500000, tax_rate: 10 },
        { id: rid(), category: 'HOTEL', description: 'Khách sạn 1 đêm', amount: 800000, tax_rate: 10 },
        { id: rid(), category: 'MEAL', description: 'Tiếp khách hàng', amount: 1200000, tax_rate: 8 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0001',
      title: 'Meeting khách hàng',
      date: '2024-12-05',
      currency: 'VND',
      dept_code: 'IT',
      project_code: 'PRJ-001',
      status: 'approved',
      lines: [
        { id: rid(), category: 'MEAL', description: 'Ăn trưa với khách', amount: 680000, tax_rate: 8 },
        { id: rid(), category: 'TAXI', description: 'Grab đi về', amount: 120000, tax_rate: 0 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0005',
      title: 'Mua thiết bị IT',
      date: '2024-12-04',
      currency: 'VND',
      dept_code: 'IT',
      project_code: 'PRJ-005',
      status: 'approved',
      lines: [
        { id: rid(), category: 'EQUIPMENT', description: 'USB, cáp mạng', amount: 850000, tax_rate: 10 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0002',
      title: 'Đào tạo online',
      date: '2024-12-03',
      currency: 'USD',
      dept_code: 'HR',
      status: 'rejected',
      lines: [
        { id: rid(), category: 'TRAINING', description: 'Course subscription', amount: 299, tax_rate: 0 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    },
    {
      id: rid(),
      employee_code: 'E0003',
      title: 'Audit tài chính quý 4',
      date: '2024-12-02',
      currency: 'VND',
      dept_code: 'FINANCE',
      status: 'rejected',
      lines: [
        { id: rid(), category: 'SERVICE', description: 'Phí dịch vụ kiểm toán', amount: 5000000, tax_rate: 10 }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    }
  ];
  
  saveDrafts(sampleExpenses);
}


// --- Approval extensions for FIN-10 ---
export type ApprovalStatus = 'pending'|'approved'|'rejected';
export type ApprovalInfo = { status: ApprovalStatus; decided_by?: string; decided_at?: string; comment?: string };

// Backward comp: submitted => pending in approval context
export function approvalStatusOf(d: ExpenseDraft): ApprovalStatus {
  if ((d as any).status === 'submitted') return 'pending';
  if ((d as any).status === 'approved') return 'approved';
  if ((d as any).status === 'rejected') return 'rejected';
  return 'pending';
}

export function setApproval(d: ExpenseDraft, info: ApprovalInfo){
  // map to legacy status field for compatibility with other lists
  if (info.status==='approved') (d as any).status = 'approved';
  else if (info.status==='rejected') (d as any).status = 'rejected';
  else (d as any).status = 'submitted';
  (d as any).approval = info;
  upsert(d);
}

export function approveExpense(id: string, actor: string, comment?: string): { ok:boolean; msg?:string } {
  const arr = listDrafts(); const d = arr.find(x => x.id===id);
  if (!d) return { ok:false, msg:'Not found' };
  if ((d as any).status!=='submitted') return { ok:false, msg:'Not in pending state' };
  setApproval(d, { status:'approved', decided_by: actor, decided_at: new Date().toISOString(), comment });
  return { ok:true };
}
export function rejectExpense(id: string, actor: string, comment?: string): { ok:boolean; msg?:string } {
  const arr = listDrafts(); const d = arr.find(x => x.id===id);
  if (!d) return { ok:false, msg:'Not found' };
  if ((d as any).status!=='submitted') return { ok:false, msg:'Not in pending state' };
  setApproval(d, { status:'rejected', decided_by: actor, decided_at: new Date().toISOString(), comment });
  return { ok:true };
}
export function bulkApprove(ids: string[], actor: string, comment?: string){
  const res = { ok:0, fail:0 };
  ids.forEach(id => {
    const r = approveExpense(id, actor, comment);
    if (r.ok) res.ok++; else res.fail++;
  });
  return res;
}
export function bulkReject(ids: string[], actor: string, comment?: string){
  const res = { ok:0, fail:0 };
  ids.forEach(id => {
    const r = rejectExpense(id, actor, comment);
    if (r.ok) res.ok++; else res.fail++;
  });
  return res;
}
export function listForApproval(): ExpenseDraft[] {
  return listDrafts().filter((d:any)=> d.status==='submitted');
}
export function amountGross(d: ExpenseDraft): number {
  try { return (d.lines||[]).reduce((s:any,l:any)=> s + (Number(l.amount)||0), 0); } catch { return 0; }
}
