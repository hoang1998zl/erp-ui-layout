
// src/components/ux/InlineEditableTable.tsx — demo table using InlineEditCell
import React, { useMemo, useState } from 'react';
import { InlineEditCell } from './InlineEditCell';
import { saveCell } from '../../integrations/ux/mockApi';

type Row = {
  id: string;
  date: string;       // YYYY-MM-DD
  project: string;
  vendor: string;
  amount: number;
  status: 'Draft'|'Submitted'|'Approved'|'Rejected';
};

const projects = ['PRJ-A','PRJ-B','PRJ-C'];
const vendors = ['V001','V002','V003','VNPT'];
const statusOptions = [
  { value:'Draft', label:'Draft' },
  { value:'Submitted', label:'Submitted' },
  { value:'Approved', label:'Approved' },
  { value:'Rejected', label:'Rejected' },
];

const fmtCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(v||0);

function genRows(): Row[] {
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth()+1;
  const pick = <T,>(arr:T[]) => arr[Math.floor(Math.random()*arr.length)];
  return Array.from({ length: 12 }).map((_,i) => ({
    id: (1000+i).toString(),
    date: `${y}-${String(m).padStart(2,'0')}-${String(1+Math.floor(Math.random()*27)).padStart(2,'0')}`,
    project: pick(projects),
    vendor: pick(vendors),
    amount: 1_000_000 + Math.floor(Math.random()*15_000_000),
    status: pick(['Draft','Submitted','Approved'] as Row['status'][]),
  }));
}

export const InlineEditableTable: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [rows, setRows] = useState<Row[]>(()=> genRows());

  const update = async (id: string, patch: Partial<Row>) => {
    setRows(rs => rs.map(r => r.id===id ? { ...r, ...patch } : r)); // optimistic
    try {
      const field = Object.keys(patch)[0] as keyof Row;
      // @ts-ignore
      await saveCell(id, String(field), patch[field]);
    } catch (e){
      // rollback if failed
      setRows(rs => rs.map(r => r.id===id ? { ...r, ...rows.find(x=>x.id===id)! } : r));
      throw e;
    }
  };

  const required = (name: string) => (v:any) => (v===null || v===undefined || v==='') ? `${name} is required` : null;
  const positive = (v:any) => (Number(v)<=0 ? 'Must be > 0' : null);

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center' }}>
        <div style={{ fontWeight:700 }}>Inline Editable Table — Demo</div>
        <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:12 }}>{t('Mẹo','Tip')}: {t('Double‑click hoặc F2 để sửa; Enter lưu, Esc hủy, Tab lưu và chuyển.','Double‑click or press F2 to edit; Enter to save, Esc cancel, Tab save+move.')}</div>
      </div>
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', background:'#f8fafc' }}>
            <th style={{ padding:'8px' }}>ID</th>
            <th style={{ padding:'8px' }}>{t('Ngày','Date')}</th>
            <th style={{ padding:'8px' }}>{t('Dự án','Project')}</th>
            <th style={{ padding:'8px' }}>{t('Nhà cung cấp','Vendor')}</th>
            <th style={{ padding:'8px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
            <th style={{ padding:'8px' }}>{t('Trạng thái','Status')}</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px 8px', color:'#64748b' }}>{r.id}</td>
                <td style={{ padding:'0 8px', width:140 }}>
                  <InlineEditCell
                    value={r.date}
                    type="date"
                    ariaLabel="date"
                    validate={required('Date')}
                    onCommit={async (v)=> update(r.id, { date: v as string })}
                  />
                </td>
                <td style={{ padding:'0 8px', width:140 }}>
                  <InlineEditCell
                    value={r.project}
                    type="select"
                    options={projects.map(p => ({ value:p, label:p }))}
                    validate={required('Project')}
                    onCommit={async (v)=> update(r.id, { project: String(v) })}
                  />
                </td>
                <td style={{ padding:'0 8px', width:160 }}>
                  <InlineEditCell
                    value={r.vendor}
                    type="text"
                    validate={required('Vendor')}
                    onCommit={async (v)=> update(r.id, { vendor: String(v) })}
                  />
                </td>
                <td style={{ padding:'0 8px', width:160, textAlign:'right' }}>
                  <InlineEditCell
                    value={r.amount}
                    type="currency"
                    align="right"
                    validate={(v)=> required('Amount')(v) || positive(v)}
                    format={(v)=> fmtCurrency(Number(v))}
                    onCommit={async (v)=> update(r.id, { amount: Number(v) })}
                  />
                </td>
                <td style={{ padding:'0 8px', width:160 }}>
                  <InlineEditCell
                    value={r.status}
                    type="select"
                    options={statusOptions}
                    onCommit={async (v)=> update(r.id, { status: v as Row['status'] })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:10, color:'#64748b', fontSize:12 }}>
        Usage examples: <code>FIN‑06</code> (Expense Lines), <code>PM‑02</code> (Task Board grid).
      </div>
    </div>
  );
};
