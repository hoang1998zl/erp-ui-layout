
// src/components/fin/ExpenseList.tsx — FIN-09 Expense_List
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listValues } from '../../mock/dimensions';
import { seedUsersIfEmpty, currentUser } from '../../mock/users';
import { listDrafts, seedDemo, type ExpenseDraft } from '../../mock/expense';

type Status = 'all'|'draft'|'submitted';

// Calculate gross amount for an expense draft
const gross = (expense: ExpenseDraft): number => {
  return (expense.lines || []).reduce((sum, line) => sum + (line.amount || 0), 0);
};

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const ExpenseList: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  // Seeds
  useEffect(()=>{ seedIfEmpty(); seedUsersIfEmpty(); try { (seedDemo as any)(); } catch {} }, []);

  const me = useMemo(()=> currentUser(), []);
  const employees = useMemo(()=> listValues('EMPLOYEE'), []);
  const projects = useMemo(()=> listValues('PROJECT'), []);

  const [rows, setRows] = useState<ExpenseDraft[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [emp, setEmp] = useState<string>(me.code);
  const [project, setProject] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [sortKey, setSortKey] = useState<'date'|'title'|'employee'|'amount'|'status'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(()=>{ setRows(listDrafts()); }, []);

  const filtered = useMemo(()=> {
    const s = q.toLowerCase();
    return rows
      .filter(r => status==='all'? true : r.status===status)
      .filter(r => !emp || r.employee_code===emp)
      .filter(r => !project || (r.project_code||'')===project || (r.lines||[]).some(l => (l.project_code||'')===project))
      .filter(r => !from || new Date(r.date) >= new Date(from+'T00:00:00'))
      .filter(r => !to || new Date(r.date) <= new Date(to+'T23:59:59'))
      .filter(r => (r.title||'').toLowerCase().includes(s) || (r.dept_code||'').toLowerCase().includes(s) || (r.employee_code||'').toLowerCase().includes(s));
  }, [rows, q, status, emp, project, from, to]);

  const counts = useMemo(()=> ({
    all: filtered.length,
    draft: filtered.filter(r => r.status==='draft').length,
    submitted: filtered.filter(r => r.status==='submitted').length,
  }), [filtered]);

  const sorted = useMemo(()=> {
    const arr = [...filtered];
    const keyFn = (r: ExpenseDraft) => {
      switch (sortKey) {
        case 'date': return r.date;
        case 'title': return r.title || '';
        case 'employee': return r.employee_code || '';
        case 'amount': return gross(r);
        case 'status': return r.status;
      }
    };
    arr.sort((a,b)=> {
      const av = keyFn(a); const bv = keyFn(b);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(()=> sorted.slice((page-1)*pageSize, page*pageSize), [sorted, page, pageSize]);

  const headerCell = (label: string, key: typeof sortKey) => (
    <th style={{ padding:'6px', cursor:'pointer', whiteSpace:'nowrap' }}
        onClick={()=>{ if (sortKey===key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } }}>
      {label} {sortKey===key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const exportCSV = () => {
    const header = 'date,title,employee,dept,project,currency,amount,status';
    const rows = sorted.map(r => [new Date(r.date).toISOString().slice(0,10), (r.title||'').replace(/,/g,' '), r.employee_code, r.dept_code||'', r.project_code||'', r.currency, String(gross(r)||0), r.status].join(','));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='expenses.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Danh sách chi phí','Expense list')}</div>
          <span><Badge text="FIN-09" /></span>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Bộ lọc theo user/project, chip trạng thái','Filter by user/project, status chips')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <a href="#" onClick={(e)=>{ e.preventDefault(); alert(t('Mở FIN‑08 (mock) để tạo/sửa phiếu','Open FIN‑08 (mock) to create/edit')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', textDecoration:'none' }}>{t('Tạo phiếu mới','New expense')}</a>
        </div>
      </div>

      {/* Chips */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {(['all','draft','submitted'] as Status[]).map(s => (
          <button key={s} onClick={()=>{ setStatus(s); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: status===s ? '#eef2ff':'#fff' }}>
            <b style={{ textTransform:'capitalize' }}>{s}</b> <span style={{ color:'#6b7280' }}>({(counts as any)[s]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr auto', gap:8, alignItems:'end' }}>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Nhân viên','Employee')}</div>
          <select value={emp} onChange={e=>{ setEmp(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="">{t('Tất cả','All')}</option>
            {employees.map(u => <option key={u.code} value={u.code}>{u.code} — {u.name_vi}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>Project</div>
          <select value={project} onChange={e=>{ setProject(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="">{t('Tất cả','All')}</option>
            {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name_vi}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Từ ngày','From')}</div>
          <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Đến ngày','To')}</div>
          <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tìm kiếm','Search')}</div>
          <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} placeholder={t('Tiêu đề/Phòng ban/Mã NV','Title/Dept/Emp')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div style={{ justifySelf:'end' }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Kích thước trang','Page size')}</div>
          <select value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value)); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:6 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              {headerCell('Date', 'date')}
              {headerCell(t('Tiêu đề','Title'), 'title')}
              {headerCell(t('Nhân viên','Employee'), 'employee')}
              <th style={{ padding:'6px' }}>Project</th>
              <th style={{ padding:'6px' }}>{t('Tiền tệ','Cur')}</th>
              {headerCell(t('Số tiền','Amount'), 'amount')}
              {headerCell(t('TT','Status'), 'status')}
              <th style={{ padding:'6px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(r => (
              <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px' }}>{new Date(r.date).toISOString().slice(0,10)}</td>
                <td style={{ padding:'6px' }}>{r.title||'—'}</td>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{r.employee_code}</td>
                <td style={{ padding:'6px' }}>{r.project_code||'—'}</td>
                <td style={{ padding:'6px' }}>{r.currency}</td>
                <td style={{ padding:'6px', textAlign:'right' }}>{gross(r).toLocaleString()}</td>
                <td style={{ padding:'6px' }}>
                  <Badge text={r.status} tone={r.status==='submitted'?'green':'amber'} />
                </td>
                <td style={{ padding:'6px' }}>
                  <button onClick={()=> alert(t('Mở FIN‑08 (mock) để xem chi tiết','Open FIN‑08 (mock) to view details'))} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Xem','View')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length===0 && <div style={{ color:'#6b7280', padding:'8px' }}>— {t('Không có dữ liệu','No data')} —</div>}
      </div>

      {/* Pager */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng','Total')}: {sorted.length} • {t('Trang','Page')} {page}/{totalPages}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>setPage(1)} disabled={page===1} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>⏮</button>
          <button onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>←</button>
          <button onClick={()=>setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>→</button>
          <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>⏭</button>
        </div>
      </div>
    </div>
  );
};
