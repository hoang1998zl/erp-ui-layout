// src/components/hr/DelegationRulesEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listUsers, listRules, getRule, upsertRule, deleteRule, exportCSV, getHolidays, resolveDelegate,
  ruleStatus, type DelegationRule, type Query, type User
} from '../../mock/delegations';

export type DelegationRulesEditorProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listUsers: typeof listUsers;
    listRules: typeof listRules;
    getRule: typeof getRule;
    upsertRule: typeof upsertRule;
    deleteRule: typeof deleteRule;
    exportCSV: typeof exportCSV;
    getHolidays: typeof getHolidays;
    resolveDelegate: typeof resolveDelegate;
    ruleStatus: typeof ruleStatus;
  }>;
};

type ModuleKey = 'leave'|'timesheet'|'expense'|'purchase'|'general';

const moduleLabels: Record<ModuleKey, { vi: string, en: string }> = {
  leave: { vi:'Nghỉ phép', en:'Leave' },
  timesheet: { vi:'Timesheet', en:'Timesheet' },
  expense: { vi:'Chi phí', en:'Expense' },
  purchase: { vi:'Mua hàng', en:'Purchase' },
  general: { vi:'Tất cả', en:'All' },
};

export const DelegationRulesEditor: React.FC<DelegationRulesEditorProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listUsers: adapters.listUsers || listUsers,
    listRules: adapters.listRules || listRules,
    getRule: adapters.getRule || getRule,
    upsertRule: adapters.upsertRule || upsertRule,
    deleteRule: adapters.deleteRule || deleteRule,
    exportCSV: adapters.exportCSV || exportCSV,
    getHolidays: adapters.getHolidays || getHolidays,
    resolveDelegate: adapters.resolveDelegate || resolveDelegate,
    ruleStatus: adapters.ruleStatus || ruleStatus,
  };

  // Filters
  const [owner, setOwner] = useState('');      // search text
  const [delegate, setDelegate] = useState('');
  const [status, setStatus] = useState<'active'|'upcoming'|'expired'|''>('');
  const [moduleFilter, setModuleFilter] = useState<ModuleKey|''>('');
  const [rows, setRows] = useState<DelegationRule[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(15);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<Query['sort']>('start_desc');
  const totalPages = Math.max(1, Math.ceil(total/limit));

  const [current, setCurrent] = useState<DelegationRule | null>(null);
  const [holidays, setHolidays] = useState<Array<{date:string;name:string}>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const query = (): Query => ({ owner: owner || undefined, delegate: delegate || undefined, status: status || undefined, module: moduleFilter || undefined, limit, offset, sort });

  const load = async () => {
    const res = await fns.listRules(query());
    setRows(res.rows); setTotal(res.total);
    if (!current && res.rows.length>0) setCurrent(res.rows[0]);
  };
  useEffect(()=>{ load(); }, [owner, delegate, status, moduleFilter, limit, offset, sort]);
  useEffect(()=>{ fns.getHolidays!().then(setHolidays); }, []);

  // Helpers
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const findUser = (id?:string) => id ? userCache[id] : undefined;
  useEffect(()=>{
    // Build minimal cache from shown rows
    (async () => {
      const needs = Array.from(new Set(rows.flatMap(r => [r.owner_id, r.delegate_id]).filter(Boolean) as string[]));
      if (needs.length===0) return;
      const all = await fns.listUsers!({}); // in demo, small
      const map: Record<string, User> = {};
      all.forEach(u => map[u.id]=u);
      setUserCache(map);
    })();
  }, [rows]);

  const statusBadge = (r: DelegationRule) => {
    const st = fns.ruleStatus!(r);
    const style = st==='active' ? { color:'#16a34a' } : st==='upcoming' ? { color:'#f59e0b' } : { color:'#6b7280' };
    return <span style={style}>● {t(st==='active'?'Hiệu lực':st==='upcoming'?'Sắp tới':'Hết hạn', st)}</span>
  };

  const onExport = async () => {
    const blob = await fns.exportCSV(query());
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='delegations.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const newRule = () => {
    const today = new Date().toISOString().slice(0,10);
    setCurrent({
      id: '' as any,
      owner_id: '', delegate_id: '',
      scope: { modules: ['general'] },
      start_date: today, end_date: today,
      include_weekends: false, exclude_company_holidays: true,
      only_when_ooo: false,
      comment: '',
      created_at: '', updated_at: '',
      created_by: '', updated_by: ''
    });
  };

  const saveRule = async () => {
    if (!current) return;
    try {
      if (!current.owner_id || !current.delegate_id) throw new Error(t('Chọn người uỷ quyền và người nhận','Pick owner and delegate'));
      if (current.end_date < current.start_date) throw new Error(t('Khoảng ngày không hợp lệ','Invalid date range'));
      const payload = { ...current }; delete (payload as any).created_at; delete (payload as any).updated_at; delete (payload as any).created_by; delete (payload as any).updated_by;
      const saved = await fns.upsertRule(payload as any);
      setToast(t('Đã lưu quy tắc','Rule saved'));
      await load();
      // set current to freshly saved
      const refetched = await fns.getRule(saved.id);
      setCurrent(refetched);
    } catch(e:any){
      setErr(e.message || String(e));
      setTimeout(()=>setErr(null), 3500);
    }
  };

  const delRule = async () => {
    if (!current?.id) return;
    if (!confirm(t('Xoá quy tắc này?','Delete this rule?'))) return;
    await fns.deleteRule(current.id);
    setCurrent(null);
    await load();
  };

  const pickUser = async (setter: (id: string)=>void) => {
    const s = prompt(t('Nhập từ khoá để tìm người (tên/email)','Enter keyword to search users (name/email)')) || '';
    const res = await fns.listUsers!({ search: s, active_only: true });
    if (res.length===0) { alert(t('Không tìm thấy','No results')); return; }
    const options = res.slice(0,10).map((u,i)=> `${i+1}. ${u.name} <${u.email}>`).join('\n');
    const ix = prompt(options+'\n'+t('Chọn số thứ tự','Pick a number')) || '';
    const n = parseInt(ix,10); if (!n || n<1 || n>res.length) return;
    setter(res[n-1].id);
  };

  const toggleModule = (key: ModuleKey) => {
    if (!current) return;
    const set = new Set(current.scope.modules);
    if (set.has(key)) set.delete(key); else set.add(key);
    if (key==='general' && !set.has('general')) {
      // ok
    }
    // if selected 'general', it supersedes others
    const modules = set.has('general') ? ['general'] : Array.from(set);
    setCurrent({ ...current, scope: { ...current.scope, modules } });
  };

  // What-if
  const [whatOwner, setWhatOwner] = useState('');
  const [whatDate, setWhatDate] = useState(new Date().toISOString().slice(0,10));
  const [whatModule, setWhatModule] = useState<ModuleKey>('general');
  const [whatResult, setWhatResult] = useState<{ to: string|null; reason: string } | null>(null);
  const runWhatIf = async () => {
    if (!whatOwner) return;
    const res = await fns.resolveDelegate!(whatOwner, whatDate, whatModule);
    setWhatResult(res);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 520px', gap:12, padding:12 }}>
      {/* Left: list */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Quy tắc uỷ quyền phê duyệt','Approval Delegation Rules')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
            <button onClick={newRule} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Tạo quy tắc','New rule')}</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
            <input value={owner} onChange={e=>{ setOwner(e.target.value); setOffset(0); }} placeholder={t('Chủ sở hữu (tên/email)','Owner (name/email)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <input value={delegate} onChange={e=>{ setDelegate(e.target.value); setOffset(0); }} placeholder={t('Người nhận (tên/email)','Delegate (name/email)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <select value={status} onChange={e=>{ setStatus(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Trạng thái —','— Status —')}</option>
              <option value="active">{t('Hiệu lực','Active')}</option>
              <option value="upcoming">{t('Sắp tới','Upcoming')}</option>
              <option value="expired">{t('Hết hạn','Expired')}</option>
            </select>
            <select value={moduleFilter} onChange={e=>{ setModuleFilter(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Module —','— Module —')}</option>
              {(['general','leave','timesheet','expense','purchase'] as ModuleKey[]).map(m => <option key={m} value={m}>{moduleLabels[m][locale]}</option>)}
            </select>
            <select value={sort||'start_desc'} onChange={e=>{ setSort(e.target.value as any); setOffset(0); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="start_desc">{t('Bắt đầu ↓','Start ↓')}</option>
              <option value="start_asc">{t('Bắt đầu ↑','Start ↑')}</option>
              <option value="owner_asc">{t('Chủ sở hữu A→Z','Owner A→Z')}</option>
              <option value="delegate_asc">{t('Người nhận A→Z','Delegate A→Z')}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Chủ sở hữu','Owner')}</th>
                <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Người nhận','Delegate')}</th>
                <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Phạm vi','Scope')}</th>
                <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Khoảng thời gian','Date range')}</th>
                <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Trạng thái','Status')}</th>
                <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Hành động','Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={6} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
              {rows.map(r => {
                const owner = findUser(r.owner_id); const delegate = findUser(r.delegate_id);
                const scope = r.scope.modules.includes('general') ? t('Tất cả','All') : r.scope.modules.map(m=>moduleLabels[m][locale]).join(', ');
                return (
                  <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9', background: current?.id===r.id ? '#f8fafc' : '#fff' }} onClick={()=>setCurrent(r)}>
                    <td style={{ padding:8 }}><div style={{ fontWeight:700 }}>{owner?.name || r.owner_id}</div><div style={{ color:'#6b7280', fontSize:12 }}>{owner?.email || '—'}</div></td>
                    <td style={{ padding:8 }}><div style={{ fontWeight:700 }}>{delegate?.name || r.delegate_id}</div><div style={{ color:'#6b7280', fontSize:12 }}>{delegate?.email || '—'}</div></td>
                    <td style={{ padding:8 }}>{scope}</td>
                    <td style={{ padding:8 }}>{r.start_date} → {r.end_date}</td>
                    <td style={{ padding:8, textTransform:'capitalize' }}>{statusBadge(r)}</td>
                    <td style={{ padding:8 }}>
                      <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setCurrent(r)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                        <button onClick={async ()=>{ if (!confirm(t('Xoá?','Delete?'))) return; await fns.deleteRule(r.id); await load(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Del')}</button>
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

      {/* Right: editor + holidays + what-if */}
      <aside style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12 }}>
        {/* Editor */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{current?.id ? t('Sửa quy tắc','Edit rule') : t('Tạo quy tắc mới','Create rule')}</div>
          <div style={{ padding:10, display:'grid', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr auto', gap:8, alignItems:'center' }}>
              <div style={{ color:'#6b7280' }}>{t('Chủ sở hữu','Owner')}</div>
              <div>{current?.owner_id ? <b>{findUser(current.owner_id)?.name || current.owner_id}</b> : <i style={{ color:'#6b7280' }}>—</i>}</div>
              <button onClick={()=>pickUser(id=>setCurrent(c=>c?{...c, owner_id:id}:c))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Chọn','Pick')}</button>

              <div style={{ color:'#6b7280' }}>{t('Người nhận','Delegate')}</div>
              <div>{current?.delegate_id ? <b>{findUser(current.delegate_id)?.name || current.delegate_id}</b> : <i style={{ color:'#6b7280' }}>—</i>}</div>
              <button onClick={()=>pickUser(id=>setCurrent(c=>c?{...c, delegate_id:id}:c))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Chọn','Pick')}</button>

              <div style={{ color:'#6b7280' }}>{t('Khoảng ngày','Date range')}</div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="date" value={current?.start_date || ''} onChange={e=>setCurrent(c=>c?{...c, start_date:e.target.value}:c)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                <span>→</span>
                <input type="date" value={current?.end_date || ''} onChange={e=>setCurrent(c=>c?{...c, end_date:e.target.value}:c)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </div>
              <div />
            </div>

            {/* Modules */}
            <div>
              <div style={{ color:'#6b7280', fontSize:12, marginBottom:6 }}>{t('Phạm vi áp dụng','Scope')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {(['general','leave','timesheet','expense','purchase'] as ModuleKey[]).map(m => {
                  const active = current?.scope.modules.includes(m);
                  return (
                    <button key={m} onClick={()=>toggleModule(m)} style={{ border:'1px solid ' + (active ? '#4f46e5' : '#e5e7eb'), color: active ? '#4f46e5' : '#111827', background:'#fff', borderRadius:999, padding:'6px 10px' }}>
                      {moduleLabels[m][locale]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={!!current?.include_weekends} onChange={e=>setCurrent(c=>c?{...c, include_weekends:e.target.checked}:c)} />
                {t('Bao gồm cuối tuần','Include weekends')}
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={!!current?.exclude_company_holidays} onChange={e=>setCurrent(c=>c?{...c, exclude_company_holidays:e.target.checked}:c)} />
                {t('Loại trừ ngày lễ công ty','Exclude company holidays')}
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={!!current?.only_when_ooo} onChange={e=>setCurrent(c=>c?{...c, only_when_ooo:e.target.checked}:c)} />
                {t('Chỉ khi OOO (đang nghỉ)','Only when OOO')}
              </label>
            </div>

            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ghi chú','Comment')}</div>
              <textarea value={current?.comment || ''} onChange={e=>setCurrent(c=>c?{...c, comment:e.target.value}:c)} rows={2} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>

            {/* Save / delete */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              {current?.id && <button onClick={delRule} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>}
              <button onClick={saveRule} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>{t('Lưu','Save')}</button>
            </div>

            {err && <div style={{ color:'#ef4444', fontSize:12 }}>{err}</div>}
          </div>
        </div>

        {/* Holidays preview */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Ngày lễ (tham chiếu)','Company holidays')}</div>
          <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
            {holidays.map((h, idx) => (
              <div key={idx} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#f9fafb' }}>
                <div style={{ fontWeight:700 }}>{h.date}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{h.name}</div>
              </div>
            ))}
            {holidays.length===0 && <div style={{ padding:8, color:'#6b7280' }}>—</div>}
          </div>
        </div>

        {/* What-if tester */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Kiểm tra áp dụng','What-if tester')}</div>
          <div style={{ padding:10, display:'grid', gap:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr auto', gap:8, alignItems:'center' }}>
              <div style={{ color:'#6b7280' }}>{t('Owner','Owner')}</div>
              <div><input value={whatOwner} onChange={e=>setWhatOwner(e.target.value)} placeholder={t('Nhập owner_id (demo)','Enter owner_id (demo)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} /></div>
              <div />
              <div style={{ color:'#6b7280' }}>{t('Ngày','Date')}</div>
              <div><input type="date" value={whatDate} onChange={e=>setWhatDate(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} /></div>
              <div />
              <div style={{ color:'#6b7280' }}>{t('Module','Module')}</div>
              <div>
                <select value={whatModule} onChange={e=>setWhatModule(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  {(['general','leave','timesheet','expense','purchase'] as ModuleKey[]).map(m => <option key={m} value={m}>{moduleLabels[m][locale]}</option>)}
                </select>
              </div>
              <button onClick={runWhatIf} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 8px' }}>{t('Chạy','Run')}</button>
            </div>
            {whatResult && (
              <div style={{ color:'#111827' }}>
                {whatResult.to ? <span>{t('Sẽ chuyển cho','Delegates to')}: <b>{findUser(whatResult.to)?.name || whatResult.to}</b> — {whatResult.reason}</span> : <span>{t('Không có quy tắc khớp','No matching rule')}</span>}
              </div>
            )}
          </div>
        </div>

        {toast && <div style={{ color:'#16a34a', fontSize:12 }}>{toast}</div>}
      </aside>
    </div>
  );
};
