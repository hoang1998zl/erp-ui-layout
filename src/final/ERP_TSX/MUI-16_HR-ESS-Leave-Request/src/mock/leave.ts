// src/mock/leave.ts
export type UUID = string;

export type LeaveType = {
  code: string;          // e.g., 'AL', 'SL', 'UP'
  name_vi: string;
  name_en: string;
  color?: string;
  paid: boolean;
};

export type LeaveBalance = {
  code: string;          // leave type code
  year: number;
  entitled: number;      // total entitlement (days)
  carried: number;       // brought forward
  used: number;          // used days
};

export type Holiday = {
  date: string;          // ISO date YYYY-MM-DD
  name: string;
};

export type LeaveRequest = {
  id: string;            // e.g., LR-2025-0001
  employee_id: string;   // 'me'
  type: string;          // code
  start: string;         // ISO date
  start_portion: 'full'|'am'|'pm';
  end: string;           // ISO date
  end_portion: 'full'|'am'|'pm';
  days: number;          // calculated working days
  reason?: string;
  contact?: string;
  backup_person?: string; // email or name
  attachments?: { name: string; size: number; data_url?: string }[];
  status: 'draft'|'submitted'|'approved'|'rejected'|'cancelled';
  created_at: string;
  updated_at: string;
};

const LS_BAL = 'erp.leave.balance.v1';
const LS_REQ = 'erp.leave.requests.v1';

function delay(ms=120){ return new Promise(res=>setTimeout(res, ms)); }
function nowISO(){ return new Date().toISOString(); }

// Sample leave types
const LEAVE_TYPES: LeaveType[] = [
  { code:'AL', name_vi:'Nghỉ phép năm', name_en:'Annual leave', color:'#2563eb', paid:true },
  { code:'SL', name_vi:'Nghỉ ốm', name_en:'Sick leave', color:'#16a34a', paid:true },
  { code:'UP', name_vi:'Nghỉ không lương', name_en:'Unpaid leave', color:'#6b7280', paid:false },
  { code:'WFH', name_vi:'Làm việc tại nhà', name_en:'Work from home', color:'#a855f7', paid:true },
];

// VN public holidays (sample, not exhaustive)
const HOLIDAYS: Holiday[] = [
  { date:'2025-01-01', name:'New Year' },
  { date:'2025-04-30', name:'Reunification Day' },
  { date:'2025-05-01', name:'International Labor Day' },
  { date:'2025-09-02', name:'National Day' },
];

function getYearBalances(year: number): LeaveBalance[] {
  try {
    const raw = localStorage.getItem(LS_BAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      const found = parsed[String(year)];
      if (found) return found;
    }
  } catch {}
  // defaults
  return [
    { code:'AL', year, entitled: 12, carried: 2, used: 5 },
    { code:'SL', year, entitled: 5, carried: 0, used: 1 },
    { code:'UP', year, entitled: 999, carried: 0, used: 0 },
    { code:'WFH', year, entitled: 999, carried: 0, used: 12 },
  ];
}

function setYearBalances(year: number, rows: LeaveBalance[]) {
  const all = JSON.parse(localStorage.getItem(LS_BAL) || '{}');
  all[String(year)] = rows;
  localStorage.setItem(LS_BAL, JSON.stringify(all));
}

export async function listLeaveTypes(): Promise<LeaveType[]> { await delay(); return LEAVE_TYPES; }
export async function listVN_Holidays(year: number): Promise<Holiday[]> { await delay(); return HOLIDAYS.filter(h => h.date.startsWith(String(year))); }
export async function getBalances(year: number): Promise<LeaveBalance[]> { await delay(); return getYearBalances(year); }
export async function saveBalances(year: number, rows: LeaveBalance[]): Promise<void> { await delay(); setYearBalances(year, rows); }

function nextReqId(): string {
  const raw = localStorage.getItem('erp.leave.seq') || '0';
  const n = (parseInt(raw) || 0) + 1;
  localStorage.setItem('erp.leave.seq', String(n));
  const y = new Date().getFullYear();
  return `LR-${y}-${String(n).padStart(4,'0')}`;
}

export async function createLeaveRequest(payload: Omit<LeaveRequest, 'id'|'status'|'created_at'|'updated_at'|'employee_id'>): Promise<LeaveRequest> {
  await delay();
  const req: LeaveRequest = {
    id: nextReqId(),
    employee_id: 'me',
    status: 'submitted',
    created_at: nowISO(),
    updated_at: nowISO(),
    ...payload,
  };
  const list = JSON.parse(localStorage.getItem(LS_REQ) || '[]');
  list.unshift(req);
  localStorage.setItem(LS_REQ, JSON.stringify(list));
  // update used balance for paid types (simplified)
  const year = new Date(payload.start).getFullYear();
  const bal = getYearBalances(year).map(b => ({ ...b }));
  const idx = bal.findIndex(b => b.code === payload.type);
  if (idx >= 0 && bal[idx].code !== 'UP') {
    bal[idx].used += payload.days;
    setYearBalances(year, bal);
  }
  return req;
}

export async function listMyRequests(limit=10, offset=0): Promise<{ rows: LeaveRequest[]; total: number; }> {
  await delay();
  const list: LeaveRequest[] = JSON.parse(localStorage.getItem(LS_REQ) || '[]');
  return { rows: list.slice(offset, offset+limit), total: list.length };
}

// Business day calculation (Mon-Fri, exclude holidays). Portions: 'am'/'pm' reduce half day at edges.
export function businessDays(startISO: string, endISO: string, startPortion: 'full'|'am'|'pm', endPortion: 'full'|'am'|'pm', holidays: Holiday[]): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const isHoliday = (d: Date) => holidays.some(h => h.date === d.toISOString().slice(0,10));
  let days = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const dow = d.getDay(); // 0 Sun .. 6 Sat
    if (dow===0 || dow===6) continue; // skip weekends
    if (isHoliday(d)) continue;
    days += 1;
  }
  // Apply half-day adjustments
  if (days > 0) {
    if (startPortion !== 'full') days -= 0.5;
    if (endPortion !== 'full') days -= 0.5;
    if (start.toDateString() === end.toDateString() && startPortion !== 'full' && endPortion !== 'full') {
      // Same day both halves -> count as 1 day if AM+PM taken; if both AM or both PM, it's 0.5 (but UI won't allow illogical).
      days = 1.0; // treat AM+PM same-day as full day
    }
  }
  return Math.max(0, days);
}
