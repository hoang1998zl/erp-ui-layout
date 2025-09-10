
// src/components/kpi/OpenTasksByStatusWidget.tsx — KPI-02
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty as seedTasks, listTasks, type Task } from '../../mock/tasks';
import { openTasksByStatus } from '../../mock/kpi_tasks';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

const COLORS: Record<string,string> = {
  todo:'#a5b4fc',
  in_progress:'#60a5fa',
  review:'#34d399',
  on_hold:'#fbbf24',
  blocked:'#f87171',
  critical:'#ef4444',
  high:'#f97316',
  medium:'#f59e0b',
  low:'#10b981'
};

type PieSlice = { label:string; value:number; color:string };

const Pie: React.FC<{ slices: PieSlice[]; size?: number }> = ({ slices, size=160 }) => {
  const cx=size/2, cy=size/2, r=size/2-6;
  const total = Math.max(1, slices.reduce((s,x)=> s+x.value, 0));
  let startAngle = -Math.PI/2;
  function arcPath(start:number, end:number){
    const x1=cx + r*Math.cos(start), y1=cy + r*Math.sin(start);
    const x2=cx + r*Math.cos(end), y2=cy + r*Math.sin(end);
    const large = (end-start) > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }
  return (
    <svg width={size} height={size}>
      {slices.map((s,i) => {
        const angle = (s.value/total) * Math.PI*2;
        const d = arcPath(startAngle, startAngle+angle);
        startAngle += angle;
        return <path key={i} d={d} fill={s.color} stroke="#fff" strokeWidth="1" />;
      })}
      <circle cx={cx} cy={cy} r={size/2-24} fill="#fff" />
    </svg>
  );
};

export const OpenTasksByStatusWidget: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedTasks(); }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getUTCFullYear());
  const tasks = useMemo(()=> listTasks(), []);
  const projects = useMemo(()=> Array.from(new Set(tasks.map(t => t.project))).sort(), [tasks]);
  const people = useMemo(()=> Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))) as string[], [tasks]);
  const [project, setProject] = useState<string>('');
  const [assignee, setAssignee] = useState<string>('');

  const data = useMemo(()=> openTasksByStatus({ year, project: project||undefined, assignee: assignee||undefined }), [year, project, assignee]);

  const slices: PieSlice[] = data.by_status.map(b => ({ label: b.key, value: b.count, color: COLORS[b.key]||'#ddd' }));

  const exportCSV = () => {
    const header = 'status,count';
    const lines = data.by_status.map(r => [r.key, r.count].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='kpi_open_tasks_by_status.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const exportList = () => {
    const header = 'code,title,project,assignee,status,priority,due_date';
    const rows = data.overdue_top.map(t => [t.code,t.title,t.project,t.assignee||'',t.status,t.priority,t.due_date||''].join(','));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='kpi_overdue_tasks.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const legend = (label:string, value:number) => (
    <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ width:10, height:10, borderRadius:2, background:COLORS[label]||'#ddd', display:'inline-block' }} />
      <span style={{ width:120 }}>{label.replace('_',' ')}</span>
      <b>{value}</b>
    </div>
  );

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Công việc đang mở theo trạng thái','Open Tasks by Status')}</div>
          <Badge text="KPI-02" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nguồn: PM-03/05 (mock)','Source: PM-03/05 (mock)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={year} onChange={e=> setYear(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={project} onChange={e=> setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả Project','All Projects')}</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={assignee} onChange={e=> setAssignee(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả người phụ trách','All Assignees')}</option>
            {people.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, padding:12, alignItems:'center' }}>
        <div>
          <Pie slices={slices} />
        </div>
        <div style={{ display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng số Open','Total Open')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{data.total_open}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Theo độ ưu tiên','By Priority')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {data.by_priority.map(r => legend(r.key, r.count))}
              </div>
            </div>
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {data.by_status.map(r => legend(r.key, r.count))}
          </div>
        </div>
        <div style={{ width:360, border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Top quá hạn','Top Overdue')}</div>
          <div style={{ display:'grid', gap:6, maxHeight:240, overflow:'auto' }}>
            {data.overdue_top.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
            {data.overdue_top.map(tk => (
              <div key={tk.id} style={{ border:'1px dashed #e5e7eb', borderRadius:8, padding:'6px 8px', display:'grid', gap:2 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'monospace' }}>{tk.code}</div>
                  <Badge text={tk.priority.toUpperCase()} tone={tk.priority==='critical'?'red': tk.priority==='high'?'amber':'slate'} />
                </div>
                <div style={{ fontWeight:600 }}>{tk.title}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Dự án','Project')}: {tk.project} • {t('Phụ trách','Assignee')}: {tk.assignee||'—'}</div>
                <div style={{ color:'#ef4444', fontSize:12 }}>{t('Hạn','Due')}: {(tk.due_date||'').slice(0,10)}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={exportList} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export list</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: PM-03 (Task board), PM-05 (My Tasks). {t('Dùng dữ liệu giả lập để demo.','Using mock seed tasks for demo.')}
      </div>
    </div>
  );
};
