
// src/components/fin/CostCenterMaster.tsx — FIN-16 CostCenter_Master
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listCC, upsertCC, removeByCode, findByCode, childrenOf, computeMeta, importCSV, exportCSV, type CostCenter } from '../../mock/costcenters';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

type Tab = 'tree'|'table';

function buildTree(nodes: CostCenter[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];
  nodes.forEach(n => map.set(n.code, { ...n, children: [] }));
  nodes.forEach(n => {
    const m = map.get(n.code);
    if (n.parent_code && map.has(n.parent_code)) map.get(n.parent_code).children.push(m);
    else roots.push(m);
  });
  const sortRec = (arr:any[]) => { arr.sort((a,b)=> a.code.localeCompare(b.code)); arr.forEach(x => sortRec(x.children)); };
  sortRec(roots);
  return roots;
}

export const CostCenterMaster: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  useEffect(()=>{ seedIfEmpty(); }, []);
  const [rows, setRows] = useState<CostCenter[]>(listCC());
  const [tab, setTab] = useState<Tab>('tree');
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);

  const reload = () => { const a=listCC(); computeMeta(a); setRows(a); };
  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(()=> rows.filter(r => (!onlyActive || r.active) && (
    r.code.toLowerCase().includes(q.toLowerCase())
    || (r.name_vi||'').toLowerCase().includes(q.toLowerCase())
    || (r.name_en||'').toLowerCase().includes(q.toLowerCase())
    || (r.path||'').toLowerCase().includes(q.toLowerCase())
  )), [rows, q, onlyActive]);

  const tree = useMemo(()=> buildTree(filtered), [filtered]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [err, setErr] = useState<string>('');
  const [form, setForm] = useState<Partial<CostCenter>>({ code:'', name_vi:'', active:true });
  const openNew = (parent_code?: string) => { setErr(''); setForm({ code:'', name_vi:'', parent_code, active:true }); setDrawerOpen(true); };
  const openEdit = (r: CostCenter) => { setErr(''); setForm(r); setDrawerOpen(true); };
  const onSave = () => {
    try{
      const code = String(form.code||'').trim();
      const name = String(form.name_vi||'').trim();
      if (code.length<2 || !name) { setErr(t('Mã & Tên (VI) bắt buộc','Code & Name(VI) required')); return; }
      if (form.effective_from && form.effective_to && String(form.effective_from) > String(form.effective_to)) { setErr(t('Khoảng hiệu lực không hợp lệ','Invalid effective range')); return; }
      // parent exist (if set)
      if (form.parent_code && !findByCode(form.parent_code)) { setErr(t('Parent không tồn tại','Parent not found')); return; }
      upsertCC({ ...form, code, name_vi: name } as any);
      setDrawerOpen(false); reload();
    } catch(e:any){ setErr(e?.message || String(e)); }
  };

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='cost_centers.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      const text = String(fr.result||'');
      const res = importCSV(text);
      alert(`Inserted: ${res.inserted}, Updated: ${res.updated}, Errors: ${res.errors.length}`);
      if (res.errors.length) console.warn(res.errors);
      reload();
    };
    fr.readAsText(file);
  };

  // Tree node component
  const Node: React.FC<{ n:any; depth:number }> = ({ n, depth }) => {
    const [open, setOpen] = useState(true);
    const has = (n.children||[]).length>0;
    return (
      <div style={{ marginLeft: depth*16, borderLeft: depth? '1px dashed #e5e7eb' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
          <button onClick={()=> setOpen(!open)} style={{ width:22, height:22, border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>{has ? (open?'−':'+') : '•'}</button>
          <span style={{ fontFamily:'monospace' }}>{n.code}</span>
          <span>— {n.name_vi}{n.name_en? ` / ${n.name_en}`:''}</span>
          <Badge text={n.active?'ACTIVE':'INACTIVE'} tone={n.active?'green':'red'} />
          <span style={{ color:'#6b7280', fontSize:12 }}>{n.path}</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button onClick={()=> openNew(n.code)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Thêm con','Add child')}</button>
            <button onClick={()=> openEdit(n)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
            <button onClick={()=> { if (confirm(t('Xoá node này? (cả con trực tiếp sẽ bị xoá)','Delete this node? (direct children will be removed)'))) { removeByCode(n.code); reload(); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px' }}>{t('Xoá','Delete')}</button>
          </div>
        </div>
        {open && has && n.children.map((c:any) => <Node key={c.code} n={c} depth={depth+1} />)}
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Danh mục Trung tâm chi phí','Cost Center Master')}</div>
          <Badge text="FIN-16" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Deferred from P0','Deferred from P0')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={handleExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Import CSV','Import CSV')}
            <input type="file" accept=".csv,text/csv" onChange={e=>{ const f = e.target.files?.[0]; if (f) handleImport(f); }} style={{ display:'none' }} />
          </label>
          <button onClick={()=> openNew()} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm CC','New CC')}</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:'grid', gridTemplateColumns:'auto auto 1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8 }}>
          {[['tree', t('Cây','Tree')], ['table', t('Bảng','Table')]].map(([k, label]) => (
            <button key={k} onClick={()=> setTab(k as Tab)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: tab===k ? '#eef2ff' : '#fff' }}><b>{label}</b></button>
          ))}
        </div>
        <label style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="checkbox" checked={onlyActive} onChange={e=> setOnlyActive((e.target as HTMLInputElement).checked)} />
          <div>{t('Chỉ hiển thị Active','Only Active')}</div>
        </label>
        <div />
        <input value={q} onChange={e=> setQ(e.target.value)} placeholder={t('Tìm code/tên/đường dẫn','Search code/name/path')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:280 }} />
      </div>

      {/* Content */}
      {tab==='tree' ? (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:8, overflow:'auto' }}>
          {tree.map(n => <Node key={n.code} n={n} depth={0} />)}
          {tree.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có dữ liệu','No data')} —</div>}
        </div>
      ) : (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>Code</th>
              <th style={{ padding:'6px' }}>{t('Tên (VI/EN)','Name (VI/EN)')}</th>
              <th style={{ padding:'6px' }}>{t('Parent','Parent')}</th>
              <th style={{ padding:'6px' }}>{t('Cấp','Level')}</th>
              <th style={{ padding:'6px' }}>{t('Đường dẫn','Path')}</th>
              <th style={{ padding:'6px' }}>{t('Quản lý','Manager')}</th>
              <th style={{ padding:'6px' }}>{t('TT','Status')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.code} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px', fontFamily:'monospace' }}>{r.code}</td>
                  <td style={{ padding:'6px' }}>{r.name_vi}{r.name_en? ` / ${r.name_en}`:''}</td>
                  <td style={{ padding:'6px' }}>{r.parent_code||'—'}</td>
                  <td style={{ padding:'6px' }}>{r.level||1}</td>
                  <td style={{ padding:'6px', fontSize:12, color:'#6b7280' }}>{r.path||r.code}</td>
                  <td style={{ padding:'6px' }}>{r.manager||'—'}</td>
                  <td style={{ padding:'6px' }}>{r.active ? <Badge text="ACTIVE" tone="green" /> : <Badge text="INACTIVE" tone="red" />}</td>
                  <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                    <button onClick={()=> openEdit(r)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                    <button onClick={()=> { if (confirm(t('Xoá CC này? (xoá cả con trực tiếp)','Delete this cost center? (direct children removed)'))) { removeByCode(r.code); reload(); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có dữ liệu','No data')} —</div>}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(760px, 96vw)' }} onClick={()=> setDrawerOpen(false)}>
          <div />
          <div onClick={e=> e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{form?.id ? t('Sửa Cost Center','Edit Cost Center') : t('Thêm Cost Center','New Cost Center')}</div>
              <button onClick={()=> setDrawerOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
            <div style={{ overflow:'auto', padding:10, display:'grid', gap:10 }}>
              {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 10px', color:'#991b1b' }}>{err}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>Code *</div><input value={form.code||''} onChange={e=> setForm({ ...form, code:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Tên (VI) *','Name (VI) *')}</div><input value={form.name_vi||''} onChange={e=> setForm({ ...form, name_vi:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Tên (EN)','Name (EN)')}</div><input value={form.name_en||''} onChange={e=> setForm({ ...form, name_en:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('Parent','Parent')}</div><input value={form.parent_code||''} onChange={e=> setForm({ ...form, parent_code:e.target.value||undefined })} placeholder="e.g., SALES" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Đơn vị sở hữu','Owner dept')}</div><input value={form.owner_dept||''} onChange={e=> setForm({ ...form, owner_dept:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Quản lý','Manager')}</div><input value={form.manager||''} onChange={e=> setForm({ ...form, manager:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'grid', gap:6 }}><div>{t('Hiệu lực từ','Effective from')}</div><input type="date" value={(form.effective_from||'').slice(0,10)} onChange={e=> setForm({ ...form, effective_from:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><div>{t('Hiệu lực đến','Effective to')}</div><input type="date" value={(form.effective_to||'').slice(0,10)} onChange={e=> setForm({ ...form, effective_to:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="checkbox" checked={form.active!==false} onChange={e=> setForm({ ...form, active:(e.target as HTMLInputElement).checked })} />
                  <div>{t('Kích hoạt','Active')}</div>
                </label>
              </div>
              <label style={{ display:'grid', gap:6 }}><div>Notes</div><textarea value={form.notes||''} onChange={e=> setForm({ ...form, notes:e.target.value })} rows={3} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lưu ý: không cho phép chu trình cha-con (cycle).','Note: parent-child cycles are not allowed.')}</div>
            </div>
            <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={()=> setDrawerOpen(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Huỷ','Cancel')}</button>
              <button onClick={onSave} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'8px 12px' }}>{t('Lưu','Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
