// src/mock/data.ts
export type UUID = string;

export type Project = { id: UUID; code: string; name: string; status: 'planning'|'active'|'on_hold'|'closed' };
export type Task = { id: UUID; project_id: UUID; title: string; status: 'todo'|'in_progress'|'done'; assignee?: string };
export type Document = { id: UUID; doc_type: string; title: string; uri: string };
export type User = { id: UUID; email: string; full_name: string };

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

export const projects: Project[] = [
  { id: rid(), code:'PRJ-HAPPY', name:'Happy Square', status:'active' },
  { id: rid(), code:'PRJ-AMA',   name:'AMA VN ERP',   status:'active' },
  { id: rid(), code:'PRJ-RND',   name:'R&D Playground', status:'planning' },
  { id: rid(), code:'PRJ-CIV',   name:'Civic Compliance AI', status:'on_hold' },
];

export const tasks: Task[] = [
  { id: rid(), project_id: projects[0].id, title:'Kickoff with stakeholders', status:'done', assignee:'pm@ktest.vn' },
  { id: rid(), project_id: projects[0].id, title:'Define CoA & Dimensions', status:'in_progress', assignee:'fin@ktest.vn' },
  { id: rid(), project_id: projects[1].id, title:'Build App Shell', status:'in_progress', assignee:'staff@ktest.vn' },
  { id: rid(), project_id: projects[1].id, title:'Kanban board implementation', status:'todo', assignee:'staff@ktest.vn' },
  { id: rid(), project_id: projects[2].id, title:'Spike: OCR provider evaluation', status:'todo', assignee:'rnd@ktest.vn' },
];

export const documents: Document[] = [
  { id: rid(), doc_type:'invoice', title:'INV-2025-0912 — Vendor A', uri:'#' },
  { id: rid(), doc_type:'contract', title:'Service Agreement — Happy Square', uri:'#' },
  { id: rid(), doc_type:'drawing', title:'Floor Plan L2 — AMA VN ERP Office', uri:'#' },
  { id: rid(), doc_type:'receipt', title:'Taxi 850,000 VND — 2025-09-02', uri:'#' },
];

export const users: User[] = [
  { id: rid(), email:'ceo@ktest.vn', full_name:'Hieu Le' },
  { id: rid(), email:'pm@ktest.vn', full_name:'Project Manager' },
  { id: rid(), email:'fin@ktest.vn', full_name:'Finance Manager' },
  { id: rid(), email:'staff@ktest.vn', full_name:'Employee A' },
];

// Mock async fetchers
const delay = (ms=200)=> new Promise(res=>setTimeout(res,ms));

export async function fetchProjects(): Promise<Project[]> { await delay(); return projects; }
export async function fetchTasks(): Promise<Task[]> { await delay(); return tasks; }
export async function fetchDocuments(): Promise<Document[]> { await delay(); return documents; }
export async function fetchUsers(): Promise<User[]> { await delay(); return users; }
