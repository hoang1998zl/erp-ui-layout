
// src/components/kpi/DashboardManager.tsx — KPI-07
import React, { useEffect, useMemo, useState } from 'react';
import { seedUsersIfEmpty, listUsers } from '../../mock/users';
import { seedActivityIfEmpty } from '../../mock/activity';
import { seedBudgetsIfEmpty } from '../../mock/budget';
import { seedActualsIfEmpty } from '../../mock/expense_actual';
import { seedPendingIfEmpty } from '../../mock/expense_pending';
import { seedTasksIfEmpty } from '../../mock/tasks';
import { kpiManager } from '../../mock/kpi_manager';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

const Ring: React.FC<{ pct:number; size?:number }> = ({ pct, size=88 }) => {
  const r= size/2 - 6; const cx=size/2, cy=size/2; const C=2*Math.PI*r;
  const p = Math.max(0, Math.min(1, pct/100));
  const dash = `${C*p} ${C*(1-p)}`;
  const color = pct<=100 ? '#16a34a' : pct<=120 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="10" fill="none" strokeDasharray={dash} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700">{Math.round(pct)}%</text>
    </svg>
  );
};

const Donut: React.FC<{ items:{ key:string; count:number }[] }> = ({ items }) => {
  const size=120, cx=size/2, cy=size/2, r=size/2-8;
  const total = Math.max(1, items.reduce((s,x)=>s+x.count,0));
  let angle = -Math.PI/2;
  const COLORS: Record<string,string> = { todo:'#a5b4fc', in_progress:'#60a5fa', review:'#34d399', on_hold:'#fbbf24', blocked:'#f87171' };
  function arc(start:number, end:number){ const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start); const x2=cx+r*Math.cos(end), y2=cy+r*Math.sin(end); const large=(end-start)>Math.PI?1:0; return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`; }
  return (
    <svg width={size} height={size}>
      {items.map((s,i)=>{ const a=(s.count/total)*2*Math.PI; const d=arc(angle, angle+a); angle+=a; return <path key={i} d={d} fill={COLORS[s.key]||'#ddd'} stroke="#fff" strokeWidth="1" />; })}
      <circle cx={cx} cy={cy} r={size/2-22} fill="#fff" />
    </svg>
  );
};

const Bars: React.FC<{ data:{month:number; budget:number; actual:number}[] }> = ({ data }) => {
  const w=12*26, h=110, pad=16;
  const max = Math.max(1, ...data.map(d => Math.max(d.budget, d.actual)));
  return (
    <svg width={w+pad*2} height={h+pad*2}>
      {data.map((d,i) => {
        const x = pad + i*26;
        const hb = (d.budget/max)*h;
        const ha = (d.actual/max)*h;
        return (
          <g key={i} transform={`translate(${x},${pad})`}>
            <rect x={4} y={h-hb} width={8} height={hb} fill="#93c5fd" />
            <rect x={14} y={h-ha} width={8} height={ha} fill="#60a5fa" />
            <text x={12} y={h+12} textAnchor="middle" fontSize="10">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const DashboardManager: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{
    seedUsersIfEmpty();
    const total = listUsers().length;
    seedActivityIfEmpty(total);
    seedBudgetsIfEmpty();
    seedActualsIfEmpty();
    seedPendingIfEmpty();
    seedTasksIfEmpty();
  }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getUTCFullYear());
  const depts = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const [dept, setDept] = useState<string>('SALES');
  const [anchor, setAnchor] = useState<string>(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0,10));
  const [approver, setApprover] = useState<string>('');

  const kpi = useMemo(()=> kpiManager({ year, dept, anchorISO: new Date(anchor).toISOString(), approver: approver||undefined }), [year, dept, anchor, approver]);

  const exportCSV = () => {
    const header = 'month,budget,actual';
    const lines = kpi.budget.series.map(s => [s.month, Math.round(s.budget), Math.round(s.actual)].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='mgr_budget_vs_actual.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const utilTone = kpi.budget.util_pct<=100 ? 'green' : kpi.budget.util_pct<=120 ? 'amber' : 'red';

  return (
    <div style={{ display:'grid', gap:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Dashboard Trưởng bộ phận','Manager Dashboard')}</div>
          <Badge text="KPI-07" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Bám KPI-01..05 (lọc theo dept/role)','Based on KPI-01..05 (dept/role filters)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={dept} onChange={e=> setDept(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={year} onChange={e=> setYear(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>{t('Anchor','Anchor')}</span>
            <input type="date" value={anchor} onChange={e=> setAnchor(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </label>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gridTemplateColumns:'auto 1fr', gap:10, alignItems:'center' }}>
          <Ring pct={kpi.budget.util_pct} />
          <div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ngân sách sử dụng','Budget utilization')}</div>
            <div style={{ fontWeight:800, fontSize:18, color: utilTone==='green'?'#16a34a': utilTone==='amber'?'#f59e0b':'#ef4444' }}>{kpi.budget.util_pct.toFixed(0)}%</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Thực chi / Ngân sách','Actual / Budget')}: {money(kpi.budget.total_actual)} / {money(kpi.budget.total_budget)} VND</div>
          </div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Open tasks','Open tasks')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.tasks.total_open}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6, color:'#6b7280', fontSize:12 }}>
            {kpi.tasks.by_status.map(s => <span key={s.key}>{s.key}:{' '}<b>{s.count}</b></span>)}
          </div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Overdue tasks','Overdue tasks')}</div>
          <div style={{ fontWeight:800, fontSize:22, color:'#ef4444' }}>{kpi.tasks.overdue}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Top 10 hiển thị phía dưới','Top 10 shown below')}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Pending approvals','Pending approvals')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.pending.count}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Giá trị','Amount')}: <b>{money(kpi.pending.amount)}</b> VND</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tuổi TB','Avg age')}: {kpi.pending.avg_age.toFixed(1)} {t('ngày','d')}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Active users (7d)','Active users (7d)')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.active.active_7d}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('WAU gần nhất','Latest WAU')}: {kpi.active.dau_series.at(-1)?.wau||0} • {t('DAU','DAU')}: {kpi.active.dau_series.at(-1)?.dau||0}</div>
        </div>
      </div>

      {/* Middle: charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontWeight:700 }}>{t('Budget vs Actual (12 tháng)','Budget vs Actual (12 months)')}</div>
          </div>
          <div style={{ overflowX:'auto' }}><Bars data={kpi.budget.series} /></div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Open tasks theo trạng thái','Open tasks by status')}</div>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <Donut items={kpi.tasks.by_status} />
            <div style={{ display:'grid', gap:6 }}>
              {kpi.tasks.by_status.map(s => (
                <div key={s.key} style={{ display:'flex', justifyContent:'space-between', width:180 }}>
                  <span>{s.key}</span><b>{s.count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: tables */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Overdue (Top 10)','Overdue (Top 10)')}</div>
          <div style={{ overflow:'auto', maxHeight:300 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Code</th>
                <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                <th style={{ padding:'6px' }}>{t('Ưu tiên','Priority')}</th>
                <th style={{ padding:'6px' }}>{t('Hạn','Due')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Quá hạn (ngày)','Days')}</th>
              </tr></thead>
              <tbody>
                {kpi.tasks.overdue_top.map(tk => (
                  <tr key={tk.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{tk.code}</td>
                    <td style={{ padding:'6px' }}>{tk.title}</td>
                    <td style={{ padding:'6px' }}>{tk.priority.toUpperCase()}</td>
                    <td style={{ padding:'6px' }}>{(tk.due_date||'').slice(0,10)}</td>
                    <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{tk.days_overdue}</td>
                  </tr>
                ))}
                {kpi.tasks.overdue_top.length===0 && <tr><td colSpan={5} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có','None')} —</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontWeight:700 }}>{t('Pending approvals (Top 10)','Pending approvals (Top 10)')}</div>
            <div style={{ marginLeft:'auto' }}>
              <label style={{ fontSize:12, color:'#6b7280' }}>{t('Approver','Approver')}: </label>
              <select value={approver} onChange={e=> (e.preventDefault(), (e.target as HTMLSelectElement).value, setApprover((e.target as HTMLSelectElement).value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px' }}>
                <option value="">{t('Tất cả','All')}</option>
                {Array.from(new Set(kpi.pending.top.map(x => x.approver))).map(ap => <option key={ap} value={ap}>{ap}</option>)}
              </select>
            </div>
          </div>
          <div style={{ overflow:'auto', maxHeight:300 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Code</th>
                <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                <th style={{ padding:'6px' }}>{t('Approver','Approver')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Giá trị','Amount')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Tuổi (ngày)','Age (d)')}</th>
              </tr></thead>
              <tbody>
                {kpi.pending.top.map(e => (
                  <tr key={e.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{e.code}</td>
                    <td style={{ padding:'6px' }}>{e.title}</td>
                    <td style={{ padding:'6px' }}>{e.approver}</td>
                    <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{money(e.amount)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{e.age_days}</td>
                  </tr>
                ))}
                {kpi.pending.top.length===0 && <tr><td colSpan={5} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có','None')} —</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: KPI-01..05. {t('Demo dùng dữ liệu giả lập; cần map dữ liệu thật theo Dept/Role trước khi go-live.','Demo uses mock; wire to real data filtered by Dept/Role before go-live.')}
      </div>
    </div>
  );
};
