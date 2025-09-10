
// src/components/kpi/ActiveUsers7dWidget.tsx — KPI-05
import React, { useEffect, useMemo, useState } from 'react';
import { seedUsersIfEmpty, listUsers } from '../../mock/users';
import { seedActivityIfEmpty, listActivity } from '../../mock/activity';
import { activeUsers7d } from '../../mock/kpi_active_users';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function pct(a:number,b:number){ return b>0 ? (a/b)*100 : 0; }
function number(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

const LineChart: React.FC<{ series:{ date:string; dau:number; wau:number }[] }> = ({ series }) => {
  const pad=24, w=Math.max(560, series.length*20), h=160;
  const max = Math.max(1, ...series.flatMap(s => [s.dau, s.wau]));
  const sx = (i:number) => pad + i*(w-pad*2)/(series.length-1);
  const sy = (v:number) => pad + (1 - v/max)*(h-pad*2);
  const path = (key:'dau'|'wau') => series.map((s,i)=> `${i?'L':'M'} ${sx(i)} ${sy(s[key])}`).join(' ');
  return (
    <svg width={w} height={h}>
      <path d={path('wau')} fill="none" stroke="#60a5fa" strokeWidth="2.5" />
      <path d={path('dau')} fill="none" stroke="#93c5fd" strokeWidth="2.5" />
      {series.map((s,i)=> <circle key={i} cx={sx(i)} cy={sy(s.wau)} r={2} fill="#60a5fa" />)}
      {series.map((s,i)=> <circle key={'d'+i} cx={sx(i)} cy={sy(s.dau)} r={2} fill="#93c5fd" />)}
      <text x={pad} y={12} fontSize="10" fill="#6b7280">WAU (7d)</text>
      <text x={pad+80} y={12} fontSize="10" fill="#6b7280">DAU</text>
    </svg>
  );
};

export const ActiveUsers7dWidget: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=>{ seedUsersIfEmpty(); const total=listUsers().length; seedActivityIfEmpty(total); }, []);
  const users = useMemo(()=> listUsers(), []);
  const totalUsers = users.length;

  const now = new Date();
  const [anchor, setAnchor] = useState<string>(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0,10));
  const [dept, setDept] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const kpi = useMemo(()=> activeUsers7d({ anchor: new Date(anchor).toISOString(), dept: dept||undefined, role: role||undefined, platform: platform||undefined }), [anchor, dept, role, platform]);

  const exportCSV = () => {
    const header = 'date,DAU,WAU';
    const lines = kpi.dau_series.map(s => [s.date, s.dau, s.wau].join(','));
    const csv = [header, ...lines].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kpi_active_users_7d.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const utilPct = Math.round(pct(kpi.active_7d, totalUsers));
  const tone = utilPct>=60 ? 'green' : utilPct>=30 ? 'amber' : 'red';

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Người dùng hoạt động 7 ngày','7‑Day Active Users')}</div>
          <Badge text="KPI-05" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nguồn: CORE-05 (User/Activity)','Source: CORE-05 (User/Activity)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="date" value={anchor} onChange={e=> setAnchor(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          <select value={dept} onChange={e=> setDept(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả phòng ban','All Depts')}</option>
            {['SALES','OPS','FIN','HR','IT','ADMIN'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={role} onChange={e=> setRole(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả vai trò','All Roles')}</option>
            {['admin','manager','staff'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={platform} onChange={e=> setPlatform(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả nền tảng','All Platforms')}</option>
            {['web','mobile'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:12 }}>
        {/* Left: KPI + chart */}
        <div style={{ display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Active 7d','Active 7d')}</div>
              <div style={{ fontWeight:800, fontSize:22 }}>{number(kpi.active_7d)}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('trên tổng','of total')}: {number(totalUsers)} ({utilPct}%)</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('WAU gần nhất','Latest WAU')}</div>
              <div style={{ fontWeight:800, fontSize:22 }}>{number(kpi.dau_series.at(-1)?.wau||0)}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('DAU gần nhất','Latest DAU')}</div>
              <div style={{ fontWeight:800, fontSize:22 }}>{number(kpi.dau_series.at(-1)?.dau||0)}</div>
            </div>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, overflowX:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontWeight:700 }}>{t('Xu hướng 30 ngày','30‑day Trend')}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>WAU vs DAU</div>
            </div>
            <LineChart series={kpi.dau_series} />
          </div>
        </div>

        {/* Right: segments */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo phòng ban','By Dept')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.by_dept.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{number(r.users)}</b>
                  </div>
                ))}
                {kpi.by_dept.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo vai trò','By Role')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {kpi.by_role.slice(0,6).map(r => (
                  <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{r.key}</span><b>{number(r.users)}</b>
                  </div>
                ))}
                {kpi.by_role.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Theo nền tảng','By Platform')}</div>
            <div style={{ display:'grid', gap:6, gridTemplateColumns:'1fr 1fr' }}>
              {kpi.by_platform.map(r => (
                <div key={r.key} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>{r.key}</span><b>{number(r.users)}</b>
                </div>
              ))}
              {kpi.by_platform.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
            </div>
          </div>

          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Người dùng tích cực (top 10)','Top Active Users (10)')}</div>
            <div style={{ display:'grid', gap:6, maxHeight:200, overflow:'auto' }}>
              {kpi.top_users.map(u => (
                <div key={u.user} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:'monospace' }}>{u.user}</span><span>{t('sự kiện','events')}: <b>{u.events}</b></span>
                </div>
              ))}
              {kpi.top_users.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có','None')} —</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
        {t('Phụ thuộc','Depends on')}: CORE-05 (User directory, Activity log). {t('Dùng dữ liệu giả lập cho demo.','Using mock seed data for demo.')}
      </div>
    </div>
  );
};
