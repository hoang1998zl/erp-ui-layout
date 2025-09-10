// src/components/hr/TimesheetApprovalsInbox.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listTsApprovals, getTsApproval, approveTs, rejectTs, exportCSV, weekRange, type TimesheetApproval, type Query } from '../../mock/tsApprovals';

export type TimesheetApprovalsInboxProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listTsApprovals: typeof listTsApprovals;
    getTsApproval: typeof getTsApproval;
    approveTs: typeof approveTs;
    rejectTs: typeof rejectTs;
    exportCSV: typeof exportCSV;
    weekRange: typeof weekRange;
  }>;
};

export const TimesheetApprovalsInbox: React.FC<TimesheetApprovalsInboxProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listTsApprovals: adapters.listTsApprovals || listTsApprovals,
    getTsApproval: adapters.getTsApproval || getTsApproval,
    approveTs: adapters.approveTs || approveTs,
    rejectTs: adapters.rejectTs || rejectTs,
    exportCSV: adapters.exportCSV || exportCSV,
    weekRange: adapters.weekRange || weekRange,
  };

  // Filters
  const mondayISO = (d: Date) => {
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = x.getUTCDay(); const diff = (day===0 ? -6 : 1 - day); x.setUTCDate(x.getUTCDate()+diff);
    return x.toISOString().slice(0,10);
  };
  const today = new Date();
  const [weekFrom, setWeekFrom] = useState(mondayISO(new Date(today.getFullYear(), today.getMonth(), today.getDate()-28)));
  const [weekTo, setWeekTo] = useState(mondayISO(today));
  const [employee, setEmployee] = useState('');
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|''>('pending');
  const [sort, setSort] = useState<'submitted_desc'|'submitted_asc'|'hours_desc'|'hours_asc'>('submitted_desc');

  const [rows, setRows] = useState<TimesheetApproval[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(15);
  const [offset, setOffset] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total/limit));
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [current, setCurrent] = useState<TimesheetApproval | null>(null);

  const query = (): Query => ({ week_from: weekFrom, week_to: weekTo, employee: employee || undefined, status: status || undefined, sort, limit, offset });

  const load = async () => {
    setLoading(true);
    const res = await fns.listTsApprovals(query());
    setRows(res.rows); setTotal(res.total);
    setSelected(sel => sel.filter(id => res.rows.some(r => r.id===id)));
    if (!current && res.rows.length>0) setCurrent(res.rows[0]);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [weekFrom, weekTo, employee, status, sort, limit, offset]);

  const toggleAll = (checked: boolean) => setSelected(checked ? rows.filter(r=>r.status==='pending').map(r=>r.id) : []);
  const toggleOne = (id:string, checked:boolean) => setSelected(sel => checked ? Array.from(new Set([...sel, id])) : sel.filter(x=>x!==id));

  const onExport = async () => {
    const blob = await fns.exportCSV(query());
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='timesheet_approvals.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const bulkApprove = async () => {
    if (selected.length===0) return;
    const note = prompt(t('Ghi chú phê duyệt (tuỳ chọn):','Approval note (optional):')) || undefined;
    await fns.approveTs(selected, note); setSelected([]); await load();
  };
  const bulkReject = async () => {
    if (selected.length===0) return;
    const reason = prompt(t('Lý do từ chối:','Rejection reason:')); if (!reason) return;
    await fns.rejectTs(selected, reason); setSelected([]); await load();
  };

  const quickApprove = async (id:string) => { await fns.approveTs([id]); await load(); };
  const quickReject = async (id:string) => { const r = prompt(t('Lý do từ chối:','Rejection reason:')); if (!r) return; await fns.rejectTs([id], r); await load(); };

  // Helpers
  const wkLabel = (w:string) => {
    const days = fns.weekRange!(w);
    return `${days[0]} → ${days[6]}`;
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 460px', gap:12, padding:12 }}>
      {/* Left section */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Duyệt timesheet','Timesheet approvals')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Tuần từ (Thứ 2)','Week from (Mon)')}</label>
              <input type="date" value={weekFrom} onChange={e=>{ setWeekFrom(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Tuần đến (Thứ 2)','Week to (Mon)')}</label>
              <input type="date" value={weekTo} onChange={e=>{ setWeekTo(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Nhân viên','Employee')}</label>
              <input value={employee} onChange={e=>{ setEmployee(e.target.value); setOffset(0); }} placeholder="name/email" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Trạng thái','Status')}</label>
              <select value={status} onChange={e=>{ setStatus(e.target.value as any); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="">{t('— Tất cả —','— All —')}</option>
                <option value="pending">{t('Chờ duyệt','Pending')}</option>
                <option value="approved">{t('Đã duyệt','Approved')}</option>
                <option value="rejected">{t('Từ chối','Rejected')}</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'end' }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Sắp xếp','Sort')}</label>
              <select value={sort} onChange={e=>{ setSort(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="submitted_desc">{t('Mới nộp → Cũ','Newest → Oldest')}</option>
                <option value="submitted_asc">{t('Cũ → Mới nộp','Oldest → Newest')}</option>
                <option value="hours_desc">{t('Giờ nhiều → ít','Hours high → low')}</option>
                <option value="hours_asc">{t('Giờ ít → nhiều','Hours low → high')}</option>
              </select>
            </div>
            <div style={{ flex:1 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={bulkReject} disabled={selected.length===0} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff', opacity:selected.length===0?0.6:1 }}>{t('Từ chối (bulk)','Reject (bulk)')}</button>
              <button onClick={bulkApprove} disabled={selected.length===0} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', opacity:selected.length===0?0.6:1 }}>{t('Duyệt (bulk)','Approve (bulk)')}</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:8, width:34 }}>
                  <input type="checkbox" onChange={e=>toggleAll(e.target.checked)} checked={selected.length>0 && rows.filter(r=>r.status==='pending').every(r=>selected.includes(r.id))} />
                </th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Nhân viên','Employee')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Tuần','Week')}</th>
                <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Giờ','Hours')}</th>
                <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Gửi lúc','Submitted')}</th>
                <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Trạng thái','Status')}</th>
                <th style={{ textAlign:'left', padding:8, width:200 }}>{t('Hành động','Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding:12, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan={7} style={{ padding:12, color:'#6b7280' }}>{t('Không có dữ liệu','No data')}</td></tr>}
              {!loading && rows.map(r => {
                const over60 = r.totals.grand > 60;
                return (
                  <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9', background: current?.id===r.id ? '#f8fafc' : '#fff' }} onClick={()=>setCurrent(r)}>
                    <td style={{ padding:8 }}>
                      <input type="checkbox" disabled={r.status!=='pending'} checked={selected.includes(r.id)} onChange={e=>{ e.stopPropagation(); toggleOne(r.id, e.target.checked); }} />
                    </td>
                    <td style={{ padding:8 }}>
                      <div style={{ fontWeight:700 }}>{r.employee_name}</div>
                      <div style={{ color:'#6b7280', fontSize:12 }}>{r.employee_email}</div>
                    </td>
                    <td style={{ padding:8 }}>{wkLabel(r.week_start)}</td>
                    <td style={{ padding:8, fontWeight:700, color: over60 ? '#f59e0b' : undefined }}>{r.totals.grand.toFixed(2)}</td>
                    <td style={{ padding:8 }}>{new Date(r.submitted_at).toLocaleString()}</td>
                    <td style={{ padding:8, textTransform:'capitalize' }}>
                      {r.status==='pending' && <span style={{ color:'#f59e0b' }}>● {t('Chờ duyệt','Pending')}</span>}
                      {r.status==='approved' && <span style={{ color:'#16a34a' }}>● {t('Đã duyệt','Approved')}</span>}
                      {r.status==='rejected' && <span style={{ color:'#ef4444' }}>● {t('Từ chối','Rejected')}</span>}
                    </td>
                    <td style={{ padding:8 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setCurrent(r)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xem','View')}</button>
                        {r.status==='pending' && <button onClick={()=>quickApprove(r.id)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'4px 8px' }}>{t('Duyệt','Approve')}</button>}
                        {r.status==='pending' && <button onClick={()=>quickReject(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Từ chối','Reject')}</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
          <div>{t('Trang','Page')} {Math.floor(offset/limit)+1}/{totalPages} — {t('Tổng','Total')}: {total}</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <label>{t('Hiển thị','Show')}</label>
            <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setOffset(0); }}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
            <button onClick={()=>setOffset(o=>Math.max(0, o - limit))} disabled={offset===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: offset===0?0.5:1 }}>Prev</button>
            <button onClick={()=>setOffset(o=>Math.min((totalPages-1)*limit, o + limit))} disabled={offset + limit >= total} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', opacity: offset+limit>=total?0.5:1 }}>Next</button>
          </div>
        </div>
      </section>

      {/* Right: details */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Chi tiết timesheet','Timesheet details')}</div>
        {!current && <div style={{ padding:12, color:'#6b7280' }}>{t('Chọn một dòng để xem chi tiết','Select a row')}</div>}
        {current && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8 }}>
              <div style={{ color:'#6b7280' }}>{t('Nhân viên','Employee')}</div><div><b>{current.employee_name}</b><div style={{ color:'#6b7280', fontSize:12 }}>{current.employee_email}</div></div>
              <div style={{ color:'#6b7280' }}>{t('Tuần','Week')}</div><div>{wkLabel(current.week_start)}</div>
              <div style={{ color:'#6b7280' }}>{t('Tổng giờ','Total hours')}</div><div><b>{current.totals.grand.toFixed(2)}</b></div>
              <div style={{ color:'#6b7280' }}>{t('Trạng thái','Status')}</div>
              <div style={{ textTransform:'capitalize' }}>
                {current.status==='pending' && <span style={{ color:'#f59e0b' }}>● {t('Chờ duyệt','Pending')}</span>}
                {current.status==='approved' && <span style={{ color:'#16a34a' }}>● {t('Đã duyệt','Approved')}</span>}
                {current.status==='rejected' && <span style={{ color:'#ef4444' }}>● {t('Từ chối','Rejected')}</span>}
              </div>
              <div style={{ color:'#6b7280' }}>{t('Ghi chú','Comment')}</div><div>{current.comment || '—'}</div>
            </div>

            {/* per-day totals bar */}
            <div>
              <div style={{ color:'#6b7280', fontSize:12, marginBottom:6 }}>{t('Tổng theo ngày','Totals per day')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6 }}>
                {fns.weekRange!(current.week_start).map(d => (
                  <div key={d} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#f9fafb' }}>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{d.slice(5)}</div>
                    <div style={{ fontWeight:700 }}>{(current.totals.per_day[d]||0).toFixed(2)}h</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lines table */}
            <div>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo task','By task')}</div>
              <div style={{ overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                      <th style={{ textAlign:'left', padding:8 }}>{t('Task','Task')}</th>
                      {fns.weekRange!(current.week_start).map(d => <th key={d} style={{ textAlign:'center', padding:8 }}>{d.slice(5)}</th>)}
                      <th style={{ textAlign:'center', padding:8 }}>{t('Tổng','Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.lines.map((ln, idx) => (
                      <tr key={idx} style={{ borderTop:'1px solid #f1f5f9' }}>
                        <td style={{ padding:8 }}>
                          <div style={{ fontWeight:700 }}>{ln.task_code} — {ln.task_name}</div>
                          <div style={{ color:'#6b7280', fontSize:12 }}>{ln.project || '—'}</div>
                        </td>
                        {fns.weekRange!(current.week_start).map(d => <td key={d} style={{ textAlign:'center', padding:8 }}>{(ln.day_hours[d]||0).toFixed(2)}</td>)}
                        <td style={{ textAlign:'center', fontWeight:700 }}>{ln.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {current.lines.length===0 && <tr><td colSpan={9} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            {current.status==='pending' ? (
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={async ()=>{ const r = prompt(t('Lý do từ chối:','Rejection reason:')); if (!r) return; await fns.rejectTs([current.id], r); await load(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Từ chối','Reject')}</button>
                <button onClick={async ()=>{ await fns.approveTs([current.id]); await load(); }} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Duyệt','Approve')}</button>
              </div>
            ) : (
              <div style={{ color:'#6b7280', fontSize:12 }}>
                {t('Hành động cuối cùng bởi','Last action by')}: <b>{current.last_action_by || '—'}</b> — {current.last_action_at ? new Date(current.last_action_at).toLocaleString() : '—'}
                <div>{t('Ghi chú','Comment')}: {current.comment || '—'}</div>
                <div style={{ marginTop:6, color:'#16a34a' }}>{t('Lưu ý: Đã duyệt thì timesheet bị khoá (theo catalog).','Note: Approved timesheets are locked (per catalog).')}</div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
