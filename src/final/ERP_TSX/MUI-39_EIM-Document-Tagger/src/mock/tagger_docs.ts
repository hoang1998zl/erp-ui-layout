// src/mock/tagger_docs.ts
export type UUID = string;
export type DocType = 'contract'|'invoice'|'receipt'|'other';
export type ScanStatus = 'pending_scan'|'clean'|'blocked';

export type DocumentRow = {
  id: UUID;
  title: string;
  doc_type: DocType;
  tags: string[];
  project_id?: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  doc_date?: string;
  file_name: string;
  mime: string;
  size: number;
  preview_data_url?: string;
  status: ScanStatus;
  created_by: string;
  created_at: string;
};

const LS_DOCS = 'erp.eim.documents.v1';

function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }
function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

export type ListQuery = { search?: string; type?: DocType|'all'; project_id?: string; date_from?: string; date_to?: string };

export async function listDocuments(q?: ListQuery): Promise<DocumentRow[]> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  let out = rows.slice().sort((a,b)=> a.created_at>b.created_at? -1:1);
  if (q?.type && q.type!=='all') out = out.filter(r => r.doc_type===q.type);
  if (q?.project_id) out = out.filter(r => r.project_id===q.project_id);
  if (q?.date_from) out = out.filter(r => (r.doc_date||'') >= q.date_from!);
  if (q?.date_to) out = out.filter(r => (r.doc_date||'') <= q.date_to!);
  if (q?.search) {
    const s = q.search.toLowerCase();
    out = out.filter(r => (r.title+' '+r.file_name+' '+(r.vendor||'')+' '+(r.tags||[]).join(' ')).toLowerCase().includes(s));
  }
  return out;
}

export async function setTags(doc_id: string, tags: string[]): Promise<void> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  const i = rows.findIndex(r => r.id===doc_id);
  if (i>=0) { rows[i].tags = normalizeTags(tags); localStorage.setItem(LS_DOCS, JSON.stringify(rows)); }
}

export async function addTags(doc_id: string, tags: string[]): Promise<void> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  const i = rows.findIndex(r => r.id===doc_id);
  if (i>=0) {
    rows[i].tags = uniq([...(rows[i].tags||[]), ...normalizeTags(tags)]);
    localStorage.setItem(LS_DOCS, JSON.stringify(rows));
  }
}

export async function removeTags(doc_id: string, tags: string[]): Promise<void> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  const i = rows.findIndex(r => r.id===doc_id);
  if (i>=0) {
    const del = new Set(normalizeTags(tags));
    rows[i].tags = (rows[i].tags||[]).filter(t => !del.has(canonical(t)));
    localStorage.setItem(LS_DOCS, JSON.stringify(rows));
  }
}

export async function bulkAdd(doc_ids: string[], tags: string[]): Promise<number> {
  await delay();
  let cnt = 0;
  for (const id of doc_ids) { await addTags(id, tags); cnt++; }
  return cnt;
}
export async function bulkRemove(doc_ids: string[], tags: string[]): Promise<number> {
  await delay();
  let cnt = 0;
  for (const id of doc_ids) { await removeTags(id, tags); cnt++; }
  return cnt;
}

export function canonical(s: string): string {
  return String(s||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-\._]/g,'');
}
export function normalizeTags(arr: string[]): string[] {
  return uniq(arr.map(x => canonical(x)).filter(Boolean));
}

export function suggestTags(d: DocumentRow): string[] {
  const out: string[] = [];
  if (d.doc_type) out.push(d.doc_type);
  if (d.vendor) out.push(d.vendor);
  if (d.doc_date) out.push(d.doc_date.slice(0,4)); // year
  // split tokens from file_name & title
  const tokens = (d.title+' '+d.file_name).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length>=3 && w.length<=16);
  const freq: Record<string, number> = {};
  tokens.forEach(w => { freq[w] = (freq[w]||0)+1; });
  Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,5).forEach(w => out.push(w));
  return normalizeTags(out);
}

export async function tagStats(project_id?: string): Promise<Array<{ tag: string; count: number }>> {
  await delay();
  const rows = await listDocuments({ project_id });
  const freq: Record<string, number> = {};
  rows.forEach(r => (r.tags||[]).forEach(t => { freq[canonical(t)] = (freq[canonical(t)]||0)+1; }));
  return Object.keys(freq).map(k => ({ tag:k, count: freq[k] })).sort((a,b)=> b.count - a.count).slice(0, 50);
}
