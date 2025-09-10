
// src/components/integrations/EmailIngestor.tsx — INT-02
import React, { useEffect, useMemo, useState } from 'react';
import type { Config, Email, Rule, Folder } from '../../integrations/email/types';
import { MockMailbox } from '../../integrations/email/mockMailbox';
import { parseEmail, applyRules } from '../../integrations/email/parser';

const LS_CFG = 'erp.int.email.cfg.v1';
const LS_RULES = 'erp.int.email.rules.v1';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function bytes(n:number){ if (n<1024) return `${n} B`; if (n<1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }

export const EmailIngestor: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [cfg, setCfg] = useState<Config>(()=> { try { return JSON.parse(localStorage.getItem(LS_CFG)||'null') || { provider:'mock', mailbox:'ingest@company.vn' }; } catch { return { provider:'mock', mailbox:'ingest@company.vn' }; } });
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folder, setFolder] = useState<string>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email|null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const [rules, setRules] = useState<Rule[]>(()=> { try { return JSON.parse(localStorage.getItem(LS_RULES)||'[]'); } catch { return []; } });
  const [editing, setEditing] = useState<Rule|null>(null);

  const refresh = async () => {
    setBusy(true); setStatus(t('Đang tải hộp thư...','Loading mailbox...'));
    try {
      const fs = await MockMailbox.listFolders(cfg);
      setFolders(fs);
      const list = await MockMailbox.listEmails(cfg, folder);
      setEmails(list);
      setStatus(t('Đã tải xong.','Loaded.'));
    } catch (e:any){
      setStatus(t('Lỗi: ','Error: ') + (e.message||String(e)));
    } finally { setBusy(false); }
  };

  useEffect(()=> { refresh(); }, [folder]);

  const parsed = useMemo(()=> selected ? parseEmail(selected) : null, [selected]);
  const decision = useMemo(()=> selected ? applyRules(selected, rules) : null, [selected, rules]);

  const saveConfig = () => { localStorage.setItem(LS_CFG, JSON.stringify(cfg)); setStatus(t('Đã lưu cấu hình (local).','Config saved (local).')); };
  const saveRules = (arr:Rule[]) => { setRules(arr); localStorage.setItem(LS_RULES, JSON.stringify(arr)); };

  const ingestSelected = async () => {
    if (!selected || !decision) return;
    const ref = decision.target.type==='ticket' ? `TCK-${Math.floor(Math.random()*9000+1000)}` : `DOC-${Math.floor(Math.random()*9000+1000)}`;
    setBusy(true);
    try {
      await MockMailbox.markIngested(cfg, folder, selected.id, { type: decision.target.type, ref });
      await refresh();
      setSelected(null);
      setStatus(t('Đã nạp thành công → ERP ','Ingested into ERP ') + ref);
    } catch (e:any){ setStatus(t('Lỗi nạp: ','Ingest error: ') + (e.message||String(e))); }
    finally { setBusy(false); }
  };

  const newRule = () : Rule => ({
    id: Math.random().toString(36).slice(2),
    name: 'New rule',
    enabled: true,
    when: { },
    then: { type:'ticket', tagsFromSubject: true, defaultProject:'' }
  });

  const headerKV = (e: Email) => {
    const h = e.headers||{};
    const keys = ['Message-ID','In-Reply-To','References','X-SPF','X-DMARC','DKIM-Signature','X-Mailer'];
    return keys.map(k => ({ k, v: h[k] })).filter(x => x.v);
  };

  const [query, setQuery] = useState<string>('');

  const filtered = emails.filter(e => {
    if (query){
      const q = query.toLowerCase();
      return (e.subject||'').toLowerCase().includes(q) || (e.from||'').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr 380px', gap:12 }}>
      {/* Left: Connection & Folders */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:800 }}>{t('Email Ingestor','Email Ingestor')}</div>
          <Badge text="INT-02" />
        </div>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Nhà cung cấp','Provider')}</span>
          <select value={cfg.provider} onChange={e=> setCfg({ ...cfg, provider: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="mock">Mock</option>
            <option value="gmail">Gmail API</option>
            <option value="m365">Microsoft 365</option>
            <option value="imap">IMAP</option>
          </select>
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Mailbox','Mailbox')}</span>
          <input value={cfg.mailbox} onChange={e=> setCfg({ ...cfg, mailbox: e.target.value })} placeholder="ingest@company.vn" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <button onClick={saveConfig} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu cấu hình (local)','Save config (local)')}</button>
        <div style={{ height:1, background:'#e5e7eb' }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:700 }}>{t('Thư mục','Folders')}</div>
          <button onClick={refresh} disabled={busy} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Làm mới','Refresh')}</button>
        </div>
        <div style={{ display:'grid', gap:6 }}>
          {folders.map(f => (
            <button key={f.id} onClick={()=> setFolder(f.id)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background: folder===f.id ? '#eef2ff':'#fff' }}>
              {f.name}
            </button>
          ))}
          {!folders.length && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Không có','None')} —</div>}
        </div>
        <div style={{ color:'#6b7280', fontSize:12 }}>{status}</div>
      </div>

      {/* Middle: Email list & details */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gridTemplateRows:'auto 1fr', gap:10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input placeholder={t('Tìm theo subject/from','Search subject/from')} value={query} onChange={e=> setQuery(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:320 }} />
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button disabled={!selected} onClick={ingestSelected} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Nạp vào ERP','Ingest to ERP')}</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:10, minHeight:420 }}>
          {/* List */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>{t('Email','Emails')}</div>
            <div style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ padding:'6px' }}>{t('Chủ đề','Subject')}</th>
                  <th style={{ padding:'6px' }}>{t('Từ','From')}</th>
                  <th style={{ padding:'6px' }}>{t('Ngày','Date')}</th>
                  <th style={{ padding:'6px' }}>{t('Đính kèm','Att')}</th>
                  <th style={{ padding:'6px' }}>{t('Trạng thái','Status')}</th>
                </tr></thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} onClick={()=> setSelected(e)} style={{ borderTop:'1px solid #f1f5f9', background: selected?.id===e.id ? '#f8fafc' : 'transparent', cursor:'pointer' }}>
                      <td style={{ padding:'6px' }}>{e.subject}</td>
                      <td style={{ padding:'6px' }}>{e.from}</td>
                      <td style={{ padding:'6px' }}>{(e.date||'').slice(0,16).replace('T',' ')}</td>
                      <td style={{ padding:'6px' }}>{(e.attachments||[]).length||''}</td>
                      <td style={{ padding:'6px' }}>{e.ingested ? (e.ingestRef?.type.toUpperCase()+': '+e.ingestRef?.ref) : (e.unread? t('Chưa đọc','Unread') : t('Đã đọc','Read'))}</td>
                    </tr>
                  ))}
                  {filtered.length===0 && <tr><td colSpan={5} style={{ color:'#6b7280', padding:8, textAlign:'center' }}>— {t('Không có','None')} —</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & Parse */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto auto 1fr' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>{t('Chi tiết & Parse','Details & Parse')}</div>
            {!selected && <div style={{ padding:10, color:'#6b7280' }}>{t('Chọn một email để xem chi tiết','Select an email to view details')}</div>}
            {selected && (
              <div style={{ display:'grid', gap:8, padding:10, overflow:'auto' }}>
                <div><b>{t('Chủ đề','Subject')}:</b> {selected.subject}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Từ','From')}: {selected.from} • To: {(selected.to||[]).join(', ')} • {(selected.cc?.length? ('Cc: '+selected.cc.join(', ')) : '')}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ngày','Date')}: {(selected.date||'').slice(0,19).replace('T',' ')}</div>
                <div style={{ display:'grid', gap:4 }}>
                  <div style={{ fontWeight:700 }}>{t('Headers chính','Key headers')}</div>
                  <div style={{ display:'grid', gap:2, fontFamily:'monospace', fontSize:12 }}>
                    {headerKV(selected).map(h => <div key={h.k}><b>{h.k}:</b> {h.v}</div>)}
                    {headerKV(selected).length===0 && <div>—</div>}
                  </div>
                </div>
                <div style={{ whiteSpace:'pre-wrap', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:8, padding:8, fontSize:12 }}>{selected.snippet}</div>
                <div style={{ display:'grid', gap:6 }}>
                  <div style={{ fontWeight:700 }}>{t('Kết quả parse','Parse result')}</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', fontSize:12 }}>
                    <span>Type*: <b>{parseEmail(selected).suggestedType?.toUpperCase()}</b></span>
                    <span>Project: <b>{parsed?.project||'—'}</b></span>
                    <span>Tags: <b>{(parsed?.tags||[]).join(', ')||'—'}</b></span>
                    <span>Attachments: <b>{parsed?.hasAttachment? 'Yes':'No'}</b></span>
                  </div>
                </div>
              </div>
            )}
            {selected && decision && (
              <div style={{ borderTop:'1px solid #e5e7eb', padding:10, background:'#fafafa', display:'grid', gap:6 }}>
                <div style={{ fontWeight:700 }}>{t('Quyết định sau khi áp rules','Decision after rules')}</div>
                <div style={{ display:'grid', gap:4, fontSize:13 }}>
                  <div>{t('Loại đích','Target type')}: <b>{decision.target.type.toUpperCase()}</b></div>
                  <div>{t('Tiêu đề ghi vào ERP','ERP title')}: <b>{decision.target.title}</b></div>
                  <div>{t('Project','Project')}: <b>{decision.target.project||'—'}</b></div>
                  <div>{t('Tags','Tags')}: <b>{decision.target.tags.join(', ')||'—'}</b></div>
                  {decision.matched && <div style={{ color:'#16a34a' }}>{t('Khớp rule','Matched rule')}: <b>{decision.matched.name}</b></div>}
                  {!decision.matched && <div style={{ color:'#334155' }}>{t('Dùng mặc định theo parser','Using default from parser')}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Rules builder */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:700 }}>{t('Rules','Rules')}</div>
          <button onClick={()=> setEditing(newRule())} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm rule','Add rule')}</button>
        </div>
        <div style={{ display:'grid', gap:6 }}>
          {rules.map(r => (
            <div key={r.id} style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:'8px 10px', display:'grid', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={r.enabled} onChange={e=> { const arr=rules.map(x=> x.id===r.id? {...x, enabled:e.target.checked }:x); saveRules(arr); }} />
                <div style={{ fontWeight:700 }}>{r.name}</div>
                <button onClick={()=> setEditing(r)} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Sửa','Edit')}</button>
                <button onClick={()=> saveRules(rules.filter(x=>x.id!==r.id))} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xóa','Delete')}</button>
              </div>
              <div style={{ color:'#6b7280', fontSize:12 }}>
                when: {r.when.fromIncludes?`from~"${r.when.fromIncludes}" `:''}
                {r.when.toIncludes?`to~"${r.when.toIncludes}" `:''}
                {r.when.subjectIncludes?`subject~"${r.when.subjectIncludes}" `:''}
                {r.when.hasAttachment!==undefined?`hasAtt=${r.when.hasAttachment} `:''}
                {r.when.bodyRegex?`body~/${r.when.bodyRegex}/ `:''}
                → then: {r.then.type.toUpperCase()} {r.then.defaultProject?`(proj=${r.then.defaultProject})`:''} {r.then.tagsFromSubject?'tagsFromSubject':''}
              </div>
            </div>
          ))}
          {rules.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có rule','No rules yet')} —</div>}
        </div>

        {editing && (
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, display:'grid', gap:8 }}>
            <div style={{ fontWeight:700 }}>{t('Sửa rule','Edit rule')}</div>
            <label style={{ display:'grid', gap:6 }}>
              <span>{t('Tên','Name')}</span>
              <input value={editing.name} onChange={e=> setEditing({ ...editing, name:e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </label>
            <div style={{ height:1, background:'#e5e7eb' }} />
            <div style={{ fontWeight:700 }}>{t('Điều kiện','Conditions')}</div>
            <label style={{ display:'grid', gap:6 }}><span>from includes</span><input value={editing.when.fromIncludes||''} onChange={e=> setEditing({ ...editing, when:{ ...editing.when, fromIncludes:e.target.value||undefined } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>to includes</span><input value={editing.when.toIncludes||''} onChange={e=> setEditing({ ...editing, when:{ ...editing.when, toIncludes:e.target.value||undefined } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>subject includes</span><input value={editing.when.subjectIncludes||''} onChange={e=> setEditing({ ...editing, when:{ ...editing.when, subjectIncludes:e.target.value||undefined } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'flex', gap:8, alignItems:'center' }}><input type="checkbox" checked={editing.when.hasAttachment||false} onChange={e=> setEditing({ ...editing, when:{ ...editing.when, hasAttachment:e.target.checked } })} /><span>has attachment</span></label>
            <label style={{ display:'grid', gap:6 }}><span>body regex</span><input value={editing.when.bodyRegex||''} onChange={e=> setEditing({ ...editing, when:{ ...editing.when, bodyRegex:e.target.value||undefined } })} placeholder="e.g. PRJ-(?<project>[A-Z0-9]+)" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <div style={{ height:1, background:'#e5e7eb' }} />
            <div style={{ fontWeight:700 }}>{t('Hành động','Actions')}</div>
            <label style={{ display:'grid', gap:6 }}><span>{t('Loại đích','Target type')}</span>
              <select value={editing.then.type} onChange={e=> setEditing({ ...editing, then:{ ...editing.then, type: e.target.value as any } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="ticket">Ticket</option>
                <option value="doc">Doc</option>
              </select>
            </label>
            <label style={{ display:'grid', gap:6 }}><span>default project</span><input value={editing.then.defaultProject||''} onChange={e=> setEditing({ ...editing, then:{ ...editing.then, defaultProject: e.target.value||undefined } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'flex', gap:8, alignItems:'center' }}><input type="checkbox" checked={editing.then.tagsFromSubject||false} onChange={e=> setEditing({ ...editing, then:{ ...editing.then, tagsFromSubject: e.target.checked } })} /><span>tags from subject (#tag)</span></label>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=> { const exists = rules.some(r => r.id===editing.id); const arr = exists ? rules.map(r => r.id===editing.id? editing : r) : [...rules, editing]; saveRules(arr); setEditing(null); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu','Save')}</button>
              <button onClick={()=> setEditing(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Hủy','Cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
