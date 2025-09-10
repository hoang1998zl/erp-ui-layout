// src/components/hr/LeaveApprovalsInbox.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listApprovals, approve, reject, exportCSV, type LeaveApproval, type Query } from '../../mock/approvals';

export type LeaveApprovalsInboxProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listApprovals: typeof listApprovals;
    approve: typeof approve;
    reject: typeof reject;
    exportCSV: typeof exportCSV;
  }>;
};

export const LeaveApprovalsInbox: React.FC<LeaveApprovalsInboxProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listApprovals: adapters.listApprovals || listApprovals,
    approve: adapters.approve || approve,
    reject: adapters.reject || reject,
    exportCSV: adapters.exportCSV || exportCSV,
  };

  // Filters
  const today = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0,10);
  const [from, setFrom] = useState(toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)));
  const [to, setTo] = useState(toISODate(today));
  const [employee, setEmployee] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|''>('pending');
  const [sort, setSort] = useState<'submitted_desc'|'submitted_asc'>('submitted_desc');

  const [rows, setRows] = useState<LeaveApproval[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(15);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [current, setCurrent] = useState<LeaveApproval | null>(null);

  const totalPages = Math.max(1, Math.ceil(total/limit));

  const buildQuery = (): Query => ({ from, to, employee: employee || undefined, type: type || undefined, status: status || undefined, sort, limit, offset });

  const load = async () => {
    setLoading(true);
    const q = buildQuery();
    const res = await fns.listApprovals(q);
    setRows(res.rows); setTotal(res.total);
    // keep selected only those still visible
    setSelected(sel => sel.filter(id => res.rows.some(r => r.id===id)));
    if (!current && res.rows.length>0) setCurrent(res.rows[0]);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [from, to, employee, type, status, sort, limit, offset]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? rows.filter(r => r.status==='pending').map(r => r.id) : []);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected(sel => checked ? Array.from(new Set([...sel, id])) : sel.filter(x => x !== id));
  };

  const bulkApprove = async () => {
    if (selected.length===0) return;
    const comment = prompt(t('Ghi chú phê duyệt (tuỳ chọn):','Approval note (optional):') ) || undefined;
    await fns.approve(selected, comment);
    setSelected([]);
    await load();
  };
  const bulkReject = async () => {
    if (selected.length===0) return;
    const reason = prompt(t('Lý do từ chối:','Rejection reason:')); if (!reason) return;
    await fns.reject(selected, reason);
    setSelected([]);
    await load();
  };

  const quickApproveOne = async (id: string) => { await fns.approve([id]); await load(); };
  const quickRejectOne = async (id: string) => { const r = prompt(t('Lý do từ chối:','Rejection reason:')); if (!r) return; await fns.reject([id], r); await load(); };

  const onExport = async () => {
    const blob = await fns.exportCSV(buildQuery());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='leave_approvals.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:12, padding:12 }}>
      {/* Left: list & filters */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Hộp thư phê duyệt nghỉ','Leave approvals inbox')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Từ ngày','From')}</label>
              <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Đến ngày','To')}</label>
              <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Nhân viên','Employee')}</label>
              <input value={employee} onChange={e=>{ setEmployee(e.target.value); setOffset(0); }} placeholder="name/email" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Loại nghỉ','Type')}</label>
              <select value={type} onChange={e=>{ setType(e.target.value); setOffset(0); }} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="">{t('— Tất cả —','— All —')}</option>
                <option value="AL">Annual</option>
                <option value="SL">Sick</option>
                <option value="UP">Unpaid</option>
                <option value="WFH">WFH</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'end' }}>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Trạng thái','Status')}</label>
              <select value={status} onChange={e=>{ setStatus(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="">{t('— Tất cả —','— All —')}</option>
                <option value="pending">{t('Chờ duyệt','Pending')}</option>
                <option value="approved">{t('Đã duyệt','Approved')}</option>
                <option value="rejected">{t('Từ chối','Rejected')}</option>
              </select>
            </div>
            <div>
              <label style={{ color:'#6b7280', fontSize:12 }}>{t('Sắp xếp','Sort')}</label>
              <select value={sort} onChange={e=>{ setSort(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="submitted_desc">{t('Mới nhất','Newest')}</option>
                <option value="submitted_asc">{t('Cũ nhất','Oldest')}</option>
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
                <th style={{ textAlign:'left', padding:8, width:120 }}>ID</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Nhân viên','Employee')}</th>
                <th style={{ textAlign:'left', padding:8, width:90 }}>{t('Loại','Type')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Khoảng','Period')}</th>
                <th style={{ textAlign:'left', padding:8, width:70 }}>{t('Ngày','Days')}</th>
                <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Gửi lúc','Submitted')}</th>
                <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Trạng thái','Status')}</th>
                <th style={{ textAlign:'left', padding:8, width:200 }}>{t('Hành động','Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ padding:12, color:'#6b7280' }}>{t('Đang tải...','Loading...')}</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan={9} style={{ padding:12, color:'#6b7280' }}>{t('Không có dữ liệu','No data')}</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9', background: current?.id===r.id ? '#f8fafc' : '#fff' }} onClick={()=>setCurrent(r)}>
                  <td style={{ padding:8 }}>
                    <input type="checkbox" disabled={r.status!=='pending'} checked={selected.includes(r.id)} onChange={e=>{ e.stopPropagation(); toggleOne(r.id, e.target.checked); }} />
                  </td>
                  <td style={{ padding:8, fontFamily:'monospace' }}>{r.request_id}</td>
                  <td style={{ padding:8 }}>
                    <div style={{ fontWeight:700 }}>{r.employee_name}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{r.employee_email}</div>
                  </td>
                  <td style={{ padding:8 }}>{r.type}</td>
                  <td style={{ padding:8 }}>{r.start} {r.start_portion!=='full'?`(${r.start_portion})`:''} → {r.end} {r.end_portion!=='full'?`(${r.end_portion})`:''}</td>
                  <td style={{ padding:8 }}>{r.days.toFixed(2)}</td>
                  <td style={{ padding:8 }}>{new Date(r.submitted_at).toLocaleString()}</td>
                  <td style={{ padding:8, textTransform:'capitalize' }}>
                    {r.status==='pending' && <span style={{ color:'#f59e0b' }}>● {t('Chờ duyệt','Pending')}</span>}
                    {r.status==='approved' && <span style={{ color:'#16a34a' }}>● {t('Đã duyệt','Approved')}</span>}
                    {r.status==='rejected' && <span style={{ color:'#ef4444' }}>● {t('Từ chối','Rejected')}</span>}
                  </td>
                  <td style={{ padding:8 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setCurrent(r)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xem','View')}</button>
                      {r.status==='pending' && <button onClick={()=>quickApproveOne(r.id)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'4px 8px' }}>{t('Duyệt','Approve')}</button>}
                      {r.status==='pending' && <button onClick={()=>quickRejectOne(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Từ chối','Reject')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
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
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Chi tiết đơn','Request details')}</div>
        {!current && <div style={{ padding:12, color:'#6b7280' }}>{t('Chọn một đơn để xem chi tiết','Select a request')}</div>}
        {current && (
          <div style={{ padding:12, display:'grid', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8 }}>
              <div style={{ color:'#6b7280' }}>ID</div><div style={{ fontFamily:'monospace' }}>{current.request_id}</div>
              <div style={{ color:'#6b7280' }}>{t('Nhân viên','Employee')}</div><div><b>{current.employee_name}</b><div style={{ color:'#6b7280', fontSize:12 }}>{current.employee_email}</div></div>
              <div style={{ color:'#6b7280' }}>{t('Phòng ban','Department')}</div><div>{current.department || '—'}</div>
              <div style={{ color:'#6b7280' }}>{t('Loại','Type')}</div><div>{current.type}</div>
              <div style={{ color:'#6b7280' }}>{t('Khoảng','Period')}</div><div>{current.start} {current.start_portion!=='full'?`(${current.start_portion})`:''} → {current.end} {current.end_portion!=='full'?`(${current.end_portion})`:''}</div>
              <div style={{ color:'#6b7280' }}>{t('Số ngày','Days')}</div><div>{current.days.toFixed(2)}</div>
              <div style={{ color:'#6b7280' }}>{t('Gửi lúc','Submitted')}</div><div>{new Date(current.submitted_at).toLocaleString()}</div>
              <div style={{ color:'#6b7280' }}>{t('Trạng thái','Status')}</div>
              <div style={{ textTransform:'capitalize' }}>
                {current.status==='pending' && <span style={{ color:'#f59e0b' }}>● {t('Chờ duyệt','Pending')}</span>}
                {current.status==='approved' && <span style={{ color:'#16a34a' }}>● {t('Đã duyệt','Approved')}</span>}
                {current.status==='rejected' && <span style={{ color:'#ef4444' }}>● {t('Từ chối','Rejected')}</span>}
              </div>
              <div style={{ color:'#6b7280' }}>{t('Ghi chú','Comment')}</div><div>{current.comment || '—'}</div>
            </div>

            {current.status==='pending' && (
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                <button onClick={()=>quickRejectOne(current.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Từ chối','Reject')}</button>
                <button onClick={()=>quickApproveOne(current.id)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Duyệt','Approve')}</button>
              </div>
            )}

            {current.status!=='pending' && (
              <div style={{ color:'#6b7280', fontSize:12 }}>
                {t('Hành động cuối cùng bởi','Last action by')}: <b>{current.last_action_by || '—'}</b> — {current.last_action_at ? new Date(current.last_action_at).toLocaleString() : '—'}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
