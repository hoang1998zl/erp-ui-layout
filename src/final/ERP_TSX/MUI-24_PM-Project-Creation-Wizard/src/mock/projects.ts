// src/mock/projects.ts
export type UUID = string;

export type Employee = {
  id: UUID;
  name: string;
  email: string;
  title?: string;
  active: boolean;
};

export type Client = { id: UUID; name: string; code?: string };
export type Currency = { code: string; name: string };

export type WBSNode = {
  id: UUID;
  name: string;
  code?: string;
  estimate_hours?: number;
  children: WBSNode[];
};

export type TeamMember = {
  employee_id: UUID;
  role: string;
  allocation_pct?: number; // 0..100
};

export type BudgetItem = {
  category: string;  // e.g., Labor, Expense, Software, Hardware
  description?: string;
  amount: number;
};

export type ProjectDraft = {
  id?: UUID; // only after submit/save
  status: 'draft' | 'submitted';
  general: {
    name: string;
    code?: string;
    client_id?: UUID;
    start_date?: string;
    end_date?: string;
    description?: string;
    project_type?: string;   // Internal/External/Billable/Non-billable
    currency?: string;
  };
  wbs: WBSNode[];
  team: TeamMember[];
  budget: BudgetItem[];
  created_at: string;
  updated_at: string;
};

const LS_EMP = 'erp.dir.emps.v1';                 // from HR-07
const LS_PROJ = 'erp.pm.projects.v1';
const LS_CLIENTS = 'erp.crm.clients.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }

// Seed a few clients
(function seedClients(){
  if (localStorage.getItem(LS_CLIENTS)) return;
  const rows: Client[] = [
    { id: rid(), name: 'Công ty TNHH Sao Việt', code: 'SVI' },
    { id: rid(), name: 'Tập đoàn Đồng Tâm', code: 'DTG' },
    { id: rid(), name: 'Ngân hàng ABC', code: 'ABC' },
    { id: rid(), name: 'Bệnh viện Quốc tế XYZ', code: 'XYZH' },
  ];
  localStorage.setItem(LS_CLIENTS, JSON.stringify(rows));
})();

export async function listClients(q?: { search?: string }): Promise<Client[]> {
  await delay();
  let rows: Client[] = JSON.parse(localStorage.getItem(LS_CLIENTS) || '[]');
  if (q?.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(c => (c.name+' '+(c.code||'')).toLowerCase().includes(s));
  }
  return rows.slice(0, 20);
}

export async function listCurrencies(): Promise<Currency[]> {
  await delay();
  return [
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'JPY', name: 'Japanese Yen' },
  ];
}

export async function searchEmployees(q: { search?: string; active_only?: boolean; limit?: number }): Promise<Employee[]> {
  await delay();
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q.active_only) rows = rows.filter(e => e.active);
  if (q.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || (e.title||'').toLowerCase().includes(s));
  }
  return rows.slice(0, q.limit || 50);
}

export async function saveDraft(draft: ProjectDraft): Promise<ProjectDraft> {
  await delay();
  let rows: ProjectDraft[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  const now = nowISO();
  if (!draft.id) {
    draft.id = rid();
    draft.status = 'draft';
    draft.created_at = now;
    draft.updated_at = now;
    rows.unshift(draft);
  } else {
    draft.updated_at = now;
    const i = rows.findIndex(r => r.id===draft.id);
    if (i>=0) rows[i] = draft; else rows.unshift(draft);
  }
  localStorage.setItem(LS_PROJ, JSON.stringify(rows));
  return draft;
}

export async function submitProject(draft: ProjectDraft): Promise<ProjectDraft> {
  await delay();
  let rows: ProjectDraft[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  const now = nowISO();
  if (!draft.id) {
    draft.id = rid();
    draft.created_at = now;
  }
  draft.status = 'submitted';
  draft.updated_at = now;
  const i = rows.findIndex(r => r.id===draft.id);
  if (i>=0) rows[i] = draft; else rows.unshift(draft);
  localStorage.setItem(LS_PROJ, JSON.stringify(rows));
  return draft;
}

export async function listProjects(): Promise<ProjectDraft[]> {
  await delay();
  return JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
}
