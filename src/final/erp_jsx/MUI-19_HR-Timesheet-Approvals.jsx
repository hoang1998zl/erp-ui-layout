import React, { useState, useEffect, useMemo, useRef } from 'react';

// ===== Mock (inlined) =====
// src/mock/tsApprovals.ts — mock data & adapters

// Helpers
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function mondayISO(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday = 1
  const x = new Date(d);
  x.setDate(d.getDate() + diff);
  x.setHours(0,0,0,0);
  return x;
}
function toYMD(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function addDays(d, k) { const x = new Date(d); x.setDate(x.getDate()+k); return x; }
function addWeeks(d, w) { return addDays(d, w*7); }
function weekKey(d) {
  const m = mondayISO(d);
  const s = toYMD(m);
  const e = toYMD(addDays(m, 6));
  return `${s}_${e}`;
}

// Seed mock timesheets for 8 weeks around today
const today = new Date();
const weeks = Array.from({ length: 8 }, (_, i) => addWeeks(today, i-3));

const EMPLOYEES = [
  { id: 'E001', name: 'Nguyễn Văn A', title: 'Frontend Dev' },
  { id: 'E002', name: 'Trần Thị B', title: 'Backend Dev' },
  { id: 'E003', name: 'Lê Văn C', title: 'QA Engineer' },
  { id: 'E004', name: 'Phạm Thị D', title: 'Project Manager' },
  { id: 'E005', name: 'Võ Văn E', title: 'Designer' },
];

function mkTimesheet(empId, date, hours, project, status='pending') {
  return { id: `${empId}_${toYMD(date)}`, empId, date: toYMD(date), hours, project, status };
}

// For each week, create entries for Mon-Fri for each employee
const TIMESHEETS = {};
for (const w of weeks) {
  const key = weekKey(w);
  const mon = mondayISO(w);
  const arr = [];
  for (let d=0; d<5; d++) {
    const day = addDays(mon, d);
    for (const emp of EMPLOYEES) {
      arr.push(mkTimesheet(emp.id, day, 8, ['ERP','HRM','CRM'][d%3], Math.random() < 0.3 ? 'approved' : 'pending'));
    }
  }
  TIMESHEETS[key] = arr;
}

const mockAdapters = {
  async listWeeks() { return weeks.map(w => ({ key: weekKey(w), start: toYMD(mondayISO(w)), end: toYMD(addDays(mondayISO(w),6)) })); },
  async listPending(weekKeyStr) { return (TIMESHEETS[weekKeyStr]||[]).filter(x => x.status === 'pending'); },
  async listApproved(weekKeyStr) { return (TIMESHEETS[weekKeyStr]||[]).filter(x => x.status === 'approved'); },
  async approve(ids) {
    for (const key of Object.keys(TIMESHEETS)) {
      for (const t of TIMESHEETS[key]) { if (ids.includes(t.id)) t.status = 'approved'; }
    }
    return { ok: true };
  },
  async reject(ids) {
    for (const key of Object.keys(TIMESHEETS)) {
      for (const t of TIMESHEETS[key]) { if (ids.includes(t.id)) t.status = 'rejected'; }
    }
    return { ok: true };
  },
};

// ===== Component (inlined) =====
// src/components/hr/TimesheetApprovalsInbox.tsx (transpiled)
function Section({ title, children, right }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div>{right}</div>
      </div>
      <div className="p-3 bg-white border shadow rounded-xl">{children}</div>
    </div>
  );
}

function Pill({ children }) {
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">{children}</span>;
}

function Toolbar({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function TimesheetApprovalsInbox({ locale='vi', adapters }) {
  const api = adapters || mockAdapters;
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { (async () => {
    const ws = await api.listWeeks();
    setWeeks(ws);
    setSelectedWeek(ws[Math.max(0, Math.floor(ws.length/2))]?.key || ws[0]?.key);
  })(); }, []);

  useEffect(() => { (async () => {
    if (!selectedWeek) return;
    setPending(await api.listPending(selectedWeek));
    setApproved(await api.listApproved(selectedWeek));
    setSelectedIds([]);
  })(); }, [selectedWeek]);

  const toggle = (id) => setSelectedIds(s => s.includes(id) ? s.filter(x => x!==id) : [...s, id]);
  const allChecked = pending.length>0 && selectedIds.length === pending.length;
  const toggleAll = () => setSelectedIds(allChecked ? [] : pending.map(x=>x.id));

  async function onApprove() { await api.approve(selectedIds); setSelectedIds([]); setPending(await api.listPending(selectedWeek)); setApproved(await api.listApproved(selectedWeek)); }
  async function onReject() { await api.reject(selectedIds); setSelectedIds([]); setPending(await api.listPending(selectedWeek)); setApproved(await api.listApproved(selectedWeek)); }

  return (
    <div className="space-y-6">
      <Section title={locale==='vi'? 'Bộ lọc tuần' : 'Week Filter'} right={<Pill>{weeks.length} weeks</Pill>}>
        <div className="flex gap-2 pb-1 overflow-x-auto">
          {weeks.map(w => (
            <button key={w.key} onClick={()=>setSelectedWeek(w.key)} className={`px-3 py-1 rounded-full border ${selectedWeek===w.key? 'bg-black text-white':'bg-white'}`}>
              {w.start} → {w.end}
            </button>
          ))}
        </div>
      </Section>

      <Section title={locale==='vi'? 'Chờ duyệt' : 'Pending Approvals'} right={<Toolbar>
        <button onClick={onApprove} disabled={!selectedIds.length} className="px-3 py-1 border rounded-lg">Approve</button>
        <button onClick={onReject} disabled={!selectedIds.length} className="px-3 py-1 border rounded-lg">Reject</button>
      </Toolbar>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th className="p-2">Employee</th>
                <th className="p-2">Date</th>
                <th className="p-2">Hours</th>
                <th className="p-2">Project</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2"><input type="checkbox" checked={selectedIds.includes(it.id)} onChange={()=>toggle(it.id)} /></td>
                  <td className="p-2">{EMPLOYEES.find(e=>e.id===it.empId)?.name}</td>
                  <td className="p-2">{it.date}</td>
                  <td className="p-2">{it.hours}</td>
                  <td className="p-2">{it.project}</td>
                  <td className="p-2"><Pill>{it.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={locale==='vi'? 'Đã duyệt' : 'Approved'} right={<Pill>{approved.length}</Pill>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Employee</th>
                <th className="p-2">Date</th>
                <th className="p-2">Hours</th>
                <th className="p-2">Project</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {approved.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{EMPLOYEES.find(e=>e.id===it.empId)?.name}</td>
                  <td className="p-2">{it.date}</td>
                  <td className="p-2">{it.hours}</td>
                  <td className="p-2">{it.project}</td>
                  <td className="p-2"><Pill>{it.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ===== App Wrapper (export default) =====
export default function MUI_19_HR_Timesheet_Approvals_SingleFile() {
  return (
    <div className="p-4">
      <TimesheetApprovalsInbox locale="vi" />
    </div>
  );
}
