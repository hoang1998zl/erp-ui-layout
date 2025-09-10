// src/mock/documents.ts — shared (from EIM‑01, trimmed for this UI)
export type UUID = string;
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
const LS_DOCS = 'erp.eim.documents.v1';
const LS_PROJ = 'erp.pm.projects.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  try { const rows: any[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]'); return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code })); } catch { return []; }
}

export async function listDocuments(q?: { project_id?: string; type?: DocType|'all' }): Promise<DocumentRow[]> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  let out = rows.slice().sort((a,b)=> a.created_at>b.created_at? -1:1);
  if (q?.project_id) out = out.filter(r => r.project_id===q.project_id);
  if (q?.type && q.type!=='all') out = out.filter(r => r.doc_type===q.type);
  return out;
}

export type UploadPayload = {
  title: string; doc_type: DocType; project_id?: string; vendor?: string; amount?: number; currency?: string; doc_date?: string;
  file_name: string; mime: string; size: number; preview_data_url?: string;
};
export type UploadResult = { id: string; status: ScanStatus };

export async function uploadOne(payload: UploadPayload, onProgress?: (pct: number) => void): Promise<UploadResult> {
  const id = rid();
  let pct = 0;
  for (let i=0;i<8;i++){ pct += 12 + Math.random()*6; onProgress?.(Math.min(95, Math.round(pct))); await delay(60); }
  const now = nowISO();
  const row: DocumentRow = {
    id, title: payload.title || payload.file_name, doc_type: payload.doc_type, tags: [],
    project_id: payload.project_id, vendor: payload.vendor, amount: payload.amount, currency: payload.currency || 'VND', doc_date: payload.doc_date,
    file_name: payload.file_name, mime: payload.mime || 'application/octet-stream', size: payload.size, preview_data_url: payload.preview_data_url,
    status: 'clean', created_by: 'current_user', created_at: now
  };
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]'); rows.push(row); localStorage.setItem(LS_DOCS, JSON.stringify(rows));
  onProgress?.(100);
  return { id, status: 'clean' };
}
