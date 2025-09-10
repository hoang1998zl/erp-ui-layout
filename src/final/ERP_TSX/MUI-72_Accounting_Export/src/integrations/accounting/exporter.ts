
// src/integrations/accounting/exporter.ts — export to CSV/JSON with profile mapping and filters
import type { Journal } from './mockData';

export type ExportProfile = {
  id: string;
  name: string;
  target: 'CSV'|'JSON'|'API';
  system: 'MISA'|'FAST'|'SAPB1'|'Custom';
  delimiter?: ','|';'|'|';
  includeHeaders: boolean;
  dateFormat: 'YYYY-MM-DD'|'DD/MM/YYYY';
  fields: { source: string; alias: string }[];  // e.g., source: 'date', 'branch', 'currency', 'ref', 'module', 'line.account', 'line.debit', 'line.credit'
  // for API target
  apiEndpoint?: string;
  apiMethod?: 'POST'|'PUT';
};

export type ExportFilter = {
  from: string; // ISO
  to: string;   // ISO
  branch?: string;
  currency?: string;
  module?: 'AP'|'AR'|'JV'|'EXP'|'ALL';
};

function fmtDate(iso: string, fmt: ExportProfile['dateFormat']){
  const d = new Date(iso);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth()+1).padStart(2,'0');
  const D = String(d.getUTCDate()).padStart(2,'0');
  return fmt==='YYYY-MM-DD' ? `${Y}-${M}-${D}` : `${D}/${M}/${Y}`;
}

export function flatten(j: Journal, fmt: ExportProfile['dateFormat']){
  const base = {
    date: fmtDate(j.date, fmt),
    branch: j.branch,
    project: j.project||'',
    currency: j.currency,
    rate: j.rate,
    ref: j.ref||'',
    module: j.module,
    vendor: j.vendor||'',
    customer: j.customer||''
  };
  const rows = [];
  for (const ln of j.lines){
    rows.push({ ...base, 'line.account': ln.account, 'line.debit': ln.debit, 'line.credit': ln.credit, 'line.desc': ln.desc||'' });
  }
  return rows;
}

export function applyFilter(js: Journal[], f: ExportFilter){
  const a = new Date(f.from).getTime();
  const b = new Date(f.to).getTime();
  return js.filter(j => {
    const t = new Date(j.date).getTime();
    if (t < a || t > b) return false;
    if (f.branch && j.branch!==f.branch) return false;
    if (f.currency && j.currency!==f.currency) return false;
    if (f.module && f.module!=='ALL' && j.module!==f.module) return false;
    return true;
  });
}

export function toCSV(rows: any[], prof: ExportProfile){
  const delim = prof.delimiter || ',';
  const cols = prof.fields.map(f => f.alias || f.source);
  const sel = (r:any, p:string) => p.split('.').reduce((o,k)=> o?.[k], r);
  const out: string[] = [];
  if (prof.includeHeaders){ out.push(cols.join(delim)); }
  for (const r of rows){
    const line = prof.fields.map(f => {
      const v = sel(r, f.source);
      const s = (v===undefined || v===null) ? '' : String(v);
      const needsQuote = s.includes(delim) || s.includes('"') || s.includes('\n');
      const esc = s.replace(/"/g,'""');
      return needsQuote ? `"${esc}"` : esc;
    }).join(delim);
    out.push(line);
  }
  return out.join('\n');
}
