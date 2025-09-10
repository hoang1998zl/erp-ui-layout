// src/mock/approvals.ts
export type UUID = string;

export type LeaveApproval = {
  id: UUID;                // approval task id
  request_id: string;      // e.g., LR-2025-0001
  employee_name: string;
  employee_email: string;
  department?: string;
  type: string;            // AL/SL/UP/WFH
  start: string;           // ISO date
  start_portion: 'full'|'am'|'pm';
  end: string;
  end_portion: 'full'|'am'|'pm';
  days: number;
  submitted_at: string;
  status: 'pending'|'approved'|'rejected';
  last_action_by?: string;
  last_action_at?: string;
  comment?: string;
};

export type Query = {
  from?: string;
  to?: string;
  employee?: string;   // name or email contains
  type?: string;       // AL/SL/UP/WFH
  status?: 'pending'|'approved'|'rejected';
  limit?: number;
  offset?: number;
  sort?: 'submitted_desc'|'submitted_asc';
};

export type Paged<T> = { rows: T[]; total: number; limit: number; offset: number };

const LS_KEY = 'erp.approvals.inbox.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function seed() {
  if (localStorage.getItem(LS_KEY)) return;
  const names = [
    ['Nguyễn Văn A','emp1@company.vn','Sales'],
    ['Trần Thị B','emp2@company.vn','Finance'],
    ['Lê Văn C','emp3@company.vn','HR'],
    ['Phạm Thị D','emp4@company.vn','Engineering'],
    ['Hoàng Văn E','emp5@company.vn','Marketing'],
  ];
  const types = ['AL','SL','UP','WFH'] as const;
  const now = Date.now();
  const rows: LeaveApproval[] = [];
  for (let i=1;i<=28;i++){
    const who = names[Math.floor(Math.random()*names.length)];
    const start = new Date(now - Math.floor(Math.random()*60)*86400000);
    const len = Math.floor(Math.random()*3)+1;
    const end = new Date(start.getTime()+ (len-1)*86400000);
    const portion = Math.random()<0.2 ? 'am' : (Math.random()<0.2 ? 'pm' : 'full');
    const t = types[Math.floor(Math.random()*types.length)];
    const reqId = `LR-${start.getFullYear()}-${String(200+i).padStart(4,'0')}`;
    rows.push({
      id: rid(),
      request_id: reqId,
      employee_name: who[0],
      employee_email: who[1],
      department: who[2],
      type: t,
      start: start.toISOString().slice(0,10),
      start_portion: portion as any,
      end: end.toISOString().slice(0,10),
      end_portion: 'full',
      days: len - (portion!=='full'?0.5:0),
      submitted_at: new Date(start.getTime()+Math.floor(Math.random()*5)*3600000).toISOString(),
      status: Math.random()<0.7 ? 'pending' : (Math.random()<0.5 ? 'approved' : 'rejected'),
    });
  }
  // ensure at least some pending
  rows.slice(0,8).forEach(r => r.status='pending');
  localStorage.setItem(LS_KEY, JSON.stringify(rows.sort((a,b)=>a.submitted_at < b.submitted_at ? 1 : -1)));
}
seed();

function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }

export async function listApprovals(q: Query): Promise<Paged<LeaveApproval>> {
  await delay();
  let rows: LeaveApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  if (q.from) rows = rows.filter(r => new Date(r.submitted_at) >= new Date(q.from!));
  if (q.to) { const end = new Date(q.to!); end.setHours(23,59,59,999); rows = rows.filter(r => new Date(r.submitted_at) <= end); }
  if (q.employee) {
    const s = q.employee.toLowerCase();
    rows = rows.filter(r => r.employee_name.toLowerCase().includes(s) || r.employee_email.toLowerCase().includes(s));
  }
  if (q.type) rows = rows.filter(r => r.type===q.type);
  if (q.status) rows = rows.filter(r => r.status===q.status);
  if (q.sort==='submitted_asc') rows = rows.slice().sort((a,b)=>a.submitted_at < b.submitted_at ? -1 : 1);
  else rows = rows.slice().sort((a,b)=>a.submitted_at < b.submitted_at ? 1 : -1);
  const total = rows.length;
  const offset = q.offset || 0;
  const limit = q.limit || 20;
  rows = rows.slice(offset, offset+limit);
  return { rows, total, limit, offset };
}

export async function approve(ids: UUID[], comment?: string): Promise<void> {
  await delay();
  const rows: LeaveApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const now = new Date().toISOString();
  rows.forEach(r => {
    if (ids.includes(r.id)) { r.status='approved'; r.last_action_by='manager@company.vn'; r.last_action_at=now; r.comment=comment || r.comment; }
  });
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export async function reject(ids: UUID[], reason: string): Promise<void> {
  await delay();
  const rows: LeaveApproval[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const now = new Date().toISOString();
  rows.forEach(r => {
    if (ids.includes(r.id)) { r.status='rejected'; r.last_action_by='manager@company.vn'; r.last_action_at=now; r.comment=reason; }
  });
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export async function exportCSV(q: Query): Promise<Blob> {
  const res = await listApprovals({ ...q, offset:0, limit:10000 });
  const header = ['id','request_id','employee_name','employee_email','department','type','start','start_portion','end','end_portion','days','submitted_at','status','last_action_by','last_action_at','comment'];
  const lines = [header.join(',')];
  res.rows.forEach(r => {
    const esc = (v:any) => v===undefined||v===null?'' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    lines.push(header.map(h => esc((r as any)[h])).join(','));
  });
  return new Blob([lines.join('\n')], { type:'text/csv' });
}
