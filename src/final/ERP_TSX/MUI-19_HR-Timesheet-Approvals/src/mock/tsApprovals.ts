// src/mock/tsApprovals.ts
export type UUID = string;

export type DayMap = Record<string, number>; // date ISO -> hours

export type TimesheetLine = {
  task_code: string;
  task_name: string;
  project?: string;
  day_hours: DayMap;    // per day in the week
  total: number;
};

export type TimesheetApproval = {
  id: UUID;
  week_start: string;    // Monday ISO YYYY-MM-DD
  employee_name: string;
  employee_email: string;
  department?: string;
  submitted_at: string;
  status: 'pending'|'approved'|'rejected';
  last_action_by?: string;
  last_action_at?: string;
  comment?: string;
  totals: {
    per_day: DayMap;
    grand: number;
    task_count: number;
  };
  lines: TimesheetLine[];  // detail lines
};

export type Query = {
  week_from?: string;     // Monday ISO
  week_to?: string;       // Monday ISO
  employee?: string;      // name or email contains
  status?: 'pending'|'approved'|'rejected';
  limit?: number;
  offset?: number;
  sort?: 'submitted_desc'|'submitted_asc'|'hours_desc'|'hours_asc';
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_KEY = 'erp.ts.approvals.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function isoDate(d: Date){ return d.toISOString().slice(0,10); }
function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay(); // 0 Sun..6 Sat
  const diff = (day===0 ? -6 : 1 - day); // Monday
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}
export function weekRange(weekStartISO: string): string[] {
  const start = new Date(weekStartISO+'T00:00:00Z');
  const days: string[] = [];
  for (let i=0;i<7;i++){ const d = new Date(start); d.setUTCDate(d.getUTCDate()+i); days.push(isoDate(d)); }
  return days;
}

// Seed sample approvals
(function seed(){
  if (localStorage.getItem(LS_KEY)) return;
  const names = [
    ['Nguyễn Văn A','emp1@company.vn','Sales'],
    ['Trần Thị B','emp2@company.vn','Finance'],
    ['Lê Văn C','emp3@company.vn','HR'],
    ['Phạm Thị D','emp4@company.vn','Engineering'],
    ['Hoàng Văn E','emp5@company.vn','Marketing'],
    ['Đỗ Thị F','emp6@company.vn','Engineering'],
    ['Võ Văn G','emp7@company.vn','CS'],
  ];
  const taskPool = [
    ['PM-101','Website redesign','PRJ-MKT'],
    ['PM-102','Mobile app API','PRJ-ENG'],
    ['PM-103','Quarterly report','PRJ-FIN'],
    ['PM-104','Recruitment drive','PRJ-HR'],
    ['PM-105','Customer onboarding','PRJ-CS'],
    ['PM-106','Ops support','PRJ-OPS'],
  ];
  const rows: TimesheetApproval[] = [];
  const now = new Date();
  // Generate for ~10 recent weeks
  for (let w=0; w<10; w++){
    const weekStart = mondayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate()-w*7));
    const days = weekRange(isoDate(weekStart));
    const nEmployees = 3 + Math.floor(Math.random()*4);
    for (let i=0;i<nEmployees;i++){
      const who = names[Math.floor(Math.random()*names.length)];
      const lineCount = 2 + Math.floor(Math.random()*3);
      const lines: TimesheetLine[] = [];
      const totals: DayMap = {}; days.forEach(d => totals[d] = 0);
      for (let j=0;j<lineCount;j++){
        const task = taskPool[Math.floor(Math.random()*taskPool.length)];
        const day_hours: DayMap = {};
        let sum = 0;
        days.forEach(d => {
          const h = Math.random()<0.2 ? 0 : Math.round((Math.random()*3.5+1.5)*4)/4; // 0 or 1.5..5.0 in 0.25
          day_hours[d] = h;
          totals[d] += h;
          sum += h;
        });
        lines.push({ task_code: task[0], task_name: task[1], project: task[2], day_hours, total: Math.round(sum*4)/4 });
      }
      const grand = Object.values(totals).reduce((s,v)=>s+v,0);
      rows.push({
        id: rid(),
        week_start: isoDate(weekStart),
        employee_name: who[0],
        employee_email: who[1],
        department: who[2],
        submitted_at: new Date(weekStart.getTime()+Math.floor(Math.random()*4)*86400000 + Math.floor(Math.random()*8)*3600000).toISOString(),
        status: Math.random()<0.7 ? 'pending' : (Math.random()<0.5 ? 'approved' : 'rejected'),
        totals: { per_day: totals, grand: Math.round(grand*4)/4, task_count: lineCount },
        lines,
      });
    }
  }
  // ensure some pendings
  rows.slice(0,10).forEach(r => r.status='pending');
  // sort by submitted desc
  rows.sort((a,b)=> a.submitted_at < b.submitted_at ? 1 : -1);
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
})();

function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }

export async function listTsApprovals(q: Query): Promise<Paged<TimesheetApproval>> {
  await delay();
  let rows: TimesheetApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  if (q.week_from) rows = rows.filter(r => r.week_start >= q.week_from!);
  if (q.week_to) rows = rows.filter(r => r.week_start <= q.week_to!);
  if (q.employee) { const s = q.employee.toLowerCase(); rows = rows.filter(r => r.employee_name.toLowerCase().includes(s) || r.employee_email.toLowerCase().includes(s)); }
  if (q.status) rows = rows.filter(r => r.status===q.status);
  switch(q.sort){
    case 'submitted_asc': rows = rows.slice().sort((a,b)=>a.submitted_at < b.submitted_at ? -1 : 1); break;
    case 'hours_desc': rows = rows.slice().sort((a,b)=> (a.totals.grand < b.totals.grand ? 1 : -1)); break;
    case 'hours_asc': rows = rows.slice().sort((a,b)=> (a.totals.grand < b.totals.grand ? -1 : 1)); break;
    default: rows = rows.slice().sort((a,b)=>a.submitted_at < b.submitted_at ? 1 : -1);
  }
  const total = rows.length;
  const offset = q.offset || 0;
  const limit = q.limit || 20;
  rows = rows.slice(offset, offset+limit);
  // strip heavy details for list
  return { rows, total, limit, offset };
}

export async function getTsApproval(id: UUID): Promise<TimesheetApproval | null> {
  await delay();
  const rows: TimesheetApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  return rows.find(r => r.id===id) || null;
}

export async function approveTs(ids: UUID[], comment?: string): Promise<void> {
  await delay();
  const rows: TimesheetApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const now = new Date().toISOString();
  rows.forEach(r => { if (ids.includes(r.id)) { r.status='approved'; r.last_action_by='manager@company.vn'; r.last_action_at=now; if (comment) r.comment = comment; } });
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export async function rejectTs(ids: UUID[], reason: string): Promise<void> {
  await delay();
  const rows: TimesheetApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const now = new Date().toISOString();
  rows.forEach(r => { if (ids.includes(r.id)) { r.status='rejected'; r.last_action_by='manager@company.vn'; r.last_action_at=now; r.comment = reason; } });
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export async function exportCSV(q: Query): Promise<Blob> {
  const res = await listTsApprovals({ ...q, offset:0, limit:10000 });
  const header = ['id','week_start','employee_name','employee_email','department','submitted_at','status','total_hours','task_count','comment'];
  const lines = [header.join(',')];
  res.rows.forEach(r => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    const row = [
      r.id, r.week_start, r.employee_name, r.employee_email, r.department || '',
      r.submitted_at, r.status, r.totals.grand, r.totals.task_count, r.comment || ''
    ];
    lines.push(row.map(esc).join(','));
  });
  return new Blob([lines.join('\n')], { type:'text/csv' });
}
