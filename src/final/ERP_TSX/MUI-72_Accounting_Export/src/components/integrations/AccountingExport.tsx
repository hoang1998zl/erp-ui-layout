
// src/components/integrations/AccountingExport.tsx — INT-04
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listJournals, type Journal } from '../../integrations/accounting/mockData';
import { applyFilter, flatten, toCSV, type ExportFilter, type ExportProfile } from '../../integrations/accounting/exporter';

const LS_PROFILES = 'erp.int.acc.export.profiles.v1';
const LS_LOGS = 'erp.int.acc.export.logs.v1';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString('vi-VN'); }

type Log = { at: string; profile: string; rows: number; file?: string; filter: ExportFilter };

export const AccountingExport: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  useEffect(()=> seedIfEmpty(), []);

  const data = useMemo(()=> listJournals(), []);
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  const defFrom = new Date(Date.UTC(y, m, 1)).toISOString();
  const defTo = new Date(Date.UTC(y, m+1, 0, 23,59,59)).toISOString();

  const [filter, setFilter] = useState<ExportFilter>({ from: defFrom, to: defTo, module:'ALL' });
  const [profiles, setProfiles] = useState<ExportProfile[]>(()=> { try { return JSON.parse(localStorage.getItem(LS_PROFILES)||'[]'); } catch { return []; } });
  const [editing, setEditing] = useState<ExportProfile|null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  const filtered = useMemo(()=> applyFilter(data, filter), [data, filter]);
  const rows = useMemo(()=> filtered.flatMap(j => flatten(j, (editing||profiles.find(p=>p.id===selectedProfile))?.dateFormat || 'YYYY-MM-DD')), [filtered, editing, profiles, selectedProfile]);

  const totalDebit = useMemo(()=> rows.reduce((s:any,r:any)=> s + Number(r['line.debit']||0), 0), [rows]);
  const totalCredit = useMemo(()=> rows.reduce((s:any,r:any)=> s + Number(r['line.credit']||0), 0), [rows]);

  const saveProfiles = (arr:ExportProfile[]) => { setProfiles(arr); localStorage.setItem(LS_PROFILES, JSON.stringify(arr)); };
  const newProfile = (): ExportProfile => ({
    id: Math.random().toString(36).slice(2),
    name: 'Export CSV (MISA-like)',
    target: 'CSV',
    system: 'MISA',
    delimiter: ',',
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD',
    fields: [
      { source:'date', alias:'Date' }, { source:'branch', alias:'Branch' }, { source:'currency', alias:'Currency' },
      { source:'rate', alias:'Rate' }, { source:'ref', alias:'RefNo' }, { source:'module', alias:'Module' },
      { source:'line.account', alias:'Account' }, { source:'line.debit', alias:'Debit' }, { source:'line.credit', alias:'Credit' }, { source:'line.desc', alias:'Description' }
    ]
  });

  const exportNow = () => {
    const prof = profiles.find(p => p.id===selectedProfile);
    if (!prof){ alert(t('Chọn profile xuất trước.','Pick an export profile first.')); return; }
    const csv = toCSV(rows, prof);
    const blob = new Blob([csv], { type:'text/csv' });
    const filename = `acc_export_${(new Date()).toISOString().slice(0,10)}.csv`;
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
    // log
    const rec: Log = { at: new Date().toISOString(), profile: prof.name, rows: rows.length, file: filename, filter };
    const logs: Log[] = JSON.parse(localStorage.getItem(LS_LOGS)||'[]'); logs.unshift(rec); localStorage.setItem(LS_LOGS, JSON.stringify(logs));
  };

  const [logs, setLogs] = useState<Log[]>(()=> { try { return JSON.parse(localStorage.getItem(LS_LOGS)||'[]'); } catch { return []; } });

  const refreshLogs = () => { try { setLogs(JSON.parse(localStorage.getItem(LS_LOGS)||'[]')); } catch { setLogs([]); } };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'380px 1fr 420px', gap:12 }}>
      {/* Left: Filters & Profiles */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:800 }}>{t('Accounting Export','Xuất dữ liệu kế toán')}</div>
          <Badge text="INT-04" />
        </div>
        <div style={{ fontWeight:700 }}>{t('Bộ lọc','Filters')}</div>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Từ ngày','From')}</span>
          <input type="date" value={filter.from.slice(0,10)} onChange={e=> setFilter({ ...filter, from: new Date(e.target.value+'T00:00:00Z').toISOString() })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Đến ngày','To')}</span>
          <input type="date" value={filter.to.slice(0,10)} onChange={e=> setFilter({ ...filter, to: new Date(e.target.value+'T23:59:59Z').toISOString() })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Chi nhánh','Branch')}</span>
          <select value={filter.branch||''} onChange={e=> setFilter({ ...filter, branch: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả','All')}</option>
            <option value="HCM">HCM</option>
            <option value="HN">HN</option>
          </select>
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Tiền tệ','Currency')}</span>
          <select value={filter.currency||''} onChange={e=> setFilter({ ...filter, currency: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('Tất cả','All')}</option>
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>Module</span>
          <select value={filter.module||'ALL'} onChange={e=> setFilter({ ...filter, module: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="ALL">{t('Tất cả','All')}</option>
            <option value="AP">AP</option>
            <option value="AR">AR</option>
            <option value="EXP">EXP</option>
            <option value="JV">JV</option>
          </select>
        </label>

        <div style={{ height:1, background:'#e5e7eb' }} />

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:700 }}>{t('Profile xuất','Export profiles')}</div>
          <button onClick={()=> setEditing({ ...newProfile() })} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm','Add')}</button>
        </div>
        <div style={{ display:'grid', gap:6 }}>
          {profiles.map(p => (
            <button key={p.id} onClick={()=> setSelectedProfile(p.id)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background: selectedProfile===p.id? '#eef2ff':'#fff' }}>
              <div style={{ fontWeight:700 }}>{p.name}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{p.system} • {p.target}</div>
            </button>
          ))}
          {profiles.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có profile','No profiles yet')} —</div>}
        </div>
        <button onClick={exportNow} disabled={!selectedProfile || rows.length===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>
          {t('Xuất ngay','Export now')} ({rows.length} {t('dòng','rows')})
        </button>
      </div>

      {/* Middle: Preview */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gridTemplateRows:'auto 1fr auto', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{t('Xem trước','Preview')}</div>
          <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:12 }}>
            {t('Dòng','Rows')}: <b>{rows.length}</b> • {t('Tổng Nợ','Total Debit')}: <b>{money(totalDebit)}</b> • {t('Tổng Có','Total Credit')}: <b>{money(totalCredit)}</b>
          </div>
        </div>
        <div style={{ overflow:'auto', minHeight:360 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>Date</th><th style={{ padding:'6px' }}>Branch</th><th style={{ padding:'6px' }}>Currency</th><th style={{ padding:'6px' }}>Rate</th>
              <th style={{ padding:'6px' }}>Ref</th><th style={{ padding:'6px' }}>Module</th><th style={{ padding:'6px' }}>Account</th>
              <th style={{ padding:'6px', textAlign:'right' }}>Debit</th><th style={{ padding:'6px', textAlign:'right' }}>Credit</th><th style={{ padding:'6px' }}>Desc</th>
            </tr></thead>
            <tbody>
              {rows.slice(0,500).map((r:any, i:number) => (
                <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px' }}>{r.date}</td>
                  <td style={{ padding:'6px' }}>{r.branch}</td>
                  <td style={{ padding:'6px' }}>{r.currency}</td>
                  <td style={{ padding:'6px' }}>{r.rate}</td>
                  <td style={{ padding:'6px' }}>{r.ref}</td>
                  <td style={{ padding:'6px' }}>{r.module}</td>
                  <td style={{ padding:'6px' }}>{r['line.account']}</td>
                  <td style={{ padding:'6px', textAlign:'right' }}>{money(r['line.debit'])}</td>
                  <td style={{ padding:'6px', textAlign:'right' }}>{money(r['line.credit'])}</td>
                  <td style={{ padding:'6px' }}>{r['line.desc']}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={10} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có dữ liệu','No data')} —</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lưu ý: dữ liệu demo giả lập. Ở môi trường thật, dùng FIN-10/11 và bút toán GL chuẩn.','Note: mock demo data. In production, source from FIN-10/11 and proper GL postings.')}</div>
      </div>

      {/* Right: Profile editor & Logs */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ fontWeight:700 }}>{t('Sửa profile xuất','Edit export profile')}</div>
        {!editing && <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chọn một profile để sửa hoặc tạo mới.','Pick a profile to edit or add a new one.')}</div>}
        {editing && (
          <div style={{ display:'grid', gap:8 }}>
            <label style={{ display:'grid', gap:6 }}><span>{t('Tên profile','Profile name')}</span><input value={editing.name} onChange={e=> setEditing({ ...editing, name:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>{t('Hệ thống đích','Target system')}</span>
              <select value={editing.system} onChange={e=> setEditing({ ...editing, system: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="MISA">MISA</option><option value="FAST">FAST</option><option value="SAPB1">SAP B1</option><option value="Custom">Custom</option>
              </select>
            </label>
            <label style={{ display:'grid', gap:6 }}><span>{t('Định dạng','Format')}</span>
              <select value={editing.target} onChange={e=> setEditing({ ...editing, target: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="CSV">CSV</option><option value="JSON">JSON</option><option value="API">API</option>
              </select>
            </label>
            {editing.target!=='API' && (
              <>
                <label style={{ display:'grid', gap:6 }}><span>{t('Dấu phân cách','Delimiter')}</span>
                  <select value={editing.delimiter||','} onChange={e=> setEditing({ ...editing, delimiter: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value=",">,</option><option value=";">;</option><option value="|">|</option>
                  </select>
                </label>
                <label style={{ display:'flex', gap:8, alignItems:'center' }}><input type="checkbox" checked={editing.includeHeaders} onChange={e=> setEditing({ ...editing, includeHeaders: e.target.checked })} /><span>{t('Gồm tiêu đề cột','Include headers')}</span></label>
                <label style={{ display:'grid', gap:6 }}><span>{t('Định dạng ngày','Date format')}</span>
                  <select value={editing.dateFormat} onChange={e=> setEditing({ ...editing, dateFormat: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option><option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </label>
              </>
            )}
            {editing.target==='API' && (
              <div style={{ display:'grid', gap:6 }}>
                <label style={{ display:'grid', gap:6 }}><span>API Endpoint</span><input value={editing.apiEndpoint||''} onChange={e=> setEditing({ ...editing, apiEndpoint: e.target.value })} placeholder="https://api.thirdparty.com/import" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
                <label style={{ display:'grid', gap:6 }}><span>Method</span>
                  <select value={editing.apiMethod||'POST'} onChange={e=> setEditing({ ...editing, apiMethod: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="POST">POST</option><option value="PUT">PUT</option>
                  </select>
                </label>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: gửi JSON theo profile fields; xử lý ở backend do CORS/khóa.','Hint: send JSON using profile fields; call via backend for CORS/keys.')}</div>
              </div>
            )}
            <div style={{ fontWeight:700 }}>{t('Trường xuất','Fields')}</div>
            <div style={{ display:'grid', gap:6 }}>
              {editing.fields.map((f,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
                  <input value={f.source} onChange={e=> { const arr=[...editing.fields]; arr[i]={ ...arr[i], source:e.target.value }; setEditing({ ...editing, fields:arr }); }} placeholder="line.debit" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input value={f.alias} onChange={e=> { const arr=[...editing.fields]; arr[i]={ ...arr[i], alias:e.target.value }; setEditing({ ...editing, fields:arr }); }} placeholder="Debit" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <button onClick={()=> { const arr=[...editing.fields]; arr.splice(i,1); setEditing({ ...editing, fields:arr }); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                </div>
              ))}
              <button onClick={()=> setEditing({ ...editing, fields:[...editing.fields, { source:'project', alias:'Project' }] })} style={{ justifySelf:'start', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm trường','Add field')}</button>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=> { const exists = profiles.some(p => p.id===editing.id); const arr = exists ? profiles.map(p => p.id===editing.id? editing : p) : [...profiles, editing]; saveProfiles(arr); setEditing(null); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu profile','Save profile')}</button>
              <button onClick={()=> setEditing(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Hủy','Cancel')}</button>
            </div>
          </div>
        )}

        <div style={{ height:1, background:'#e5e7eb' }} />

        <div style={{ display:'flex', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{t('Lịch sử xuất','Export history')}</div>
          <button onClick={refreshLogs} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Làm mới','Refresh')}</button>
        </div>
        <div style={{ display:'grid', gap:6, maxHeight:240, overflow:'auto' }}>
          {logs.map((l,i) => (
            <div key={i} style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:'8px 10px', display:'grid', gap:4 }}>
              <div style={{ fontSize:12, color:'#6b7280' }}>{(l.at||'').slice(0,19).replace('T',' ')}</div>
              <div>{t('Profile','Profile')}: <b>{l.profile}</b> — {l.rows} {t('dòng','rows')}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('File','File')}: {l.file||'—'}</div>
            </div>
          ))}
          {logs.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có lịch sử','No history yet')} —</div>}
        </div>
      </div>
    </div>
  );
};
