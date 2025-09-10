// src/mock/context.ts
export type UUID = string;
export type EntityType = 'project'|'task'|'expense';

export type BaseEntity = {
  id: UUID;
  type: EntityType;
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
};

export type Document = {
  id: UUID;
  doc_type: 'invoice'|'contract'|'receipt'|'drawing'|'other';
  title: string;
  uri: string;
  uploaded_at: string;
};

export type Activity = {
  id: UUID;
  time: string;       // ISO
  actor: string;      // email or name
  action: string;     // e.g., created, updated, commented, uploaded
  message?: string;
};

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

const projects: BaseEntity[] = [
  { id: rid(), type: 'project', title: 'PRJ-HAPPY — Happy Square', subtitle: 'Status: active', meta: { currency:'VND', budget_total: 3000000000 } },
  { id: rid(), type: 'project', title: 'PRJ-AMA — AMA VN ERP', subtitle: 'Status: active', meta: { currency:'VND', budget_total: 1200000000 } },
];

const tasks: BaseEntity[] = [
  { id: rid(), type:'task', title:'Define CoA & Dimensions', subtitle:'PRJ-HAPPY · in_progress', meta:{ assignee:'fin@ktest.vn', priority:'high', due_date:'2025-09-18' } },
  { id: rid(), type:'task', title:'Setup Approval Inbox', subtitle:'PRJ-HAPPY · todo', meta:{ assignee:'pm@ktest.vn', priority:'medium' } },
  { id: rid(), type:'task', title:'Build App Shell', subtitle:'PRJ-AMA · in_progress', meta:{ assignee:'staff@ktest.vn', priority:'urgent' } },
];

const expenses: BaseEntity[] = [
  { id: rid(), type:'expense', title:'E-102 — Travel 2,350,000 VND', subtitle:'PRJ-HAPPY · submitted', meta:{ employee:'staff@ktest.vn', currency:'VND', amount:2350000, date:'2025-09-02' } },
  { id: rid(), type:'expense', title:'E-103 — Meals 450,000 VND', subtitle:'PRJ-AMA · draft', meta:{ employee:'staff@ktest.vn', currency:'VND', amount:450000, date:'2025-09-05' } },
];

// Document & Activity stores per entity key
const docs: Record<string, Document[]> = {};
const acts: Record<string, Activity[]> = {};

function keyOf(e: {type: EntityType; id: UUID}) { return `${e.type}:${e.id}`; }

function seed() {
  const now = new Date();
  const samples = [
    { e: projects[0], doc: { doc_type:'contract', title:'Service Agreement — Happy Square' } },
    { e: expenses[0], doc: { doc_type:'receipt', title:'Taxi 850,000 VND — 2025-09-02' } },
    { e: tasks[0],    doc: { doc_type:'other', title:'CoA Worksheet v1.xlsx' } },
  ];
  for (const s of samples) {
    const k = keyOf(s.e);
    const d = { id: rid(), doc_type: s.doc.doc_type as any, title: s.doc.title, uri:'#', uploaded_at: now.toISOString() };
    (docs[k] ||= []).push(d);
    (acts[k] ||= []).push({ id: rid(), time: now.toISOString(), actor:'system', action:'linked_document', message:`Linked document: ${d.title}` });
  }
  // Add some generic activities
  for (const e of [...projects, ...tasks, ...expenses]) {
    const k = keyOf(e);
    const t0 = new Date(now.getTime() - Math.floor(Math.random()*1000*60*60*24*10));
    (acts[k] ||= []).push({ id: rid(), time: t0.toISOString(), actor:'pm@ktest.vn', action:'updated', message:'Status or fields updated' });
  }
}
seed();

export async function fetchEntity(type: EntityType, id: UUID): Promise<BaseEntity | undefined> {
  await new Promise(res => setTimeout(res, 150));
  const col = type === 'project' ? projects : type === 'task' ? tasks : expenses;
  return col.find(x => x.id === id);
}

export async function listEntities(): Promise<BaseEntity[]> {
  await new Promise(res => setTimeout(res, 100));
  return [...projects, ...tasks, ...expenses];
}

export async function listDocuments(entity: {type: EntityType; id: UUID}): Promise<Document[]> {
  await new Promise(res => setTimeout(res, 120));
  return [...(docs[keyOf(entity)] || [])].sort((a,b)=>b.uploaded_at.localeCompare(a.uploaded_at));
}

export async function linkDocument(entity: {type: EntityType; id: UUID}, file: File, doc_type: Document['doc_type'], title?: string): Promise<Document> {
  await new Promise(res => setTimeout(res, 200));
  const d: Document = { id: rid(), doc_type, title: title || file.name, uri: URL.createObjectURL(file), uploaded_at: new Date().toISOString() };
  const k = keyOf(entity);
  (docs[k] ||= []).unshift(d);
  (acts[k] ||= []).unshift({ id: rid(), time: new Date().toISOString(), actor:'you@ktest.vn', action:'uploaded', message:`Uploaded ${d.title}` });
  return d;
}

export async function listActivity(entity: {type: EntityType; id: UUID}): Promise<Activity[]> {
  await new Promise(res => setTimeout(res, 100));
  return [...(acts[keyOf(entity)] || [])].sort((a,b)=>b.time.localeCompare(a.time));
}

// Helpers for demo
export const demoEntities = { projects, tasks, expenses };
