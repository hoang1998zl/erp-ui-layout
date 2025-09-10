
// src/mock/approvals.ts — reuse from APP‑03 with minor export additions
export type UUID = string;
export type EntityType = 'expense_claim'|'purchase_request'|'contract'|'invoice'|'generic';
export type TaskStatus = 'pending'|'approved'|'rejected'|'delegated';
export type Priority = 'low'|'normal'|'high';

export type ApprovalTask = {
  id: UUID;
  entity_type: EntityType;
  entity_id: string;
  title: string;
  requester: { id: string; name: string; department?: string; email?: string };
  stage_name: string;
  workflow_id?: string;
  approval_rule?: 'any'|'all';
  amount?: number;
  currency?: string;
  created_at: string;
  due_at?: string; // SLA deadline
  priority?: Priority;
  assigned_to?: { type: 'role'|'user'; ref: string };
  status: TaskStatus;
  comments?: Array<{ by: string; at: string; text: string }>;
  payload?: any;
};

const LS_TASKS = 'erp.app.approvals.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=40){ return new Promise(res=>setTimeout(res, ms)); }

export function seedIfEmpty() {
  try { const txt = localStorage.getItem(LS_TASKS); if (txt) return; } catch {}
  const now = new Date();
  const plusH = (h:number)=> new Date(now.getTime()+h*3600*1000).toISOString();
  const minusH = (h:number)=> new Date(now.getTime()-h*3600*1000).toISOString();
  const rows: ApprovalTask[] = [
    {
      id: rid(), entity_type:'expense_claim', entity_id:'EC-2025-0001', title:'Expense Claim – Taxi & Meals',
      requester:{ id:'u01', name:'Nguyen Van A', department:'Sales', email:'a@sme.vn' },
      stage_name:'Line Manager Approval', workflow_id:'wf-expense', approval_rule:'any',
      amount: 1250000, currency:'VND', created_at: minusH(6), due_at: plusH(18), priority:'normal',
      assigned_to:{ type:'role', ref:'Manager' }, status:'pending',
      payload:{ items:[{cat:'Taxi', amt:350000},{cat:'Meal', amt:900000}], date:'2025-09-07' }
    },
    {
      id: rid(), entity_type:'purchase_request', entity_id:'PR-2025-0132', title:'PR – 10x Laptop',
      requester:{ id:'u02', name:'Tran Thi B', department:'IT', email:'b@sme.vn' },
      stage_name:'Finance Review', workflow_id:'wf-proc', approval_rule:'all',
      amount: 250_000_000, currency:'VND', created_at: minusH(20), due_at: minusH(2), priority:'high',
      assigned_to:{ type:'role', ref:'Finance' }, status:'pending',
      payload:{ vendor:'ACME', items:[{name:'Laptop', qty:10, price:25_000_000}] }
    },
    {
      id: rid(), entity_type:'contract', entity_id:'CT-24-019', title:'Contract – Vendor ACME (Support)',
      requester:{ id:'u03', name:'Le Van C', department:'PMO', email:'c@sme.vn' },
      stage_name:'Director Approval', workflow_id:'wf-contract', approval_rule:'any',
      amount: 30_000_000, currency:'VND', created_at: minusH(40), due_at: plusH(8), priority:'high',
      assigned_to:{ type:'role', ref:'Director' }, status:'pending',
      payload:{ vendor:'ACME', term:'12 months', start:'2025-10-01' }
    },
  ];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
}

export function listTasks(): ApprovalTask[] {
  try { return JSON.parse(localStorage.getItem(LS_TASKS) || '[]'); } catch { return []; }
}
export function getTask(id: string): ApprovalTask | undefined {
  return listTasks().find(x => x.id===id);
}
export function saveTask(t: ApprovalTask): void {
  const arr = listTasks();
  const i = arr.findIndex(x => x.id===t.id);
  if (i>=0) arr[i] = t; else arr.push(t);
  localStorage.setItem(LS_TASKS, JSON.stringify(arr));
}
export function timeLeftText(due_at?: string): { ms: number, text: string } {
  const now = Date.now();
  const t = new Date(due_at||new Date().toISOString()).getTime();
  const ms = t - now;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const text = ms >= 0 ? `${h}h ${m}m left` : `${h}h ${m}m overdue`;
  return { ms, text };
}

// Simple actions (mock): approve/reject/delegate/comment
export function approve(id: string, comment?: string): ApprovalTask | undefined {
  const t = getTask(id); if (!t) return undefined;
  t.status = 'approved'; t.comments = [...(t.comments||[]), { by:'me', at: nowISO(), text: comment||'Approved' }];
  saveTask(t); return t;
}
export function reject(id: string, reason: string): ApprovalTask | undefined {
  const t = getTask(id); if (!t) return undefined;
  t.status = 'rejected'; t.comments = [...(t.comments||[]), { by:'me', at: nowISO(), text: 'Rejected: '+reason }];
  saveTask(t); return t;
}
export function delegateTo(id: string, to: string, note?: string): ApprovalTask | undefined {
  const t = getTask(id); if (!t) return undefined;
  t.status = 'delegated'; t.assigned_to = { type:'user', ref: to };
  t.comments = [...(t.comments||[]), { by:'me', at: nowISO(), text: `Delegated to ${to}${note?': '+note:''}` }];
  saveTask(t); return t;
}
export function addComment(id: string, text: string): ApprovalTask | undefined {
  const t = getTask(id); if (!t) return undefined;
  t.comments = [...(t.comments||[]), { by:'me', at: nowISO(), text }];
  saveTask(t); return t;
}
