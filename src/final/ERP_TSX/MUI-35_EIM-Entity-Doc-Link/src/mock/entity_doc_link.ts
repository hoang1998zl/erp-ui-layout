// src/mock/entity_doc_link.ts
export type UUID = string;
export type EntityType = 'project'|'vendor'|'task'|'client';

export type DocType = 'contract' | 'invoice' | 'receipt' | 'other';
export type ScanStatus = 'pending_scan' | 'clean' | 'blocked';

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

export type Project = { id: UUID; general: { name: string; code?: string } };

export type DocLinkRow = {
  entity_type: EntityType;
  entity_id: string;
  doc_id: string;
  relation?: 'primary'|'supporting'|'invoice'|'receipt'|'other';
  note?: string;
  linked_at: string;
  linked_by: string;
};

const LS_DOCS = 'erp.eim.documents.v1';   // from EIM-01
const LS_PROJ = 'erp.pm.projects.v1';     // PM-01
const LS_LINK = 'erp.eim.doclinks.v1';    // DocLinkRow[]

function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  try {
    const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
    return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
  } catch { return []; }
}

export async function listDocuments(): Promise<DocumentRow[]> {
  await delay();
  try { return JSON.parse(localStorage.getItem(LS_DOCS) || '[]'); } catch { return []; }
}

export async function listVendors(): Promise<string[]> {
  await delay();
  const docs = await listDocuments();
  const set = new Set(docs.map(d => (d.vendor||'').trim()).filter(Boolean));
  return Array.from(set).sort();
}

export async function listLinks(entity_type: EntityType, entity_id: string): Promise<DocLinkRow[]> {
  await delay();
  try {
    const rows: DocLinkRow[] = JSON.parse(localStorage.getItem(LS_LINK) || '[]');
    return rows.filter(r => r.entity_type===entity_type && r.entity_id===entity_id);
  } catch { return []; }
}

export async function linkDocs(entity_type: EntityType, entity_id: string, doc_ids: string[], relation?: DocLinkRow['relation']): Promise<number> {
  await delay();
  const rows: DocLinkRow[] = JSON.parse(localStorage.getItem(LS_LINK) || '[]');
  const set = new Set(rows.filter(r => r.entity_type===entity_type && r.entity_id===entity_id).map(r => r.doc_id));
  let added = 0;
  doc_ids.forEach(id => {
    if (!set.has(id)) {
      rows.push({ entity_type, entity_id, doc_id: id, relation: relation || 'other', linked_at: nowISO(), linked_by: 'current_user' });
      added++;
    }
  });
  localStorage.setItem(LS_LINK, JSON.stringify(rows));
  return added;
}

export async function unlinkDoc(entity_type: EntityType, entity_id: string, doc_id: string): Promise<void> {
  await delay();
  const rows: DocLinkRow[] = JSON.parse(localStorage.getItem(LS_LINK) || '[]');
  const out = rows.filter(r => !(r.entity_type===entity_type && r.entity_id===entity_id && r.doc_id===doc_id));
  localStorage.setItem(LS_LINK, JSON.stringify(out));
}

export async function updateRelation(entity_type: EntityType, entity_id: string, doc_id: string, relation: DocLinkRow['relation']): Promise<void> {
  await delay();
  const rows: DocLinkRow[] = JSON.parse(localStorage.getItem(LS_LINK) || '[]');
  const i = rows.findIndex(r => r.entity_type===entity_type && r.entity_id===entity_id && r.doc_id===doc_id);
  if (i>=0) { rows[i].relation = relation; localStorage.setItem(LS_LINK, JSON.stringify(rows)); }
}

export type Suggestion = { doc_id: string; reason: string; score: number };

export async function suggestDocs(entity_type: EntityType, entity_id: string): Promise<Suggestion[]> {
  // heuristic: match project code/name/vendor/tags/file_name/title
  await delay();
  const docs = await listDocuments();
  const links = await listLinks(entity_type, entity_id);
  const already = new Set(links.map(l => l.doc_id));

  let tokens: string[] = [];
  if (entity_type==='project') {
    const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
    const p = rows.find(x => x.id===entity_id);
    if (p) tokens = [p.general?.code||'', p.general?.name||''].filter(Boolean);
  } else if (entity_type==='vendor') {
    tokens = [entity_id];
  } else {
    tokens = [entity_id];
  }
  const norm = (s:string) => (s||'').toLowerCase();

  const out: Suggestion[] = [];
  docs.forEach(d => {
    if (already.has(d.id)) return;
    let score = 0; let reasons: string[] = [];
    const fields = [d.file_name, d.title, d.vendor||'', (d.tags||[]).join(' ')].map(norm).join(' ');
    tokens.forEach(t => {
      if (!t) return;
      const k = norm(t);
      if (!k) return;
      if (fields.includes(k)) { score += 5; reasons.push(`match "${t}"`); }
    });
    // boost: same project id
    if (entity_type==='project' && d.project_id===entity_id) { score += 8; reasons.push('same project_id'); }
    if (score>0) out.push({ doc_id: d.id, reason: reasons.join(', '), score });
  });
  out.sort((a,b)=> b.score - a.score);
  return out.slice(0, 20);
}
