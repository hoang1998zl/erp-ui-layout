// src/mock/documents.ts
export type UUID = string;

export type DocType = 'contract' | 'invoice' | 'receipt' | 'other';
export type ScanStatus = 'pending_scan' | 'clean' | 'blocked';

export type DocumentRow = {
  id: UUID;
  title: string;
  doc_type: DocType;
  tags: string[];
  project_id?: string;
  vendor?: string;      // for invoice/receipt
  amount?: number;      // for invoice/receipt
  currency?: string;    // VND default
  doc_date?: string;    // YYYY-MM-DD
  file_name: string;
  mime: string;
  size: number;
  preview_data_url?: string;   // (images/pdf small) for demo
  status: ScanStatus;
  created_by: string;
  created_at: string;
};

const LS_DOCS = 'erp.eim.documents.v1';
const LS_PROJ = 'erp.pm.projects.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  try {
    const rows: any[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
    return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
  } catch { return []; }
}

export async function listDocuments(q?: { search?: string; type?: DocType|'all'; project_id?: string; date_from?: string; date_to?: string }): Promise<DocumentRow[]> {
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

export async function deleteDocument(id: string): Promise<void> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  const out = rows.filter(r => r.id!==id);
  localStorage.setItem(LS_DOCS, JSON.stringify(out));
}

export type UploadPayload = {
  title: string;
  doc_type: DocType;
  tags: string[];
  project_id?: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  doc_date?: string;
  // file info
  file_name: string;
  mime: string;
  size: number;
  preview_data_url?: string;
};
export type UploadResult = { id: string; status: ScanStatus };

export async function uploadOne(payload: UploadPayload, onProgress?: (pct: number) => void): Promise<UploadResult> {
  // simulate streaming upload & virus scan queue
  const id = rid();
  let pct = 0;
  for (let i=0;i<8;i++){ pct += 12 + Math.random()*6; onProgress?.(Math.min(95, Math.round(pct))); await delay(100); }
  const now = nowISO();
  const row: DocumentRow = {
    id,
    title: payload.title || payload.file_name,
    doc_type: payload.doc_type,
    tags: payload.tags || [],
    project_id: payload.project_id,
    vendor: payload.vendor,
    amount: payload.amount,
    currency: payload.currency || (payload.doc_type==='invoice'||payload.doc_type==='receipt' ? 'VND' : undefined),
    doc_date: payload.doc_date,
    file_name: payload.file_name,
    mime: payload.mime,
    size: payload.size,
    preview_data_url: payload.preview_data_url,
    status: 'pending_scan',
    created_by: 'current_user',
    created_at: now
  };
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  rows.push(row);
  localStorage.setItem(LS_DOCS, JSON.stringify(rows));
  onProgress?.(100);
  // simulate virus scan in background (mark clean later)
  setTimeout(()=>{
    try {
      const arr: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
      const i = arr.findIndex(r => r.id===id);
      if (i>=0) { arr[i].status = 'clean'; localStorage.setItem(LS_DOCS, JSON.stringify(arr)); }
    } catch {}
  }, 800);
  return { id, status: 'pending_scan' };
}

export async function exportCSV(q?: { project_id?: string }): Promise<Blob> {
  await delay();
  const rows = await listDocuments({ project_id: q?.project_id });
  const header = ['id','title','type','project','vendor','amount','currency','doc_date','file_name','mime','size','tags','status','created_at'];
  const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
  const lines = [header.join(',')];
  rows.forEach(r => lines.push([r.id, r.title, r.doc_type, r.project_id||'', r.vendor||'', r.amount||'', r.currency||'', r.doc_date||'', r.file_name, r.mime, r.size, (r.tags||[]).join('|'), r.status, r.created_at].map(esc).join(',')));
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}
