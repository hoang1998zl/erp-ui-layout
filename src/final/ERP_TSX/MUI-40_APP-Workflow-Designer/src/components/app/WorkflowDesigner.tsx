// src/components/app/WorkflowDesigner.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listWorkflows, saveWorkflow, deleteWorkflow, exportWorkflow, importWorkflow, simulate, seedIfEmpty, type Workflow, type Stage, type Approver } from '../../mock/workflow';

const EMPTY_STAGE = (): Stage => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  name: 'New Stage',
  entryCondition: null,
  approvers: [],
  approvalRule: 'any',
  slaHours: 24,
  escalateTo: null,
  onReject: 'previous',
  notify: []
});

function Chip({ text }: { text:string }) {
  return <span style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', fontSize:12, background:'#f9fafb' }}>{text}</span>;
}

export const WorkflowDesigner: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [list, setList] = useState<Workflow[]>([]);
  const [wid, setWid] = useState<string>('');
  const [wf, setWf] = useState<Workflow | null>(null);

  const [simInput, setSimInput] = useState<{ entity_type: string; payload: any }>({ entity_type: 'expense_claim', payload: { total: 2000000, requester: { manager: 'manager@company.com' } } });
  const [simOut, setSimOut] = useState<any>(null);

  const impRef = useRef<HTMLInputElement>(null);

  const reload = () => { seedIfEmpty(); const arr = listWorkflows(); setList(arr); if (!wid) setWid(arr[0]?.id||''); };
  useEffect(()=>{ reload(); }, []);
  useEffect(()=>{ const w = list.find(x => x.id===wid) || null; setWf(w ? JSON.parse(JSON.stringify(w)) : null); }, [wid, list]);

  const save = () => { if (!wf) return; saveWorkflow(wf); setList(listWorkflows()); alert(t('Đã lưu workflow','Workflow saved')); };
  const addStage = () => { if (!wf) return; setWf({ ...wf, stages: [...wf.stages, EMPTY_STAGE()] }); };
  const removeStage = (id: string) => { if (!wf) return; setWf({ ...wf, stages: wf.stages.filter(s => s.id!==id) }); };
  const move = (i: number, dir: -1|1) => { if (!wf) return; const arr = wf.stages.slice(); const j = i+dir; if (j<0 || j>=arr.length) return; const [x] = arr.splice(i,1); arr.splice(j,0,x); setWf({ ...wf, stages: arr }); };

  const setStage = (i: number, patch: Partial<Stage>) => { if (!wf) return; const arr = wf.stages.slice(); arr[i] = { ...arr[i], ...patch }; setWf({ ...wf, stages: arr }); };

  const addApprover = (i: number, a?: Approver) => { if (!wf) return; const arr = wf.stages.slice(); arr[i].approvers = [...(arr[i].approvers||[]), a || { type:'role', ref:'Manager' } as any]; setWf({ ...wf, stages: arr }); };
  const setApprover = (i: number, k: number, a: Approver) => { if (!wf) return; const arr = wf.stages.slice(); arr[i].approvers[k] = a; setWf({ ...wf, stages: arr }); };
  const delApprover = (i: number, k: number) => { if (!wf) return; const arr = wf.stages.slice(); arr[i].approvers.splice(k,1); setWf({ ...wf, stages: arr }); };

  const runSim = () => { if (!wf) return; const out = simulate(wf, { entity_type: simInput.entity_type, payload: simInput.payload }); setSimOut(out); };

  const onExport = () => { if (!wf) return; const blob = exportWorkflow(wf); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=(wf.name||'workflow')+'.json'; a.click(); URL.revokeObjectURL(url); };
  const onImport = async (txt: string) => { importWorkflow(txt); setList(listWorkflows()); alert(t('Đã import','Imported')); };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Thiết kế quy trình phê duyệt','Approval workflow designer')}</div>
          <select value={wid} onChange={e=>setWid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {list.map(w => <option key={w.id} value={w.id}>{w.name} ({w.entity_type})</option>)}
          </select>
          {wf && (
            <>
              <input value={wf.name} onChange={e=>setWf({ ...wf, name: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:280 }} />
              <input value={wf.entity_type} onChange={e=>setWf({ ...wf, entity_type: e.target.value })} placeholder="entity_type" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="checkbox" checked={!!wf.is_active} onChange={e=>setWf({ ...wf, is_active: e.target.checked })} />
                <span>{t('Kích hoạt','Active')}</span>
              </label>
            </>
          )}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={()=>{ const n: Workflow = { id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name:'New workflow', entity_type:'generic', version:1, stages:[], created_at:new Date().toISOString(), updated_at:new Date().toISOString(), is_active:false }; saveWorkflow(n); setList(listWorkflows()); setWid(n.id); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Mới','New')}</button>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          <button onClick={()=>{ const txt = prompt('Paste workflow JSON'); if (txt) onImport(txt); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Import</button>
          <button onClick={()=>{ if (!wf) return; if (!confirm(t('Xoá workflow này?','Delete this workflow?'))) return; deleteWorkflow(wf.id); setList(listWorkflows()); setWid(listWorkflows()[0]?.id||''); }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xoá','Delete')}</button>
          <button onClick={save} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
        </div>
      </div>

      {/* Body: left stages, right simulator */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Stage designer */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
          <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Các bước phê duyệt','Approval stages')}</div>
          <div style={{ overflow:'auto' }}>
            {!wf || wf.stages.length===0 ? <div style={{ padding:12, color:'#6b7280' }}>{t('Chưa có bước nào. Thêm bước mới.','No stages yet. Add one.')}</div> :
              wf.stages.map((s, i) => (
                <div key={s.id} style={{ borderTop:'1px solid #f1f5f9', padding:'8px 10px', display:'grid', gap:8 }}>
                  {/* Row header */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, alignItems:'center' }}>
                    <input value={s.name} onChange={e=>setStage(i,{ name: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>move(i,-1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>↑</button>
                      <button onClick={()=>move(i,1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>↓</button>
                    </div>
                    <button onClick={()=>addApprover(i)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>＋ {t('Người duyệt','Approver')}</button>
                    <button onClick={()=>removeStage(s.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
                  </div>
                  {/* Condition */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 1fr', gap:8, alignItems:'center' }}>
                    <input placeholder={t('Trường điều kiện (ví dụ: total, requester.department)','Field path (e.g., total, requester.department)')} defaultValue={s.entryCondition?.left||''} onBlur={e=>setStage(i,{ entryCondition: { ...(s.entryCondition||{op:'gte',right:0}), left: e.target.value } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    <select defaultValue={s.entryCondition?.op||'gte'} onChange={e=>setStage(i,{ entryCondition: { ...(s.entryCondition||{left:'total',right:0}), op: e.target.value as any } as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                      {['eq','neq','gt','lt','gte','lte','in','contains'].map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                    <input placeholder={t('Giá trị so sánh (ví dụ: 5000000 hoặc ["HR","IT"])','Compare value (e.g., 5000000 or ["HR","IT"])')} defaultValue={s.entryCondition ? JSON.stringify(s.entryCondition.right) : ''} onBlur={e=>{
                      let v: any = e.target.value;
                      try { v = JSON.parse(e.target.value); } catch {}
                      setStage(i,{ entryCondition: { ...(s.entryCondition||{left:'total', op:'gte'}), right: v } as any });
                    }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  </div>
                  {/* Approvers table */}
                  {(s.approvers||[]).length===0 ? <div style={{ color:'#6b7280' }}>{t('Chưa có người duyệt','No approvers')}</div> :
                    <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 60px', gap:8, alignItems:'center' }}>
                      {s.approvers.map((a, k) => (
                        <React.Fragment key={k}>
                          <select value={a.type} onChange={e=>setApprover(i,k,{ ...a, type: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                            <option value="role">role</option>
                            <option value="user">user</option>
                            <option value="dynamic">dynamic</option>
                          </select>
                          <input value={a.ref} onChange={e=>setApprover(i,k,{ ...a, ref: e.target.value })} placeholder={t('VD: Finance / user@corp / requester.manager','e.g., Finance / user@corp / requester.manager')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                          <div style={{ display:'flex', justifyContent:'flex-end' }}>
                            <button onClick={()=>delApprover(i,k)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  }
                  {/* Stage options */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:160 }}>{t('Quy tắc duyệt','Approval rule')}</span>
                      <select value={s.approvalRule} onChange={e=>setStage(i,{ approvalRule: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                        <option value="any">{t('ANY (1 người duyệt)','ANY (one approves)')}</option>
                        <option value="all">{t('ALL (tất cả duyệt)','ALL (everyone approves)')}</option>
                      </select>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:160 }}>SLA (h)</span>
                      <input type="number" min={0} value={s.slaHours||0} onChange={e=>setStage(i,{ slaHours: Number(e.target.value||0) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:100 }} />
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:160 }}>{t('Escalate to','Escalate to')}</span>
                      <input placeholder={t('role/user/dynamic path','role/user/dynamic path')} defaultValue={s.escalateTo?.ref||''} onBlur={e=>setStage(i,{ escalateTo: e.target.value ? { type:'role', ref: e.target.value } as any : null })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    </label>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:160 }}>{t('Khi từ chối','On reject')}</span>
                      <select value={s.onReject} onChange={e=>setStage(i,{ onReject: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                        <option value="previous">{t('Quay về bước trước','Back to previous')}</option>
                        <option value="terminate">{t('Kết thúc quy trình','Terminate')}</option>
                      </select>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:160 }}>{t('Notify (danh sách, phẩy)','Notify (comma list)')}</span>
                      <input defaultValue={(s.notify||[]).join(', ')} onBlur={e=>setStage(i,{ notify: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                    </label>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
            <button onClick={addStage} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Thêm bước','Add stage')}</button>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: dùng dynamic approver như','Tip: use dynamic approver like')}: <code>requester.manager</code>, <code>project.pm</code></div>
          </div>
        </div>

        {/* Simulator */}
        <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Mô phỏng lộ trình','Route simulation')}</div>
            <div style={{ padding:'6px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input value={simInput.entity_type} onChange={e=>setSimInput({ ...simInput, entity_type: e.target.value })} placeholder="entity_type" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <input value={String(simInput.payload.total||'')} onChange={e=>setSimInput({ ...simInput, payload: { ...simInput.payload, total: Number(e.target.value||0) } })} placeholder="total" type="number" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div style={{ padding:'6px 10px' }}>
              <label style={{ fontSize:12, color:'#6b7280' }}>{t('Payload (JSON)','Payload (JSON)')}</label>
              <textarea defaultValue={JSON.stringify(simInput.payload, null, 2)} onBlur={e=>{ try { const p = JSON.parse(e.target.value); setSimInput({ ...simInput, payload: p }); } catch { alert('Invalid JSON'); } }} style={{ width:'100%', minHeight:160, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', fontFamily:'monospace' }}></textarea>
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button onClick={runSim} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Chạy mô phỏng','Run simulation')}</button>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Kiểm tra điều kiện stage, người duyệt động và cảnh báo cấu hình.','Validates stage conditions, dynamic approvers and config warnings.')}</div>
            </div>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Kết quả mô phỏng','Simulation result')}</div>
            <div style={{ overflow:'auto' }}>
              {!simOut ? <div style={{ padding:12, color:'#6b7280' }}>—</div> :
                <div style={{ padding:10, display:'grid', gap:10 }}>
                  {simOut.appliedStages.map((s:any, idx:number) => (
                    <div key={idx} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'8px 10px', background: s.skipped ? '#fff7ed' : '#f0fdf4' }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div style={{ fontWeight:700 }}>{s.name}</div>
                        <div>{s.skipped ? <Chip text={t('Bỏ qua','Skipped')} /> : <Chip text={t('Áp dụng','Applied')} />}</div>
                      </div>
                      {s.skipped ? <div style={{ color:'#b45309', fontSize:12 }}>{s.reason}</div> :
                        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Người duyệt','Approvers')}: {(s.approvers||[]).map((a:any)=> `${a.type}:${a.ref}`).join(', ')||'—'}</div>}
                    </div>
                  ))}
                </div>
              }
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
              {simOut && simOut.warnings.length>0 ? simOut.warnings.join(' • ') : t('Không có cảnh báo','No warnings')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
