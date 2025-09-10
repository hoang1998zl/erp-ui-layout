
// src/components/kpi/DashboardEmployee.tsx — KPI-08
import React, { useEffect, useMemo, useState } from 'react';
import { seedTasksIfEmpty, listTasks } from '../../mock/tasks';
import { seedExpensesIfEmpty, listExpenses } from '../../mock/expenses';
import { employeeDashboard } from '../../mock/kpi_employee';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

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

export const DashboardEmployee: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedTasksIfEmpty(); seedExpensesIfEmpty(); }, []);

  const tasks = useMemo(()=> listTasks(), []);
  const people = useMemo(()=> Array.from(new Set(tasks.map(t => t.assignee))).sort(), [tasks]);
  const now = new Date();
  const [me, setMe] = useState<string>(people[0] || 'lan');
  const [year, setYear] = useState<number>(now.getUTCFullYear());
  const [project, setProject] = useState<string>('');

  const kpi = useMemo(()=> employeeDashboard({ user: me, year, project: project||undefined }), [me, year, project]);

  const exportCSV = () => {
    const header = 'code,title,due_date,days_left,priority';
    const lines = kpi.tasks.upcoming.map(r => [r.code, r.title, (r.due_date||'').slice(0,10), r.days_left, r.priority].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='my_upcoming_tasks.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gap:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Trang tổng quan cá nhân','Employee Dashboard')}</div>
          <Badge text="KPI-08" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tập trung vào công việc & đề nghị chi phí của tôi','Focus on my tasks & expense requests')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={me} onChange={e=> setMe(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {people.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={year} onChange={e=> setYear(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={project} onChange={e=> setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả Project','All Projects')}</option>
            {Array.from(new Set(tasks.map(t => t.project))).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Công việc đang mở','Open tasks')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.tasks.open}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Quá hạn','Overdue')}</div>
          <div style={{ fontWeight:800, fontSize:22, color:'#ef4444' }}>{kpi.tasks.overdue}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Sắp đến hạn (7d)','Due next 7d')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.tasks.due_next7}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Hoàn thành 7d gần nhất','Done last 7d')}</div>
          <div style={{ fontWeight:800, fontSize:22, color:'#16a34a' }}>{kpi.tasks.done_last7}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đề nghị chi phí đang mở','My pending expenses')}</div>
          <div style={{ fontWeight:800, fontSize:22 }}>{kpi.expenses.by_status.find(x=>x.key==='pending')?.count || 0}</div>
        </div>
      </div>

      {/* Middle: Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gridTemplateColumns:'auto 1fr', gap:12, alignItems:'center' }}>
          <Donut items={kpi.tasks.by_status} />
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>{t('Trạng thái công việc','Task status')}</div>
            {kpi.tasks.by_status.map(s => (
              <div key={s.key} style={{ display:'flex', justifyContent:'space-between', width:220 }}>
                <span>{s.key}</span><b>{s.count}</b>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Tổng quan đề nghị chi phí của tôi','My expense requests overview')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đang xử lý','Pending')}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{(kpi.expenses.by_status.find(x=>x.key==='pending')?.count||0) + (kpi.expenses.by_status.find(x=>x.key==='submitted')?.count||0)}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Giá trị','Amount')}: <b>{money(kpi.expenses.pending_amount)}</b></div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đã duyệt','Approved')}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{kpi.expenses.by_status.find(x=>x.key==='approved')?.count || 0}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Giá trị','Amount')}: <b>{money(kpi.expenses.approved_amount)}</b></div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đã thanh toán','Paid')}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{kpi.expenses.by_status.find(x=>x.key==='paid')?.count || 0}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Giá trị','Amount')}: <b>{money(kpi.expenses.paid_amount)}</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Lists */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Sắp đến hạn (Top 10)','Upcoming due (Top 10)')}</div>
            <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:12 }}>{t('Ưu tiên','Priority')}</div>
          </div>
          <div style={{ overflow:'auto', maxHeight:300 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Code</th>
                <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                <th style={{ padding:'6px' }}>{t('Hạn','Due')}</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Còn (ngày)','Left (d)')}</th>
                <th style={{ padding:'6px' }}>{t('Ưu tiên','Priority')}</th>
              </tr></thead>
              <tbody>
                {kpi.tasks.upcoming.map(tk => (
                  <tr key={tk.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{tk.code}</td>
                    <td style={{ padding:'6px' }}>{tk.title}</td>
                    <td style={{ padding:'6px' }}>{(tk.due_date||'').slice(0,10)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{tk.days_left}</td>
                    <td style={{ padding:'6px' }}>{tk.priority.toUpperCase()}</td>
                  </tr>
                ))}
                {kpi.tasks.upcoming.length===0 && <tr><td colSpan={5} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có','None')} —</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Đề nghị chi phí chờ xử lý (Top 10)','My pending expenses (Top 10)')}</div>
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
                {kpi.expenses.pending_top.map(e => (
                  <tr key={e.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px', fontFamily:'monospace' }}>{e.code}</td>
                    <td style={{ padding:'6px' }}>{e.title}</td>
                    <td style={{ padding:'6px' }}>{e.approver||'—'}</td>
                    <td style={{ padding:'6px', textAlign:'right', fontWeight:700 }}>{money(e.amount)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{e.age_days}</td>
                  </tr>
                ))}
                {kpi.expenses.pending_top.length===0 && <tr><td colSpan={5} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có','None')} —</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: KPI-02, KPI-03, FIN-09. {t('Demo dùng dữ liệu giả lập (tasks/expenses); tích hợp thật cần RBAC, upload chứng từ & quy trình duyệt.','Demo uses mock tasks/expenses; production needs RBAC, receipts upload & approval flow.')}
      </div>
    </div>
  );
};
