
// src/components/app/DelegationConsole.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seedIfEmpty, listRules, saveRule, deleteRule, newRule, resolveDelegate, checkConflicts, hrIsOOO, type DelegationRule } from '../../mock/delegation';

type Tab = 'rules'|'simulate'|'help';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

function Field({ label, children }: { label:string, children:any }) {
  return <label style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:8, alignItems:'center' }}><div style={{ color:'#6b7280', fontSize:12 }}>{label}</div><div>{children}</div></label>;
}

export const DelegationConsole: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [tab, setTab] = useState<Tab>('rules');
  const [rows, setRows] = useState<DelegationRule[]>([]);
  const [editing, setEditing] = useState<DelegationRule|null>(null);
  const [search, setSearch] = useState('');

  const reload = () => { seedIfEmpty(); setRows(listRules()); };
  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(()=> {
    const s = search.toLowerCase();
    return rows.filter(r => (r.principal.ref+' '+r.delegate_to.ref+' '+(r.scope?.entity_types||[]).join(' ')+' '+(r.scope?.stages||[]).join(' ')).toLowerCase().includes(s));
  }, [rows, search]);

  const startEdit = (r?: DelegationRule) => setEditing(r ? JSON.parse(JSON.stringify(r)) : newRule());
  const cancelEdit = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    // Basic required checks
    if (!editing.principal.ref || !editing.delegate_to.ref) { alert('Principal and delegate are required'); return; }
    // Conflict check
    const conflicts = checkConflicts(editing, editing.id);
    if (conflicts.length>0 && !confirm(t('Có xung đột thời gian với rule khác. Vẫn lưu?','Conflicts with existing rules. Save anyway?'))) return;
    saveRule(editing);
    setEditing(null);
    reload();
  };

  const RuleRow: React.FC<{ r: DelegationRule }> = ({ r }) => {
    const now = Date.now();
    const s = r.start_at ? new Date(r.start_at).getTime() : -Infinity;
    const e = r.end_at ? new Date(r.end_at).getTime() : Infinity;
    const status: 'active'|'upcoming'|'expired' = !r.active ? 'expired' : (now<s ? 'upcoming' : (now>e ? 'expired' : 'active'));
    const tone = status==='active' ? 'green' : status==='upcoming' ? 'violet' : 'red';
    return (
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'8px 10px', display:'grid', gridTemplateColumns:'1.2fr 1.2fr 1fr 0.7fr auto', gap:8, alignItems:'center' }}>
        <div>
          <div><b>{r.principal.type}:</b> {r.principal.ref}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Phạm vi','Scope')}: {r.scope?.entity_types?.join(', ')||'*'} {r.scope?.stages?.length? '• '+r.scope?.stages?.join(', '):''}</div>
        </div>
        <div>
          <div><b>{t('Ủy quyền cho','Delegate to')}:</b> {r.delegate_to.type}:{r.delegate_to.ref}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lý do','Reason')}: {r.reason||'—'}</div>
        </div>
        <div>
          <div>{r.start_at ? new Date(r.start_at).toLocaleString() : '—'} → {r.end_at ? new Date(r.end_at).toLocaleString() : '—'}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ưu tiên','Priority')}: {r.priority||0} • {r.active? t('Bật','On'):t('Tắt','Off')}</div>
        </div>
        <div><Badge text={status.toUpperCase()} tone={tone as any} /></div>
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <button onClick={()=>startEdit(r)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 10px', background:'#fff' }}>{t('Sửa','Edit')}</button>
          <button onClick={()=>{ if (!confirm(t('Xoá rule này?','Delete this rule?'))) return; deleteRule(r.id); reload(); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>
        </div>
      </div>
    );
  };

  const Editor: React.FC = () => {
    if (!editing) return null;
    const e = editing;
    const set = (patch: Partial<DelegationRule>) => setEditing({ ...e, ...patch });
    const setScope = (patch: any) => setEditing({ ...e, scope: { ...(e.scope||{}), ...patch } });
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', placeItems:'center', padding:20 }}>
        <div style={{ width:860, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{e.id ? t('Sửa rule uỷ quyền','Edit delegation rule') : t('Rule uỷ quyền mới','New delegation rule')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={save} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
              <button onClick={cancelEdit} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
          </div>
          <div style={{ padding:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'grid', gap:10 }}>
              <Field label={t('Principal','Principal')}>
                <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:8 }}>
                  <select value={e.principal.type} onChange={ev=>set({ principal:{ ...e.principal, type: ev.target.value as any } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="user">user</option><option value="role">role</option>
                  </select>
                  <input value={e.principal.ref} onChange={ev=>set({ principal:{ ...e.principal, ref: ev.target.value } })} placeholder="user@corp.com or RoleName" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                </div>
              </Field>
              <Field label={t('Delegate to','Delegate to')}>
                <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:8 }}>
                  <select value={e.delegate_to.type} onChange={ev=>set({ delegate_to:{ ...e.delegate_to, type: ev.target.value as any } })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="user">user</option><option value="role">role</option>
                  </select>
                  <input value={e.delegate_to.ref} onChange={ev=>set({ delegate_to:{ ...e.delegate_to, ref: ev.target.value } })} placeholder="backup@corp.com or RoleName" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                </div>
              </Field>
              <Field label={t('Khoảng thời gian','Time window')}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <input type="datetime-local" value={e.start_at? e.start_at.slice(0,16):''} onChange={ev=>set({ start_at: ev.target.value? new Date(ev.target.value).toISOString():'' })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input type="datetime-local" value={e.end_at? e.end_at.slice(0,16):''} onChange={ev=>set({ end_at: ev.target.value? new Date(ev.target.value).toISOString():'' })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                </div>
              </Field>
              <Field label={t('Phạm vi','Scope')}>
                <div style={{ display:'grid', gap:6 }}>
                  <input defaultValue={(e.scope?.entity_types||[]).join(', ')} onBlur={ev=>setScope({ entity_types: ev.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="entity_types: expense_claim, purchase_request, ..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input defaultValue={(e.scope?.stages||[]).join(', ')} onBlur={ev=>setScope({ stages: ev.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="stages: Finance Review, Director Approval, ..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <input defaultValue={(e.scope?.projects||[]).join(', ')} onBlur={ev=>setScope({ projects: ev.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="projects (optional)" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                </div>
              </Field>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              <Field label={t('Trạng thái','Status')}>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={e.active} onChange={ev=>set({ active: ev.target.checked })} /><span>{t('Bật','Active')}</span>
                </label>
              </Field>
              <Field label="Priority">
                <input type="number" value={e.priority||0} onChange={ev=>set({ priority: Number(ev.target.value||0) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
              </Field>
              <Field label={t('Notify','Notify')}>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={!!e.notify} onChange={ev=>set({ notify: ev.target.checked })} /><span>{t('Gửi thông báo khi áp dụng','Notify both sides when applied')}</span>
                </label>
              </Field>
              <Field label={t('Lý do','Reason')}>
                <input value={e.reason||''} onChange={ev=>set({ reason: ev.target.value })} placeholder={t('VD: nghỉ phép, công tác...','e.g., leave, business trip...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              </Field>

              {/* Conflict check */}
              <div style={{ border:'1px solid #fde68a', background:'#fffbeb', borderRadius:12, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{t('Kiểm tra xung đột','Conflict check')}</div>
                <button onClick={()=>{
                  const c = checkConflicts(e, e.id);
                  if (c.length===0) alert(t('Không có xung đột','No conflicts'));
                  else alert(t('Xung đột với','Conflicts with')+':\n'+c.map(x => `${x.principal.type}:${x.principal.ref} → ${x.delegate_to.ref} (${x.start_at||'—'} → ${x.end_at||'—'})`).join('\n'));
                }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Chạy kiểm tra','Run check')}</button>
              </div>

              {/* Simulation */}
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{t('Mô phỏng áp dụng','Apply simulation')}</div>
                <div style={{ display:'grid', gap:6 }}>
                  <small style={{ color:'#6b7280' }}>{t('Nhập thông tin bên phải (tab Simulate) để mô phỏng với toàn bộ rule.','Use the Simulate tab on the main screen to test against all rules.')}</small>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Quy tắc ưu tiên','Precedence')}: user‑specific &gt; role‑based; scope hẹp hơn &gt; rộng; priority lớn hơn thắng.</div>
            <div>
              <button onClick={save} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Simulate: React.FC = () => {
    const [userId, setUserId] = useState('manager@corp.com');
    const [roles, setRoles] = useState('Manager, Finance');
    const [entity, setEntity] = useState('purchase_request');
    const [stage, setStage] = useState('Finance Review');
    const [at, setAt] = useState('');
    const [result, setResult] = useState<any>(null);

    const run = () => {
      const res = resolveDelegate(
        { userId, roles: roles.split(',').map(s=>s.trim()).filter(Boolean) },
        { entity_type: entity, stage_name: stage, at: at? new Date(at).toISOString(): undefined }
      );
      setResult(res);
    };

    return (
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Field label="userId"><input value={userId} onChange={e=>setUserId(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
          <Field label="roles"><input value={roles} onChange={e=>setRoles(e.target.value)} placeholder="Manager, Finance" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
          <Field label="entity_type"><input value={entity} onChange={e=>setEntity(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
          <Field label="stage_name"><input value={stage} onChange={e=>setStage(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
          <Field label="at (optional)"><input type="datetime-local" value={at} onChange={e=>setAt(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></Field>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={run} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Chạy mô phỏng','Run simulation')}</button>
          <div style={{ color:'#6b7280', fontSize:12 }}>
            {t('Nếu HR‑09 báo OOO, vẫn có thể force delegate theo rule.','If HR‑09 marks OOO, rule can still override.')}
          </div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
          {!result ? <div style={{ color:'#6b7280' }}>—</div> :
            <div style={{ display:'grid', gap:6 }}>
              <div><b>{t('Kết luận','Result')}:</b> {result.to ? `${result.to.type}:${result.to.ref}` : t('Không ủy quyền','No delegation')}</div>
              <div><b>{t('Rule áp dụng','Matched rule')}:</b> {result.rule ? `${result.rule.principal.type}:${result.rule.principal.ref} → ${result.rule.delegate_to.ref}` : '—'}</div>
              <details>
                <summary style={{ cursor:'pointer' }}>{t('Ứng viên','Candidates')}</summary>
                <pre style={{ margin:0 }}>{JSON.stringify(result.candidates||[], null, 2)}</pre>
              </details>
            </div>
          }
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Bảng điều khiển ủy quyền (Delegation Console)','Delegation Console')}</div>
          <Badge text="APP-05" />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Tìm principal/delegate/scope','Search principal/delegate/scope')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:320 }} />
          <button onClick={()=>startEdit()} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Rule mới','New rule')}</button>
        </div>
      </div>

      {/* Body: tabs */}
      <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:8 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', gap:8 }}>
          {(['rules','simulate','help'] as Tab[]).map(k => (
            <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab===k ? '#eef2ff':'#fff' }}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          {tab==='rules' && (
            <div style={{ display:'grid', gap:10 }}>
              {filtered.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : filtered.map(r => <RuleRow key={r.id} r={r} />)}
            </div>
          )}
          {tab==='simulate' && <Simulate />}
          {tab==='help' && (
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, color:'#6b7280', fontSize:14 }}>
              <div style={{ fontWeight:700, color:'#111827' }}>{t('Nguyên tắc & Tích hợp','Principles & Integration')}</div>
              <ul>
                <li>{t('Ưu tiên: rule theo user > role; scope hẹp hơn > rộng; priority lớn > nhỏ.','Precedence: user rule > role; narrower scope > broad; higher priority wins.')}</li>
                <li>{t('Override routing: khi khớp, assign task/approval cho delegate_to thay vì principal.','Override routing: when matched, task goes to delegate_to instead of principal.')}</li>
                <li>{t('Tích hợp HR‑09 (OOO/Leave): tự tạo rule tạm thời khi OOO nếu bật.','Integrate HR‑09 (OOO/Leave): auto‑create temporary rule if enabled.')}</li>
                <li>{t('APP‑03 Inbox: hiển thị item theo người được uỷ quyền; có filter “delegated to me”.','APP‑03 Inbox: show items delegated to me; include a filter.')}</li>
                <li>{t('Audit ADM‑06: log tạo/sửa/xóa rule và hit‑logs khi áp dụng.','Audit ADM‑06: log create/update/delete rules and hit‑logs upon apply.')}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Editor modal */}
      <Editor />
    </div>
  );
};
