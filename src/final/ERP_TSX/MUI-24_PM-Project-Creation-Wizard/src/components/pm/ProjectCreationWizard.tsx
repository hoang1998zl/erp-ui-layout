// src/components/pm/ProjectCreationWizard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listClients, listCurrencies, searchEmployees, saveDraft, submitProject, type Client, type Currency, type Employee, type ProjectDraft, type WBSNode, type TeamMember, type BudgetItem
} from '../../mock/projects';

type StepKey = 1|2|3|4;

const roleOptions = ['Project Manager','Engineer','QA','Designer','Business Analyst','Finance Controller','Procurement'];

const startDraft = (): ProjectDraft => ({
  status: 'draft',
  general: { name:'', code:'', client_id: undefined, start_date: '', end_date: '', description:'', project_type:'External', currency:'VND' },
  wbs: [],
  team: [],
  budget: [],
  created_at: '', updated_at: ''
});

export const ProjectCreationWizard: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [step, setStep] = useState<StepKey>(1);
  const [draft, setDraft] = useState<ProjectDraft>(startDraft());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Step 1: General
  const [clients, setClients] = useState<Client[]>([]);
  const [currs, setCurrs] = useState<Currency[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  useEffect(()=>{ listClients({ search: clientSearch }).then(setClients); }, [clientSearch]);
  useEffect(()=>{ listCurrencies().then(setCurrs); }, []);

  // Step 2: WBS (Tree operations)
  const newNode = (name='New task'): WBSNode => ({ id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name, code: '', estimate_hours: 0, children: [] });
  const addRootTask = () => setDraft(d => ({ ...d, wbs: [...d.wbs, newNode('Phase')] }));
  const addChild = (id: string) => setDraft(d => {
    const clone = structuredClone(d);
    const rec = (n: WBSNode): boolean => {
      if (n.id===id) { n.children.push(newNode('Task')); return true; }
      return n.children.some(rec);
    };
    clone.wbs.some(rec);
    return clone;
  });
  const renameNode = (id: string, name: string) => setDraft(d => {
    const c = structuredClone(d); const rec=(n:WBSNode)=>{ if(n.id===id) n.name=name; n.children.forEach(rec); }; c.wbs.forEach(rec); return c;
  });
  const setNodeHours = (id: string, h: number) => setDraft(d => {
    const c = structuredClone(d); const rec=(n:WBSNode)=>{ if(n.id===id) n.estimate_hours=h; n.children.forEach(rec); }; c.wbs.forEach(rec); return c;
  });
  const deleteNode = (id: string) => setDraft(d => {
    const c = structuredClone(d);
    const filter = (arr: WBSNode[]): WBSNode[] => arr.filter(n => n.id!==id).map(n => ({ ...n, children: filter(n.children) }));
    c.wbs = filter(c.wbs);
    return c;
  });
  const totalHours = useMemo(()=>{
    const sum = (arr:WBSNode[]): number => arr.reduce((s,n)=> s + (n.estimate_hours||0) + sum(n.children), 0);
    return sum(draft.wbs);
  }, [draft.wbs]);

  const Tree: React.FC<{ nodes: WBSNode[], depth: number }> = ({ nodes, depth }) => (
    <div>
      {nodes.map(n => (
        <div key={n.id} style={{ marginLeft: depth*12, border:'1px solid #e5e7eb', borderRadius:8, padding:8, background:'#fff', marginTop:8 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input defaultValue={n.name} onBlur={e=>renameNode(n.id, e.target.value)} style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <input type="number" min={0} step={0.5} defaultValue={n.estimate_hours||0} onBlur={e=>setNodeHours(n.id, Number(e.target.value||0))} style={{ width:120, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            <span style={{ color:'#6b7280', fontSize:12 }}>h</span>
            <button onClick={()=>addChild(n.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>＋ {t('Thêm con','Add child')}</button>
            <button onClick={()=>deleteNode(n.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{t('Xoá','Delete')}</button>
          </div>
          {n.children.length>0 && <Tree nodes={n.children} depth={depth+1} />}
        </div>
      ))}
    </div>
  );

  // Step 3: Team
  const [empSearch, setEmpSearch] = useState('');
  const [empOptions, setEmpOptions] = useState<Employee[]>([]);
  useEffect(()=>{ searchEmployees({ search: empSearch, active_only: true }).then(setEmpOptions); }, [empSearch]);
  const addMember = (e: Employee, role='Engineer') => setDraft(d => ({ ...d, team: [...d.team, { employee_id: e.id, role, allocation_pct: 100 }] }));
  const removeMember = (id: string) => setDraft(d => ({ ...d, team: d.team.filter(m => m.employee_id!==id) }));
  const setMemberRole = (id: string, role: string) => setDraft(d => ({ ...d, team: d.team.map(m => m.employee_id===id ? { ...m, role } : m) }));
  const setMemberAlloc = (id: string, pct: number) => setDraft(d => ({ ...d, team: d.team.map(m => m.employee_id===id ? { ...m, allocation_pct: pct } : m) }));
  const findEmp = (id?:string) => empOptions.find(e => e.id===id) || null;

  // Step 4: Budget
  const addBudgetLine = () => setDraft(d => ({ ...d, budget: [...d.budget, { category:'Labor', description:'', amount: 0 }] }));
  const setBudgetLine = (i:number, patch: Partial<BudgetItem>) => setDraft(d => ({ ...d, budget: d.budget.map((b,idx)=> idx===i ? { ...b, ...patch } : b) }));
  const removeBudgetLine = (i:number) => setDraft(d => ({ ...d, budget: d.budget.filter((_,idx)=> idx!==i) }));
  const totalBudget = useMemo(()=> draft.budget.reduce((s,b)=> s + (Number(b.amount)||0), 0), [draft.budget]);

  // Validation & navigation
  const canNext = (): boolean => {
    if (step===1) return !!draft.general.name && !!draft.general.currency && (!draft.general.start_date || !draft.general.end_date || draft.general.start_date <= draft.general.end_date);
    if (step===2) return draft.wbs.length>0;
    if (step===3) return draft.team.some(m => m.role==='Project Manager');
    if (step===4) return totalBudget > 0;
    return true;
  };
  const next = () => { if (!canNext()) { setErr(t('Vui lòng hoàn thiện bước hiện tại','Please complete current step')); setTimeout(()=>setErr(null), 2500); return; } setStep((s => Math.min(4, (s as number)+1)) as StepKey); };
  const prev = () => setStep((s => Math.max(1, (s as number)-1)) as StepKey);

  // Save & submit
  const doSave = async () => {
    setBusy(true);
    const saved = await saveDraft(structuredClone(draft));
    setDraft(saved); setBusy(false); setToast(t('Đã lưu nháp','Draft saved')); setTimeout(()=>setToast(null), 2000);
  };
  const doSubmit = async () => {
    if (!canNext()) { setErr(t('Thiếu thông tin bắt buộc','Missing required info')); setTimeout(()=>setErr(null), 2500); return; }
    setBusy(true);
    const submitted = await submitProject(structuredClone(draft));
    setDraft(submitted); setBusy(false);
    setToast(t('Đã gửi khởi tạo dự án','Project submitted')); setTimeout(()=>setToast(null), 2500);
  };

  // Summary for header
  const pmName = useMemo(()=> {
    const pm = draft.team.find(m => m.role==='Project Manager');
    return pm ? (findEmp(pm.employee_id)?.name || pm.employee_id) : t('Chưa chọn','Not set');
  }, [draft.team, empOptions]);

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:800 }}>{t('Khởi tạo dự án','Project creation')} {draft.id && <span style={{ color:'#6b7280', fontWeight:400 }}>#{draft.id.slice(0,8)}</span>}</div>
        <div style={{ display:'flex', gap:12, color:'#6b7280' }}>
          <span>{t('PM','PM')}: <b style={{ color:'#111827' }}>{pmName}</b></span>
          <span>{t('Ngân sách','Budget')}: <b style={{ color:'#111827' }}>{draft.general.currency || '—'} {totalBudget.toLocaleString()}</b></span>
          <span>{t('Giờ ước tính','Est. hours')}: <b style={{ color:'#111827' }}>{totalHours}</b></span>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
        {[1,2,3,4].map((s, idx) => {
          const titles = [t('Tổng quan','General'), t('WBS','WBS'), t('Đội ngũ','Team'), t('Ngân sách','Budget')];
          const active = step===s;
          const done = (step as number) > s;
          return (
            <div key={s as any} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'8px 10px', background: active ? '#eef2ff' : '#fff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, borderRadius:999, background: done ? '#16a34a' : active ? '#4f46e5' : '#e5e7eb', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{s}</div>
                <div style={{ fontWeight:700 }}>{titles[idx]}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        {step===1 && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tên dự án','Project name')} *</div>
                <input value={draft.general.name} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, name:e.target.value }}))} placeholder="..." style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mã dự án','Project code')}</div>
                <input value={draft.general.code||''} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, code:e.target.value }}))} placeholder="e.g., PRJ-2025-001" style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Khách hàng','Client')}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <select value={draft.general.client_id||''} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, client_id: e.target.value || undefined }}))} style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                    <option value="">{t('— Chọn khách hàng —','— Select client —')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.code?` (${c.code})`:''}</option>)}
                  </select>
                  <input placeholder={t('Tìm...','Search...')} value={clientSearch} onChange={e=>setClientSearch(e.target.value)} style={{ width:180, border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
                </div>
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Loại dự án','Project type')}</div>
                <select value={draft.general.project_type||'External'} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, project_type:e.target.value }}))} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                  <option value="External">{t('External (Billable)','External (Billable)')}</option>
                  <option value="Internal">{t('Internal','Internal')}</option>
                  <option value="Non-billable">{t('Non-billable','Non-billable')}</option>
                </select>
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Bắt đầu','Start')}</div>
                <input type="date" value={draft.general.start_date||''} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, start_date:e.target.value }}))} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Kết thúc','End')}</div>
                <input type="date" value={draft.general.end_date||''} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, end_date:e.target.value }}))} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
              <div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tiền tệ','Currency')} *</div>
                <select value={draft.general.currency||'VND'} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, currency:e.target.value }}))} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                  {currs.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mô tả','Description')}</div>
                <textarea value={draft.general.description||''} onChange={e=>setDraft(d=>({ ...d, general:{ ...d.general, description:e.target.value }}))} rows={3} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              </div>
            </div>
          </div>
        )}

        {step===2 && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Cấu trúc WBS','WBS structure')}</div>
              <button onClick={addRootTask} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm Phase','Add Phase')}</button>
            </div>
            {draft.wbs.length===0 && <div style={{ color:'#6b7280' }}>{t('Chưa có task. Bấm "Thêm Phase".','No tasks. Click "Add Phase".')}</div>}
            <Tree nodes={draft.wbs} depth={0} />
            <div style={{ color:'#6b7280' }}>{t('Tổng giờ ước tính','Total est. hours')}: <b style={{ color:'#111827' }}>{totalHours}</b> h</div>
          </div>
        )}

        {step===3 && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Tìm & thêm nhân sự','Search & add people')}</div>
                <div style={{ padding:10, display:'grid', gap:8 }}>
                  <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder={t('Tìm tên/email/chức danh...','Search name/email/title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <div style={{ maxHeight:280, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                          <th style={{ textAlign:'left', padding:8 }}>{t('Tên','Name')}</th>
                          <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Email','Email')}</th>
                          <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Hành động','Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empOptions.length===0 && <tr><td colSpan={3} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                        {empOptions.map(e => (
                          <tr key={e.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                            <td style={{ padding:8 }}><div style={{ fontWeight:700 }}>{e.name}</div><div style={{ color:'#6b7280', fontSize:12 }}>{e.title||'—'}</div></td>
                            <td style={{ padding:8 }}>{e.email}</td>
                            <td style={{ padding:8 }}><button onClick={()=>addMember(e)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Thêm','Add')}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Đội ngũ dự án','Project team')}</div>
                <div style={{ padding:10 }}>
                  {draft.team.length===0 && <div style={{ color:'#6b7280' }}>{t('Chưa có thành viên','No members')}</div>}
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                        <th style={{ textAlign:'left', padding:8 }}>{t('Thành viên','Member')}</th>
                        <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Vai trò','Role')}</th>
                        <th style={{ textAlign:'left', padding:8, width:140 }}>{t('Phân bổ (%)','Allocation (%)')}</th>
                        <th style={{ textAlign:'left', padding:8, width:100 }}>{t('Hành động','Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.team.map(m => {
                        const emp = empOptions.find(x => x.id===m.employee_id);
                        return (
                          <tr key={m.employee_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                            <td style={{ padding:8 }}>
                              <div style={{ fontWeight:700 }}>{emp?.name || m.employee_id}</div>
                              <div style={{ color:'#6b7280', fontSize:12 }}>{emp?.email || ''}</div>
                            </td>
                            <td style={{ padding:8 }}>
                              <select value={m.role} onChange={e=>setMemberRole(m.employee_id, e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                            <td style={{ padding:8 }}>
                              <input type="number" min={0} max={200} step={5} value={m.allocation_pct||0} onChange={e=>setMemberAlloc(m.employee_id, Number(e.target.value||0))} style={{ width:120, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                            </td>
                            <td style={{ padding:8 }}>
                              <button onClick={()=>removeMember(m.employee_id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Gỡ','Remove')}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop:8, color:'#6b7280' }}>{t('Yêu cầu: Chọn ít nhất 1 **Project Manager**.','Requirement: Pick at least one **Project Manager**.')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step===4 && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Dòng ngân sách','Budget lines')}</div>
                <div style={{ padding:10, display:'grid', gap:8 }}>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={addBudgetLine} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm dòng','Add line')}</button>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                        <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Nhóm','Category')}</th>
                        <th style={{ textAlign:'left', padding:8 }}>{t('Mô tả','Description')}</th>
                        <th style={{ textAlign:'left', padding:8, width:180 }}>{t('Số tiền','Amount')}</th>
                        <th style={{ textAlign:'left', padding:8, width:100 }}>{t('','')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.budget.length===0 && <tr><td colSpan={4} style={{ padding:10, color:'#6b7280' }}>—</td></tr>}
                      {draft.budget.map((b, i) => (
                        <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:8 }}>
                            <select value={b.category} onChange={e=>setBudgetLine(i, { category: e.target.value })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                              {['Labor','Expense','Software','Hardware','Travel','Contingency'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={{ padding:8 }}>
                            <input value={b.description||''} onChange={e=>setBudgetLine(i, { description: e.target.value })} placeholder="..." style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                          </td>
                          <td style={{ padding:8 }}>
                            <input type="number" min={0} step={100000} value={b.amount} onChange={e=>setBudgetLine(i, { amount: Number(e.target.value||0) })} style={{ width:180, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                          </td>
                          <td style={{ padding:8 }}>
                            <button onClick={()=>removeBudgetLine(i)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Remove')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>{t('Tổng hợp & kiểm tra','Summary & checks')}</div>
                <div style={{ padding:10, display:'grid', gap:8 }}>
                  <div><b>{t('Tên dự án','Project')}:</b> {draft.general.name || '—'}</div>
                  <div><b>{t('Khách hàng','Client')}:</b> {clients.find(c=>c.id===draft.general.client_id)?.name || t('Nội bộ','Internal')}</div>
                  <div><b>{t('Thời gian','Timeline')}:</b> {(draft.general.start_date||'—')+' → '+(draft.general.end_date||'—')}</div>
                  <div><b>{t('PM','PM')}:</b> {pmName}</div>
                  <div><b>{t('Tổng ngân sách','Total budget')}:</b> {draft.general.currency} {totalBudget.toLocaleString()}</div>
                  <div><b>{t('Tổng giờ ước tính','Total est. hours')}:</b> {totalHours}</div>
                  <div style={{ color:'#6b7280', fontSize:13 }}>{t('Lưu ý: sau khi Submit sẽ chuyển sang trạng thái "submitted" và chờ phê duyệt (PM‑05).','Note: after Submit, status becomes "submitted" and awaits approval (PM‑05).')}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer actions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280' }}>{err || toast || ' '}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={prev} disabled={step===1} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff', opacity: step===1?0.6:1 }}>{t('Trước','Back')}</button>
          <button onClick={doSave} disabled={busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff', opacity: busy?0.6:1 }}>{t('Lưu nháp','Save draft')}</button>
          {step<4 ? (
            <button onClick={next} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>{t('Tiếp','Next')}</button>
          ) : (
            <button onClick={doSubmit} disabled={busy || !canNext()} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', opacity: (busy || !canNext())?0.6:1 }}>{t('Gửi khởi tạo','Submit')}</button>
          )}
        </div>
      </div>
    </div>
  );
};
