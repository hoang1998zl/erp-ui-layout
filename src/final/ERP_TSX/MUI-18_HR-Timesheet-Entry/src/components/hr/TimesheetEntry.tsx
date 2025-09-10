// src/components/hr/TimesheetEntry.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listMyTasks, getEntries, upsertEntries, deleteEntry, copyFromPreviousWeek,
  getWeekView, weekRange, weekStartISO, submitWeek, isWeekSubmitted,
  type Task
} from '../../mock/timesheet';

export type TimesheetEntryProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listMyTasks: typeof listMyTasks;
    getEntries: typeof getEntries;
    upsertEntries: typeof upsertEntries;
    deleteEntry: typeof deleteEntry;
    copyFromPreviousWeek: typeof copyFromPreviousWeek;
    getWeekView: typeof getWeekView;
    weekRange: typeof weekRange;
    weekStartISO: typeof weekStartISO;
    submitWeek: typeof submitWeek;
    isWeekSubmitted: typeof isWeekSubmitted;
  }>;
};

type Mode = 'weekly'|'daily';

const toISO = (d: Date) => d.toISOString().slice(0,10);

export const TimesheetEntry: React.FC<TimesheetEntryProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listMyTasks: adapters.listMyTasks || listMyTasks,
    getEntries: adapters.getEntries || getEntries,
    upsertEntries: adapters.upsertEntries || upsertEntries,
    deleteEntry: adapters.deleteEntry || deleteEntry,
    copyFromPreviousWeek: adapters.copyFromPreviousWeek || copyFromPreviousWeek,
    getWeekView: adapters.getWeekView || getWeekView,
    weekRange: adapters.weekRange || weekRange,
    weekStartISO: adapters.weekStartISO || weekStartISO,
    submitWeek: adapters.submitWeek || submitWeek,
    isWeekSubmitted: adapters.isWeekSubmitted || isWeekSubmitted,
  };

  const [mode, setMode] = useState<Mode>('weekly');
  const [date, setDate] = useState<string>(toISO(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTask, setSearchTask] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // WEEKLY VIEW STATE
  const week = useMemo(() => fns.weekRange!(date), [date]);
  const weekStart = useMemo(() => fns.weekStartISO!(date), [date]);
  const [grid, setGrid] = useState<any>(null);
  const [perDay, setPerDay] = useState<Record<string, number>>({});
  const [perTask, setPerTask] = useState<Record<string, number>>({});
  const [grand, setGrand] = useState(0);
  const [submitted, setSubmitted] = useState<any>(null);

  const loadWeek = async () => {
    const v = await fns.getWeekView!(weekStart);
    setGrid(v.grid);
    setPerDay(v.totals.perDay);
    setPerTask(v.totals.perTask);
    setGrand(v.totals.grand);
    const s = await fns.isWeekSubmitted!(weekStart);
    setSubmitted(s);
  };

  // DAILY VIEW STATE
  const [dailyRows, setDailyRows] = useState<Array<{ task_id: string; task?: Task; hours: number; note?: string }>>([]);

  const loadDaily = async () => {
    const rows = await fns.getEntries!(date, date);
    const withTask = await Promise.all(rows.map(async r => ({ task_id: r.task_id, hours: r.hours, note: r.note })));
    setDailyRows(withTask);
  };

  useEffect(() => { fns.listMyTasks!({}).then(setTasks); }, []);
  useEffect(() => { if (mode==='weekly') loadWeek(); else loadDaily(); }, [mode, date]);

  // Task picker helpers
  const filteredTasks = useMemo(() => {
    const s = searchTask.toLowerCase().trim();
    if (!s) return tasks.slice(0,30);
    return tasks.filter(tk => tk.name.toLowerCase().includes(s) || tk.code.toLowerCase().includes(s) || (tk.project||'').toLowerCase().includes(s)).slice(0,30);
  }, [tasks, searchTask]);

  // Update cell
  const setCell = async (task_id: string, dayISO: string, val: number, note?: string) => {
    if (submitted) { setToast(t('Tuần đã nộp, không thể sửa.','Week submitted; locked.')); return; }
    const hours = Math.max(0, Math.min(24, isNaN(val)?0:val));
    await fns.upsertEntries!([{ date: dayISO, task_id, hours, note } as any]);
    await loadWeek();
  };

  const removeTaskRow = async (task_id: string) => {
    if (submitted) return;
    for (const d of week.days) await fns.deleteEntry!(d, task_id);
    await loadWeek();
  };

  const addTaskRow = async (task_id: string) => {
    if (grid?.[task_id]) return; // already exists
    // initialize with zeros by writing no entries; row will appear when grid loads from tasks list
    await loadWeek();
  };

  const copyPrev = async () => {
    if (submitted) return;
    const n = await fns.copyFromPreviousWeek!(weekStart);
    await loadWeek();
    setToast(t('Đã sao chép từ tuần trước: ','Copied from previous week: ') + n + ' ' + t('dòng','rows'));
  };

  const onSubmitWeek = async () => {
    if (submitted) return;
    setBusy(true);
    const s = await fns.submitWeek!(weekStart);
    setBusy(false);
    setSubmitted(s);
    setToast(t('Đã nộp timesheet tuần.','Week submitted.'));
  };

  const dayHeader = (d: string) => {
    const dt = new Date(d+'T00:00:00');
    const wd = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const iv = wd[dt.getUTCDay()===0?6:dt.getUTCDay()-1];
    return `${iv} ${d.slice(5)}`;
  };

  const perDayClass = (h: number) => ({ color: h>10 ? '#f59e0b' : '#111827', fontWeight: 700 });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>HR-04 — {t('Chấm công theo task','Timesheet entry')}</div>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="weekly">{t('Theo tuần','Weekly')}</option>
            <option value="daily">{t('Theo ngày','Daily')}</option>
          </select>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          {mode==='weekly' && (
            <div style={{ color:'#6b7280', fontSize:13 }}>
              {t('Tuần','Week')}: <b>{week.days[0]}</b> → <b>{week.days[6]}</b> {submitted && <span> — ✅ {t('ĐÃ NỘP','SUBMITTED')}</span>}
            </div>
          )}
        </div>
        {mode==='weekly' && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={copyPrev} disabled={!!submitted} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: submitted?0.6:1 }}>{t('Copy tuần trước','Copy last week')}</button>
            <button onClick={onSubmitWeek} disabled={!!submitted || busy} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', opacity: (submitted||busy)?0.7:1 }}>{t('Nộp tuần','Submit week')}</button>
          </div>
        )}
      </div>

      {/* Weekly grid */}
      {mode==='weekly' && grid && (
        <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'auto' }}>
          <div style={{ minWidth: 900 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ textAlign:'left', padding:8, width:320 }}>{t('Task','Task')}</th>
                  {week.days.map(d => <th key={d} style={{ textAlign:'center', padding:8 }}>{dayHeader(d)}</th>)}
                  <th style={{ textAlign:'center', padding:8, width:90 }}>{t('Tổng','Total')}</th>
                  <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Hành động','Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {/* Row per task */}
                {Object.keys(grid).map(task_id => {
                  const task = tasks.find(tk => tk.id===task_id);
                  const total = week.days.reduce((s,d)=>s + (grid[task_id][d]?.hours || 0), 0);
                  return (
                    <tr key={task_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:8 }}>
                        <div style={{ fontWeight:700 }}>{task?.code} — {task?.name}</div>
                        <div style={{ color:'#6b7280', fontSize:12 }}>{task?.project || '—'}</div>
                      </td>
                      {week.days.map(d => {
                        const cell = grid[task_id][d] || { hours: 0 };
                        return (
                          <td key={d} style={{ padding:6, textAlign:'center' }}>
                            <input type="number" step="0.25" min={0} max={24} disabled={!!submitted}
                                   value={cell.hours || 0}
                                   onChange={e=>setCell(task_id, d, parseFloat(e.target.value) || 0)}
                                   style={{ width:80, textAlign:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                          </td>
                        );
                      })}
                      <td style={{ textAlign:'center', fontWeight:700 }}>{total.toFixed(2)}</td>
                      <td style={{ padding:8 }}>
                        <button onClick={()=>removeTaskRow(task_id)} disabled={!!submitted} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: submitted?0.6:1 }}>{t('Xoá dòng','Remove')}</button>
                      </td>
                    </tr>
                  );
                })}
                {/* Add task row */}
                <tr style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:8 }} colSpan={week.days.length + 2}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input value={searchTask} onChange={e=>setSearchTask(e.target.value)} placeholder={t('Tìm task (mã/tên/dự án)','Search task (code/name/project)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', flex:1 }} />
                      <div style={{ position:'relative' }}>
                        <div style={{ position:'absolute', zIndex:10, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, width:460, maxHeight:220, overflow:'auto', display: searchTask ? 'block' : 'none' }}>
                          {filteredTasks.map(tk => (
                            <div key={tk.id} onMouseDown={()=>{ addTaskRow(tk.id); setSearchTask(''); }} style={{ padding:'6px 8px', cursor:'pointer', borderBottom:'1px solid #f3f4f6' }}>
                              <div style={{ fontWeight:700 }}>{tk.code} — {tk.name}</div>
                              <div style={{ color:'#6b7280', fontSize:12 }}>{tk.project || '—'}</div>
                            </div>
                          ))}
                          {filteredTasks.length===0 && <div style={{ padding:'8px 10px', color:'#6b7280' }}>{t('Không tìm thấy','No results')}</div>}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr style={{ borderTop:'2px solid #e5e7eb', background:'#f9fafb' }}>
                  <td style={{ padding:8, fontWeight:800, textAlign:'right' }}>{t('Tổng theo ngày →','Totals by day →')}</td>
                  {week.days.map(d => <td key={d} style={{ textAlign:'center', padding:8 }}><span style={perDayClass(perDay[d]||0)}>{(perDay[d]||0).toFixed(2)}</span></td>)}
                  <td style={{ textAlign:'center', fontWeight:800 }}>{grand.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ padding:'8px 10px', color:'#6b7280' }}>
            {t('Cảnh báo: >10h/ngày hoặc >60h/tuần sẽ được đánh dấu để quản lý xem xét (chỉ cảnh báo demo).','Warning: >10h/day or >60h/week are highlighted for manager review (demo only).')}
          </div>
        </section>
      )}

      {/* Daily list */}
      {mode==='daily' && (
        <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
            <div style={{ fontWeight:800 }}>{t('Nhật ký ngày','Daily log')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={async ()=>{ await loadDaily(); setToast(t('Đã load lại','Refreshed')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Làm mới','Refresh')}</button>
            </div>
          </div>
          <div style={{ padding:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'center', marginBottom:8 }}>
              <input value={searchTask} onChange={e=>setSearchTask(e.target.value)} placeholder={t('Chọn task để thêm','Pick task to add')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <input id="daily_hours" placeholder="0.5" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <button onClick={()=>{
                const elH = document.getElementById('daily_hours') as HTMLInputElement | null;
                const val = parseFloat(elH?.value || '0'); if (!val) return;
                const tk = filteredTasks[0]; if (!tk) return;
                fns.upsertEntries!([{ date, task_id: tk.id, hours: Math.max(0,Math.min(24,val)) } as any]).then(loadDaily);
                (elH as any).value='';
              }} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Thêm','Add')}</button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Task','Task')}</th>
                  <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Giờ','Hours')}</th>
                  <th style={{ textAlign:'left', padding:8 }}>{t('Ghi chú','Note')}</th>
                  <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Hành động','Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.length===0 && <tr><td colSpan={4} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                {dailyRows.map((r, idx) => {
                  const tk = tasks.find(tk => tk.id===r.task_id);
                  return (
                    <tr key={r.task_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:8 }}><div style={{ fontWeight:700 }}>{tk?.code} — {tk?.name}</div><div style={{ color:'#6b7280', fontSize:12 }}>{tk?.project || '—'}</div></td>
                      <td style={{ padding:8 }}>
                        <input type="number" step="0.25" min={0} max={24} defaultValue={r.hours} onBlur={e=>{
                          const v = parseFloat(e.target.value)||0;
                          fns.upsertEntries!([{ date, task_id:r.task_id, hours: Math.max(0,Math.min(24,v)), note:r.note } as any]).then(loadDaily);
                        }} style={{ width:100, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                      </td>
                      <td style={{ padding:8 }}>
                        <input defaultValue={r.note||''} onBlur={e=>{
                          fns.upsertEntries!([{ date, task_id:r.task_id, hours:r.hours, note:e.target.value } as any]).then(loadDaily);
                        }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                      </td>
                      <td style={{ padding:8 }}>
                        <button onClick={()=>fns.deleteEntry!(date, r.task_id).then(loadDaily)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:999, fontSize:13 }}
             onAnimationEnd={()=>setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
};
