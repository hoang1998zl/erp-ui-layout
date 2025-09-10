// src/mock/assignment.ts
export type UUID = string;

export type Employee = {
  id: UUID;
  name: string;
  email: string;
  title?: string;
  dept_id?: string;     // current assigned department id
  active: boolean;
};

export type DeptNode = {
  id: UUID;
  name: string;
  code?: string;
  children: DeptNode[];
};

export type AssignEvent = {
  id: UUID;
  ts: string;           // ISO
  actor: string;        // who performed (demo fixed)
  employee_id: UUID;
  employee_name: string;
  from_dept?: string;   // id
  to_dept?: string;     // id
  note?: string;
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_EMP = 'erp.dir.emps.v1';
const LS_DEPT = 'erp.dir.depts.v1';
const LS_HIS = 'erp.dir.assign.history.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function nowISO(){ return new Date().toISOString(); }

function seed() {
  if (!localStorage.getItem(LS_DEPT)) {
    const mk = (name:string, code:string, children:DeptNode[]=[]) => ({ id: rid(), name, code, children });
    const depts: DeptNode = { id:'root', name:'CÔNG TY TNHH ABC', code:'COMP', children:[
      mk('Kinh Doanh','SALES',[ mk('Miền Bắc','SAL-N'), mk('Miền Nam','SAL-S') ]),
      mk('Kỹ Thuật','ENG',[ mk('Backend','ENG-BE'), mk('Frontend','ENG-FE'), mk('QA','ENG-QA'), mk('DevOps','ENG-OPS') ]),
      mk('Tài Chính','FIN'), mk('Nhân Sự','HR'), mk('Marketing','MKT')
    ]};
    localStorage.setItem(LS_DEPT, JSON.stringify(depts));
  }
  if (!localStorage.getItem(LS_EMP)) {
    const firsts = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Đỗ','Võ','Vũ','Bùi','Đặng'];
    const middles = ['Văn','Thị','Quốc','Hữu','Ngọc','Hoài','Minh','Anh','Đức','Thanh'];
    const lasts = ['An','Bình','Châu','Dũng','Giang','Hà','Khánh','Long','My','Quân','Quyên','Sơn','Trang','Uyên','Vy'];
    const titles = ['Sales Exec','Engineer','QA','DevOps','Accountant','HR Officer','Designer','PM'];
    const emps: Employee[] = [];
    for (let i=1;i<=80;i++) {
      const name = `${firsts[Math.floor(Math.random()*firsts.length)]} ${middles[Math.floor(Math.random()*middles.length)]} ${lasts[Math.floor(Math.random()*lasts.length)]}`;
      const email = `user${i}@company.vn`;
      const title = titles[Math.floor(Math.random()*titles.length)];
      emps.push({ id: rid(), name, email, title, active: Math.random() > 0.05 });
    }
    // randomly assign some to depts
    const allDeptIds = (()=>{
      const out:string[] = [];
      const walk = (n:DeptNode) => { out.push(n.id); n.children.forEach(walk); };
      const root = JSON.parse(localStorage.getItem(LS_DEPT) || '{}');
      walk(root);
      return out.filter(id=>id!=='root');
    })();
    emps.forEach(e => { if (Math.random() < 0.65) e.dept_id = allDeptIds[Math.floor(Math.random()*allDeptIds.length)]; });
    localStorage.setItem(LS_EMP, JSON.stringify(emps));
  }
  if (!localStorage.getItem(LS_HIS)) localStorage.setItem(LS_HIS, JSON.stringify([]));
}
seed();

function delay(ms=100){ return new Promise(res=>setTimeout(res, ms)); }

export async function getDepartments(): Promise<DeptNode> {
  await delay(); return JSON.parse(localStorage.getItem(LS_DEPT) || '{}');
}

export async function listEmployees(q?: { search?: string; active_only?: boolean; dept_id?: string; unassigned_only?: boolean; limit?: number; offset?: number; }): Promise<Paged<Employee>> {
  await delay();
  let rows: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  if (q?.active_only) rows = rows.filter(e => e.active);
  if (q?.dept_id) rows = rows.filter(e => e.dept_id === q.dept_id);
  if (q?.unassigned_only) rows = rows.filter(e => !e.dept_id);
  if (q?.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || (e.title||'').toLowerCase().includes(s));
  }
  const total = rows.length;
  const offset = q?.offset || 0;
  const limit = q?.limit || 25;
  return { rows: rows.slice(offset, offset+limit), total, limit, offset };
}

export async function assignEmployees(employeeIds: UUID[], toDeptId: string, actor='admin@company.vn'): Promise<void> {
  await delay();
  if (!employeeIds || employeeIds.length===0) return;
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const hist: AssignEvent[] = JSON.parse(localStorage.getItem(LS_HIS) || '[]');
  const updated: Employee[] = [];
  emps.forEach(emp => {
    if (employeeIds.includes(emp.id)) {
      const from = emp.dept_id;
      emp.dept_id = toDeptId;
      updated.push(emp);
      hist.unshift({ id: rid(), ts: nowISO(), actor, employee_id: emp.id, employee_name: emp.name, from_dept: from, to_dept: toDeptId });
    }
  });
  localStorage.setItem(LS_EMP, JSON.stringify(emps));
  localStorage.setItem(LS_HIS, JSON.stringify(hist.slice(0, 500))); // cap history
}

export async function unassignEmployees(employeeIds: UUID[], actor='admin@company.vn'): Promise<void> {
  await delay();
  if (!employeeIds || employeeIds.length===0) return;
  const emps: Employee[] = JSON.parse(localStorage.getItem(LS_EMP) || '[]');
  const hist: AssignEvent[] = JSON.parse(localStorage.getItem(LS_HIS) || '[]');
  emps.forEach(emp => {
    if (employeeIds.includes(emp.id)) {
      const from = emp.dept_id;
      emp.dept_id = undefined;
      hist.unshift({ id: rid(), ts: nowISO(), actor, employee_id: emp.id, employee_name: emp.name, from_dept: from, to_dept: undefined });
    }
  });
  localStorage.setItem(LS_EMP, JSON.stringify(emps));
  localStorage.setItem(LS_HIS, JSON.stringify(hist.slice(0, 500)));
}

export async function getHistory(limit=50, offset=0): Promise<Paged<AssignEvent>> {
  await delay();
  const hist: AssignEvent[] = JSON.parse(localStorage.getItem(LS_HIS) || '[]');
  return { rows: hist.slice(offset, offset+limit), total: hist.length, limit, offset };
}

export async function exportHistoryCSV(): Promise<Blob> {
  const res = await getHistory(10000, 0);
  const header = ['ts','actor','employee_id','employee_name','from_dept','to_dept'];
  const lines = [header.join(',')];
  res.rows.forEach(r => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push([r.ts,r.actor,r.employee_id,r.employee_name,r.from_dept||'',r.to_dept||''].map(esc).join(','));
  });
  return new Blob([lines.join('\\n')], { type:'text/csv' });
}
