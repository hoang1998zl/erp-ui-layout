
// src/mock/costcenters.ts — FIN-16 Cost center master
export type UUID = string;
export type CostCenter = {
  id: UUID;
  code: string;            // unique
  name_vi: string;
  name_en?: string;
  parent_code?: string;    // parent cost center code
  level?: number;          // computed
  path?: string;           // computed (e.g., "CCO/SALES/SAIGON")
  owner_dept?: string;
  manager?: string;        // employee code/name (free text for mock)
  effective_from?: string; // ISO date
  effective_to?: string;   // ISO date
  active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};
const LS = 'erp.fin.costcenters.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function nowISO(){ return new Date().toISOString(); }
export function listCC(): CostCenter[] { try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
export function saveCC(arr: CostCenter[]){ localStorage.setItem(LS, JSON.stringify(arr)); }
export function seedIfEmpty(){
  if (listCC().length) return;
  const arr: CostCenter[] = [
    { id: rid(), code:'ADMIN', name_vi:'Khối Hành chính', name_en:'Administration', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'FIN', name_vi:'Tài chính', parent_code:'ADMIN', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'HR', name_vi:'Nhân sự', parent_code:'ADMIN', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'OPS', name_vi:'Vận hành', name_en:'Operations', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'OPS-SG', name_vi:'OPS Sài Gòn', parent_code:'OPS', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'OPS-HN', name_vi:'OPS Hà Nội', parent_code:'OPS', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'SALES', name_vi:'Kinh doanh', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'SALES-B2B', name_vi:'KD Doanh nghiệp', parent_code:'SALES', active:true, created_at: nowISO(), updated_at: nowISO() },
    { id: rid(), code:'SALES-ONLINE', name_vi:'KD Online', parent_code:'SALES', active:true, created_at: nowISO(), updated_at: nowISO() },
  ];
  // compute level/path initially
  const byCode = new Map<string, CostCenter>(); arr.forEach(x => byCode.set(x.code, x));
  function compute(x: CostCenter){
    const trail: string[] = [x.code];
    let p = x.parent_code ? byCode.get(x.parent_code) : undefined;
    while (p) { trail.unshift(p.code); p = p.parent_code ? byCode.get(p.parent_code) : undefined; if (trail.length>50) break; }
    x.path = trail.join('/'); x.level = trail.length;
  }
  arr.forEach(compute);
  saveCC(arr);
}
export function findByCode(code: string): CostCenter | undefined { return listCC().find(x => x.code.toLowerCase()===code.toLowerCase()); }
export function childrenOf(code?: string): CostCenter[] {
  return listCC().filter(x => (x.parent_code||'') === (code||''));
}
export function computeMeta(arr: CostCenter[]){
  const map = new Map(arr.map(x => [x.code, x]));
  function calc(x: CostCenter){
    const trail: string[] = [x.code];
    let p = x.parent_code ? map.get(x.parent_code) : undefined;
    while (p) { if (trail.includes(p.code)) break; trail.unshift(p.code); p = p.parent_code ? map.get(p.parent_code) : undefined; if (trail.length>200) break; }
    x.path = trail.join('/'); x.level = trail.length;
  }
  arr.forEach(calc);
}
export function upsertCC(input: Partial<CostCenter> & { code: string; name_vi: string }){
  const arr = listCC();
  const i = arr.findIndex(x => x.code.toLowerCase()===input.code.toLowerCase());
  const base = i>=0 ? arr[i] : ({ id: rid(), created_at: nowISO(), active: true } as CostCenter);
  const v: CostCenter = { ...base, ...input, code: String(input.code).trim(), name_vi: String(input.name_vi).trim(), updated_at: nowISO() };
  const temp = i>=0 ? [...arr.slice(0,i), v, ...arr.slice(i+1)] : [v, ...arr];
  // validation: self/descendant as parent?
  if (v.parent_code && v.parent_code.toLowerCase()===v.code.toLowerCase()) throw new Error('Parent cannot be self');
  // cycle check
  computeMeta(temp);
  const node = temp.find(x => x.code===v.code)!;
  const ancestors = (node.path||'').split('/').slice(0,-1);
  if (ancestors.includes(v.code)) throw new Error('Cycle detected');
  saveCC(temp);
  return v;
}
export function removeByCode(code: string){
  const arr = listCC().filter(x => x.code.toLowerCase()!==code.toLowerCase() && (x.parent_code||'').toLowerCase()!==code.toLowerCase());
  // Note: remove also prunes any direct children; nested children left orphaned in this simple mock
  computeMeta(arr);
  saveCC(arr);
}
export function exportCSV(): string {
  const arr = listCC();
  const header = 'code,name_vi,name_en,parent_code,owner_dept,manager,effective_from,effective_to,active,notes';
  const lines = arr.map(r => [r.code, r.name_vi, r.name_en||'', r.parent_code||'', r.owner_dept||'', r.manager||'', (r.effective_from||'').slice(0,10), (r.effective_to||'').slice(0,10), String(r.active), (r.notes||'').replace(/,/g,' ')].join(','));
  return [header, ...lines].join('\n');
}
export function importCSV(text: string): { inserted:number; updated:number; errors:string[] } {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(Boolean);
  if (!lines.length) return { inserted:0, updated:0, errors:['Empty file'] };
  const head = lines[0].split(',').map(s => s.trim().toLowerCase());
  const idx = (k:string) => head.indexOf(k);
  const arr = listCC(); const map = new Map(arr.map(x => [x.code.toLowerCase(), x]));
  let ins=0, upd=0; const errs:string[] = [];
  for (const line of lines.slice(1)){
    const cols = line.split(',').map(v => v.trim());
    const code = cols[idx('code')]; if (!code) { errs.push('Missing code'); continue; }
    const row: Partial<CostCenter> = {
      code,
      name_vi: cols[idx('name_vi')]||code,
      name_en: cols[idx('name_en')]||cols[idx('name_vi')]||code,
      parent_code: cols[idx('parent_code')]||undefined,
      owner_dept: cols[idx('owner_dept')]||'',
      manager: cols[idx('manager')]||'',
      effective_from: cols[idx('effective_from')]||undefined,
      effective_to: cols[idx('effective_to')]||undefined,
      active: String(cols[idx('active')]||'true').toLowerCase()!=='false',
      notes: cols[idx('notes')]||'',
    };
    try{
      const existed = map.has(code.toLowerCase());
      upsertCC(row as any);
      if (existed) upd++; else ins++;
    } catch (e:any) {
      errs.push(`${code}: ${e?.message||String(e)}`);
    }
  }
  return { inserted:ins, updated:upd, errors:errs };
}
