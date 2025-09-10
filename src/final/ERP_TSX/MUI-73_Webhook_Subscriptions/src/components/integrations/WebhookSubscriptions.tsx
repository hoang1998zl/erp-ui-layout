
// src/components/integrations/WebhookSubscriptions.tsx — INT-05
import React, { useEffect, useMemo, useState } from 'react';
import type { WebhookSubscription, EventType } from '../../integrations/webhooks/types';
import { Entities, listSubs, createSub, updateSub, deleteSub, simulateDeliver, listLogsBySub } from '../../integrations/webhooks/mockStore';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function copy(s: string){ navigator.clipboard.writeText(s); }
function short(s: string, n=64){ return s.length>n ? s.slice(0,n-1)+'…' : s; }

const ALL_EVENTS: EventType[] = ['entity.created','entity.updated','entity.deleted','status.changed','approval.submitted','approval.approved','approval.rejected','webhook.ping'];

export const WebhookSubscriptions: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [subs, setSubs] = useState<WebhookSubscription[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const selected = subs.find(s => s.id===selectedId) || null;

  const reload = () => setSubs(listSubs());

  useEffect(()=> { if (listSubs().length===0){ const s = createSub(); setSelectedId(s.id); } reload(); }, []);

  useEffect(()=> { if (!selectedId && subs.length){ setSelectedId(subs[0].id); } }, [subs, selectedId]);

  const [maskSecret, setMaskSecret] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(()=> { if (selected) setLogs(listLogsBySub(selected.id)); }, [selectedId]);

  const onChange = (patch: Partial<WebhookSubscription>) => {
    if (!selected) return;
    const s = { ...selected, ...patch }; updateSub(s); reload();
  };

  const ping = async () => {
    if (!selected) return;
    await simulateDeliver(selected, 'webhook.ping');
    setLogs(listLogsBySub(selected.id));
  };

  const replay = async (event: EventType) => {
    if (!selected) return;
    await simulateDeliver(selected, event);
    setLogs(listLogsBySub(selected.id));
  };

  const curlFor = (sub: WebhookSubscription, payload: any, signature?: string) => {
    const body = JSON.stringify(payload, null, 2).replace('$','\\$');
    const lines = [
      `curl -X POST \\`,
      `  '${sub.targetUrl}' \\`,
      `  -H 'Content-Type: ${sub.contentType}' \\`,
      ...(signature ? [`  -H 'X-ERP-Signature-256: ${signature}' \\`] : []),
      ...(sub.headers||[]).filter(h=>h.key && h.value).map(h => `  -H '${h.key}: ${h.value}' \\`),
      `  --data '${body.replace(/'/g, "'\\''")}'`
    ];
    return lines.join('\n');
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr 480px', gap:12 }}>
      {/* Left: list & actions */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:800 }}>{t('Webhook Subscriptions','Webhook Subscriptions')}</div>
          <Badge text="INT-05" />
        </div>
        <button onClick={()=> { const s = createSub(); reload(); setSelectedId(s.id); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Tạo subscription','New subscription')}</button>
        <div style={{ display:'grid', gap:6, maxHeight:420, overflow:'auto' }}>
          {subs.map(s => (
            <button key={s.id} onClick={()=> setSelectedId(s.id)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: selectedId===s.id? '#eef2ff':'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontWeight:700 }}>{s.name}</div>
                <Badge text={s.active? t('bật','on'):t('tắt','off')} tone={s.active?'green':'red'} />
              </div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{short(s.targetUrl, 44)}</div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Sự kiện','Events')}: {s.events.length}</div>
            </button>
          ))}
          {subs.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có subscription','No subscriptions yet')} —</div>}
        </div>
        {selected && (
          <button onClick={()=> { if(confirm(t('Xóa subscription này?','Delete this subscription?'))){ deleteSub(selected.id); reload(); setSelectedId(''); } }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xóa','Delete')}</button>
        )}
      </div>

      {/* Middle: editor */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10 }}>
        {!selected && <div style={{ color:'#6b7280' }}>{t('Chọn một subscription để chỉnh sửa hoặc tạo mới.','Select a subscription to edit or create a new one.')}</div>}
        {selected && (
          <div style={{ display:'grid', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input value={selected.name} onChange={e=> onChange({ name: e.target.value })} placeholder="My ERP → Partner" style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', fontWeight:700 }} />
              <label style={{ display:'flex', gap:6, alignItems:'center' }}><input type="checkbox" checked={selected.active} onChange={e=> onChange({ active: e.target.checked })} /><span>{t('Kích hoạt','Active')}</span></label>
            </div>
            <label style={{ display:'grid', gap:6 }}>
              <span>Target URL</span>
              <input value={selected.targetUrl} onChange={e=> onChange({ targetUrl: e.target.value })} placeholder="https://..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <span>Secret</span>
                <input value={selected.secret||''} onChange={e=> onChange({ secret: e.target.value })} placeholder="(optional)" type={maskSecret?'password':'text'} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </label>
              <div style={{ display:'flex', alignItems:'end' }}>
                <button onClick={()=> setMaskSecret(m => !m)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{maskSecret? t('Hiện','Unmask'): t('Ẩn','Mask')}</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <span>{t('Thực thể','Entity')}</span>
                <select value={selected.entity} onChange={e=> onChange({ entity: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  {Entities.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <div>
                <div style={{ marginBottom:6 }}>{t('Sự kiện','Events')}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ALL_EVENTS.map(ev => (
                    <label key={ev} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 8px', display:'inline-flex', gap:6, alignItems:'center' }}>
                      <input
                        type="checkbox"
                        checked={selected.events.includes(ev)}
                        onChange={e=> {
                          const set = new Set(selected.events);
                          if (e.target.checked) set.add(ev); else set.delete(ev);
                          onChange({ events: Array.from(set) as EventType[] });
                        }}
                      />
                      <span style={{ fontSize:12 }}>{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Headers */}
            <div>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Headers tùy chỉnh','Custom headers')}</div>
              {(selected.headers||[]).map((h,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:6 }}>
                  <input value={h.key} onChange={e=> { const arr=[...(selected.headers||[])]; arr[i]={ ...arr[i], key:e.target.value }; onChange({ headers: arr }); }} placeholder="X-Partner-Key" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input value={h.value} onChange={e=> { const arr=[...(selected.headers||[])]; arr[i]={ ...arr[i], value:e.target.value }; onChange({ headers: arr }); }} placeholder="abcdef..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <button onClick={()=> { const arr=[...(selected.headers||[])]; arr.splice(i,1); onChange({ headers: arr }); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xóa','Delete')}</button>
                </div>
              ))}
              <button onClick={()=> onChange({ headers: [ ...(selected.headers||[]), { key:'', value:'' } ] })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm header','Add header')}</button>
            </div>

            {/* Retry policy */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><span>{t('Nội dung','Content type')}</span>
                <input value={selected.contentType} disabled style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </label>
              <label style={{ display:'grid', gap:6 }}><span>{t('Version','Version')}</span>
                <input value={selected.version} disabled style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </label>
              <label style={{ display:'grid', gap:6 }}><span>{t('Số lần thử tối đa','Max attempts')}</span>
                <input type="number" min={1} max={10} value={selected.retry.maxAttempts} onChange={e=> onChange({ retry: { ...selected.retry, maxAttempts: Number(e.target.value)||1 } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><span>{t('Backoff (giây)','Backoff (s)')}</span>
                <input type="number" min={1} max={3600} value={selected.retry.backoffSeconds} onChange={e=> onChange({ retry: { ...selected.retry, backoffSeconds: Number(e.target.value)||30 } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </label>
              <div style={{ display:'flex', alignItems:'end', gap:8 }}>
                <button onClick={ping} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Gửi ping (mock)','Send ping (mock)')}</button>
              </div>
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>
              {t('Ký chữ ký HMAC-SHA256 vào header','Sign HMAC-SHA256 in header')}: <code>X-ERP-Signature-256</code> {t('dạng','as')} <code>t=&lt;unix&gt;,v1=&lt;hex&gt;</code>.
            </div>
          </div>
        )}
      </div>

      {/* Right: deliveries */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:700 }}>{t('Giao nhận gần đây','Recent deliveries')}</div>
          {selected && <button onClick={()=> setLogs(listLogsBySub(selected.id))} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Làm mới','Refresh')}</button>}
        </div>
        {!selected && <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chọn subscription để xem logs.','Select a subscription to see logs.')}</div>}
        {selected && (
          <div style={{ display:'grid', gap:8 }}>
            {logs.map((l:any) => (
              <div key={l.id} style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:'8px 10px', display:'grid', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontFamily:'monospace' }}>{(l.at||'').slice(0,19).replace('T',' ')}</div>
                  <Badge text={String(l.status)} tone={l.status===200?'green':'amber'} />
                  <div style={{ color:'#6b7280', fontSize:12 }}>{t('Thời gian','Time')}: {l.durationMs}ms • {t('Thử','Attempts')}: {l.attempts}</div>
                </div>
                <div style={{ color:'#334155', fontSize:13 }}>{t('Sự kiện','Event')}: <b>{l.event}</b> • {t('Thực thể','Entity')}: <b>{l.payload?.entity}</b> • ID: <b>{l.payload?.data?.id}</b></div>
                {l.signature && <div style={{ fontSize:12, color:'#6b7280' }}>X-ERP-Signature-256: <code>{l.signature}</code> <a style={{ marginLeft:6, cursor:'pointer' }} onClick={()=> copy(l.signature)}>copy</a></div>}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={()=> replay(l.event)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Gửi lại (mock)','Replay (mock)')}</button>
                  <button onClick={()=> alert(JSON.stringify(l.payload, null, 2))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xem payload','View payload')}</button>
                  <button onClick={()=> copy((()=>{ const sub = subs.find(s=>s.id===l.subId)!; return (document.getElementById('curl-'+l.id) as HTMLTextAreaElement).value; })())} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Copy cURL','Copy cURL')}</button>
                </div>
                <textarea id={'curl-'+l.id} readOnly style={{ width:'100%', height:120, border:'1px solid #e5e7eb', borderRadius:8, padding:8, fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12 }}>
{(() => { 
  const sub = (window as any).SUBS?.find((s:any)=> s.id===l.subId) || subs.find(s=>s.id===l.subId);
  const headers = (sub?.headers||[]).filter((h:any)=>h.key && h.value).map((h:any)=>`  -H '${h.key}: ${h.value}' \\`).join('\n');
  const sig = l.signature ? `  -H 'X-ERP-Signature-256: ${l.signature}' \\\n` : '';
  const body = JSON.stringify(l.payload, null, 2).replace('$','\\$').replace("'", "'\\''");
  return `curl -X POST \\\n  '${sub?.targetUrl||''}' \\\n  -H 'Content-Type: application/json' \\\n${sig}${headers}\n  --data '${body}'`;
})()}
                </textarea>
              </div>
            ))}
            {logs.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có delivery','No deliveries yet')} —</div>}
          </div>
        )}
        <div style={{ color:'#6b7280', fontSize:12 }}>
          {t('Demo giả lập không gửi HTTP thật. Dùng cURL để test endpoint đối tác.','Mock demo does not send real HTTP. Use the cURL to test partner endpoints.')}
        </div>
      </div>
    </div>
  );
};
