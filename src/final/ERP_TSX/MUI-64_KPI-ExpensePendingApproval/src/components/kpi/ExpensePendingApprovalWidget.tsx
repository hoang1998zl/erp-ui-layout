
// src/components/kpi/ExpensePendingApprovalWidget.tsx — KPI-04
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listExpenses, updateStatus, type Expense } from '../../mock/expense_pending';
import { expensePendingKPI } from '../../mock/kpi_expense_pending';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

const COLOR = { bar:'#60a5fa', axis:'#6b7280' };
const Bars: React.FC<{ data:{label:string; count:number; amount:number}[] }> = ({ data }) => {
  const w = Math.max(360, data.length*80), h=160, pad=24;
  const max = Math.max(1, ...data.map(d => d.amount));
  return (
    <svg width={w+pad*2} height={h+pad*2}>
      {data.map((d,i)=>{
        const x = pad + i*80;
        const hh = (d.amount/max)*h;
        return (
          <g key={i} transform={`translate(${x},${pad})`}>
            <rect x={12} y={h-hh} width={44} height={hh} fill={COLOR.bar} />
            <text x={34} y={h+14} textAnchor="middle" fontSize="11">{d.label}</text>
            <text x={34} y={h-hh-6} textAnchor="middle" fontSize="11">{money(d.amount)}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const ExpensePendingApprovalWidget: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedIfEmpty(); }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getUTCFullYear());
  const all = useMemo(()=> listExpenses(), []);
  const approvers = useMemo(()=> Array.from(new Set(all.map(x => x.approver).filter(Boolean))) as string[], [all]);
  const ccs = useMemo(()=> Array.from(new Set(all.map(x => x.cost_center).filter(Boolean))) as string[], [all]);
  const [approver, setApprover] = useState<string>('');
  const [cc, setCC] = useState<string>('');
  const [minAmount, setMinAmount] = useState<number>(0);

  const kpi = useMemo(()=> expensePendingKPI({ year, approver: approver||undefined, cost_center: cc||undefined, min_amount: minAmount||undefined }), [year, approver, cc, minAmount]);

  const exportCSV = () => {
    const header = 'code,title,requester,approver,cost_center,project,total_amount,age_days,submitted_at';
    const rows = kpi.list.map(r => [r.code, r.title, r.requester, r.approver||'', r.cost_center||'', r.project||'', Math.round(r.total_amount), r.age_days, (r.submitted_at||'').slice(0,10)].join(','));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kpi_expense_pending.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const approve = (code:string) => { if (confirm(t('Duyệt yêu cầu này?','Approve this expense?'))) { updateStatus(code, 'approved' as any, 'finance'); alert('Approved (mock). Reload to refresh.'); } };
  const reject = (code:string) => { if (confirm(t('Từ chối yêu cầu này?','Reject this expense?'))) { updateStatus(code, 'rejected' as any, 'finance'); alert('Rejected (mock). Reload to refresh.'); } };

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Chi phí chờ duyệt','Expense Pending Approval')}</div>
          <Badge text="KPI-04" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nguồn: FIN-10 / APP-03 (mock)','Source: FIN-10 / APP-03 (mock)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={year} onChange={e=> setYear(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={approver} onChange={e=> setApprover(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả approver','All approvers')}</option>
            {approvers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={cc} onChange={e=> setCC(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả Cost Center','All Cost Centers')}</option>
            {ccs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span>{t('Tối thiểu (VND)','Min amount (VND)')}</span>
            <input type="number" value={Number(minAmount||0)} onChange={e=> setMinAmount(Number(e.target.value)||0)} style={{ width:140, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </label>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:12 }}>
        {/* Left: KPIs + buckets + breakdown */}
        <div style={{ display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Số hồ sơ pending','Total pending')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.total_pending}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Giá trị pending','Amount pending')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{money(kpi.amount_pending)} VND</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tuổi hồ sơ TB (ngày)','Avg age (days)')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.avg_age_days.toFixed(1)}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Max tuổi (ngày)','Max age')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.max_age_days}</div>
            </div>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Phân bố theo tuổi pending','Distribution by pending age')}</div>
            <div style={{ overflowX:'auto' }}><Bars data={kpi.buckets_by_age} /></div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo Cost Center','By Cost Center')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.by_cost_center.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{money(r.amount)}</b>
                  </div>
                ))}
                {kpi.by_cost_center.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
              </div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo người đề nghị','By Requester')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.by_requester.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{money(r.amount)}</b>
                  </div>
                ))}
                {kpi.by_requester.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: list + actions */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:8 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Danh sách pending (Top 50)','Pending list (Top 50)')}</div>
            <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:12 }}>{t('Sắp xếp theo','Sorted by')}: {t('Giá trị giảm dần','Amount desc')}</div>
          </div>
          <div style={{ overflow:'auto', maxHeight:460 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Code</th>
                <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                <th style={{ padding:'6px' }}>{t('Người đề nghị','Requester')}</th>
                <th style={{ padding:'6px' }}>{t('Approver','Approver')}</th>
                <th style={{ padding:'6px' }}>CC</th>
                <th style={{ padding:'6px' }}>{t('Project','Project')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Giá trị','Amount')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Tuổi (ngày)','Age (d)')}</th>
                <th style={{ padding:'6px' }}></th>
              </tr></thead>
              <tbody>
                {kpi.list.map(e => (
                  <tr key={e.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{e.code}</td>
                    <td style={{ padding:'6px' }}>{e.title}</td>
                    <td style={{ padding:'6px' }}>{e.requester}</td>
                    <td style={{ padding:'6px' }}>{e.approver||'—'}</td>
                    <td style={{ padding:'6px' }}>{e.cost_center||'—'}</td>
                    <td style={{ padding:'6px' }}>{e.project||'—'}</td>
                    <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{money(e.total_amount)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{e.age_days}</td>
                    <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                      <button onClick={()=> approve(e.code)} style={{ border:'1px solid #16a34a', background:'#16a34a', color:'#fff', borderRadius:8, padding:'4px 8px' }}>{t('Duyệt','Approve')}</button>
                      <button onClick={()=> reject(e.code)} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Từ chối','Reject')}</button>
                    </td>
                  </tr>
                ))}
                {kpi.list.length===0 && (
                  <tr><td colSpan={9} style={{ color:'#6b7280', padding:10, textAlign:'center' }}>— {t('Không có dữ liệu','No data')} —</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: FIN-10 (Expense Approval), APP-03 (Approvals Inbox). {t('Demo cập nhật localStorage; cần RBAC & audit khi tích hợp thật.','Demo writes localStorage; add RBAC & audit for production.')}
      </div>
    </div>
  );
};
