// src/mock/rules.ts
export type UUID = string;

export type ValueType = 'string'|'number'|'boolean'|'date';
export type Operator = 'eq'|'neq'|'gt'|'lt'|'gte'|'lte'|'in'|'contains'|'startsWith'|'endsWith'|'between'|'exists'|'notexists';

export type Predicate = {
  kind: 'predicate';
  id: UUID;
  field: string;         // e.g., 'total', 'requester.department'
  op: Operator;
  value?: any;           // for 'in' => comma list or array; for 'between' => lower bound (use value2 as upper)
  value2?: any;          // only for 'between'
  valueType?: ValueType; // help parsing numbers/booleans/dates
};

export type GroupLogic = 'all'|'any'|'none'; // all = AND, any = OR, none = NOT(OR)
export type Group = {
  kind: 'group';
  id: UUID;
  logic: GroupLogic;
  children: RuleNode[];
};

export type RuleNode = Predicate | Group;

const LS_RULES = 'erp.app.rules.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=40){ return new Promise(res=>setTimeout(res, ms)); }

export function seedIfEmpty() {
  try {
    const txt = localStorage.getItem(LS_RULES);
    if (txt) return;
  } catch {}
  const demo: Group = {
    kind:'group', id: rid(), logic:'all', children:[
      { kind:'predicate', id: rid(), field:'total', op:'gt', value: 5000000, valueType:'number' },
      { kind:'predicate', id: rid(), field:'requester.department', op:'in', value:['IT','HR'], valueType:'string' },
    ]
  };
  saveRuleTree(demo);
}

export function getRuleTree(): RuleNode | null {
  try { const txt = localStorage.getItem(LS_RULES); return txt ? JSON.parse(txt) : null; } catch { return null; }
}

export function saveRuleTree(tree: RuleNode): void {
  localStorage.setItem(LS_RULES, JSON.stringify(tree));
}

function getByPath(obj: any, path: string): any {
  if (path==='.' || path==='') return obj;
  return path.split('.').reduce((acc,k)=> (acc ? acc[k] : undefined), obj);
}
function coerce(val: any, vt?: ValueType): any {
  if (vt==='number') {
    if (typeof val==='number') return val;
    const n = parseFloat(String(val).replace(/[^\d\.\-]/g,''));
    return isNaN(n)? undefined : n;
  }
  if (vt==='boolean') {
    if (typeof val==='boolean') return val;
    const s = String(val).toLowerCase();
    return s==='true'||s==='1'||s==='yes';
  }
  if (vt==='date') {
    const d = new Date(val); return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0,10);
  }
  return val;
}

export type EvalLog = { id: string; kind: 'predicate'|'group'; ok: boolean; detail: string };
export type EvalResult = { ok: boolean; logs: EvalLog[] };

export function evaluate(node: RuleNode, payload: any): EvalResult {
  const logs: EvalLog[] = [];
  function evalNode(n: RuleNode): boolean {
    if (n.kind==='predicate') {
      const left = coerce(getByPath(payload, n.field), n.valueType);
      const op = n.op;
      const vt = n.valueType;
      const val = coerce(n.value, vt);
      const val2 = coerce(n.value2, vt);
      let ok = false;
      switch (op) {
        case 'exists': ok = typeof left!=='undefined' && left!==null && left!==''; break;
        case 'notexists': ok = typeof left==='undefined' || left===null || left===''; break;
        case 'eq': ok = String(left)===String(val); break;
        case 'neq': ok = String(left)!==String(val); break;
        case 'gt': ok = Number(left) > Number(val); break;
        case 'lt': ok = Number(left) < Number(val); break;
        case 'gte': ok = Number(left) >= Number(val); break;
        case 'lte': ok = Number(left) <= Number(val); break;
        case 'contains': ok = String(left||'').toLowerCase().includes(String(val||'').toLowerCase()); break;
        case 'startsWith': ok = String(left||'').toLowerCase().startsWith(String(val||'').toLowerCase()); break;
        case 'endsWith': ok = String(left||'').toLowerCase().endsWith(String(val||'').toLowerCase()); break;
        case 'in': {
          const arr = Array.isArray(val) ? val : String(val||'').split(',').map(s=>s.trim()).filter(Boolean);
          ok = arr.some(v => String(v)===String(left));
          break;
        }
        case 'between': ok = Number(left)>=Number(val) && Number(left)<=Number(val2); break;
      }
      logs.push({ id: n.id, kind:'predicate', ok, detail: `${n.field} ${op} ${JSON.stringify(n.value)}${op==='between'? ' and '+JSON.stringify(n.value2):''} -> ${JSON.stringify(left)}` });
      return ok;
    } else {
      // group
      const child = (n.children||[]).map(evalNode);
      let ok = false;
      if (n.logic==='all') ok = child.every(v=>v);
      else if (n.logic==='any') ok = child.some(v=>v);
      else if (n.logic==='none') ok = !child.some(v=>v);
      logs.push({ id: n.id, kind:'group', ok, detail: `Group ${n.logic} on ${child.length} children` });
      return ok;
    }
  }
  const ok = evalNode(node);
  return { ok, logs };
}

export function newPredicate(): Predicate {
  return { kind:'predicate', id: rid(), field:'total', op:'gt', value: 0, valueType:'number' };
}
export function newGroup(logic: GroupLogic = 'all'): Group {
  return { kind:'group', id: rid(), logic, children: [] };
}
