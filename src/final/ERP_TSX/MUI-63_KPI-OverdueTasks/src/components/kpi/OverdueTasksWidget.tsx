
// src/components/kpi/OverdueTasksWidget.tsx — KPI-03
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listTasks, updateTask, type Task } from '../../mock/tasks';
import { overdueKPI } from '../../mock/kpi_overdue';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

const COLOR = { bar:'#93c5fd', axis:'#6b7280' };

const Bars: React.FC<{ data:{label:string; count:number}[] }> = ({ data }) => {
  const w = Math.max(320, data.length*70), h=150, pad=24;
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <svg width={w+pad*2} height={h+pad*2}>
      {data.map((d,i)=>{
        const x = pad + i*70;
        const hh = (d.count/max)*h;
        return (
          <g key={i} transform={`translate(${x},${pad})`}>
            <rect x={10} y={h-hh} width={40} height={hh} fill={COLOR.bar} />
            <text x={30} y={h+14} textAnchor="middle" fontSize="11">{d.label}</text>
            <text x={30} y={h-hh-6} textAnchor="middle" fontSize="11">{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const OverdueTasksWidget: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedIfEmpty(); }, []);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getUTCFullYear());
  const tasks = useMemo(()=> listTasks(), []);
  const projects = useMemo(()=> Array.from(new Set(tasks.map(t => t.project))).sort(), [tasks]);
  const people = useMemo(()=> Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))) as string[], [tasks]);
  const [project, setProject] = useState<string>('');
  const [assignee, setAssignee] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  const kpi = useMemo(()=> overdueKPI({ year, project: project||undefined, assignee: assignee||undefined, priority: priority||undefined }), [year, project, assignee, priority]);

  const exportCSV = () => {
    const header = 'code,title,project,assignee,priority,status,due_date,days_overdue';
    const rows = kpi.list.map(r => [r.code, r.title, r.project, r.assignee||'', r.priority, r.status, (r.due_date||'').slice(0,10), r.days_overdue].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kpi_overdue_tasks.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const [sortKey, setSortKey] = useState<'days'|'priority'|'project'|'assignee'>('days');
  const sorted = useMemo(()=> {
    const arr = [...kpi.list];
    if (sortKey==='days') arr.sort((a,b)=> b.days_overdue - a.days_overdue);
    if (sortKey==='priority') arr.sort((a,b)=> ({critical:3,high:2,medium:1,low:0} as any)[b.priority]-({critical:3,high:2,medium:1,low:0} as any)[a.priority]);
    if (sortKey==='project') arr.sort((a,b)=> a.project.localeCompare(b.project));
    if (sortKey==='assignee') arr.sort((a,b)=> (a.assignee||'').localeCompare(b.assignee||''));
    return arr.slice(0,50);
  }, [kpi.list, sortKey]);

  const actSnooze = (id:string) => { 
    const t = tasks.find(x => x.id===id); 
    if (!t || !t.due_date) return; 
    const dt = new Date(t.due_date); dt.setUTCDate(dt.getUTCDate()+7); 
    updateTask(id, { due_date: dt.toISOString() }); alert('Snoozed +7d (mock) — reload to see changes'); 
  };
  const actDone = (id:string) => { updateTask(id, { status:'done' as any }); alert('Marked done (mock) — reload to see changes'); };

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Công việc quá hạn','Overdue Tasks')}</div>
          <Badge text="KPI-03" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nguồn: PM-03','Source: PM-03')}</div>
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
          <select value={priority} onChange={e=> setPriority(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả độ ưu tiên','All Priorities')}</option>
            {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:12 }}>
        {/* Left: Metrics + Buckets */}
        <div style={{ display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng quá hạn','Total overdue')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.total_overdue}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Trung bình (ngày)','Avg days')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.avg_days.toFixed(1)}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Trung vị (ngày)','Median')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.median_days}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Max (ngày)','Max')}</div>
              <div style={{ fontWeight:800, fontSize:20 }}>{kpi.max_days}</div>
            </div>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Phân bố theo số ngày quá hạn','Distribution by days overdue')}</div>
            <div style={{ overflowX:'auto' }}><Bars data={kpi.buckets} /></div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo Project','By Project')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.counts_by_project.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{r.count}</b>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo người phụ trách','By Assignee')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.counts_by_assignee.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{r.count}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Table */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:8 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Danh sách quá hạn (Top 50)','Overdue list (Top 50)')}</div>
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <label>{t('Sắp theo','Sort by')}:
                <select value={sortKey} onChange={e=> setSortKey(e.target.value as any)} style={{ marginLeft:6, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px' }}>
                  <option value="days">{t('Số ngày','Days')}</option>
                  <option value="priority">{t('Ưu tiên','Priority')}</option>
                  <option value="project">Project</option>
                  <option value="assignee">{t('Người phụ trách','Assignee')}</option>
                </select>
              </label>
            </div>
          </div>
          <div style={{ overflow:'auto', maxHeight:420 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Code</th>
                <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                <th style={{ padding:'6px' }}>Project</th>
                <th style={{ padding:'6px' }}>{t('Phụ trách','Assignee')}</th>
                <th style={{ padding:'6px' }}>{t('Ưu tiên','Priority')}</th>
                <th style={{ padding:'6px' }}>{t('Hạn','Due')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Quá hạn (ngày)','Days overdue')}</th>
                <th style={{ padding:'6px' }}></th>
              </tr></thead>
              <tbody>
                {sorted.map(tk => (
                  <tr key={tk.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{tk.code}</td>
                    <td style={{ padding:'6px' }}>{tk.title}</td>
                    <td style={{ padding:'6px' }}>{tk.project}</td>
                    <td style={{ padding:'6px' }}>{tk.assignee||'—'}</td>
                    <td style={{ padding:'6px', color: tk.priority==='critical' ? '#ef4444' : tk.priority==='high' ? '#f97316' : '#374151' }}>{tk.priority.toUpperCase()}</td>
                    <td style={{ padding:'6px' }}>{(tk.due_date||'').slice(0,10)}</td>
                    <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{tk.days_overdue}</td>
                    <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                      <button onClick={()=> actSnooze(tk.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Hoãn +7d','Snooze +7d')}</button>
                      <button onClick={()=> actDone(tk.id)} style={{ border:'1px solid #16a34a', background:'#16a34a', color:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Mark done','Mark done')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có','None')} —</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: PM-03 (Task board). {t('Demo dùng dữ liệu giả lập; hành động chỉ cập nhật localStorage.','Demo uses mock data; actions write localStorage only.')}
      </div>
    </div>
  );
};
