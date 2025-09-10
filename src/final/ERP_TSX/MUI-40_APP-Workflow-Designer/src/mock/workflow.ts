// src/mock/workflow.ts
export type UUID = string;

export type Comparator = 'eq'|'neq'|'gt'|'lt'|'gte'|'lte'|'in'|'contains';
export type ValueType = 'string'|'number'|'boolean';

export type Condition = {
  left: string;            // field path, e.g., 'amount', 'requester.department', 'project.budget'
  op: Comparator;
  right: any;              // literal or array for 'in'
  valueType?: ValueType;   // help parsing numbers/booleans
};

export type ApproverType = 'role'|'user'|'dynamic';
export type Approver = {
  type: ApproverType;
  ref: string;             // role name, user id/email, or dynamic path (e.g., 'requester.manager')
};

export type Stage = {
  id: UUID;
  name: string;
  entryCondition?: Condition | null;   // stage is skipped if false
  approvers: Approver[];               // list of approvers
  approvalRule: 'any'|'all';           // any = 1 approval enough; all = all approvers must approve
  slaHours?: number;                   // SLA threshold to escalate
  escalateTo?: Approver | null;        // target for escalation if SLA breached
  onReject: 'previous'|'terminate';    // behavior on reject
  notify?: string[];                   // emails/user ids to notify on entry/complete
};

export type Workflow = {
  id: UUID;
  name: string;
  entity_type: string;                 // e.g., 'expense_claim', 'purchase_request'
  version: number;
  stages: Stage[];                     // sequential stages
  created_at: string;
  updated_at: string;
  is_active?: boolean;
};

export type SimulationInput = {
  entity_type: string;
  payload: any;                        // object with fields used in conditions/dynamic approvers
};

export type SimulationResult = {
  appliedStages: Array<{
    id: string;
    name: string;
    skipped: boolean;
    reason?: string;
    approvers?: Approver[];
  }>;
  final: 'approved'|'terminated'|'pending';
  warnings: string[];
};

const LS_WF = 'erp.app.workflows.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

export function listWorkflows(entity_type?: string): Workflow[] {
  try {
    const arr: Workflow[] = JSON.parse(localStorage.getItem(LS_WF) || '[]');
    return entity_type ? arr.filter(w => w.entity_type===entity_type) : arr;
  } catch { return []; }
}
export function getWorkflow(id: string): Workflow | undefined {
  return listWorkflows().find(w => w.id===id);
}
export function saveWorkflow(w: Workflow): Workflow {
  const arr = listWorkflows();
  const i = arr.findIndex(x => x.id===w.id);
  w.updated_at = nowISO();
  if (i>=0) arr[i] = w; else { w.created_at = nowISO(); arr.push(w); }
  localStorage.setItem(LS_WF, JSON.stringify(arr));
  return w;
}
export function deleteWorkflow(id: string): void {
  const arr = listWorkflows().filter(w => w.id!==id);
  localStorage.setItem(LS_WF, JSON.stringify(arr));
}
export function exportWorkflow(w: Workflow): Blob {
  return new Blob([JSON.stringify(w, null, 2)], { type:'application/json' });
}
export function importWorkflow(jsonText: string): Workflow {
  const w = JSON.parse(jsonText);
  if (!w.id) w.id = rid();
  w.created_at = w.created_at || nowISO();
  w.updated_at = nowISO();
  saveWorkflow(w);
  return w;
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function coerce(val: any, vt?: ValueType): any {
  if (vt==='number') {
    const n = typeof val==='number' ? val : parseFloat(String(val).replace(/[^\d.-]/g,''));
    return isNaN(n) ? undefined : n;
  }
  if (vt==='boolean') {
    if (typeof val==='boolean') return val;
    const s = String(val).toLowerCase();
    return s==='true' || s==='1' || s==='yes';
  }
  return val;
}

export function evalCondition(c: Condition | null | undefined, payload: any): { ok: boolean, reason?: string } {
  if (!c) return { ok: true };
  const left = coerce(getByPath(payload, c.left), c.valueType);
  const right = c.op==='in' ? (Array.isArray(c.right) ? c.right : [c.right]) : coerce(c.right, c.valueType);
  let ok = false;
  switch (c.op) {
    case 'eq': ok = left===right; break;
    case 'neq': ok = left!==right; break;
    case 'gt': ok = Number(left) > Number(right); break;
    case 'lt': ok = Number(left) < Number(right); break;
    case 'gte': ok = Number(left) >= Number(right); break;
    case 'lte': ok = Number(left) <= Number(right); break;
    case 'in': ok = (right as any[]).some(v => String(v)===String(left)); break;
    case 'contains': ok = String(left||'').toLowerCase().includes(String(right||'').toLowerCase()); break;
  }
  const reason = ok ? 'condition met' : `condition failed: ${c.left} ${c.op} ${JSON.stringify(c.right)} (got ${JSON.stringify(left)})`;
  return { ok, reason };
}

export function resolveApprover(a: Approver, payload: any): Approver {
  if (a.type!=='dynamic') return a;
  const v = getByPath(payload, a.ref);
  return { type: 'user', ref: v || a.ref }; // fallback to path string
}

export function simulate(w: Workflow, input: SimulationInput): SimulationResult {
  const res: SimulationResult = { appliedStages: [], final: 'pending', warnings: [] };
  if (w.entity_type!==input.entity_type) {
    res.warnings.push(`Workflow entity_type ${w.entity_type} != ${input.entity_type}`);
  }
  for (let i=0; i<w.stages.length; i++) {
    const s = w.stages[i];
    const { ok, reason } = evalCondition(s.entryCondition, input.payload);
    if (!ok) {
      res.appliedStages.push({ id: s.id, name: s.name, skipped: true, reason });
      continue;
    }
    const approvers = (s.approvers||[]).map(a => resolveApprover(a, input.payload));
    if (!approvers.length) {
      res.warnings.push(`Stage "${s.name}" has no approvers`);
    }
    res.appliedStages.push({ id: s.id, name: s.name, skipped: false, approvers });
  }
  if (res.appliedStages.some(s => !s.skipped && (!s.approvers || s.approvers.length===0))) {
    res.final = 'terminated';
  } else {
    res.final = 'pending';
  }
  return res;
}

// Seed sample if none
export function seedIfEmpty() {
  const arr = listWorkflows();
  if (!arr || arr.length===0) {
    const w: Workflow = {
      id: rid(),
      name: 'Default — Expense Claim',
      entity_type: 'expense_claim',
      version: 1,
      is_active: true,
      stages: [
        {
          id: rid(),
          name: 'Line Manager Approval',
          entryCondition: { left:'total', op:'lte', right: 5000000, valueType:'number' },
          approvers: [{ type:'dynamic', ref:'requester.manager' }],
          approvalRule: 'any',
          slaHours: 24,
          escalateTo: { type:'role', ref:'Finance' },
          onReject: 'terminate',
          notify: []
        },
        {
          id: rid(),
          name: 'Finance Review',
          entryCondition: null,
          approvers: [{ type:'role', ref:'Finance' }],
          approvalRule: 'all',
          slaHours: 24,
          escalateTo: { type:'role', ref:'Finance Manager' },
          onReject: 'previous',
          notify: []
        },
        {
          id: rid(),
          name: 'Director Approval',
          entryCondition: { left:'total', op:'gt', right: 5000000, valueType:'number' },
          approvers: [{ type:'role', ref:'Director' }],
          approvalRule: 'any',
          onReject: 'terminate',
          notify: []
        }
      ],
      created_at: nowISO(),
      updated_at: nowISO()
    };
    saveWorkflow(w);
  }
}
