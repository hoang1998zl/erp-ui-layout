
// src/components/fin/ExpenseApproval.tsx — FIN-10 Expense_Approval
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listValues } from '../../mock/dimensions';
import { seedUsersIfEmpty, listEmployees, currentUser } from '../../mock/users';
import { listDrafts, listForApproval, amountGross, approveExpense, rejectExpense, bulkApprove, bulkReject, seedExpenseApprovalData, type ExpenseDraft } from '../../mock/expense';

type Tab = 'pending'|'approved'|'rejected'|'all';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const ExpenseApproval: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // Seeds
  useEffect(()=>{ seedIfEmpty(); seedUsersIfEmpty(); seedExpenseApprovalData(); }, []);

  const me = useMemo(()=> currentUser(), []);
  const employees = useMemo(()=> listEmployees(), []);
  const projects = useMemo(()=> listValues('PROJECT'), []);

  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<ExpenseDraft[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState('');
  const [emp, setEmp] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [drawerId, setDrawerId] = useState<string>('');
  const [decisionComment, setDecisionComment] = useState<string>('');

  const reload = () => {
    const all = listDrafts();
    setRows(all);
    setSelected({});
  };
  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(()=> {
    const s = q.toLowerCase();
    return rows
      .filter(r => tab==='all' ? true : tab==='pending' ? r.status==='submitted' : (r.status===tab))
      .filter(r => !emp || r.employee_code===emp)
      .filter(r => !project || r.project_code===project || (r.lines||[]).some(l => (l.project_code||'')===project))
      .filter(r => !from || new Date(r.date) >= new Date(from+'T00:00:00'))
      .filter(r => !to || new Date(r.date) <= new Date(to+'T23:59:59'))
      .filter(r => (r.title||'').toLowerCase().includes(s) || (r.employee_code||'').toLowerCase().includes(s) || (r.dept_code||'').toLowerCase().includes(s));
  }, [rows, tab, emp, project, from, to, q]);

  const counts = useMemo(()=> ({
    pending: rows.filter(r => r.status==='submitted').length,
    approved: rows.filter(r => r.status==='approved').length,
    rejected: rows.filter(r => r.status==='rejected').length,
    all: rows.length,
  }), [rows]);

  const anySelected = Object.values(selected).some(v => v);
  const selectedIds = Object.entries(selected).filter(([,v])=>v).map(([k])=>k);

  const toggleAll = (check: boolean) => {
    const next: any = {};
    filtered.forEach(r => next[r.id] = check);
    setSelected(next);
  };

  const exportCSV = () => {
    const header = 'date,title,employee,dept,project,currency,amount,status';
    const rows = filtered.map(r => [new Date(r.date).toISOString().slice(0,10), (r.title||'').replace(/,/g,' '), r.employee_code, r.dept_code||'', r.project_code||'', r.currency, String(amountGross(r)||0), r.status].join(','));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='expense_approval.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const doBulkApprove = () => {
    if (!selectedIds.length) return;
    const res = bulkApprove(selectedIds, me.code, decisionComment||undefined);
    alert(t('Đã duyệt','Approved')+`: ${res.ok}` + (res.fail? t('; lỗi','; failed')+`: ${res.fail}` : ''));
    setDecisionComment('');
    reload();
  };
  const doBulkReject = () => {
    if (!selectedIds.length) return;
    const res = bulkReject(selectedIds, me.code, decisionComment||undefined);
    alert(t('Đã từ chối','Rejected')+`: ${res.ok}` + (res.fail? t('; lỗi','; failed')+`: ${res.fail}` : ''));
    setDecisionComment('');
    reload();
  };

  const approveOne = (id: string) => { const r = approveExpense(id, me.code, decisionComment||undefined); if (!r.ok) alert(r.msg); reload(); };
  const rejectOne = (id: string) => { const r = rejectExpense(id, me.code, decisionComment||undefined); if (!r.ok) alert(r.msg); reload(); };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Duyệt chi phí','Expense approvals')}</div>
          <Badge text="FIN-10" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Pending → Approved/Rejected; post GL sau','Pending → Approved/Rejected; post GL later')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <a href="#" onClick={(e)=>{ e.preventDefault(); alert(t('Mở FIN‑09 (mock) để xem danh sách','Open FIN‑09 (mock) list')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', textDecoration:'none' }}>{t('Danh sách','List')}</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {(['pending','approved','rejected','all'] as Tab[]).map(s => (
          <button key={s} onClick={()=> setTab(s)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: tab===s ? '#eef2ff' : '#fff' }}>
            <b style={{ textTransform:'capitalize' }}>{s}</b> <span style={{ color:'#6b7280' }}>({(counts as any)[s]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:8, alignItems:'end' }}>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Nhân viên','Employee')}</div>
          <select value={emp} onChange={e=> setEmp(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="">{t('Tất cả','All')}</option>
            {employees.map(u => <option key={u.code} value={u.code}>{u.code} — {u.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>Project</div>
          <select value={project} onChange={e=> setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="">{t('Tất cả','All')}</option>
            {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Từ ngày','From')}</div>
          <input type="date" value={from} onChange={e=> setFrom(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Đến ngày','To')}</div>
          <input type="date" value={to} onChange={e=> setTo(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tìm','Search')}</div>
          <input value={q} onChange={e=> setQ(e.target.value)} placeholder={t('Tiêu đề/Phòng ban/Mã NV','Title/Dept/Emp')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
      </div>

      {/* Table + Actions */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:6 }}>
        {/* Bulk bar */}
        {anySelected && (
          <div style={{ border:'1px dashed #94a3b8', borderRadius:8, padding:'8px 10px', margin:'6px 6px 10px 6px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>{t('Đã chọn','Selected')}: {selectedIds.length}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input value={decisionComment} onChange={e=> setDecisionComment(e.target.value)} placeholder={t('Ghi chú quyết định (tuỳ chọn)','Decision comment (optional)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:260 }} />
              <button onClick={doBulkApprove} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'6px 10px' }}>{t('Duyệt','Approve')}</button>
              <button onClick={doBulkReject} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'6px 10px' }}>{t('Từ chối','Reject')}</button>
              <button onClick={()=> setSelected({})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Bỏ chọn','Clear')}</button>
            </div>
          </div>
        )}
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}><input type="checkbox" onChange={e=> toggleAll((e.target as HTMLInputElement).checked)} /></th>
              <th style={{ padding:'6px' }}>Date</th>
              <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
              <th style={{ padding:'6px' }}>{t('Nhân viên','Employee')}</th>
              <th style={{ padding:'6px' }}>Project</th>
              <th style={{ padding:'6px' }}>{t('Tiền tệ','Cur')}</th>
              <th style={{ padding:'6px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
              <th style={{ padding:'6px' }}>{t('TT','Status')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px' }}><input type="checkbox" checked={!!selected[r.id]} onChange={e=> setSelected({ ...selected, [r.id]: (e.target as HTMLInputElement).checked })} /></td>
                <td style={{ padding:'6px' }}>{new Date(r.date).toISOString().slice(0,10)}</td>
                <td style={{ padding:'6px' }}>{r.title||'—'}</td>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{r.employee_code}</td>
                <td style={{ padding:'6px' }}>{r.project_code||'—'}</td>
                <td style={{ padding:'6px' }}>{r.currency}</td>
                <td style={{ padding:'6px', textAlign:'right' }}>{amountGross(r).toLocaleString()}</td>
                <td style={{ padding:'6px' }}>
                  {r.status==='submitted' && <Badge text="pending" tone="amber" />}
                  {r.status==='approved' && <Badge text="approved" tone="green" />}
                  {r.status==='rejected' && <Badge text="rejected" tone="red" />}
                </td>
                <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                  {r.status==='submitted' && (
                    <>
                      <button onClick={()=> approveOne(r.id)} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'4px 8px' }}>{t('Duyệt','Approve')}</button>
                      <button onClick={()=> rejectOne(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Từ chối','Reject')}</button>
                    </>
                  )}
                  <button onClick={()=> setDrawerId(r.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff', marginLeft:6 }}>{t('Xem','View')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ color:'#6b7280', padding:'8px' }}>— {t('Không có dữ liệu','No data')} —</div>}
      </div>

      {/* Drawer detail */}
      {drawerId && (() => {
        const r = rows.find(x => x.id===drawerId);
        if (!r) return null;
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(900px, 96vw)' }} onClick={()=> setDrawerId('')}>
            <div />
            <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
              <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{t('Phiếu chi phí','Expense')}</div>
                  {r.status==='submitted' && <Badge text="pending" tone="amber" />}
                  {r.status==='approved' && <Badge text="approved" tone="green" />}
                  {r.status==='rejected' && <Badge text="rejected" tone="red" />}
                </div>
                <button onClick={()=> setDrawerId('')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
              </div>
              <div style={{ overflow:'auto', padding:10, display:'grid', gap:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Ngày','Date')}</div><div>{new Date(r.date).toISOString().slice(0,10)}</div></div>
                  <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Nhân viên','Employee')}</div><div>{r.employee_code}</div></div>
                  <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Dự án','Project')}</div><div>{r.project_code||'—'}</div></div>
                </div>
                <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Tiêu đề','Title')}</div><div style={{ fontWeight:700 }}>{r.title||'—'}</div></div>
                <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                      <th style={{ padding:'6px' }}>{t('Nhóm','Cat')}</th>
                      <th style={{ padding:'6px' }}>{t('Mô tả','Desc')}</th>
                      <th style={{ padding:'6px' }}>Project</th>
                      <th style={{ padding:'6px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
                      <th style={{ padding:'6px' }}>{t('Thuế %','Tax%')}</th>
                      <th style={{ padding:'6px' }}>{t('Hóa đơn','Receipt')}</th>
                    </tr></thead>
                    <tbody>
                      {(r.lines||[]).map((l:any) => (
                        <tr key={l.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'6px' }}>{l.category}</td>
                          <td style={{ padding:'6px' }}>{l.description||''}</td>
                          <td style={{ padding:'6px' }}>{l.project_code||'—'}</td>
                          <td style={{ padding:'6px', textAlign:'right' }}>{(Number(l.amount)||0).toLocaleString()}</td>
                          <td style={{ padding:'6px' }}>{l.tax_rate||0}</td>
                          <td style={{ padding:'6px' }}>{l.receipt_image ? <img src={l.receipt_image} style={{ width:60, height:60, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' }} /> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:16 }}>
                  <div style={{ color:'#6b7280' }}>{t('Tổng','Total')}: <b>{amountGross(r).toLocaleString()} {r.currency}</b></div>
                </div>
                <div style={{ display:'grid', gap:6 }}>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ghi chú quyết định','Decision comment')}</div>
                  <textarea value={decisionComment} onChange={e=> setDecisionComment(e.target.value)} placeholder={t('Nhập ghi chú (tuỳ chọn)...','Enter comment (optional)...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minHeight:80 }} />
                </div>
              </div>
              <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'space-between' }}>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Sau khi duyệt: sẽ hạch toán GL ở bước sau (posting).','After approval: GL posting will be done later.')}</div>
                <div style={{ display:'flex', gap:8 }}>
                  {r.status==='submitted' && (
                    <>
                      <button onClick={()=> approveOne(r.id)} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'6px 10px' }}>{t('Duyệt','Approve')}</button>
                      <button onClick={()=> rejectOne(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'6px 10px' }}>{t('Từ chối','Reject')}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
