// src/components/admin/ApiTokensAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listScopes, listTokens, createToken, revokeToken, rotateToken, deleteToken,
  listWebhooks, createWebhook, rotateWebhookSecret, toggleWebhook, deleteWebhook, sendTestDelivery,
  exportJSON, importJSON,
  type Scope, type ApiToken, type WebhookEndpoint
} from '../../mock/apiTokens';

export type ApiTokensAdminProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listScopes: typeof listScopes;
    listTokens: typeof listTokens;
    createToken: typeof createToken;
    revokeToken: typeof revokeToken;
    rotateToken: typeof rotateToken;
    deleteToken: typeof deleteToken;
    listWebhooks: typeof listWebhooks;
    createWebhook: typeof createWebhook;
    rotateWebhookSecret: typeof rotateWebhookSecret;
    toggleWebhook: typeof toggleWebhook;
    deleteWebhook: typeof deleteWebhook;
    sendTestDelivery: typeof sendTestDelivery;
    exportJSON: typeof exportJSON;
    importJSON: typeof importJSON;
  }>;
};

type Tab = 'tokens'|'webhooks';

export const ApiTokensAdmin: React.FC<ApiTokensAdminProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    listScopes: adapters.listScopes || listScopes,
    listTokens: adapters.listTokens || listTokens,
    createToken: adapters.createToken || createToken,
    revokeToken: adapters.revokeToken || revokeToken,
    rotateToken: adapters.rotateToken || rotateToken,
    deleteToken: adapters.deleteToken || deleteToken,
    listWebhooks: adapters.listWebhooks || listWebhooks,
    createWebhook: adapters.createWebhook || createWebhook,
    rotateWebhookSecret: adapters.rotateWebhookSecret || rotateWebhookSecret,
    toggleWebhook: adapters.toggleWebhook || toggleWebhook,
    deleteWebhook: adapters.deleteWebhook || deleteWebhook,
    sendTestDelivery: adapters.sendTestDelivery || sendTestDelivery,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };

  const [tab, setTab] = useState<Tab>('tokens');
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [q, setQ] = useState('');

  const [secretOnce, setSecretOnce] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const [sc, tk, wh] = await Promise.all([fns.listScopes(), fns.listTokens(), fns.listWebhooks()]);
    setScopes(sc); setTokens(tk); setWebhooks(wh);
  };
  useEffect(() => { load(); }, []);

  const filteredTokens = useMemo(() => {
    const qq = q.toLowerCase().trim();
    return tokens.filter(tk => !qq || tk.name.toLowerCase().includes(qq) || tk.scopes.some(s => s.includes(qq)));
  }, [tokens, q]);

  const groupScopes = useMemo(() => {
    const g: Record<string, Scope[]> = {};
    scopes.forEach(s => { (g[s.group] ||= []).push(s); });
    return g;
  }, [scopes]);

  // Token actions
  const onCreateToken = async () => {
    const name = prompt(t('Tên token','Token name'));
    if (!name) return;
    // simple scope picker: select all by default; in real UI, show modal. We'll pick read-only subset via prompt? For demo, all read scopes.
    const selected = scopes.filter(s => /:read$/.test(s.key)).map(s => s.key);
    const res = await fns.createToken({ name, scopes: selected, expires_in_days: 90 });
    setTokens([res.token, ...tokens]);
    setSecretOnce(res.plaintext);
  };
  const onRevoke = async (id: string) => {
    await fns.revokeToken(id);
    setTokens(tokens.map(tk => tk.id===id ? { ...tk, active:false } : tk));
  };
  const onRotate = async (id: string) => {
    const r = await fns.rotateToken(id);
    setTokens(tokens.map(tk => tk.id===id ? { ...tk, prefix:r.prefix } : tk));
    setSecretOnce(r.plaintext);
  };
  const onDelete = async (id: string) => {
    if (!confirm(t('Xóa token này?','Delete this token?'))) return;
    await fns.deleteToken(id);
    setTokens(tokens.filter(tk => tk.id !== id));
  };

  // Webhook actions
  const onCreateWebhook = async () => {
    const url = prompt('Webhook URL (https://...)');
    if (!url) return;
    const events = ['expense.submitted','task.completed','document.uploaded'];
    const res = await fns.createWebhook({ url, events });
    setWebhooks([res.endpoint, ...webhooks]);
    setSecretOnce(res.plaintext_secret);
  };
  const onRotateWh = async (id: string) => {
    const r = await fns.rotateWebhookSecret(id);
    setWebhooks(webhooks.map(w => w.id===id ? { ...w, secret_prefix: r.prefix } : w));
    setSecretOnce(r.plaintext);
  };
  const onToggleWh = async (w: WebhookEndpoint) => {
    await fns.toggleWebhook(w.id, !w.active);
    setWebhooks(webhooks.map(x => x.id===w.id ? { ...x, active: !x.active } : x));
  };
  const onDeleteWh = async (id: string) => {
    if (!confirm(t('Xóa webhook này?','Delete this webhook?'))) return;
    await fns.deleteWebhook(id);
    setWebhooks(webhooks.filter(w => w.id !== id));
  };
  const onTestWh = async (id: string) => {
    await fns.sendTestDelivery(id, 'test.ping');
    const list = await fns.listWebhooks();
    setWebhooks(list);
    setToast(t('Đã gửi test event','Test event sent'));
  };

  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='api_tokens_webhooks.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    await fns.importJSON(file);
    await load();
    setToast(t('Đã nhập cấu hình','Imported'));
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:12, padding:12 }}>
      {/* Left nav */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8, alignContent:'start' }}>
        <button onClick={()=>setTab('tokens')} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: tab==='tokens' ? '#eef2ff' : '#fff', fontWeight: tab==='tokens' ? 700 : 500 }}>{t('API Tokens','API Tokens')}</button>
        <button onClick={()=>setTab('webhooks')} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: tab==='webhooks' ? '#eef2ff' : '#fff', fontWeight: tab==='webhooks' ? 700 : 500 }}>Webhooks</button>
        <div style={{ height:8 }} />
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
          </label>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
        </div>
      </aside>

      {/* Right content */}
      <main style={{ display:'grid', gap:12, alignContent:'start' }}>
        {tab==='tokens' && (
          <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:800 }}>{t('API Tokens','API Tokens')}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm tên hoặc scope...','Search name or scope...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
                <button onClick={onCreateToken} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Tạo token','Create token')}</button>
              </div>
            </div>
            <div style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                    <th style={{ textAlign:'left', padding:10, width:260 }}>{t('Tên','Name')}</th>
                    <th style={{ textAlign:'left', padding:10 }}>{t('Scope','Scopes')}</th>
                    <th style={{ textAlign:'left', padding:10, width:120 }}>{t('Tình trạng','Status')}</th>
                    <th style={{ textAlign:'left', padding:10, width:160 }}>{t('Hết hạn','Expires')}</th>
                    <th style={{ textAlign:'left', padding:10, width:160 }}>{t('Lần dùng gần nhất','Last used')}</th>
                    <th style={{ textAlign:'left', padding:10, width:220 }}>{t('Hành động','Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map(tk => (
                    <tr key={tk.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:10 }}>
                        <div style={{ fontWeight:700 }}>{tk.name}</div>
                        <div style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{tk.prefix}</div>
                      </td>
                      <td style={{ padding:10 }}>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {tk.scopes.map(sc => <span key={sc} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 8px', fontSize:12, background:'#fff' }}>{sc}</span>)}
                        </div>
                      </td>
                      <td style={{ padding:10 }}>{tk.active ? <span style={{ color:'#16a34a' }}>● {t('Đang hoạt động','Active')}</span> : <span style={{ color:'#ef4444' }}>● {t('Đã thu hồi','Revoked')}</span>}</td>
                      <td style={{ padding:10 }}>{tk.expires_at ? new Date(tk.expires_at).toLocaleString() : t('Không','None')}</td>
                      <td style={{ padding:10 }}>{tk.last_used_at ? new Date(tk.last_used_at).toLocaleString() : '—'}</td>
                      <td style={{ padding:10 }}>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {tk.active && <button onClick={()=>onRotate(tk.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Rotate','Rotate')}</button>}
                          {tk.active && <button onClick={()=>onRevoke(tk.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Thu hồi','Revoke')}</button>}
                          <button onClick={()=>onDelete(tk.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTokens.length === 0 && (
                    <tr><td colSpan={6} style={{ padding:14, color:'#6b7280' }}>{t('Không có token','No tokens')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab==='webhooks' && (
          <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:800 }}>Webhooks</div>
              <button onClick={onCreateWebhook} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 10px' }}>{t('Thêm webhook','Add webhook')}</button>
            </div>
            <div style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                    <th style={{ textAlign:'left', padding:10, width:320 }}>URL</th>
                    <th style={{ textAlign:'left', padding:10 }}>{t('Sự kiện','Events')}</th>
                    <th style={{ textAlign:'left', padding:10, width:120 }}>{t('Tình trạng','Status')}</th>
                    <th style={{ textAlign:'left', padding:10, width:180 }}>{t('Gần nhất','Last delivery')}</th>
                    <th style={{ textAlign:'left', padding:10, width:260 }}>{t('Hành động','Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map(w => (
                    <tr key={w.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:10 }}>
                        <div style={{ fontWeight:700, wordBreak:'break-all' }}>{w.url}</div>
                        <div style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{w.secret_prefix}</div>
                      </td>
                      <td style={{ padding:10 }}>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {w.events.map(e => <span key={e} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 8px', fontSize:12, background:'#fff' }}>{e}</span>)}
                        </div>
                      </td>
                      <td style={{ padding:10 }}>{w.active ? <span style={{ color:'#16a34a' }}>● {t('Hoạt động','Active')}</span> : <span style={{ color:'#ef4444' }}>● {t('Tạm dừng','Paused')}</span>}</td>
                      <td style={{ padding:10 }}>{w.last_delivery_at ? `${new Date(w.last_delivery_at).toLocaleString()} (${w.last_delivery_status})` : '—'}</td>
                      <td style={{ padding:10 }}>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <button onClick={()=>onTestWh(w.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Gửi test','Send test')}</button>
                          <button onClick={()=>onRotateWh(w.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Rotate secret','Rotate secret')}</button>
                          <button onClick={()=>onToggleWh(w)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{w.active ? t('Tạm dừng','Pause') : t('Kích hoạt','Resume')}</button>
                          <button onClick={()=>onDeleteWh(w.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                        </div>
                        {w.deliveries && w.deliveries.length > 0 && (
                          <details style={{ marginTop:8 }}>
                            <summary style={{ cursor:'pointer' }}>{t('Nhật ký gửi gần đây','Recent deliveries')}</summary>
                            <div style={{ marginTop:6, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
                              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead>
                                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                                    <th style={{ textAlign:'left', padding:8, width:170 }}>Time</th>
                                    <th style={{ textAlign:'left', padding:8, width:160 }}>Event</th>
                                    <th style={{ textAlign:'left', padding:8, width:80 }}>HTTP</th>
                                    <th style={{ textAlign:'left', padding:8, width:100 }}>Duration</th>
                                    <th style={{ textAlign:'left', padding:8 }}>Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {w.deliveries?.slice().reverse().map(d => (
                                    <tr key={d.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                                      <td style={{ padding:8 }}>{new Date(d.ts).toLocaleString()}</td>
                                      <td style={{ padding:8 }}>{d.event}</td>
                                      <td style={{ padding:8 }}>{d.status}</td>
                                      <td style={{ padding:8 }}>{d.duration_ms} ms</td>
                                      <td style={{ padding:8 }}>{d.success ? 'success' : 'fail'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                  {webhooks.length === 0 && (
                    <tr><td colSpan={5} style={{ padding:14, color:'#6b7280' }}>{t('Chưa có webhook','No webhooks')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* One-time secret modal */}
      {secretOnce && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'min(720px, 96vw)', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Mã bí mật — Chỉ hiển thị một lần','Secret — Shown once')}</div>
            <div style={{ padding:12, display:'grid', gap:10 }}>
              <div style={{ fontSize:14 }}>{t('Hãy sao chép và lưu trữ an toàn. Sau khi đóng, bạn sẽ không xem lại được giá trị đầy đủ.','Copy and store securely. After closing, the full value cannot be viewed again.')}</div>
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
