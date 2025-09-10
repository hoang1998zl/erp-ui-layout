// src/mock/heads.ts
export type UUID = string;

export type DeptNode = {
  id: UUID;
  name: string;
  code?: string;
  children: DeptNode[];
};

export type Employee = {
  id: UUID;
  name: string;
  email: string;
  title?: string;
  dept_id?: string;
  active: boolean;
};

export type DeptHead = {
  dept_id: string;
  employee_id?: string;      // null/undefined if none
  acting_from?: string;      // optional for acting head
  acting_to?: string;
  updated_by?: string;
  updated_at?: string;
};

export type HeadsMap = Record<string, DeptHead>;

const LS_DEPT = 'erp.dir.depts.v1';  // from HR-07
const LS_EMP  = 'erp.dir.emps.v1';   // from HR-07
const LS_HEAD = 'erp.dir.dept.heads.v1'; // new

function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }
function nowISO(){ return new Date().toISOString(); }

// Basic readers
export async function getDepartments(): Promise<DeptNode> {
  await delay();
  let root;
  try { root = JSON.parse(localStorage.getItem(LS_DEPT) || 'null'); } catch {}
  if (!root) {
    // fallback tiny seed if not present
    root = { id:'root', name:'CÔNG TY TNHH ABC', code:'COMP', children: [] };
    localStorage.setItem(LS_DEPT, JSON.stringify(root));
  }
  return root;
}

export async function listEmployeesByDept(deptId: string): Promise<Employee[]> {
  await delay();
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  return emps.filter(e => e.active && e.dept_id === deptId).sort((a,b)=> a.name.localeCompare(b.name));
}

export async function getHeads(): Promise<HeadsMap> {
  await delay();
  try { return JSON.parse(localStorage.getItem(LS_HEAD) || '{}'); } catch { return {}; }
}

export async function setHead(deptId: string, employeeId: string, acting_from?: string, acting_to?: string, who='admin@company.vn'): Promise<void> {
  await delay();
  const map = await getHeads();
  map[deptId] = { dept_id: deptId, employee_id: employeeId || undefined, acting_from, acting_to, updated_by: who, updated_at: nowISO() };
  localStorage.setItem(LS_HEAD, JSON.stringify(map));
}

export async function clearHead(deptId: string, who='admin@company.vn'): Promise<void> {
  await delay();
  const map = await getHeads();
  map[deptId] = { dept_id: deptId, employee_id: undefined, updated_by: who, updated_at: nowISO() };
  localStorage.setItem(LS_HEAD, JSON.stringify(map));
}

export async function exportHeadsCSV(): Promise<Blob> {
  await delay();
  const map = await getHeads();
  const header = ['dept_id','employee_id','acting_from','acting_to','updated_by','updated_at'];
  const lines = [header.join(',')];
  Object.values(map).forEach(h => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([h.dept_id, h.employee_id||'', h.acting_from||'', h.acting_to||'', h.updated_by||'', h.updated_at||''].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}
