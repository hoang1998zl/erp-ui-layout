
// src/mock/dimensions.ts
export type UUID = string;
export type ModuleKey = 'GL'|'AP'|'AR'|'EXP'|'PR'|'INV'|'CRM'|'HR';

export type DimensionType = {
  id: UUID;
  code: string;            // e.g., PROJECT, DEPT, COSTCENTER
  name_vi: string;
  name_en?: string;
  hierarchical: boolean;
  active: boolean;
  // Applicability rules per module
  applicability: Record<ModuleKey, { enabled: boolean; required: boolean }>;
  created_at?: string;
  updated_at?: string;
};

export type DimensionValue = {
  id: UUID;
  dim_code: string;        // FK -> DimensionType.code
  code: string;            // e.g., PRJ-001, HR
  name_vi: string;
  name_en?: string;
  parent_code?: string;    // for hierarchical types
  active: boolean;
  valid_from?: string;     // ISO date
  valid_to?: string;       // ISO date
  external_code?: string;  // mapping to other system
  attributes?: Record<string, string>; // free-form key-values
  created_at?: string;
  updated_at?: string;
};

const LS_DIM_TYPES = 'erp.fin.dim.types.v1';
const LS_DIM_VALUES = 'erp.fin.dim.values.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export function seedIfEmpty() {
  try {
    const t = localStorage.getItem(LS_DIM_TYPES);
    const v = localStorage.getItem(LS_DIM_VALUES);
    if (t && v) return;
  } catch {}
  const baseApp = (enabled=true, required=false)=>({ enabled, required });
  const types: DimensionType[] = [
    { id: rid(), code:'PROJECT', name_vi:'Dự án', name_en:'Project', hierarchical:true, active:true, applicability:{
      GL: baseApp(true,false), AP: baseApp(true,false), AR: baseApp(true,false), EXP: baseApp(true,true), PR: baseApp(true,true),
      INV: baseApp(false,false), CRM: baseApp(false,false), HR: baseApp(false,false)
    }},
    { id: rid(), code:'DEPT', name_vi:'Phòng ban', name_en:'Department', hierarchical:true, active:true, applicability:{
      GL: baseApp(true,true), AP: baseApp(true,false), AR: baseApp(true,false), EXP: baseApp(true,true), PR: baseApp(true,true),
      INV: baseApp(false,false), CRM: baseApp(false,false), HR: baseApp(true,false)
    }},
  ];
  const values: DimensionValue[] = [
    { id: rid(), dim_code:'PROJECT', code:'PRJ-001', name_vi:'ERP Rollout', name_en:'ERP Rollout', active:true },
    { id: rid(), dim_code:'PROJECT', code:'PRJ-002', name_vi:'Website Revamp', name_en:'Website Revamp', active:true },
    { id: rid(), dim_code:'DEPT', code:'HR', name_vi:'Nhân sự', name_en:'Human Resources', active:true },
    { id: rid(), dim_code:'DEPT', code:'IT', name_vi:'CNTT', name_en:'IT', active:true },
    { id: rid(), dim_code:'DEPT', code:'IT-OPS', parent_code:'IT', name_vi:'Vận hành hạ tầng', name_en:'IT Ops', active:true },
  ];
  localStorage.setItem(LS_DIM_TYPES, JSON.stringify(types));
  localStorage.setItem(LS_DIM_VALUES, JSON.stringify(values));
}

export function listTypes(): DimensionType[] {
  try { return JSON.parse(localStorage.getItem(LS_DIM_TYPES) || '[]'); } catch { return []; }
}
export function listValues(dim_code?: string): DimensionValue[] {
  try {
    const arr: DimensionValue[] = JSON.parse(localStorage.getItem(LS_DIM_VALUES) || '[]');
    return dim_code ? arr.filter(v => v.dim_code===dim_code) : arr;
  } catch { return []; }
}

export function upsertType(t: Partial<DimensionType>): DimensionType {
  const arr = listTypes();
  const idx = arr.findIndex(x => x.code===t.code);
  const base: DimensionType = idx>=0 ? arr[idx] : {
    id: rid(), code: t.code||'', name_vi: t.name_vi||'', hierarchical: !!t.hierarchical, active: true, applicability: defaultApplicability()
  } as any;
  const next: DimensionType = { ...base, ...t, updated_at: nowISO(), created_at: base.created_at||nowISO() };
  if (idx>=0) arr[idx] = next; else arr.push(next);
  localStorage.setItem(LS_DIM_TYPES, JSON.stringify(arr));
  return next;
}
export function deleteType(code: string) {
  // Also delete values of this type
  const arr = listTypes().filter(x => x.code!==code);
  localStorage.setItem(LS_DIM_TYPES, JSON.stringify(arr));
  const values = listValues().filter(v => v.dim_code!==code);
  localStorage.setItem(LS_DIM_VALUES, JSON.stringify(values));
}

export function upsertValue(v: Partial<DimensionValue>): DimensionValue {
  const arr = listValues();
  const idx = arr.findIndex(x => x.dim_code===v.dim_code && x.code===v.code);
  const base: DimensionValue = idx>=0 ? arr[idx] : {
    id: rid(), dim_code: v.dim_code||'', code: v.code||'', name_vi: v.name_vi||'', active: true
  } as any;
  const next: DimensionValue = { ...base, ...v, updated_at: nowISO(), created_at: base.created_at||nowISO() };
  if (idx>=0) arr[idx] = next; else arr.push(next);
  localStorage.setItem(LS_DIM_VALUES, JSON.stringify(arr));
  return next;
}
export function deleteValue(dim_code: string, code: string) {
  const arr = listValues().filter(x => !(x.dim_code===dim_code && x.code===code));
  localStorage.setItem(LS_DIM_VALUES, JSON.stringify(arr));
}

export function defaultApplicability(): Record<ModuleKey, { enabled:boolean; required:boolean }> {
  const keys: ModuleKey[] = ['GL','AP','AR','EXP','PR','INV','CRM','HR'];
  const map: any = {};
  keys.forEach(k => map[k] = { enabled: false, required: false });
  return map;
}

export function validateType(t: DimensionType, existing: DimensionType[]): { ok:boolean; errors:string[]; warnings:string[] } {
  const errors:string[] = []; const warnings:string[] = [];
  if (!t.code) errors.push('Thiếu mã chiều (code)');
  if (!t.name_vi) errors.push('Thiếu tên VI');
  if (existing.filter(x => x.code===t.code && x.id!==t.id).length>0) errors.push('Trùng mã chiều');
  // required cannot be true if disabled
  Object.entries(t.applicability||{}).forEach(([m, v]: any) => {
    if (v.required && !v.enabled) errors.push(`Module ${m}: required=true nhưng enabled=false`);
  });
  return { ok: errors.length===0, errors, warnings };
}

export function validateValue(v: DimensionValue, existing: DimensionValue[], type?: DimensionType): { ok:boolean; errors:string[]; warnings:string[] } {
  const errors:string[] = []; const warnings:string[] = [];
  if (!v.dim_code) errors.push('Thiếu dim_code');
  if (!v.code) errors.push('Thiếu mã giá trị');
  if (!v.name_vi) errors.push('Thiếu tên VI');
  if (existing.filter(x => x.dim_code===v.dim_code && x.code===v.code && x.id!==v.id).length>0) errors.push('Trùng mã giá trị trong cùng chiều');
  if (v.parent_code) {
    const parent = existing.find(x => x.dim_code===v.dim_code && x.code===v.parent_code);
    if (!parent) errors.push('Parent không tồn tại');
  }
  if (v.valid_from && v.valid_to) {
    if (new Date(v.valid_from) > new Date(v.valid_to)) errors.push('valid_from > valid_to');
  }
  if (type && !type.hierarchical && v.parent_code) warnings.push('Chiều không phân cấp nhưng có parent_code — sẽ bỏ qua parent');
  return { ok: errors.length===0, errors, warnings };
}

export function exportCSV(dim_code: string): string {
  const header = 'dim_code,code,name_vi,name_en,parent_code,active,valid_from,valid_to,external_code';
  const rows = listValues(dim_code).map(v => [
    v.dim_code, v.code, v.name_vi||'', v.name_en||'', v.parent_code||'',
    v.active?'1':'0', v.valid_from||'', v.valid_to||'', v.external_code||''
  ].join(','));
  return [header, ...rows].join('\n');
}
export function importCSV(text: string): DimensionValue[] {
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length<=1) return [];
  const header = lines[0].split(',').map(s=>s.trim());
  const idx = (k:string)=> header.indexOf(k);
  const out: DimensionValue[] = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',').map(s=>s.trim());
    const get = (k:string)=>{ const j = idx(k); return j>=0 ? cols[j] : ''; };
    const v: DimensionValue = {
      id: rid(),
      dim_code: get('dim_code'),
      code: get('code'),
      name_vi: get('name_vi'),
      name_en: get('name_en'),
      parent_code: get('parent_code') || undefined,
      active: get('active')==='1' || /true/i.test(get('active')),
      valid_from: get('valid_from') || undefined,
      valid_to: get('valid_to') || undefined,
      external_code: get('external_code') || undefined,
      attributes: {}
    };
    out.push(v);
  }
  return out;
}

// Build value tree for a dim
export type ValueTree = { code:string; name:string; active:boolean; children: ValueTree[] };
export function buildValueTree(dim_code: string): ValueTree[] {
  const vals = listValues(dim_code);
  const by: Record<string, ValueTree> = {};
  const roots: ValueTree[] = [];
  vals.forEach(v => by[v.code] = { code:v.code, name:v.name_vi||v.name_en||v.code, active:v.active, children:[] });
  vals.forEach(v => {
    const node = by[v.code];
    if (v.parent_code && by[v.parent_code]) by[v.parent_code].children.push(node);
    else roots.push(node);
  });
  const sortTree = (ns:ValueTree[]) => { ns.sort((a,b)=> a.code.localeCompare(b.code)); ns.forEach(n => sortTree(n.children)); };
  sortTree(roots);
  return roots;
}
