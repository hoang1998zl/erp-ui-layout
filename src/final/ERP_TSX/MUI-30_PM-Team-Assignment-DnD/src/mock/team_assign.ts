// src/mock/team_assign.ts
export type UUID = string;

export type Employee = {
  id: UUID;
  name: string;
  email: string;
  title?: string;
  department?: string;
  active: boolean;
};

export type Project = {
  id: UUID;
  general: {
    name: string;
    code?: string;
    client_id?: UUID;
    start_date?: string;
    end_date?: string;
    description?: string;
    project_type?: string;
    currency?: string;
  };
  team: Array<{ employee_id: UUID; role: 'Owner'|'Manager'|'Member'; allocation_pct?: number; }>;
  created_at: string;
  updated_at: string;
};

const LS_EMP  = 'erp.dir.emps.v1';     // HR-07
const LS_PROJ = 'erp.pm.projects.v1';  // PM-01

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

function seedEmps() {
  try { const rows = JSON.parse(localStorage.getItem(LS_EMP) || '[]'); if (rows.length) return; } catch {}
  const names = ['An','Bình','Châu','Dũng','Giang','Hà','Khánh','Linh','Minh','Ngọc','Oanh','Phúc','Quân','Trang','Vy','Yến'];
  const titles = ['Dev','QA','BA','PM','Designer','DevOps'];
  const deps = ['ENG','QA','PMO','UI/UX','OPS'];
  const rows: Employee[] = [];
  for (let i=0;i<16;i++){
    rows.push({ id: rid(), name: `Nguyễn ${names[i%names.length]}`, email:`user${i+1}@company.vn`, title: titles[i%titles.length], department: deps[i%deps.length], active: true });
  }
  localStorage.setItem(LS_EMP, JSON.stringify(rows));
}
function seedProj() {
  try { const rows = JSON.parse(localStorage.getItem(LS_PROJ) || '[]'); if (rows.length) return; } catch {}
  const p: Project = {
    id: rid(),
    general: { name:'Demo Project', code:'PRJ-001', project_type:'External', currency:'VND', start_date: nowISO().slice(0,10) },
    team: [],
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  localStorage.setItem(LS_PROJ, JSON.stringify([p]));
}
seedEmps(); seedProj();

export async function listEmployees(q?: { search?: string; active_only?: boolean; department?: string }): Promise<Employee[]> {
  await delay();
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(e=>e.active);
  if (q?.department) rows = rows.filter(e=> (e.department||'')===q.department);
  if (q?.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(e => (e.name+' '+(e.email||'')+' '+(e.title||'')).toLowerCase().includes(s));
  }
  return rows.slice(0, 500);
}

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
}

export type TeamEntry = { employee_id: string; role: 'Owner'|'Manager'|'Member'; allocation_pct?: number };

export async function getTeam(project_id: string): Promise<TeamEntry[]> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.find(p => p.id===project_id)?.team || [];
}

export async function saveTeam(project_id: string, team: TeamEntry[]): Promise<void> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  const i = rows.findIndex(p => p.id===project_id);
  if (i<0) throw new Error('Project not found');
  rows[i].team = team;
  rows[i].updated_at = nowISO();
  localStorage.setItem(LS_PROJ, JSON.stringify(rows));
}

export function normalizeTeam(team: TeamEntry[]): TeamEntry[] {
  // ensure unique employee_id, last one wins; enforce single Owner
  const uniq = new Map<string, TeamEntry>();
  team.forEach(t => uniq.set(t.employee_id, t));
  let ownerCount = 0;
  const out: TeamEntry[] = [];
  Array.from(uniq.values()).forEach(t => {
    if (t.role==='Owner') {
      if (ownerCount===0) { out.push(t); ownerCount++; }
      else { out.push({ ...t, role:'Manager' }); } // demote extra to Manager
    } else {
      out.push(t);
    }
  });
  return out;
}

export async function exportCSV(project_id: string): Promise<Blob> {
  const team = await getTeam(project_id);
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const find = (id:string) => emps.find(e=>e.id===id);
  const header = ['employee_id','name','email','title','department','role','allocation_pct'];
  const lines = [header.join(',')];
  team.forEach(t => {
    const e = find(t.employee_id);
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([t.employee_id, e?.name||'', e?.email||'', e?.title||'', e?.department||'', t.role, t.allocation_pct||0].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}
