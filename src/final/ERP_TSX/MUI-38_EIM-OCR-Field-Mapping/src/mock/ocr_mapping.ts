// src/mock/ocr_mapping.ts
export type UUID = string;

export type Scope = 'global'|'vendor'|'project';
export type TransformType = 'raw'|'trim'|'upper'|'lower'|'toDate'|'toNumber'|'regex'|'vendorNormalize';

export type Transform = {
  type: TransformType;
  // for regex
  pattern?: string;
  group?: number;
};

export type Rule = {
  target: string;           // ERP field (e.g., vendor,date,total)
  sourcePath: string;       // path in OCR object, e.g., 'vendor.value'
  transform: Transform;
  threshold?: number;       // 0..1 — if OCR confidence < threshold => use defaultValue (if provided) & warn
  defaultValue?: string;    // fallback when below threshold or source missing
};

export type MappingProfile = {
  id: UUID;
  name: string;
  scope: Scope;
  vendor?: string;
  project_id?: string;
  rules: Rule[];
  updated_at: string;
  created_at: string;
};

export type ExpenseReceipt = {
  id: UUID; doc_id: string; project_id?: string;
  vendor?: { value: string, confidence: number };
  date?: { value: string, confidence: number };
  currency?: { value: string, confidence: number };
  subtotal?: { value: number, confidence: number };
  tax?: { value: number, confidence: number };
  total?: { value: number, confidence: number };
  payment_method?: { value: string, confidence: number };
  category?: { value: string, confidence: number };
  line_items?: Array<{ data: any, confidence: number }>;
  status: string;
  created_at: string; updated_at: string;
};

const LS_MAP = 'erp.eim.ocr.mapping.v1';
const LS_ALIAS = 'erp.eim.ocr.vendor_alias.v1';
const LS_REC = 'erp.fin.receipts.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

export function listProfiles(): MappingProfile[] {
  try { return JSON.parse(localStorage.getItem(LS_MAP) || '[]'); } catch { return []; }
}
export function saveProfile(p: MappingProfile): void {
  const arr: MappingProfile[] = listProfiles();
  const i = arr.findIndex(x => x.id===p.id);
  p.updated_at = nowISO();
  if (i>=0) arr[i] = p; else arr.push(p);
  localStorage.setItem(LS_MAP, JSON.stringify(arr));
}
export function deleteProfile(id: string): void {
  const arr: MappingProfile[] = listProfiles().filter(p => p.id!==id);
  localStorage.setItem(LS_MAP, JSON.stringify(arr));
}

export function exportProfile(p: MappingProfile): Blob {
  return new Blob([JSON.stringify(p, null, 2)], { type:'application/json' });
}
export function importProfile(jsonText: string): MappingProfile {
  const p = JSON.parse(jsonText);
  if (!p.id) p.id = rid();
  p.created_at = p.created_at || nowISO();
  p.updated_at = nowISO();
  saveProfile(p);
  return p;
}

export type AliasRow = { alias: string; canonical: string };
export function listVendorAliases(): AliasRow[] {
  try { return JSON.parse(localStorage.getItem(LS_ALIAS) || '[]'); } catch { return []; }
}
export function saveVendorAliases(rows: AliasRow[]): void {
  localStorage.setItem(LS_ALIAS, JSON.stringify(rows));
}

export function listReceipts(project_id?: string): ExpenseReceipt[] {
  try {
    const arr: ExpenseReceipt[] = JSON.parse(localStorage.getItem(LS_REC) || '[]');
    return project_id ? arr.filter(r => r.project_id===project_id) : arr;
  } catch { return []; }
}

function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function siblingConfidencePath(path: string): string {
  return path.replace(/\.value(\.|$)/, '.confidence$1').replace(/(\w+)$/, 'confidence');
}

function normalizeNumber(s: any): number | undefined {
  if (s===null || typeof s==='undefined') return undefined;
  if (typeof s==='number') return s;
  const t = String(s).trim();
  // remove currency symbols and spaces
  let x = t.replace(/[^\d,.\-]/g, '');
  // if both comma and dot exist, assume dot as decimal if last is dot; else comma decimal
  if (x.count) {}
  const lastComma = x.lastIndexOf(',');
  const lastDot = x.lastIndexOf('.');
  let decSep = '.';
  if (lastComma>lastDot) decSep = ',';
  // remove thousand separators
  if (decSep===',') x = x.replace(/\./g,'');
  else x = x.replace(/,/g,'');
  // standardize decimal
  if (decSep===',') x = x.replace(',', '.');
  const n = parseFloat(x);
  return isNaN(n) ? undefined : n;
}

function toDateYMD(v: any): string | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  // try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // try DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2,'0'), mm = m[2].padStart(2,'0'), yy = m[3];
    return `${yy}-${mm}-${dd}`;
  }
  // try MM/DD/YYYY
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const mm = m2[1].padStart(2,'0'), dd = m2[2].padStart(2,'0'), yy = m2[3];
    return `${yy}-${mm}-${dd}`;
  }
  // ISO date-time
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
  return undefined;
}

function applyTransform(val: any, tr: Transform): any {
  switch (tr?.type) {
    case 'trim': return String(val||'').trim();
    case 'upper': return String(val||'').toUpperCase();
    case 'lower': return String(val||'').toLowerCase();
    case 'toNumber': return normalizeNumber(val);
    case 'toDate': return toDateYMD(val);
    case 'regex': {
      if (!tr.pattern) return val;
      try {
        const re = new RegExp(tr.pattern);
        const m = String(val||'').match(re);
        return m ? (tr.group ? m[tr.group] : m[0]) : undefined;
      } catch { return val; }
    }
    case 'vendorNormalize': {
      const rows: AliasRow[] = listVendorAliases();
      const s = String(val||'').trim().toLowerCase();
      const hit = rows.find(r => r.alias.trim().toLowerCase()===s);
      return hit ? hit.canonical : val;
    }
    case 'raw':
    default: return val;
  }
}

export type MappingLog = {
  target: string;
  sourcePath: string;
  rawValue: any;
  confidence?: number;
  transformed: any;
  usedDefault?: boolean;
  ok: boolean;
  warning?: string;
};

export function applyMapping(profile: MappingProfile, receipt: ExpenseReceipt): { output: any, logs: MappingLog[], warnings: string[] } {
  const logs: MappingLog[] = [];
  const out: any = {};
  const warnings: string[] = [];
  (profile.rules||[]).forEach(rule => {
    const raw = getByPath(receipt, rule.sourcePath);
    let conf: number | undefined = undefined;
    const confPath = siblingConfidencePath(rule.sourcePath);
    const c = getByPath(receipt, confPath);
    if (typeof c==='number') conf = c;
    let val = applyTransform(raw, rule.transform || { type:'raw' });
    let usedDefault = false;
    let ok = true;
    if ((raw===undefined || raw===null || raw==='') && rule.defaultValue!==undefined) {
      val = rule.defaultValue; usedDefault = true; ok = false;
      warnings.push(`Missing ${rule.sourcePath} → used default for ${rule.target}`);
    } else if (typeof conf==='number' && typeof rule.threshold==='number' && conf < rule.threshold) {
      if (rule.defaultValue!==undefined) { val = rule.defaultValue; usedDefault = true; }
      ok = false;
      warnings.push(`Low confidence (${conf}) on ${rule.sourcePath} < ${rule.threshold} for ${rule.target}`);
    }
    logs.push({ target: rule.target, sourcePath: rule.sourcePath, rawValue: raw, confidence: conf, transformed: val, usedDefault, ok, warning: ok? undefined : warnings[warnings.length-1] });
    out[rule.target] = val;
  });
  return { output: out, logs, warnings };
}

export function defaultProfile(): MappingProfile {
  const p: MappingProfile = {
    id: rid(),
    name: 'Default — Receipts',
    scope: 'global',
    rules: [
      { target:'vendor', sourcePath:'vendor.value', transform:{ type:'vendorNormalize' }, threshold:0.7 },
      { target:'date', sourcePath:'date.value', transform:{ type:'toDate' }, threshold:0.6 },
      { target:'currency', sourcePath:'currency.value', transform:{ type:'upper' }, threshold:0.5, defaultValue:'VND' },
      { target:'subtotal', sourcePath:'subtotal.value', transform:{ type:'toNumber' }, threshold:0.5 },
      { target:'tax', sourcePath:'tax.value', transform:{ type:'toNumber' }, threshold:0.5 },
      { target:'total', sourcePath:'total.value', transform:{ type:'toNumber' }, threshold:0.5 },
      { target:'payment_method', sourcePath:'payment_method.value', transform:{ type:'lower' }, threshold:0.5, defaultValue:'cash' },
      { target:'category', sourcePath:'category.value', transform:{ type:'lower' }, threshold:0.4, defaultValue:'other' },
    ],
    created_at: nowISO(), updated_at: nowISO()
  };
  return p;
}

// init seed if none
export function seedIfEmpty() {
  const arr = listProfiles();
  if (!arr || arr.length===0) {
    const p = defaultProfile(); saveProfile(p);
    // also seed vendor alias examples
    if (listVendorAliases().length===0) {
      saveVendorAliases([
        { alias:'ACME LTD', canonical:'ACME Co' },
        { alias:'CTY TNHH ACME', canonical:'ACME Co' },
        { alias:'CONG TY ACME', canonical:'ACME Co' },
      ]);
    }
  }
}
