// src/components/hr/ESSLeaveRequest.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listLeaveTypes, listVN_Holidays, getBalances, createLeaveRequest, listMyRequests, businessDays,
  type LeaveType, type LeaveBalance, type Holiday
} from '../../mock/leave';

export type ESSLeaveRequestProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listLeaveTypes: typeof listLeaveTypes;
    listVN_Holidays: typeof listVN_Holidays;
    getBalances: typeof getBalances;
    createLeaveRequest: typeof createLeaveRequest;
    listMyRequests: typeof listMyRequests;
    businessDays: typeof businessDays;
  }>;
};

const todayISO = () => new Date().toISOString().slice(0,10);

export const ESSLeaveRequest: React.FC<ESSLeaveRequestProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listLeaveTypes: adapters.listLeaveTypes || listLeaveTypes,
    listVN_Holidays: adapters.listVN_Holidays || listVN_Holidays,
    getBalances: adapters.getBalances || getBalances,
    createLeaveRequest: adapters.createLeaveRequest || createLeaveRequest,
    listMyRequests: adapters.listMyRequests || listMyRequests,
    businessDays: adapters.businessDays || businessDays,
  };

  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Form state
  const [type, setType] = useState('AL');
  const [start, setStart] = useState(todayISO());
  const [startPortion, setStartPortion] = useState<'full'|'am'|'pm'>('full');
  const [end, setEnd] = useState(todayISO());
  const [endPortion, setEndPortion] = useState<'full'|'am'|'pm'>('full');
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState('');
  const [backup, setBackup] = useState('');
  const [files, setFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const year = useMemo(() => new Date(start).getFullYear(), [start]);
  const currentBal = useMemo(() => balances.find(b => b.code===type), [balances, type]);
  const entitled = (currentBal?.entitled || 0) + (currentBal?.carried || 0);
  const remaining = Math.max(0, entitled - (currentBal?.used || 0));

  const days = useMemo(() => fns.businessDays!(start, end, startPortion, endPortion, holidays), [start, end, startPortion, endPortion, holidays]);

  useEffect(() => {
    (async () => {
      const [ts, hol] = await Promise.all([fns.listLeaveTypes!(), fns.listVN_Holidays!(year)]);
      setTypes(ts); setHolidays(hol);
      const bal = await fns.getBalances!(year);
      setBalances(bal);
    })();
  }, [year]);

  const valid = useMemo(() => {
    const s = new Date(start), e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    if (s > e) return false;
    if (days <= 0) return false;
    return true;
  }, [start, end, days]);

  const onUpload = (filesList: FileList | null) => {
    if (!filesList) return;
    const arr = Array.from(filesList).map(f => ({ name: f.name, size: f.size }));
    setFiles(prev => [...prev, ...arr].slice(0, 5)); // cap 5 files
    (document.getElementById('lr_files') as HTMLInputElement | null)?.blur();
  };

  const reset = () => {
    setType('AL'); setStart(todayISO()); setStartPortion('full'); setEnd(todayISO()); setEndPortion('full');
    setReason(''); setContact(''); setBackup(''); setFiles([]); setErr(null);
  };

  const onSubmit = async () => {
    if (!valid) { setErr(t('Dữ liệu chưa hợp lệ','Form invalid')); return; }
    setSubmitting(true);
    const req = await fns.createLeaveRequest!({
      type, start, start_portion: startPortion, end, end_portion: endPortion, days,
      reason: reason || undefined, contact: contact || undefined, backup_person: backup || undefined,
      attachments: files,
    } as any);
    setSubmitting(false);
    setToast(t('Đã gửi đơn nghỉ: ','Submitted: ') + req.id);
    reset();
    // refresh balances for the year
    const bal = await fns.getBalances!(year);
    setBalances(bal);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:12, padding:12 }}>
      {/* Left: form */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Đăng ký nghỉ phép','Submit leave request')}</div>
        <div style={{ padding:12, display:'grid', gap:12 }}>
          {/* Type & dates */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Loại nghỉ','Leave type')}</div>
              <select value={type} onChange={e=>setType(e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                {types.map(tp => <option key={tp.code} value={tp.code}>{locale==='vi'?tp.name_vi:tp.name_en}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Số ngày theo lịch làm việc','Working days')}</div>
              <div style={{ fontWeight:800 }}>{days.toFixed(2)} {t('ngày','days')}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tự động trừ cuối tuần & ngày lễ VN (demo).','Weekends & VN holidays excluded (demo).')}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Từ ngày','From')}</div>
              <input type="date" value={start} onChange={e=>setStart(e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Phần ngày','Portion')}</div>
              <select value={startPortion} onChange={e=>setStartPortion(e.target.value as any)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                <option value="full">{t('Cả ngày','Full day')}</option>
                <option value="am">{t('Buổi sáng','Morning')}</option>
                <option value="pm">{t('Buổi chiều','Afternoon')}</option>
              </select>
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đến ngày','To')}</div>
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Phần ngày','Portion')}</div>
              <select value={endPortion} onChange={e=>setEndPortion(e.target.value as any)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                <option value="full">{t('Cả ngày','Full day')}</option>
                <option value="am">{t('Buổi sáng','Morning')}</option>
                <option value="pm">{t('Buổi chiều','Afternoon')}</option>
              </select>
            </div>
          </div>

          {/* Reason and contact */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lý do','Reason')}</div>
              <textarea rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder={t('Ví dụ: Nghỉ phép năm, việc gia đình...','E.g., annual leave, personal matters...')} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Liên hệ khi cần','Contact while away')}</div>
              <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Phone/Email" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', marginBottom:8 }} />
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Người thay thế/backup','Backup person')}</div>
              <input value={backup} onChange={e=>setBackup(e.target.value)} placeholder="Name/Email" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div style={{ color:'#6b7280', fontSize:12, marginBottom:4 }}>{t('Tài liệu đính kèm (tuỳ chọn)','Attachments (optional)')}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
                {t('Chọn file','Choose files')}<input id="lr_files" type="file" multiple onChange={e=>{ onUpload(e.target.files); (e.currentTarget as HTMLInputElement).value=''; }} style={{ display:'none' }} />
              </label>
              {files.map((f,i) => (
                <span key={i} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 8px', background:'#fff' }}>
                  {f.name} ({Math.ceil(f.size/1024)} KB) <button onClick={()=>setFiles(files.filter((_,idx)=>idx!==i))} style={{ border:'none', background:'transparent', color:'#ef4444', cursor:'pointer' }}>✕</button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color: days > remaining && type!=='UP' ? '#ef4444' : '#6b7280', fontSize:12 }}>
              {t('Số ngày còn lại','Remaining days')}: <b>{remaining.toFixed(2)}</b> — {t('Sẽ trừ','Will use')}: <b>{days.toFixed(2)}</b>
              {days > remaining && type!=='UP' && <span> — {t('Không đủ quỹ (vẫn có thể gửi, sẽ kiểm tra chính sách sau).','Insufficient balance (can submit, policy checks later).')}</span>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={reset} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Nhập lại','Reset')}</button>
              <button onClick={onSubmit} disabled={!valid || submitting} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', opacity: (!valid||submitting)?0.7:1 }}>{t('Gửi đăng ký','Submit')}</button>
            </div>
          </div>

          {err && <div style={{ color:'#ef4444', fontSize:12 }}>{err}</div>}
        </div>
      </section>

      {/* Right: balances & recent requests */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Tổng quan','Overview')}</div>
        <div style={{ padding:12, display:'grid', gap:12 }}>
          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Quỹ nghỉ năm','Leave balances')}</div>
            <div style={{ display:'grid', gap:6 }}>
              {balances.map(b => {
                const ent = b.entitled + b.carried; const rem = Math.max(0, ent - b.used);
                const tp = types.find(t => t.code===b.code);
                return (
                  <div key={b.code} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, alignItems:'center' }}>
                    <div style={{ fontWeight:600 }}>{tp ? (locale==='vi'?tp.name_vi:tp.name_en) : b.code}</div>
                    <div style={{ border:'1px solid #e5e7eb', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ display:'grid', gridTemplateColumns:`${Math.min(100,(b.used/ent*100))}% auto`, height:10 }}>
                        <div style={{ background:'#fca5a5' }} />
                        <div style={{ background:'#dcfce7' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'2px 8px', color:'#6b7280' }}>
                        <span>{t('Đã dùng','Used')}: {b.used.toFixed(2)}/{ent.toFixed(2)}</span>
                        <span>{t('Còn lại','Rem')}: {rem.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Đơn gần đây','Recent requests')}</div>
            <RecentRequests listMyRequests={fns.listMyRequests!} />
          </div>
        </div>
      </aside>

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

const RecentRequests: React.FC<{ listMyRequests: typeof listMyRequests }> = ({ listMyRequests }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(5);
  const load = async () => {
    const res = await listMyRequests(limit, offset);
    setRows(res.rows); setTotal(res.total);
  };
  useEffect(()=>{ load(); }, [offset, limit]);

  const totalPages = Math.max(1, Math.ceil(total/limit));
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            <th style={{ textAlign:'left', padding:8, width:120 }}>ID</th>
            <th style={{ textAlign:'left', padding:8, width:80 }}>Type</th>
            <th style={{ textAlign:'left', padding:8, width:200 }}>Period</th>
            <th style={{ textAlign:'left', padding:8, width:80 }}>Days</th>
            <th style={{ textAlign:'left', padding:8, width:120 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length===0 && <tr><td colSpan={5} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
              <td style={{ padding:8, fontFamily:'monospace' }}>{r.id}</td>
              <td style={{ padding:8 }}>{r.type}</td>
              <td style={{ padding:8 }}>{r.start} {r.start_portion!=='full'?`(${r.start_portion})`:''} → {r.end} {r.end_portion!=='full'?`(${r.end_portion})`:''}</td>
              <td style={{ padding:8 }}>{r.days.toFixed(2)}</td>
              <td style={{ padding:8, textTransform:'capitalize' }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 8px', borderTop:'1px solid #e5e7eb', color:'#6b7280' }}>
        <div>Page {Math.floor(offset/limit)+1}/{totalPages}</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setOffset(o=>Math.max(0, o - limit))} disabled={offset===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff', opacity: offset===0?0.5:1 }}>Prev</button>
          <button onClick={()=>setOffset(o=>Math.min((totalPages-1)*limit, o + limit))} disabled={offset + limit >= total} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff', opacity: offset+limit>=total?0.5:1 }}>Next</button>
        </div>
      </div>
    </div>
  );
};
