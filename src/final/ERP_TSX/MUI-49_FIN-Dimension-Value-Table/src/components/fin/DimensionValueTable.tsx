
// src/components/fin/DimensionValueTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listTypes, listValues, exportCSV, type DimensionType, type DimensionValue } from '../../mock/dimensions';

type StatusFilter = 'all'|'active'|'inactive';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const DimensionValueTable: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [types, setTypes] = useState<DimensionType[]>([]);
  const [dim, setDim] = useState<string>('');
  const [rows, setRows] = useState<DimensionValue[]>([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [atDate, setAtDate] = useState<string>(''); // YYYY-MM-DD
  const [sortKey, setSortKey] = useState<'code'|'name'|'status'|'from'|'to'>('code');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(()=>{ seedIfEmpty(); const ts = listTypes(); setTypes(ts); if (ts[0]) setDim(ts[0].code); }, []);
  useEffect(()=>{ if (dim) { setRows(listValues(dim)); setPage(1); } }, [dim]);

  const isValidOn = (v: DimensionValue, ymd?: string) => {
    if (!ymd) return true;
    const d = new Date(ymd + 'T00:00:00');
    const f = v.valid_from ? new Date(v.valid_from) : new Date('1900-01-01');
    const tto = v.valid_to ? new Date(v.valid_to) : new Date('2999-12-31');
    return d>=f && d<=tto;
  };

  const filtered = useMemo(()=> {
    const s = search.toLowerCase();
    return rows
      .filter(r => (r.code+' '+r.name_vi+' '+(r.name_en||'')+' '+(r.parent_code||'')+' '+(r.external_code||'')).toLowerCase().includes(s))
      .filter(r => status==='all' ? true : status==='active' ? r.active : !r.active)
      .filter(r => isValidOn(r, atDate));
  }, [rows, search, status, atDate]);

  const sorted = useMemo(()=> {
    const arr = [...filtered];
    const get = (r: DimensionValue) => {
      switch (sortKey) {
        case 'code': return r.code;
        case 'name': return r.name_vi || r.name_en || '';
        case 'status': return r.active ? 1 : 0;
        case 'from': return r.valid_from || '';
        case 'to': return r.valid_to || '';
        default: return r.code;
      }
    };
    arr.sort((a,b)=> {
      const av = get(a); const bv = get(b);
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

  const handleExport = () => {
    if (!dim) return;
    const csv = exportCSV(dim);
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`${dim}_values.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Bảng giá trị chiều','Dimension Value Table')}</div>
          <Badge text="FIN-05" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Xem & lọc giá trị theo hiệu lực ngày','View & filter by validity date')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={handleExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <a href="#" onClick={(e)=>{ e.preventDefault(); alert(t('Mở FIN‑04 (mock): quản lý chiều','Open FIN‑04 (mock): manage dimensions')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', textDecoration:'none' }}>{t('Mở quản lý (FIN‑04)','Open management (FIN‑04)')}</a>
        </div>
      </div>

      {/* Filters */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Chiều','Dimension')}</div>
          <select value={dim} onChange={e=>{ setDim(e.target.value); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            {types.map(x => <option key={x.code} value={x.code}>{x.code} — {x.name_vi}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tìm kiếm','Search')}</div>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder={t('Mã/Tên/Parent/Mã ngoài','Code/Name/Parent/External')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Trạng thái','Status')}</div>
          <select value={status} onChange={e=>{ setStatus(e.target.value as StatusFilter); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="all">{t('Tất cả','All')}</option>
            <option value="active">{t('Hoạt động','Active')}</option>
            <option value="inactive">{t('Ngưng','Inactive')}</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Hiệu lực tại ngày','Valid on date')}</div>
          <input type="date" value={atDate} onChange={e=>{ setAtDate(e.target.value); setPage(1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
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
              {headerCell('Code', 'code')}
              {headerCell(t('Tên','Name'), 'name')}
              <th style={{ padding:'6px' }}>{t('Parent','Parent')}</th>
              {headerCell(t('Hiệu lực từ','Valid from'), 'from')}
              {headerCell(t('Hiệu lực đến','Valid to'), 'to')}
              {headerCell(t('TT','Status'), 'status')}
              <th style={{ padding:'6px' }}>{t('Mã ngoài','External')}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(v => (
              <tr key={v.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{v.code}</td>
                <td style={{ padding:'6px' }}>{v.name_vi} {v.name_en? <span style={{ color:'#6b7280' }}>({v.name_en})</span>:null}</td>
                <td style={{ padding:'6px' }}>{v.parent_code||'—'}</td>
                <td style={{ padding:'6px' }}>{v.valid_from? new Date(v.valid_from).toISOString().slice(0,10) : '—'}</td>
                <td style={{ padding:'6px' }}>{v.valid_to? new Date(v.valid_to).toISOString().slice(0,10) : '—'}</td>
                <td style={{ padding:'6px' }}><Badge text={v.active? t('Hoạt động','Active'):t('Ngưng','Inactive')} tone={v.active?'green':'red'} /></td>
                <td style={{ padding:'6px' }}>{v.external_code||'—'}</td>
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
