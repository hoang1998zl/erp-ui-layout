
// src/mock/approvals.ts
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
  assigned_to?: { type: 'role'|'user'; ref: string }; // who is supposed to act
  status: TaskStatus;
  comments?: Array<{ by: string; at: string; text: string }>;
  payload?: any; // entity summary for preview
};

const LS_TASKS = 'erp.app.approvals.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=50){ return new Promise(res=>setTimeout(res, ms)); }

export type ListQuery = {
  q?: string;
  status?: TaskStatus|'all';
  entity_type?: EntityType|'all';
  role?: string; // assigned_to.ref
  sort?: 'sla'|'created_at'|'amount';
  asc?: boolean;
};

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
    {
      id: rid(), entity_type:'invoice', entity_id:'INV-2025-077', title:'Invoice – May Hosting',
      requester:{ id:'u04', name:'Pham D', department:'Finance', email:'d@sme.vn' },
      stage_name:'Finance Approval', workflow_id:'wf-invoice', approval_rule:'all',
      amount: 12_500_000, currency:'VND', created_at: minusH(72), due_at: plusH(48), priority:'low',
      assigned_to:{ type:'role', ref:'Finance' }, status:'pending',
      payload:{ vendor:'CloudCo', period:'2025-05', po:'PO-2025-088' }
    },
    {
      id: rid(), entity_type:'expense_claim', entity_id:'EC-2025-0002', title:'Expense Claim – Client Lunch',
      requester:{ id:'u05', name:'Pham E', department:'Sales', email:'e@sme.vn' },
      stage_name:'Finance Review', workflow_id:'wf-expense', approval_rule:'any',
      amount: 820000, currency:'VND', created_at: minusH(10), due_at: plusH(4), priority:'normal',
      assigned_to:{ type:'role', ref:'Finance' }, status:'pending',
      payload:{ items:[{cat:'Meals', amt:820000}], date:'2025-09-08' }
    },
  ];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
}

export async function listTasks(q?: ListQuery): Promise<ApprovalTask[]> {
  await delay();
  const rows: ApprovalTask[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  let out = rows.slice();
  if (q?.status && q.status!=='all') out = out.filter(r => r.status===q.status);
  if (q?.entity_type && q.entity_type!=='all') out = out.filter(r => r.entity_type===q.entity_type);
  if (q?.role) out = out.filter(r => (r.assigned_to?.ref||'').toLowerCase()===q.role!.toLowerCase());
  if (q?.q) {
    const s = q.q.toLowerCase();
    out = out.filter(r => (r.title+' '+r.entity_id+' '+r.requester.name+' '+(r.stage_name||'')).toLowerCase().includes(s));
  }
  // sort
  const by = q?.sort || 'sla';
  const asc = !!q?.asc;
  const now = Date.now();
  out.sort((a,b) => {
    if (by==='created_at') {
      return asc ? (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                 : (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (by==='amount') {
      return asc ? ((a.amount||0) - (b.amount||0)) : ((b.amount||0) - (a.amount||0));
    }
    // default sla: time remaining (overdue = negative -> highest priority: show first when asc=false)
    const ra = (new Date(a.due_at||a.created_at).getTime() - now);
    const rb = (new Date(b.due_at||b.created_at).getTime() - now);
    return asc ? (ra - rb) : (rb - ra);
  });
  return out;
}

export async function approve(id: string, comment?: string): Promise<ApprovalTask | undefined> {
  await delay();
  const rows: ApprovalTask[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const i = rows.findIndex(r => r.id===id);
  if (i<0) return undefined;
  rows[i].status = 'approved';
  rows[i].comments = [...(rows[i].comments||[]), { by:'me', at: nowISO(), text: comment||'Approved' }];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[i];
}
export async function reject(id: string, reason: string): Promise<ApprovalTask | undefined> {
  await delay();
  const rows: ApprovalTask[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const i = rows.findIndex(r => r.id===id);
  if (i<0) return undefined;
  rows[i].status = 'rejected';
  rows[i].comments = [...(rows[i].comments||[]), { by:'me', at: nowISO(), text: 'Rejected: '+reason }];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[i];
}
export async function delegate(id: string, to: string, note?: string): Promise<ApprovalTask | undefined> {
  await delay();
  const rows: ApprovalTask[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const i = rows.findIndex(r => r.id===id);
  if (i<0) return undefined;
  rows[i].status = 'delegated';
  rows[i].assigned_to = { type:'user', ref: to };
  rows[i].comments = [...(rows[i].comments||[]), { by:'me', at: nowISO(), text: `Delegated to ${to}${note?': '+note:''}` }];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[i];
}
export async function comment(id: string, text: string): Promise<ApprovalTask | undefined> {
  await delay();
  const rows: ApprovalTask[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  const i = rows.findIndex(r => r.id===id);
  if (i<0) return undefined;
  rows[i].comments = [...(rows[i].comments||[]), { by:'me', at: nowISO(), text }];
  localStorage.setItem(LS_TASKS, JSON.stringify(rows));
  return rows[i];
}

export async function bulkApprove(ids: string[], commentText?: string): Promise<number> {
  let cnt = 0; for (const id of ids) { await approve(id, commentText); cnt++; } return cnt;
}
export async function bulkReject(ids: string[], reason: string): Promise<number> {
  let cnt = 0; for (const id of ids) { await reject(id, reason); cnt++; } return cnt;
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
