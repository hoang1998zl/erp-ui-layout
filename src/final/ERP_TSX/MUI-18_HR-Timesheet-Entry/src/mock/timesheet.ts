// src/mock/timesheet.ts
export type UUID = string;

export type Task = {
  id: UUID;
  code: string;        // PM-03 dependency
  name: string;
  project?: string;
  active: boolean;
};

export type TimeEntry = {
  id: UUID;
  date: string;        // ISO YYYY-MM-DD
  task_id: UUID;
  hours: number;       // 0..24
  note?: string;
  created_at: string;
  updated_at: string;
};

export type SubmitStatus = {
  week_start: string;  // Monday ISO date
  submitted_at: string;
  by: string;          // user email
  total_hours: number;
};

const LS_TASKS = 'erp.ts.tasks.v1';
const LS_ENTRIES = 'erp.ts.entries.v1';
const LS_SUBMITS = 'erp.ts.submits.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }
function nowISO(){ return new Date().toISOString(); }
function isoDate(d: Date){ return d.toISOString().slice(0,10); }

function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay(); // 0 Sun..6 Sat
  const diff = (day===0 ? -6 : 1 - day); // Monday as start
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}
export function weekStartISO(dateISO: string): string { return isoDate(mondayOf(new Date(dateISO+'T00:00:00Z'))); }
export function weekRange(dateISO: string): { start: string; days: string[] } {
  const start = mondayOf(new Date(dateISO+'T00:00:00Z'));
  const days: string[] = [];
  for(let i=0;i<7;i++){ const d = new Date(start); d.setUTCDate(d.getUTCDate()+i); days.push(isoDate(d)); }
  return { start: isoDate(start), days };
}

// Seed tasks
(function seed(){
  if (localStorage.getItem(LS_TASKS)) return;
  const tasks: Task[] = [
    { id: rid(), code:'PM-101', name:'Website redesign', project:'PRJ-MKT', active:true },
    { id: rid(), code:'PM-102', name:'Mobile app API', project:'PRJ-ENG', active:true },
    { id: rid(), code:'PM-103', name:'Quarterly report', project:'PRJ-FIN', active:true },
    { id: rid(), code:'PM-104', name:'Recruitment drive', project:'PRJ-HR', active:true },
    { id: rid(), code:'PM-105', name:'Customer onboarding', project:'PRJ-CS', active:true },
  ];
  localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
  // entries empty by default
  localStorage.setItem(LS_ENTRIES, JSON.stringify([]));
  localStorage.setItem(LS_SUBMITS, JSON.stringify({}));
})();

export async function listMyTasks(q?: { search?: string; include_inactive?: boolean }): Promise<Task[]> {
  await delay();
  let rows: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
  if (!q?.include_inactive) rows = rows.filter(t => t.active);
  if (q?.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter(t => t.name.toLowerCase().includes(s) || t.code.toLowerCase().includes(s) || (t.project||'').toLowerCase().includes(s));
  }
  // top 50
  return rows.slice(0, 50);
}

export async function getEntries(fromISO: string, toISO: string): Promise<TimeEntry[]> {
  await delay();
  const rows: TimeEntry[] = JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]');
  const from = new Date(fromISO+'T00:00:00'); const to = new Date(toISO+'T23:59:59');
  return rows.filter(r => new Date(r.date) >= from && new Date(r.date) <= to).sort((a,b)=>a.date<b.date?-1:1);
}

export async function upsertEntries(entries: Omit<TimeEntry,'id'|'created_at'|'updated_at'>[]): Promise<TimeEntry[]> {
  await delay();
  const rows: TimeEntry[] = JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]');
  const out: TimeEntry[] = [];
  entries.forEach(e => {
    // if existing entry for (date, task_id) replace; allow multiple lines per day by summing? For simplicity: 1 per task/day; we replace.
    const idx = rows.findIndex(r => r.date===e.date && r.task_id===e.task_id);
    if (idx>=0) {
      rows[idx] = { ...rows[idx], hours: e.hours, note: e.note, updated_at: nowISO() };
      out.push(rows[idx]);
    } else {
      const row: TimeEntry = { id: rid(), date: e.date, task_id: e.task_id, hours: e.hours, note: e.note, created_at: nowISO(), updated_at: nowISO() };
      rows.push(row); out.push(row);
    }
  });
  localStorage.setItem(LS_ENTRIES, JSON.stringify(rows));
  return out;
}

export async function deleteEntry(dateISO: string, task_id: UUID): Promise<void> {
  await delay();
  let rows: TimeEntry[] = JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]');
  rows = rows.filter(r => !(r.date===dateISO && r.task_id===task_id));
  localStorage.setItem(LS_ENTRIES, JSON.stringify(rows));
}

export async function copyFromPreviousWeek(weekStartISODate: string): Promise<number> {
  await delay();
  const start = new Date(weekStartISODate+'T00:00:00');
  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate()-7);
  const prevEnd = new Date(prevStart); prevEnd.setDate(prevEnd.getDate()+6);
  const prevRows = await getEntries(isoDate(prevStart), isoDate(prevEnd));
  // shift each entry +7 days
  const shifted = prevRows.map(r => {
    const d = new Date(r.date); d.setDate(d.getDate()+7);
    return { date: isoDate(d), task_id: r.task_id, hours: r.hours, note: r.note };
  });
  await upsertEntries(shifted as any);
  return shifted.length;
}

export async function submitWeek(weekStart: string, by='me@company.vn'): Promise<SubmitStatus> {
  await delay();
  const days = weekRange(weekStart).days;
  const rows = await getEntries(days[0], days[6]);
  const total = rows.reduce((s,r)=>s+(r.hours||0),0);
  const submits = JSON.parse(localStorage.getItem(LS_SUBMITS) || '{}');
  submits[weekStart] = { week_start: weekStart, submitted_at: nowISO(), by, total_hours: total };
  localStorage.setItem(LS_SUBMITS, JSON.stringify(submits));
  return submits[weekStart];
}

export async function isWeekSubmitted(weekStart: string): Promise<SubmitStatus | null> {
  await delay();
  const submits = JSON.parse(localStorage.getItem(LS_SUBMITS) || '{}');
  return submits[weekStart] || null;
}

export type WeekViewData = {
  tasks: Task[];
  grid: Record<string, Record<string, { hours: number; note?: string }>>; // task_id -> date -> cell
  totals: {
    perDay: Record<string, number>;
    perTask: Record<string, number>;
    grand: number;
  };
};

export async function getWeekView(weekStartISODate: string): Promise<WeekViewData> {
  await delay();
  const { days } = weekRange(weekStartISODate);
  const tasks: Task[] = JSON.parse(localStorage.getItem(LS_TASKS) || '[]').filter((t:Task)=>t.active);
  const entries: TimeEntry[] = await getEntries(days[0], days[6]);
  const grid: WeekViewData['grid'] = {};
  const totals = { perDay: {} as Record<string, number>, perTask: {} as Record<string, number>, grand: 0 };
  days.forEach(d => totals.perDay[d]=0);
  tasks.forEach(t => { grid[t.id] = {}; days.forEach(d => grid[t.id][d] = { hours: 0 }); totals.perTask[t.id] = 0; });
  entries.forEach(e => {
    if (!grid[e.task_id]) return;
    grid[e.task_id][e.date] = { hours: e.hours, note: e.note };
    totals.perDay[e.date] += e.hours;
    totals.perTask[e.task_id] += e.hours;
    totals.grand += e.hours;
  });
  return { tasks, grid, totals };
}
