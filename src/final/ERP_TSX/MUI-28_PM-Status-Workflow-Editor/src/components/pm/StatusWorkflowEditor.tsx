// src/components/pm/StatusWorkflowEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  listProjects, getWorkflow, saveWorkflow, suggestFromTasks, migrateTaskStatuses,
  type Workflow, type WFStatus, type WFTransition, type Category3, type Project
} from '../../mock/workflow';

type TabKey = 'statuses'|'transitions'|'preview'|'advanced';

export const StatusWorkflowEditor: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Project[]>([]);
  const [pid, setPid] = useState<string>('default');
  const [wf, setWf] = useState<Workflow | null>(null);
  const [tab, setTab] = useState<TabKey>('statuses');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(()=>{ listProjects().then(p => setProjects([{ id:'default', name: t('Mặc định (áp dụng nếu chưa cấu hình)','Default (fallback)') }, ...p])); }, []);
  useEffect(()=>{ (async ()=> setWf(await getWorkflow(pid==='default'? undefined : pid)))(); }, [pid]);

  const sortStatuses = (arr: WFStatus[]) => arr.slice().sort((a,b)=> a.order - b.order);

  const update = (patch: Partial<Workflow>) => setWf(w => w ? ({ ...w, ...patch }) : w);
  const setStatuses = (sts: WFStatus[]) => update({ statuses: sortStatuses(sts.map((s,idx)=>({ ...s, order: idx+1 }))) });
  const setTransitions = (ts: WFTransition[]) => update({ transitions: ts });

  const addStatus = () => {
    if (!wf) return;
    const name = prompt(t('Tên trạng thái','Status name'));
    if (!name) return;
    const maxOrder = wf.statuses.reduce((m,s)=>Math.max(m,s.order), 0);
    setStatuses([...wf.statuses, { id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), name, category:'todo', order: maxOrder+1, is_default: wf.statuses.length===0, color:'#bfdbfe', wip: null }]);
  };
  const removeStatus = (id: string) => {
    if (!wf) return;
    if (!confirm(t('Xoá trạng thái này? Mọi transition liên quan sẽ bị xoá.','Delete this status? Related transitions will be removed.'))) return;
    setStatuses(wf.statuses.filter(s => s.id!==id));
    setTransitions((wf.transitions||[]).filter(tr => tr.from!==id && tr.to!==id));
  };
  const renameStatus = (id: string, name: string) => {
    if (!wf) return;
    setStatuses(wf.statuses.map(s => s.id===id ? { ...s, name } : s));
  };
  const setCategory = (id: string, cat: Category3) => {
    if (!wf) return;
    setStatuses(wf.statuses.map(s => s.id===id ? { ...s, category: cat } : s));
  };
  const setColor = (id: string, color: string) => {
    if (!wf) return;
    setStatuses(wf.statuses.map(s => s.id===id ? { ...s, color } : s));
  };
  const setWIP = (id: string, w: string) => {
    if (!wf) return;
    const v = w==='' ? null : Math.max(0, Number(w));
    setStatuses(wf.statuses.map(s => s.id===id ? { ...s, wip: (Number.isNaN(v) ? null : v) } : s));
  };
  const setDefault = (id: string) => {
    if (!wf) return;
    setStatuses(wf.statuses.map(s => ({ ...s, is_default: s.id===id })));
  };
  const move = (id: string, dir: -1|1) => {
    if (!wf) return;
    const arr = sortStatuses(wf.statuses);
    const i = arr.findIndex(s => s.id===id);
    const j = i + dir;
    if (i<0 || j<0 || j>=arr.length) return;
    const tmp = arr[i].order; arr[i].order = arr[j].order; arr[j].order = tmp;
    setStatuses(arr);
  };

  const hasTransition = (from: string, to: string) => !!wf?.transitions.find(tr => tr.from===from && tr.to===to);
  const toggleTransition = (from: string, to: string) => {
    if (!wf) return;
    if (from===to) return;
    const exists = hasTransition(from, to);
    setTransitions(exists ? wf.transitions.filter(tr => !(tr.from===from && tr.to===to)) : [...wf.transitions, { from, to }]);
  };

  const save = async () => {
    if (!wf) return;
    const saved = await saveWorkflow(wf);
    setWf(saved);
    setToast(t('Đã lưu workflow','Workflow saved')); setTimeout(()=>setToast(null), 1800);
  };

  const suggest = async () => {
    const res = await suggestFromTasks(pid==='default'? null : pid);
    if (!wf) return;
    // keep orders but replace statuses with suggestions (mapped categories/colors)
    setStatuses(res.statuses.map((s,idx)=>({ ...s, order: idx+1 })));
    // transitions: simple forward & to-done
    setTransitions([]);
  };

  const exportJson = () => {
    if (!wf) return;
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`workflow_${pid}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const doMigrate = async () => {
    if (!wf) return;
    if (pid==='default') { alert(t('Chọn một dự án cụ thể để migrate','Pick a specific project to migrate')); return; }
    // Map by status name (lowercased) → first status id (also lowercased compare by name)
    const mapping: Record<string,string> = {};
    wf.statuses.forEach(s => mapping[s.name.toLowerCase().replace(/\s+/g,'_')] = s.id);
    const n = await migrateTaskStatuses(pid, mapping);
    setToast(t('Đã remap','Remapped')+` ${n} `+t('task','task')); setTimeout(()=>setToast(null), 1800);
  };

  if (!wf) return null;

  const sts = sortStatuses(wf.statuses);

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', fontWeight:800 }}>
          <span>{t('Trạng thái & Workflow','Status & Workflow')}</span>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={suggest} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Gợi ý từ Tasks','Suggest from Tasks')}</button>
          <button onClick={exportJson} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button>
          <button onClick={save} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', gap:8, alignItems:'center' }}>
        {(['statuses','transitions','preview','advanced'] as TabKey[]).map(k => (
          <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid ' + (tab===k ? '#4f46e5' : '#e5e7eb'), color: tab===k ? '#4f46e5' : '#111827', background:'#fff', borderRadius:999, padding:'6px 10px' }}>
            {k==='statuses'?t('Trạng thái','Statuses'):k==='transitions'?t('Chuyển tiếp','Transitions'):k==='preview'?t('Xem trước','Preview'):t('Nâng cao','Advanced')}
          </button>
        ))}
        <div style={{ marginLeft:'auto', color:'#6b7280' }}>{toast || ' '}</div>
      </div>

      {/* Body */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        {tab==='statuses' && (
          <div style={{ padding:12, display:'grid', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Danh mục trạng thái','Status catalog')}</div>
              <button onClick={addStatus} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm trạng thái','Add status')}</button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ textAlign:'left', padding:8, width:60 }}>#</th>
                  <th style={{ textAlign:'left', padding:8, width:220 }}>{t('Tên','Name')}</th>
                  <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Nhóm (map 3 trạng thái)','Map to 3 states')}</th>
                  <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Màu','Color')}</th>
                  <th style={{ textAlign:'left', padding:8, width:120 }}>{t('Giới hạn WIP','WIP limit')}</th>
                  <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Mặc định tạo mới','Default for new')}</th>
                  <th style={{ textAlign:'left', padding:8, width:160 }}>{t('Hành động','Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sts.map((s, idx) => (
                  <tr key={s.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:8 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>move(s.id, -1)} disabled={idx===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff', opacity: idx===0?0.5:1 }}>↑</button>
                        <button onClick={()=>move(s.id, +1)} disabled={idx===sts.length-1} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff', opacity: idx===sts.length-1?0.5:1 }}>↓</button>
                      </div>
                    </td>
                    <td style={{ padding:8 }}>
                      <input defaultValue={s.name} onBlur={e=>renameStatus(s.id, e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
                    </td>
                    <td style={{ padding:8 }}>
                      <select value={s.category} onChange={e=>setCategory(s.id, e.target.value as Category3)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                        <option value="todo">todo</option>
                        <option value="in_progress">in_progress</option>
                        <option value="done">done</option>
                      </select>
                    </td>
                    <td style={{ padding:8 }}>
                      <input type="color" value={s.color||'#e5e7eb'} onChange={e=>setColor(s.id, e.target.value)} />
                    </td>
                    <td style={{ padding:8 }}>
                      <input type="number" min={0} placeholder="∞" defaultValue={s.wip==null?'':s.wip} onBlur={e=>setWIP(s.id, e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:100 }} />
                    </td>
                    <td style={{ padding:8 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="radio" name="def" checked={!!s.is_default} onChange={()=>setDefault(s.id)} />
                        <span>{s.is_default? t('Mặc định','Default') : t('Đặt làm mặc định','Set default')}</span>
                      </label>
                    </td>
                    <td style={{ padding:8 }}>
                      <button onClick={()=>removeStatus(s.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab==='transitions' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ fontWeight:700 }}>{t('Ma trận chuyển tiếp','Transition matrix')}</div>
            <div style={{ overflow:'auto' }}>
              <table style={{ borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th></th>
                    {sts.map(s => <th key={s.id} style={{ padding:'6px 10px', border:'1px solid #e5e7eb' }}>{s.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sts.map(from => (
                    <tr key={from.id}>
                      <th style={{ padding:'6px 10px', border:'1px solid #e5e7eb', textAlign:'right' }}>{from.name}</th>
                      {sts.map(to => (
                        <td key={to.id} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', textAlign:'center' }}>
                          {from.id===to.id ? '—' : (
                            <input type="checkbox" checked={!!wf.transitions.find(tr => tr.from===from.id && tr.to===to.id)} onChange={()=>toggleTransition(from.id, to.id)} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: Cho phép chuyển bất kỳ → Done để đóng nhanh khi cần.','Tip: Allow any → Done for quick closure.')}</div>
          </div>
        )}

        {tab==='preview' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ fontWeight:700 }}>{t('Xem trước board theo workflow','Board preview')}</div>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${sts.length}, minmax(200px, 1fr))`, gap:12 }}>
              {sts.map(s => (
                <div key={s.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#f9fafb', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
                  <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:s.color||'#f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:800 }}>{s.name}</div>
                    <div style={{ color:'#374151', fontSize:12 }}>{s.wip==null?'∞':s.wip}</div>
                  </div>
                  <div style={{ padding:10, color:'#6b7280', fontSize:12 }}>{t('Thẻ sẽ hiển thị ở đây theo status','Cards would appear here')}</div>
                  <div style={{ padding:6, borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>{t('Nhóm','Group')}: {s.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='advanced' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ fontWeight:700 }}>{t('Quy tắc nâng cao','Advanced rules')}</div>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!wf.rules?.require_comment_to_done} onChange={e=>update({ rules: { ...(wf.rules||{}), require_comment_to_done: e.target.checked } })} />
              {t('Yêu cầu nhập bình luận khi chuyển sang Done','Require comment when moving to Done')}
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!wf.rules?.lock_after_done} onChange={e=>update({ rules: { ...(wf.rules||{}), lock_after_done: e.target.checked } })} />
              {t('Khoá chỉnh sửa sau khi Done (trừ Admin)','Lock editing after Done (except Admin)')}
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={doMigrate} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Remap status cho Tasks hiện có','Remap statuses for existing Tasks')}</button>
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Lưu ý: Remap sẽ đổi field status trên Task sang tên trạng thái mới khớp gần nhất.','Note: Remap changes Task.status into closest matching new names.')}</div>
          </div>
        )}
      </section>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280' }}>{t('Cập nhật lần cuối','Last updated')}: {new Date(wf.updated_at).toLocaleString()}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setTab('statuses')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Statuses','Statuses')}</button>
          <button onClick={()=>setTab('transitions')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Transitions','Transitions')}</button>
          <button onClick={()=>setTab('preview')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Preview','Preview')}</button>
          <button onClick={()=>setTab('advanced')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Advanced','Advanced')}</button>
        </div>
      </div>
    </div>
  );
};
