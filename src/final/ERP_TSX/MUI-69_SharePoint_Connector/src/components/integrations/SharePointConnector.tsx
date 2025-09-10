
// src/components/integrations/SharePointConnector.tsx — INT-01
import React, { useEffect, useMemo, useState } from 'react';
import type { SPConfig, SPDrive, SPItem, MappingRule } from '../../integrations/sharepoint/types';
import { MockGraph } from '../../integrations/sharepoint/mockGraph';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function bytes(n:number){ 
  if (n<1024) return `${n} B`; if (n<1024*1024) return `${(n/1024).toFixed(1)} KB`; if (n<1024*1024*1024) return `${(n/1024/1024).toFixed(1)} MB`; return `${(n/1024/1024/1024).toFixed(1)} GB`; 
}
const LS_CFG = 'erp.int.sp.cfg.v1';
const LS_MAP = 'erp.int.sp.map.v1';

const defaultCfg: SPConfig = { authMode:'delegated', tenantId:'', clientId:'', siteHostname:'contoso.sharepoint.com', sitePath:'sites/ERP' };

export const SharePointConnector: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [cfg, setCfg] = useState<SPConfig>(()=> { try { return JSON.parse(localStorage.getItem(LS_CFG)||'null') || defaultCfg; } catch { return defaultCfg; } });
  const [status, setStatus] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');
  const [drives, setDrives] = useState<SPDrive[]>([]);
  const [driveId, setDriveId] = useState<string>('');
  const [path, setPath] = useState<string>('/');
  const [items, setItems] = useState<SPItem[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

  const [rules, setRules] = useState<MappingRule[]>(()=> { try { return JSON.parse(localStorage.getItem(LS_MAP)||'[]'); } catch { return []; } });
  const [newRule, setNewRule] = useState<{module:string; path:string}>({ module:'', path:'/' });

  const refreshItems = async (id: string, p: string) => {
    setBusy(true);
    try {
      const list = await MockGraph.listChildren(cfg, id, p);
      setItems(list);
    } catch (e:any) {
      alert(e.message||String(e));
    } finally { setBusy(false); }
  };

  const connect = async () => {
    setBusy(true); setStatus(t('Đang kết nối...','Connecting...'));
    try {
      await MockGraph.testConnection(cfg);
      const site = await MockGraph.getSite(cfg);
      setSiteName(site.displayName);
      const ds = await MockGraph.listDrives(cfg);
      setDrives(ds);
      const first = ds[0]?.id || '';
      setDriveId(first);
      setPath('/');
      if (first){ await refreshItems(first, '/'); }
      setStatus(t('Kết nối thành công (mock)','Connected (mock)'));
      localStorage.setItem(LS_CFG, JSON.stringify(cfg));
    } catch (e:any) {
      setStatus(t('Lỗi: ','Error: ')+ (e.message||String(e)));
    } finally { setBusy(false); }
  };

  const breadcrumbs = useMemo(()=> {
    const segs = (path||'/').split('/').filter(Boolean);
    const parts = ['/', ...segs.map((_,i)=> '/'+segs.slice(0,i+1).join('/'))];
    const labels = ['/', ...segs];
    return parts.map((p, i) => ({ p, label: labels[i] }));
  }, [path]);

  const openPath = async (p:string) => { setPath(p); if (driveId) await refreshItems(driveId, p); };

  const createFolder = async () => {
    const name = prompt(t('Tên thư mục mới','New folder name'));
    if (!name || !driveId) return;
    setBusy(true);
    try { await MockGraph.createFolder(cfg, driveId, path, name); await refreshItems(driveId, path); }
    catch (e:any){ alert(e.message||String(e)); }
    finally { setBusy(false); }
  };

  const upload = async (f?: File) => {
    if (!f || !driveId) return;
    setBusy(true);
    try { await MockGraph.uploadFile(cfg, driveId, path, f); await refreshItems(driveId, path); }
    catch (e:any){ alert(e.message||String(e)); }
    finally { setBusy(false); }
  };

  const deleteItem = async (id:string) => {
    if (!driveId) return;
    if (!confirm(t('Xóa mục này?','Delete this item?'))) return;
    setBusy(true);
    try { await MockGraph.deleteItem(cfg, driveId, path, id); await refreshItems(driveId, path); }
    catch (e:any){ alert(e.message||String(e)); }
    finally { setBusy(false); }
  };

  const addRule = () => {
    if (!driveId || !newRule.module) { alert(t('Điền module & chọn thư viện','Fill module & choose drive')); return; }
    const id = Math.random().toString(36).slice(2);
    const rule = { id, module: newRule.module, driveId, path };
    const arr = [...rules, rule];
    setRules(arr);
    localStorage.setItem(LS_MAP, JSON.stringify(arr));
    setNewRule({ module:'', path:'/' });
  };
  const removeRule = (id:string) => {
    const arr = rules.filter(r => r.id!==id);
    setRules(arr);
    localStorage.setItem(LS_MAP, JSON.stringify(arr));
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr 360px', gap:12 }}>
      {/* Left: Connection & Settings */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:800 }}>{t('Kết nối SharePoint','SharePoint Connector')}</div>
          <Badge text="INT-01" />
        </div>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Chế độ xác thực','Auth mode')}</span>
          <select value={cfg.authMode} onChange={e=> setCfg({ ...cfg, authMode: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="delegated">Delegated (MSAL)</option>
            <option value="app-only">App-only (Client credentials)</option>
          </select>
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>Tenant ID</span>
          <input value={cfg.tenantId} onChange={e=> setCfg({ ...cfg, tenantId: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>Client ID (App ID)</span>
          <input value={cfg.clientId} onChange={e=> setCfg({ ...cfg, clientId: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Site hostname','Site hostname')}</span>
          <input value={cfg.siteHostname} onChange={e=> setCfg({ ...cfg, siteHostname: e.target.value })} placeholder="contoso.sharepoint.com" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Site path','Site path')}</span>
          <input value={cfg.sitePath} onChange={e=> setCfg({ ...cfg, sitePath: e.target.value })} placeholder="sites/ERP" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <button onClick={connect} disabled={busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>
          {t('Kết nối (mock)','Connect (mock)')}
        </button>
        <div style={{ color:'#6b7280', fontSize:12 }}>{status}</div>
        {siteName && <div style={{ fontSize:12, color:'#334155' }}>{t('Site','Site')}: <b>{siteName}</b></div>}
        {!!drives.length && (
          <label style={{ display:'grid', gap:6 }}>
            <span>{t('Thư viện (Drive)','Document Library (Drive)')}</span>
            <select value={driveId} onChange={async e=> { setDriveId(e.target.value); setPath('/'); await refreshItems(e.target.value, '/'); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              {drives.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {/* Middle: File Browser */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>{t('Duyệt tài liệu','Browse documents')}</div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={createFolder} disabled={!driveId || busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Tạo thư mục','New folder')}</button>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Tải lên','Upload')}
              <input type="file" style={{ display:'none' }} onChange={e=> upload((e.target as HTMLInputElement).files?.[0]||undefined)} />
            </label>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đường dẫn','Path')}:</div>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            {breadcrumbs.map((b,i)=> (
              <span key={b.p} style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
                <a onClick={()=> openPath(b.p)} style={{ cursor:'pointer' }}>{b.label||'/'}</a>
                {i<breadcrumbs.length-1 && <span style={{ color:'#cbd5e1' }}>/</span>}
              </span>
            ))}
          </div>
        </div>
        <div style={{ overflow:'auto', maxHeight:500 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}>{t('Tên','Name')}</th>
              <th style={{ padding:'6px' }}>{t('Loại','Type')}</th>
              <th style={{ padding:'6px' }}>{t('Cập nhật','Modified')}</th>
              <th style={{ padding:'6px', textAlign:'right' }}>{t('Kích thước','Size')}</th>
              <th style={{ padding:'6px' }}>{t('Tác giả','Owner')}</th>
              <th style={{ padding:'6px' }}></th>
            </tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px' }}>
                    {it.isFolder ? <a onClick={()=> openPath((path==='/'?'':path) + '/' + it.name)} style={{ cursor:'pointer', fontWeight:700 }}>{it.name}</a> : it.name}
                  </td>
                  <td style={{ padding:'6px' }}>{it.isFolder ? 'Folder' : 'File'}</td>
                  <td style={{ padding:'6px' }}>{(it.lastModified||'').slice(0,19).replace('T',' ')}</td>
                  <td style={{ padding:'6px', textAlign:'right' }}>{it.isFolder ? '' : bytes(it.size)}</td>
                  <td style={{ padding:'6px' }}>{it.createdBy||'—'}</td>
                  <td style={{ padding:'6px', whiteSpace:'nowrap' }}>
                    {!it.isFolder && <a href="#" onClick={(e)=> e.preventDefault()} style={{ marginRight:8 }}>{t('Tải xuống','Download')}</a>}
                    <a href="#" onClick={(e)=> { e.preventDefault(); deleteItem(it.id); }} style={{ color:'#ef4444' }}>{t('Xóa','Delete')}</a>
                  </td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={6} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có dữ liệu','No data')} —</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: ERP Mapping & How-to */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ fontWeight:700 }}>{t('Mapping ERP → SharePoint','Mapping ERP → SharePoint')}</div>
        <div style={{ display:'grid', gap:8 }}>
          <label style={{ display:'grid', gap:6 }}>
            <span>{t('Module ERP','ERP Module')}</span>
            <input value={newRule.module} onChange={e=> setNewRule({ ...newRule, module: e.target.value })} placeholder="e.g., FIN-10 Expense" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </label>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Lưu ý: sử dụng Drive & Path đang chọn ở panel giữa','Note: will use the currently selected Drive & Path from middle panel')}</div>
          <button onClick={addRule} disabled={!driveId} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm mapping','Add mapping')}</button>
          <div style={{ display:'grid', gap:6 }}>
            {rules.map(r => (
              <div key={r.id} style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{r.module}</div>
                  <div style={{ color:'#6b7280', fontSize:12 }}>Drive: {drives.find(d=>d.id===r.driveId)?.name||r.driveId} • Path: {r.path}</div>
                </div>
                <button onClick={()=> removeRule(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'4px 8px' }}>{t('Xóa','Delete')}</button>
              </div>
            ))}
            {rules.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có mapping','No mappings yet')} —</div>}
          </div>
        </div>

        <div style={{ height:1, background:'#e5e7eb', margin:'6px 0' }} />

        <div style={{ fontWeight:700 }}>{t('Tích hợp thật (gợi ý nhanh)','Production integration (quick guide)')}</div>
        <ol style={{ paddingLeft:16, color:'#475569', fontSize:12, display:'grid', gap:6 }}>
          <li>{t('Đăng ký ứng dụng Azure AD (Entra ID), cấp quyền Microsoft Graph','Register an Azure AD (Entra ID) app, grant Microsoft Graph permissions')}</li>
          <li>Graph scopes: <code>Files.ReadWrite.All</code>, <code>Sites.Read.All</code>, <code>offline_access</code></li>
          <li>{t('Delegated dùng MSAL (PKCE); App-only dùng Client Credentials với chứng thực app','Use MSAL (PKCE) for Delegated; Client Credentials for App-only')}</li>
          <li>{t('API chính','Key APIs')}: <code>/sites/{'{hostname}'}:/{'{site-path}'}:</code> → siteId; <code>/sites/{'{siteId}'}/drives</code>; <code>/drives/{'{driveId}'}/root/children</code>; <code>/drives/{'{driveId}'}/root:/{'{path/file}'}:/content</code></li>
          <li>{t('Bảo mật','Security')}: {t('lưu token an toàn (server), RBAC, audit truy cập; tuân thủ Nghị định 13/2023/ND-CP về dữ liệu cá nhân','store tokens server-side, RBAC & audit; comply with VN Decree 13/2023 on personal data')}</li>
        </ol>
      </div>
    </div>
  );
};
