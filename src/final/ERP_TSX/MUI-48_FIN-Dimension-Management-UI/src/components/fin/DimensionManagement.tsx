
// src/components/fin/DimensionManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  seedIfEmpty, listTypes, listValues, upsertType, deleteType, upsertValue, deleteValue,
  exportCSV, importCSV, buildValueTree, defaultApplicability,
  validateType, validateValue,
  type DimensionType, type DimensionValue, type ModuleKey
} from '../../mock/dimensions';

type Tab = 'types'|'values'|'help';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function Field({ label, children }: { label:string, children:any }){
  return <label style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:8, alignItems:'center' }}><div style={{ color:'#6b7280', fontSize:12 }}>{label}</div><div>{children}</div></label>;
}
function Panel({ title, children, extra }: { title:string, children:any, extra?:any }){
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr', overflow:'hidden' }}>
      <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>{title}</div>
        <div>{extra}</div>
      </div>
      <div style={{ padding:10 }}>{children}</div>
    </div>
  );
}

export const DimensionManagement: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<DimensionType[]>([]);
  const [selectedDim, setSelectedDim] = useState<string>('');
  const [values, setValues] = useState<DimensionValue[]>([]);
  const [typeSearch, setTypeSearch] = useState('');
  const [valueSearch, setValueSearch] = useState('');
  const [csvText, setCsvText] = useState('');

  useEffect(()=>{ seedIfEmpty(); reloadTypes(); }, []);
  useEffect(()=>{ if (selectedDim) reloadValues(); }, [selectedDim]);

  const reloadTypes = () => { const arr = listTypes(); setTypes(arr); if (!selectedDim && arr[0]) setSelectedDim(arr[0].code); };
  const reloadValues = () => setValues(listValues(selectedDim));

  const modules: ModuleKey[] = ['GL','AP','AR','EXP','PR','INV','CRM','HR'];

  // Type editor state
  const [editType, setEditType] = useState<DimensionType|null>(null);
  const startNewType = () => setEditType({ id: Math.random().toString(36).slice(2), code:'', name_vi:'', name_en:'', hierarchical:true, active:true, applicability: defaultApplicability() });
  const startEditType = (t: DimensionType) => setEditType(JSON.parse(JSON.stringify(t)));
  const saveTypeClick = () => {
    if (!editType) return;
    const { ok, errors } = validateType(editType, types);
    if (!ok) { alert(errors.join('\\n')); return; }
    upsertType(editType);
    setEditType(null);
    reloadTypes();
  };

  // Value editor state
  const [editValue, setEditValue] = useState<DimensionValue|null>(null);
  const startNewValue = () => setEditValue({ id: Math.random().toString(36).slice(2), dim_code:selectedDim, code:'', name_vi:'', name_en:'', parent_code:'', active:true, attributes:{} });
  const startEditValue = (v: DimensionValue) => setEditValue(JSON.parse(JSON.stringify(v)));
  const saveValueClick = () => {
    if (!editValue) return;
    // If type is non-hierarchical, ignore parent_code
    const type = types.find(x => x.code===editValue.dim_code);
    if (type && !type.hierarchical) editValue.parent_code = undefined;
    const { ok, errors } = validateValue(editValue, listValues(editValue.dim_code), type);
    if (!ok) { alert(errors.join('\\n')); return; }
    upsertValue(editValue);
    setEditValue(null);
    reloadValues();
  };

  const tree = useMemo(()=> buildValueTree(selectedDim), [values, selectedDim]);
  const filteredTypes = useMemo(()=> types.filter(x => (x.code+' '+x.name_vi+' '+(x.name_en||'')).toLowerCase().includes(typeSearch.toLowerCase())), [types, typeSearch]);
  const filteredValues = useMemo(()=> values.filter(x => (x.code+' '+x.name_vi+' '+(x.name_en||'')).toLowerCase().includes(valueSearch.toLowerCase())), [values, valueSearch]);

  const TypeList = () => (
    <div style={{ display:'grid', gap:6 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input value={typeSearch} onChange={e=>setTypeSearch(e.target.value)} placeholder={t('Tìm theo mã/tên','Search code/name')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        <button onClick={startNewType} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Chiều mới','New dimension')}</button>
      </div>
      {filteredTypes.map(x => (
        <button key={x.code} onClick={()=>{ setSelectedDim(x.code); setTab('values'); }} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background: selectedDim===x.code ? '#eef2ff':'#fff' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <b>{x.code}</b> — {x.name_vi} {x.name_en? <span style={{ color:'#6b7280' }}>({x.name_en})</span>:null}
            <Badge text={x.hierarchical? 'hierarchical':'flat'} tone={x.hierarchical?'violet':'slate'} />
            <Badge text={x.active? t('Hoạt động','Active'):t('Ngưng','Inactive')} tone={x.active?'green':'red'} />
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Áp dụng','Applicability')}:
            {modules.map(m => x.applicability?.[m]?.enabled ? ` ${m}${x.applicability?.[m]?.required?'*':''}` : '').join('') || ' — '}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <button onClick={(e)=>{ e.stopPropagation(); startEditType(x); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
            <button onClick={(e)=>{ e.stopPropagation(); if (!confirm(t('Xoá chiều và toàn bộ giá trị?','Delete dimension and all values?'))) return; deleteType(x.code); reloadTypes(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Delete')}</button>
          </div>
        </button>
      ))}
    </div>
  );

  const TypeEditor = () => {
    if (!editType) return null;
    const e = editType;
    const set = (patch: Partial<DimensionType>) => setEditType({ ...e, ...patch });
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', placeItems:'center', padding:20 }}>
        <div style={{ width:900, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Sửa chiều phân tích','Edit dimension')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveTypeClick} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
              <button onClick={()=>setEditType(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
          </div>
          <div style={{ padding:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'grid', gap:10 }}>
              <Field label="Code"><input value={e.code} onChange={ev=>set({ code: ev.target.value.toUpperCase() })} placeholder="PROJECT / DEPT" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', textTransform:'uppercase' }} /></Field>
              <Field label={t('Tên (VI)','Name (VI)')}><input value={e.name_vi} onChange={ev=>set({ name_vi: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Tên (EN)','Name (EN)')}><input value={e.name_en||''} onChange={ev=>set({ name_en: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Phân cấp','Hierarchical')}>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={e.hierarchical} onChange={ev=>set({ hierarchical: ev.target.checked })} /><span>{e.hierarchical? t('Có','Yes'):t('Không','No')}</span>
                </label>
              </Field>
              <Field label={t('Trạng thái','Status')}>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={e.active} onChange={ev=>set({ active: ev.target.checked })} /><span>{t('Hoạt động','Active')}</span>
                </label>
              </Field>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              <div style={{ fontWeight:700 }}>{t('Áp dụng theo module','Module applicability')}</div>
              <div style={{ display:'grid', gap:6 }}>
                {modules.map(m => {
                  const item = e.applicability?.[m] || { enabled:false, required:false };
                  return (
                    <div key={m} style={{ display:'grid', gridTemplateColumns:'60px auto auto', gap:8, alignItems:'center' }}>
                      <div style={{ fontFamily:'monospace' }}>{m}</div>
                      <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="checkbox" checked={item.enabled} onChange={ev=>set({ applicability: { ...e.applicability, [m]: { ...item, enabled: ev.target.checked, required: ev.target.checked ? item.required : false } } })} />
                        <span>{t('Bật','Enabled')}</span>
                      </label>
                      <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="checkbox" checked={item.required} disabled={!item.enabled} onChange={ev=>set({ applicability: { ...e.applicability, [m]: { ...item, required: ev.target.checked } } })} />
                        <span>{t('Bắt buộc','Required')}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ padding:10, borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
            {t('Lưu ý: nếu đánh dấu "Required" cho một module, hệ thống sẽ enforce nhập chiều khi tạo chứng từ/bút toán của module đó.','Note: if "Required" is set for a module, the system will enforce entering this dimension in that module’s documents.')}
          </div>
        </div>
      </div>
    );
  };

  const ValueList = () => (
    <div style={{ display:'grid', gap:10 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <b style={{ fontFamily:'monospace' }}>{selectedDim||'—'}</b>
          <Badge text={t('Giá trị','Values')} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={valueSearch} onChange={e=>setValueSearch(e.target.value)} placeholder={t('Tìm mã/tên','Search code/name')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:260 }} />
          <button onClick={startNewValue} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Giá trị mới','New value')}</button>
        </div>
      </div>
      {/* Flat table */}
      <div style={{ maxHeight:260, overflow:'auto', border:'1px solid #f1f5f9', borderRadius:8, padding:6 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
            <th style={{ padding:'6px' }}>Code</th>
            <th style={{ padding:'6px' }}>{t('Tên','Name')}</th>
            <th style={{ padding:'6px' }}>{t('Parent','Parent')}</th>
            <th style={{ padding:'6px' }}>{t('Hiệu lực','Validity')}</th>
            <th style={{ padding:'6px' }}>{t('TT','Status')}</th>
            <th style={{ padding:'6px' }}></th>
          </tr></thead>
          <tbody>
            {filteredValues.map(v => (
              <tr key={v.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{v.code}</td>
                <td style={{ padding:'6px' }}>{v.name_vi} {v.name_en? <span style={{ color:'#6b7280' }}>({v.name_en})</span>:null}</td>
                <td style={{ padding:'6px' }}>{v.parent_code||'—'}</td>
                <td style={{ padding:'6px' }}>{(v.valid_from||'—') + ' → ' + (v.valid_to||'—')}</td>
                <td style={{ padding:'6px' }}><Badge text={v.active? t('Hoạt động','Active'):t('Ngưng','Inactive')} tone={v.active?'green':'red'} /></td>
                <td style={{ padding:'6px', textAlign:'right' }}>
                  <button onClick={()=>startEditValue(v)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                  <button onClick={()=>{ if (!confirm(t('Xoá giá trị này?','Delete this value?'))) return; deleteValue(v.dim_code, v.code); reloadValues(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'4px 8px', background:'#fff', marginLeft:6 }}>{t('Xoá','Delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Tree preview */}
      <Panel title={t('Cây giá trị','Value tree')}>
        <div style={{ maxHeight:260, overflow:'auto' }}>
          {tree.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : <Tree nodes={tree} />}
        </div>
      </Panel>

      {/* CSV import/export */}
      <Panel title="CSV" extra={<>
        <button onClick={()=>{
          const csv = exportCSV(selectedDim);
          const blob = new Blob([csv], { type:'text/csv' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`${selectedDim}_values.csv`; a.click(); URL.revokeObjectURL(url);
        }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
        <button onClick={()=>{
          const rows = importCSV(csvText);
          if (rows.length===0) { alert(t('CSV rỗng hoặc sai header','Empty CSV or invalid header')); return; }
          rows.filter(r => r.dim_code===selectedDim).forEach(r => upsertValue(r));
          reloadValues();
          alert(t('Đã nạp','Imported'));
        }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', marginLeft:8 }}>{t('Nạp từ CSV','Import from CSV')}</button>
      </>}>
        <div style={{ color:'#6b7280', fontSize:12, marginBottom:6 }}>{t('Header yêu cầu','Required header')}: <code>dim_code,code,name_vi,name_en,parent_code,active,valid_from,valid_to,external_code</code></div>
        <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} placeholder="Paste CSV here" style={{ width:'100%', minHeight:120, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', fontFamily:'monospace' }} />
      </Panel>
    </div>
  );

  function Tree({ nodes }:{ nodes:any[] }){
    return <ul style={{ margin:0, paddingLeft:16 }}>{nodes.map(n => (
      <li key={n.code} style={{ margin:'2px 0' }}>
        <span style={{ fontFamily:'monospace' }}>{n.code}</span> — {n.name} {!n.active && <em style={{ color:'#6b7280' }}>(inactive)</em>}
        {n.children?.length>0 && <Tree nodes={n.children} />}
      </li>
    ))}</ul>;
  }

  const ValueEditor = () => {
    if (!editValue) return null;
    const e = editValue;
    const set = (patch: Partial<DimensionValue>) => setEditValue({ ...e, ...patch });
    const parentOptions = values.filter(v => v.code!==e.code).map(v => v.code);
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', placeItems:'center', padding:20 }}>
        <div style={{ width:860, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Sửa giá trị','Edit value')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveValueClick} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
              <button onClick={()=>setEditValue(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
          </div>
          <div style={{ padding:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'grid', gap:10 }}>
              <Field label="dim_code"><input value={e.dim_code} onChange={ev=>set({ dim_code: ev.target.value.toUpperCase() })} disabled style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label="Code"><input value={e.code} onChange={ev=>set({ code: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Tên (VI)','Name (VI)')}><input value={e.name_vi} onChange={ev=>set({ name_vi: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Tên (EN)','Name (EN)')}><input value={e.name_en||''} onChange={ev=>set({ name_en: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Parent','Parent')}>
                <select value={e.parent_code||''} onChange={ev=>set({ parent_code: ev.target.value || undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option value="">{t('— Không có —','— None —')}</option>
                  {parentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label={t('Trạng thái','Status')}>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={e.active} onChange={ev=>set({ active: ev.target.checked })} /><span>{t('Hoạt động','Active')}</span>
                </label>
              </Field>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              <Field label={t('Hiệu lực từ','Valid from')}><input type="date" value={e.valid_from? e.valid_from.slice(0,10):''} onChange={ev=>set({ valid_from: ev.target.value? new Date(ev.target.value).toISOString(): undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Hiệu lực đến','Valid to')}><input type="date" value={e.valid_to? e.valid_to.slice(0,10):''} onChange={ev=>set({ valid_to: ev.target.value? new Date(ev.target.value).toISOString(): undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <Field label={t('Mã ngoài','External code')}><input value={e.external_code||''} onChange={ev=>set({ external_code: ev.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{t('Thuộc tính bổ sung','Additional attributes')}</div>
                <AttrEditor obj={e.attributes||{}} onChange={(o)=>set({ attributes:o })} />
              </div>
            </div>
          </div>
          <div style={{ padding:10, borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>{t('Lưu ý: parent chỉ áp dụng với chiều phân cấp.','Note: parent is respected only when the dimension is hierarchical.')}</div>
        </div>
      </div>
    );
  };

  const AttrEditor: React.FC<{ obj: Record<string,string>, onChange:(o:Record<string,string>)=>void }> = ({ obj, onChange }) => {
    const [local, setLocal] = useState<Record<string,string>>({ ...obj });
    useEffect(()=>{ setLocal({ ...obj }); }, [JSON.stringify(obj)]);
    const add = () => {
      const k = prompt('Key'); if (!k) return;
      const v = prompt('Value') || '';
      const next = { ...local, [k]: v }; setLocal(next); onChange(next);
    };
    const del = (k:string) => { const next = { ...local }; delete next[k]; setLocal(next); onChange(next); };
    return (
      <div style={{ display:'grid', gap:6 }}>
        {Object.keys(local).length===0 ? <div style={{ color:'#6b7280' }}>—</div> :
          Object.entries(local).map(([k,v]) => (
            <div key={k} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'center' }}>
              <div><b>{k}</b>: {v}</div>
              <button onClick={()=>del(k)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'2px 8px', background:'#fff' }}>{t('Xoá','Delete')}</button>
            </div>
          ))
        }
        <button onClick={add} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff', width:120 }}>{t('Thêm','Add')}</button>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'grid', gap:6 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontWeight:800 }}>{t('Quản lý chiều phân tích','Dimension Management')}</div>
            <Badge text="FIN-04" />
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Khai báo chiều như PROJECT, DEPT; đặt áp dụng theo module và bắt buộc/không. Quản lý giá trị (có thể phân cấp), hiệu lực, và mapping.','Define dimensions like PROJECT, DEPT; set module applicability and required flags. Manage values (hierarchical), validity and mapping.')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {(['types','values','help'] as Tab[]).map(k => (
            <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab===k ? '#eef2ff':'#fff' }}>{k.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr', gap:12 }}>
        <Panel title={t('Chiều (Types)','Dimensions (Types)')} extra={<button onClick={startNewType} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Chiều mới','New')}</button>}>
          <TypeList />
        </Panel>
        <Panel title={t('Giá trị (Values)','Values')} extra={<button onClick={startNewValue} disabled={!selectedDim} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Giá trị mới','New value')}</button>}>
          {selectedDim ? <ValueList /> : <div style={{ color:'#6b7280' }}>{t('Chọn một chiều để xem giá trị','Select a dimension to view values')}</div>}
        </Panel>
      </div>

      {/* Help */}
      {tab==='help' && (
        <Panel title={t('Gợi ý tích hợp & quy tắc','Integration & rules')}>
          <ul>
            <li>{t('RBAC: chỉ Finance/Admin được tạo/sửa/xoá.','RBAC: Finance/Admin only for create/update/delete.')}</li>
            <li>{t('GL/EXP/PR bắt buộc nhập theo cờ Required. Hệ thống validate hiệu lực (valid_from/valid_to).','GL/EXP/PR must input if Required; system validates validity dates.')}</li>
            <li>{t('API đề xuất','Suggested API')}: <code>GET/POST/PATCH/DELETE /fin/dimensions</code>, <code>GET/POST/PATCH/DELETE /fin/dimensions/{'{code}'}/values</code></li>
            <li>{t('Mapping external_code để đồng bộ với hệ thống khác (kế toán/BI).','Use external_code for mapping to accounting/BI systems.')}</li>
          </ul>
        </Panel>
      )}

      {/* Editors */}
      <TypeEditor />
      <ValueEditor />
    </div>
  );
};
