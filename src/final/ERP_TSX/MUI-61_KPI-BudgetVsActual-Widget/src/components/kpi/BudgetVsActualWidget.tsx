
// src/components/kpi/BudgetVsActualWidget.tsx — KPI-01
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty as seedBudget, listBudgets } from '../../mock/budget';
import { seedIfEmpty as seedExpense } from '../../mock/expense';
import { budgetVsActual } from '../../mock/kpis';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

const Ring: React.FC<{ pct:number; size?:number }> = ({ pct, size=92 }) => {
  const r= size/2 - 6; const cx=size/2, cy=size/2; const C=2*Math.PI*r;
  const p = Math.max(0, Math.min(1, pct/100));
  const dash = `${C*p} ${C*(1-p)}`;
  const color = pct<=100 ? '#16a34a' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="10" fill="none" strokeDasharray={dash} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700">{Math.round(pct)}%</text>
    </svg>
  );
};

const Bars: React.FC<{ data:{month:number; budget:number; actual:number}[] }> = ({ data }) => {
  const w=12*28, h=120, pad=16;
  const max = Math.max(1, ...data.map(d => Math.max(d.budget, d.actual)));
  return (
    <svg width={w+pad*2} height={h+pad*2}>
      {data.map((d,i) => {
        const x = pad + i*28;
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
      <text x={pad} y={12} fontSize="10" fill="#6b7280">Budget</text>
      <text x={pad+56} y={12} fontSize="10" fill="#6b7280">Actual</text>
    </svg>
  );
};

export const BudgetVsActualWidget: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedBudget(); seedExpense(); }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [dim, setDim] = useState<'overall'|'cost_center'|'project'>('overall');
  const [key, setKey] = useState<string>('');

  const budgets = useMemo(()=> listBudgets(), []);
  const ccList = useMemo(()=> Array.from(new Set(budgets.map(b => b.cost_center).filter(Boolean))) as string[], [budgets]);
  const projList = useMemo(()=> Array.from(new Set(budgets.map(b => b.project).filter(Boolean))) as string[], [budgets]);

  const kpi = useMemo(()=> budgetVsActual({ year, dim, key: key||undefined }), [year, dim, key]);

  const pct = kpi.total_budget>0 ? (kpi.total_actual/kpi.total_budget)*100 : 0;
  const tone = pct<=100 ? 'green' : 'red';

  const exportCSV = () => {
    const header = 'month,budget,actual';
    const lines = kpi.series.map(s => [s.month, Math.round(s.budget), Math.round(s.actual)].join(','));
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='kpi_budget_vs_actual.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Ngân sách vs Thực chi','Budget vs Actual')}</div>
          <Badge text="KPI-01" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nguồn: kpis.json (mock)','Source: kpis.json (mock)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={year} onChange={e=> setYear(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={dim} onChange={e=> { setDim(e.target.value as any); setKey(''); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="overall">{t('Tổng công ty','Overall')}</option>
            <option value="cost_center">{t('Theo Cost Center','By Cost Center')}</option>
            <option value="project">{t('Theo Project','By Project')}</option>
          </select>
          {dim==='cost_center' && (
            <select value={key} onChange={e=> setKey(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Chọn CC —','— Pick CC —')}</option>
              {ccList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
            </select>
          )}
          {dim==='project' && (
            <select value={key} onChange={e=> setKey(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="">{t('— Chọn Project —','— Pick Project —')}</option>
              {projList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, padding:12, alignItems:'center' }}>
        <div><Ring pct={pct} /></div>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ngân sách (YTD)','Budget (YTD)')}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{money(kpi.total_budget)} VND</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Thực chi (YTD)','Actual (YTD)')}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{money(kpi.total_actual)} VND</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chênh lệch','Variance')}</div>
              <div style={{ fontWeight:800, fontSize:18, color: pct<=100? '#16a34a':'#ef4444' }}>{money(kpi.variance)} VND ({kpi.variance_pct.toFixed(1)}%)</div>
            </div>
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, overflowX:'auto' }}>
            <Bars data={kpi.series} />
          </div>
        </div>
        <div style={{ width:320, border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Top vượt ngân sách (CC)','Top over budget (CC)')}</div>
          <div style={{ display:'grid', gap:6 }}>
            {kpi.by_dim.slice(0,5).map(r => (
              <div key={r.key} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:8, alignItems:'center', borderBottom:'1px dashed #e5e7eb', padding:'6px 0' }}>
                <Badge text={r.key||'—'} tone={r.variance>0?'red':'green'} />
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chênh','Var')}: {money(r.variance)} ({r.variance_pct.toFixed(1)}%)</div>
                <div style={{ fontFamily:'monospace' }}>{r.actual>r.budget? t('Vượt','Over') : t('Dư','Under')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: FIN-06 (Budgets), FIN-10 (Expense Approval). {t('Dùng dữ liệu giả lập để demo.','Uses mock seed data for demo.')}
      </div>
    </div>
  );
};
