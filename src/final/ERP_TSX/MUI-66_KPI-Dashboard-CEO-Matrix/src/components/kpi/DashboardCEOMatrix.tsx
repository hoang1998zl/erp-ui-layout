
// src/components/kpi/DashboardCEOMatrix.tsx — KPI-06
import React, { useMemo, useState } from 'react';
import { buildDashboard, type Dashboard, type Cell, type RAG } from '../../mock/ceo_dashboard';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function ragColor(r:RAG){ return r==='green' ? '#16a34a' : (r==='amber' ? '#f59e0b' : '#ef4444'); }

const Quadrant: React.FC<{ data: Dashboard['quadrant']; onPickDept:(d:string)=>void }> = ({ data, onPickDept }) => {
  const w=360, h=280, pad=28;
  const xScale = (v:number)=> pad + (Math.min(150, v)/150)*(w-pad*2);
  const yScale = (v:number)=> h - (Math.min(100, v)/100)*(h-pad*2) - pad;
  return (
    <svg width={w} height={h} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
      {/* Axes */}
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#cbd5e1" />
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#cbd5e1" />
      {/* Midlines */}
      <line x1={pad} y1={h/2} x2={w-pad} y2={h/2} stroke="#e5e7eb" strokeDasharray="4 4" />
      <line x1={(w)/2} y1={pad} x2={(w)/2} y2={h-pad} stroke="#e5e7eb" strokeDasharray="4 4" />
      <text x={w/2} y={h-6} textAnchor="middle" fontSize="11">Spend Utilization % (≤100% tốt)</text>
      <g transform={`translate(12, ${h/2}) rotate(-90)`}><text fontSize="11">Task Health % (↑ tốt)</text></g>
      {/* Points */}
      {data.map((p,i)=>(
        <g key={i} transform={`translate(${xScale(p.spend_util_pct)}, ${yScale(p.task_health_pct)})`} onClick={()=> onPickDept(p.dept)} style={{ cursor:'pointer' }}>
          <circle r={Math.max(6, Math.sqrt(p.size))} fill="#60a5fa" fillOpacity={0.7} stroke="#2563eb" />
          <text y={-10} textAnchor="middle" fontSize="11" fill="#334155">{p.dept}</text>
        </g>
      ))}
    </svg>
  );
};

const Matrix: React.FC<{ cells: Cell[]; depts:string[]; procs:string[]; onPick:(c:Cell)=>void }> = ({ cells, depts, procs, onPick }) => {
  const cellOf = (d:string,p:string)=> cells.find(c => c.dept===d && c.process===p)!;
  return (
    <div style={{ overflow:'auto', border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
      <table style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead>
          <tr>
            <th style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>Dept \ Process</th>
            {procs.map(p => <th key={p} style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', textAlign:'center' }}>{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {depts.map(d => (
            <tr key={d} style={{ borderTop:'1px solid #f1f5f9' }}>
              <td style={{ padding:'8px 10px', fontWeight:700 }}>{d}</td>
              {procs.map(p => {
                const c = cellOf(d,p);
                return (
                  <td key={p} onClick={()=> onPick(c)} style={{ padding:'6px 8px', textAlign:'center', cursor:'pointer' }} title={`${d} • ${p}: ${c.score}`}>
                    <div style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
                      <span style={{ width:10, height:10, borderRadius:999, background:ragColor(c.rag), display:'inline-block' }} />
                      <span style={{ fontWeight:700 }}>{c.score}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DashboardCEOMatrix: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [period, setPeriod] = useState<'M'|'Q'|'Y'>('M');
  const [anchor, setAnchor] = useState<string>(new Date().toISOString());
  const dash = useMemo(()=> buildDashboard(anchor, period), [anchor, period]);

  const [pickedDept, setPickedDept] = useState<string>('');
  const [pickedCell, setPickedCell] = useState<Cell|undefined>(undefined);

  const exportCSV = () => {
    const header = ['dept','process','score','rag','kpi1','kpi2'];
    const rows = dash.matrix.map(m => [m.dept, m.process, m.score, m.rag, `${m.kpis[0]?.label}:${m.kpis[0]?.value}${m.kpis[0]?.unit||''}`, `${m.kpis[1]?.label}:${m.kpis[1]?.value}${m.kpis[1]?.unit||''}`]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ceo_matrix.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const rightTitle = pickedCell ? `${pickedCell.dept} • ${pickedCell.process}` : (pickedDept ? `${pickedDept} — ${t('tổng quan','overview')}` : t('Điểm nhấn & ngữ cảnh','Highlights & context'));
  const contextItems = pickedCell ? [
    { title: t('Điểm tổng hợp','Composite score'), value: String(pickedCell.score), tone: pickedCell.rag as RAG },
    ...pickedCell.kpis.map(k => ({ title: k.label, value: `${k.value}${k.unit||''}`, tone: 'slate' as RAG }))
  ] : (pickedDept ? dash.matrix.filter(m => m.dept===pickedDept).map(m => ({ title: m.process, value: String(m.score), tone: m.rag })) : dash.highlights.map(h => ({ title: h.title, value: h.detail, tone: h.severity })));

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Bảng điều khiển CEO — Ma trận','CEO Dashboard — Matrix')}</div>
          <Badge text="KPI-06" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Trái: Quadrant • Giữa: Matrix • Phải: Context','Left: Quadrant • Middle: Matrix • Right: Context')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={period} onChange={e=> setPeriod(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="M">{t('Tháng','Monthly')}</option>
            <option value="Q">{t('Quý','Quarterly')}</option>
            <option value="Y">{t('Năm','Yearly')}</option>
          </select>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body: 3 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'400px 1fr 380px', gap:12 }}>
        {/* Left: Quadrant */}
        <div>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Quadrant: Chi tiêu vs Sức khỏe công việc','Quadrant: Spend vs Task Health')}</div>
          <Quadrant data={dash.quadrant} onPickDept={(d)=> { setPickedDept(d); setPickedCell(undefined); }} />
          <div style={{ color:'#6b7280', fontSize:12, marginTop:6 }}>{t('Nhấn vào bubble để xem theo phòng ban ở panel phải.','Click a bubble to view department context on the right.')}</div>
        </div>

        {/* Middle: Matrix */}
        <div>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Ma trận KPI theo Dept × Process','KPI Matrix by Dept × Process')}</div>
          <Matrix cells={dash.matrix} depts={dash.depts} procs={dash.processes} onPick={(c)=> { setPickedCell(c); setPickedDept(''); }} />
          <div style={{ color:'#6b7280', fontSize:12, marginTop:6 }}>{t('Bấm ô để xem chi tiết KPI & bối cảnh.','Click a cell to view detailed KPIs & context.')}</div>
        </div>

        {/* Right: Context */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gridTemplateRows:'auto 1fr auto', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontWeight:700 }}>{rightTitle}</div>
          </div>
          <div style={{ overflow:'auto', display:'grid', gap:8 }}>
            {contextItems.map((it, idx) => (
              <div key={idx} style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
                <div>{it.title}</div>
                <div style={{ fontWeight:700, color: ragColor(it.tone as any) }}>{it.value}</div>
              </div>
            ))}
            {contextItems.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có dữ liệu','No data')} —</div>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xem chi tiết','View details')}</button>
            <button style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Tạo action','Create action')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
