// src/mock/doc_viewer.ts
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
  preview_data_url?: string;   // (images/pdf small) for demo
  status: ScanStatus;
  created_by: string;
  created_at: string;
};

const LS_DOCS = 'erp.eim.documents.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=60){ return new Promise(res=>setTimeout(res, ms)); }

export async function listDocuments(): Promise<DocumentRow[]> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  return rows.slice().sort((a,b)=> a.created_at>b.created_at? -1:1);
}

export async function getDocument(id: string): Promise<DocumentRow | undefined> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  return rows.find(r => r.id===id);
}

export async function seedIfEmpty(): Promise<number> {
  await delay();
  const rows: DocumentRow[] = JSON.parse(localStorage.getItem(LS_DOCS) || '[]');
  if (rows.length>0) return 0;
  const now = nowISO();
  const mk = (title:string, mime:string, dataUrl:string, extra: Partial<DocumentRow> = {}): DocumentRow => ({
    id: rid(),
    title,
    doc_type: (extra.doc_type as any) || 'other',
    tags: extra.tags || ['sample','demo'],
    project_id: extra.project_id,
    vendor: extra.vendor,
    amount: extra.amount,
    currency: extra.currency,
    doc_date: extra.doc_date || now.slice(0,10),
    file_name: title.replace(/\s+/g,'_') + (mime.startsWith('image/')?'.png':'.pdf'),
    mime,
    size: dataUrl.length,
    preview_data_url: dataUrl,
    status: 'clean',
    created_by: 'system_seed',
    created_at: now
  });
  // tiny PNG (100x60) gradient
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAA8CAYAAABM2qfXAAAACXBIWXMAAAsSAAALEgHS3X78AAAAGXRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjhVv3a7AAABGklEQVR4Xu3WwQ2DMBBF0TQk1mGQ0oTlpQ3kGQdQ2R6Jb6r12s8m2I9V0o5z1mXQmH9h6qfPj3/7kJmJdR1U3m1m8J4yM0pF2mR4C2i2qK0Z0w1p0w8q8B9b8Gg8cQ7x1zspU2o6Gm9r7o1n3o6Gk9r6oVb9o6Gm9r7o1n3o6Gk9r6oVb5+K1sTt7oWgH3w1G0HkCz8nF0G0GkDkG0HkCz8nF0G0GkDkG0HkCz8nF0G0GkDkG0HkC78f2cYlT8Q8m9f7g8Q0o8w3kRk5m3m2kYw7i4t3l7mK6V7f3eYIfs0r1+K9c4y0oO3X8o8fQv6r1M6e6b3A1HjvV2a3bX9r2o7a6u3b8S/3WcHnS6y9t1fS5C7yX8X1mV9Qv3Qk8Hq3AAAAAElFTkSuQmCC';
  // minimal inline SVG (acts as image)
  const svg = 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"380\"><defs><linearGradient id=\"g\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#4f46e5\"/><stop offset=\"1\" stop-color=\"#06b6d4\"/></linearGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(#g)\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"white\" font-size=\"28\" font-family=\"Inter,Arial\">Sample Document Preview</text></svg>');
  const arr = [
    mk('Sample Contract', 'image/png', png, { doc_type: 'contract', tags:['contract','legal'] }),
    mk('Sample Invoice', 'image/svg+xml', svg, { doc_type: 'invoice', vendor: 'ACME Co', amount: 1200000, currency:'VND', tags:['invoice'] }),
  ];
  localStorage.setItem(LS_DOCS, JSON.stringify(arr));
  return arr.length;
}
