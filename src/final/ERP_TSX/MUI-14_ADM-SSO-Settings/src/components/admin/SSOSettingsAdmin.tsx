// src/components/admin/SSOSettingsAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getSettings, saveSettings, exportJSON, importJSON,
  addProvider, updateProvider, deleteProvider, setClientSecret, toggleProvider, setDefaultProvider,
  type SSOSettings, type OIDCProvider, type ProviderType
} from '../../mock/sso';

export type SSOSettingsAdminProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getSettings: typeof getSettings;
    saveSettings: typeof saveSettings;
    exportJSON: typeof exportJSON;
    importJSON: typeof importJSON;
    addProvider: typeof addProvider;
    updateProvider: typeof updateProvider;
    deleteProvider: typeof deleteProvider;
    setClientSecret: typeof setClientSecret;
    toggleProvider: typeof toggleProvider;
    setDefaultProvider: typeof setDefaultProvider;
  }>;
};

const providerOptions: ProviderType[] = ['Microsoft','Google','Okta','OIDC'];

export const SSOSettingsAdmin: React.FC<SSOSettingsAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getSettings: adapters.getSettings || getSettings,
    saveSettings: adapters.saveSettings || saveSettings,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
    addProvider: adapters.addProvider || addProvider,
    updateProvider: adapters.updateProvider || updateProvider,
    deleteProvider: adapters.deleteProvider || deleteProvider,
    setClientSecret: adapters.setClientSecret || setClientSecret,
    toggleProvider: adapters.toggleProvider || toggleProvider,
    setDefaultProvider: adapters.setDefaultProvider || setDefaultProvider,
  };

  const [data, setData] = useState<SSOSettings | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);

  useEffect(() => { fns.getSettings().then(s => { setData(s); if (s.providers[0]) setSel(s.providers[0].id); }); }, []);

  if (!data) return <div style={{ padding:12 }}>{t('Đang tải...','Loading...')}</div>;

  const selected = data.providers.find(p => p.id===sel) || null;

  const onAdd = async (type: ProviderType) => {
    const p = await fns.addProvider(type);
    const s = await fns.getSettings();
    setData(s); setSel(p.id);
  };
  const onSave = async () => {
    await fns.saveSettings(data);
    setToast(t('Đã lưu cấu hình','Saved'));
  };
  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='sso_settings.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    await fns.importJSON(file);
    const s = await fns.getSettings();
    setData(s); setToast(t('Đã nhập cấu hình','Imported'));
  };

  const setProv = (patch: Partial<OIDCProvider>) => {
    if (!selected) return;
    setData(d => {
      if (!d) return d;
      return { ...d, providers: d.providers.map(p => p.id===selected.id ? { ...p, ...patch } : p) };
    });
  };
  const commitProv = async (patch: Partial<OIDCProvider>) => {
    if (!selected) return;
    const res = await fns.updateProvider(selected.id, patch);
    setData(d => !d ? d : { ...d, providers: d.providers.map(p => p.id===selected.id ? res : p) });
  };

  const onSetSecret = async () => {
    if (!selected) return;
    // Generate mock plaintext secret and show once
    const randomHex = Array.from({length:24}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('');
    const plain = `oidc_${randomHex}`;
    await fns.setClientSecret(selected.id, plain);
    const s = await fns.getSettings();
    setData(s);
    setSecretOnce(plain);
  };

  const redirectExample = useMemo(() => 'https://erp.example.com/auth/callback/oidc', []);

  const onRemoveProvider = async () => {
    if (!selected) return;
    if (!confirm(t('Xóa nhà cung cấp này?','Delete this provider?'))) return;
    await fns.deleteProvider(selected.id);
    const s = await fns.getSettings();
    setData(s); setSel(s.providers[0]?.id || null);
  };

  const onToggleProvider = async (p: OIDCProvider) => {
    await fns.toggleProvider(p.id, !p.active);
    const s = await fns.getSettings();
    setData(s);
  };

  const makeDefault = async (p: OIDCProvider) => {
    await fns.setDefaultProvider(p.id);
    const s = await fns.getSettings();
    setData(s);
  };

  const removeRedirect = (i: number) => { if (!selected) return; const arr = selected.redirect_uris.filter((_,idx)=>idx!==i); commitProv({ redirect_uris: arr }); };
  const addRedirect = (url: string) => { if (!selected || !url) return; const arr = Array.from(new Set([...(selected.redirect_uris||[]), url])); commitProv({ redirect_uris: arr }); };

  const addDomain = (d: string) => { if (!selected || !d) return; const arr = Array.from(new Set([...(selected.domain_allowlist||[]), d.toLowerCase()])); commitProv({ domain_allowlist: arr }); };
  const removeDomain = (i: number) => { if (!selected) return; const arr = (selected.domain_allowlist||[]).filter((_,idx)=>idx!==i); commitProv({ domain_allowlist: arr }); };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:12, padding:12 }}>
      {/* Left: list & global settings */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Nhà cung cấp SSO','SSO Providers')}</div>
        <div style={{ padding:12, display:'grid', gap:8 }}>
          {data.providers.map(p => (
            <button key={p.id} onClick={()=>setSel(p.id)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: sel===p.id ? '#eef2ff' : '#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{p.type}</div>
                </div>
                <div>{p.active ? <span style={{ color:'#16a34a' }}>●</span> : <span style={{ color:'#ef4444' }}>●</span>}</div>
              </div>
            </button>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
            {providerOptions.map(x => (
              <button key={x} onClick={()=>onAdd(x)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>+ {x}</button>
            ))}
          </div>
          <div style={{ height:8 }} />
          <div style={{ fontWeight:800 }}>{t('Cài đặt chung','Global')}</div>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!data.enforce_sso} onChange={e=>setData({ ...data, enforce_sso: e.target.checked })} />
            {t('Bắt buộc SSO (trừ super admin)','Enforce SSO (except super admins)')}
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!data.allow_password_login_for_admins} onChange={e=>setData({ ...data, allow_password_login_for_admins: e.target.checked })} />
            {t('Cho phép admin đăng nhập bằng mật khẩu','Allow admins to use password login')}
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!data.jit_provisioning} onChange={e=>setData({ ...data, jit_provisioning: e.target.checked })} />
            {t('Tự tạo user khi đăng nhập lần đầu (JIT)','Just-In-Time provisioning')}
          </label>
          <div>
            <label style={{ color:'#6b7280', fontSize:12 }}>{t('Vai trò mặc định khi JIT','Default role for JIT')}</label>
            <input value={data.jit_default_role || ''} onChange={e=>setData({ ...data, jit_default_role: e.target.value })} placeholder="Employee" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          <div>
            <div style={{ color:'#6b7280', fontSize:12, marginBottom:6 }}>{t('Ánh xạ nhóm → vai trò','Group → Role mapping')}</div>
            <div style={{ display:'grid', gap:6 }}>
              {(data.role_mapping||[]).map((m, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:6, alignItems:'center' }}>
                  <input value={m.group} onChange={e=>{
                    const arr = (data.role_mapping||[]).slice(); arr[idx] = { ...m, group:e.target.value };
                    setData({ ...data, role_mapping: arr });
                  }} placeholder="AAD Group / Okta Group" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input value={m.role} onChange={e=>{
                    const arr = (data.role_mapping||[]).slice(); arr[idx] = { ...m, role:e.target.value };
                    setData({ ...data, role_mapping: arr });
                  }} placeholder="ERP Role (e.g., Manager)" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <button onClick={()=>{
                    const arr = (data.role_mapping||[]).filter((_,i)=>i!==idx);
                    setData({ ...data, role_mapping: arr });
                  }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff' }}>✕</button>
                </div>
              ))}
              <button onClick={()=>setData({ ...data, role_mapping: [...(data.role_mapping||[]), { group:'', role:'' }] })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff', width:140 }}>{t('Thêm dòng','Add row')}</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
            <button onClick={onSave} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu tất cả','Save all')}</button>
          </div>
        </div>
      </aside>

      {/* Right: provider details */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Chi tiết nhà cung cấp','Provider details')}</div>
          {selected && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>onToggleProvider(selected)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{selected.active ? t('Tạm dừng','Pause') : t('Kích hoạt','Enable')}</button>
              <button onClick={()=>makeDefault(selected)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Đặt mặc định','Make default')}</button>
              <button onClick={onRemoveProvider} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>
            </div>
          )}
        </div>
        {!selected && <div style={{ padding:12, color:'#6b7280' }}>{t('Chọn một provider để cấu hình','Select a provider to configure')}</div>}
        {selected && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center' }}>
              <label style={{ color:'#6b7280' }}>{t('Tên hiển thị','Display name')}</label>
              <input value={selected.name} onChange={e=>setProv({ name:e.target.value })} onBlur={()=>commitProv({ name:selected.name })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Loại','Type')}</label>
              <input value={selected.type} disabled style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#f9fafb' }} />
              <label style={{ color:'#6b7280' }}>Issuer</label>
              <input value={selected.issuer || ''} onChange={e=>setProv({ issuer:e.target.value })} onBlur={()=>commitProv({ issuer:selected.issuer })} placeholder="https://accounts.google.com" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>Client ID</label>
              <input value={selected.client_id} onChange={e=>setProv({ client_id:e.target.value })} onBlur={()=>commitProv({ client_id:selected.client_id })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Client Secret','Client Secret')}</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={selected.client_secret_set ? t('— Đã cài đặt —','— Set —') : t('— Chưa cài đặt —','— Not set —')} disabled style={{ border:'1px dashed #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#f9fafb', color:'#6b7280', width:'100%' }} />
                <button onClick={onSetSecret} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{selected.client_secret_set ? t('Thay đổi','Change') : t('Cài đặt','Set')}</button>
              </div>
              <label style={{ color:'#6b7280' }}>{t('Scopes','Scopes')}</label>
              <input value={selected.scopes.join(' ')} onChange={e=>setProv({ scopes: e.target.value.split(/\s+/).filter(Boolean) })} onBlur={()=>commitProv({ scopes:selected.scopes })} placeholder="openid profile email" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Redirect URIs','Redirect URIs')}</label>
              <div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                  {selected.redirect_uris.map((u,i)=>(
                    <span key={u+i} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 8px', background:'#fff', display:'inline-flex', alignItems:'center', gap:6 }}>
                      <span style={{ maxWidth:380, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={u}>{u}</span>
                      <button onClick={()=>removeRedirect(i)} style={{ border:'none', background:'transparent', color:'#ef4444', cursor:'pointer' }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input id="newRedirect" placeholder={redirectExample} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', flex:1 }} />
                  <button onClick={()=>{
                    const el = document.getElementById('newRedirect') as HTMLInputElement | null;
                    if (el && el.value) { addRedirect(el.value); el.value=''; }
                  }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm','Add')}</button>
                </div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:6 }}>{t('Ví dụ callback','Example callback')}: <code>{redirectExample}</code></div>
              </div>
              <label style={{ color:'#6b7280' }}>{t('Claims mapping','Claims mapping')}</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <input value={selected.claim_map.email} onChange={e=>setProv({ claim_map: { ...selected.claim_map, email: e.target.value } as any })} onBlur={()=>commitProv({ claim_map:selected.claim_map })} placeholder="email" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
                <input value={selected.claim_map.name || ''} onChange={e=>setProv({ claim_map: { ...selected.claim_map, name: e.target.value } as any })} onBlur={()=>commitProv({ claim_map:selected.claim_map })} placeholder="name" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
                <input value={selected.claim_map.groups || ''} onChange={e=>setProv({ claim_map: { ...selected.claim_map, groups: e.target.value } as any })} onBlur={()=>commitProv({ claim_map:selected.claim_map })} placeholder="groups" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <label style={{ color:'#6b7280' }}>{t('Giới hạn domain email','Email domain allowlist')}</label>
              <div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                  {(selected.domain_allowlist||[]).map((d,i)=>(
                    <span key={d+i} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 8px', background:'#fff' }}>
                      {d} <button onClick={()=>removeDomain(i)} style={{ border:'none', background:'transparent', color:'#ef4444', cursor:'pointer' }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input id="newDomain" placeholder="example.com" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', flex:1 }} />
                  <button onClick={()=>{
                    const el = document.getElementById('newDomain') as HTMLInputElement | null;
                    if (el && el.value) { addDomain(el.value); el.value=''; }
                  }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm','Add')}</button>
                </div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:6 }}>{t('Để trống để cho phép tất cả domain.','Leave blank to allow all domains.')}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
              <button onClick={()=>window.open('https://example.com/.well-known/openid-configuration','_blank')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Mở Discovery (tham khảo)','Open Discovery (ref)')}</button>
              <button onClick={onSave} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Lưu thay đổi','Save')}</button>
            </div>
            <div style={{ fontSize:12, color:'#6b7280' }}>
              {t('Mẹo: Trên IdP hãy cấu hình redirect/callback đúng và bật claims email/name/groups.','Tip: Configure redirect/callback on IdP and enable email/name/groups claims.')}
            </div>
          </div>
        )}
        <div style={{ borderTop:'1px solid #e5e7eb', padding:'8px 12px', background:'#f9fafb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Nhà cung cấp mặc định','Default provider')}: <b>{data.providers.find(p=>p.id===data.default_provider_id)?.name || t('(chưa đặt)','(unset)')}</b></div>
        </div>
      </section>

      {/* Secret once modal */}
      {secretOnce && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'min(720px, 96vw)', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Client Secret — Hiển thị một lần','Client Secret — Shown once')}</div>
            <div style={{ padding:12, display:'grid', gap:10 }}>
              <div style={{ fontSize:14 }}>{t('Hãy sao chép và lưu trữ an toàn. Sau khi đóng, bạn sẽ không xem lại được giá trị.','Copy and store securely. After closing, you cannot view it again.')}</div>
              <div style={{ fontFamily:'monospace', fontSize:14, border:'1px dashed #e5e7eb', borderRadius:8, padding:'10px 12px', background:'#f9fafb', wordBreak:'break-all' }}>{secretOnce}</div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={()=>{ navigator.clipboard.writeText(secretOnce); setToast(t('Đã sao chép','Copied')); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>{t('Copy','Copy')}</button>
                <button onClick={()=>setSecretOnce(null)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Đóng','Close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:999, fontSize:13 }}
             onAnimationEnd={()=>setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
};
