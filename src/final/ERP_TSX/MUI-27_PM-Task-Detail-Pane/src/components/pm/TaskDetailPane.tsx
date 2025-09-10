// src/components/pm/TaskDetailPane.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTask, updateTask, listEmployees, listProjects,
  listSubtasks, upsertSubtask, reorderSubtasks, deleteSubtask,
  listComments, addComment, deleteComment,
  listAttachments, addAttachment, deleteAttachment,
  type Task, type Employee, type Subtask, type Comment, type Attachment
} from '../../mock/task_detail';

type TabKey = 'overview'|'subtasks'|'comments'|'files';

export type TaskDetailPaneProps = {
  taskId: string | null;
  onClose?: () => void;
  locale?: 'vi'|'en';
};

const priMeta: Record<NonNullable<Task['priority']>, { vi: string; en: string }> = {
  low: { vi: 'Thấp', en: 'Low' },
  medium: { vi: 'Trung bình', en: 'Medium' },
  high: { vi: 'Cao', en: 'High' },
  urgent: { vi: 'Khẩn', en: 'Urgent' },
};

const statusMeta: Record<NonNullable<Task['status']>, { vi: string; en: string }> = {
  backlog: { vi:'Backlog', en:'Backlog' },
  todo: { vi:'To do', en:'To do' },
  in_progress: { vi:'Đang làm', en:'In progress' },
  review: { vi:'Review', en:'Review' },
  done: { vi:'Hoàn tất', en:'Done' },
};

export const TaskDetailPane: React.FC<TaskDetailPaneProps> = ({ taskId, onClose, locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const [task, setTask] = useState<Task | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [projs, setProjs] = useState<Array<{id:string;name:string}>>([]);
  const [tab, setTab] = useState<TabKey>('overview');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Subtasks
  const [subs, setSubs] = useState<Subtask[]>([]);
  // Comments
  const [cmts, setCmts] = useState<Comment[]>([]);
  const [cmtDraft, setCmtDraft] = useState('');
  // Files
  const [files, setFiles] = useState<Attachment[]>([]);

  const assName = (id?:string) => emps.find(e=>e.id===id)?.name || '';
  const projName = (id?:string) => projs.find(p=>p.id===id)?.name || '';

  const load = async () => {
    if (!taskId) return;
    setTask(await getTask(taskId));
    setSubs(await listSubtasks(taskId));
    setCmts(await listComments(taskId));
    setFiles(await listAttachments(taskId));
  };
  const loadMeta = async () => {
    setEmps(await listEmployees({ active_only: true }));
    setProjs(await listProjects());
  };

  useEffect(()=>{ loadMeta(); }, []);
  useEffect(()=>{ load(); }, [taskId]);

  const patch = async (p: Partial<Task>) => {
    if (!task) return;
    setBusy(true);
    const saved = await updateTask(task.id, p);
    setTask(saved);
    setBusy(false);
    setToast(t('Đã lưu','Saved')); setTimeout(()=>setToast(null), 1500);
  };

  // Subtasks ops
  const addSub = async () => {
    if (!task) return;
    const title = prompt(t('Tên subtask','Subtask title'));
    if (!title) return;
    await upsertSubtask(task.id, { title });
    setSubs(await listSubtasks(task.id));
  };
  const toggleSub = async (s: Subtask) => {
    if (!task) return;
    await upsertSubtask(task.id, { id: s.id, done: !s.done });
    setSubs(await listSubtasks(task.id));
  };
  const delSub = async (s: Subtask) => {
    if (!task) return;
    if (!confirm(t('Xoá subtask này?','Delete this subtask?'))) return;
    await deleteSubtask(task.id, s.id);
    setSubs(await listSubtasks(task.id));
  };
  const moveSub = async (s: Subtask, dir: -1|1) => {
    if (!task) return;
    const idx = subs.findIndex(x=>x.id===s.id);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= subs.length) return;
    const ordered = subs.slice();
    const [a,b] = [ordered[idx], ordered[nextIdx]];
    ordered[idx] = b; ordered[nextIdx] = a;
    await reorderSubtasks(task.id, ordered.map(x=>x.id));
    setSubs(await listSubtasks(task.id));
  };

  // Comments ops
  const addCmt = async () => {
    if (!task || !cmtDraft.trim()) return;
    await addComment(task.id, { id: 'me', name: 'You' }, cmtDraft.trim());
    setCmtDraft('');
    setCmts(await listComments(task.id));
  };
  const delCmt = async (c: Comment) => {
    if (!task) return;
    await deleteComment(task.id, c.id);
    setCmts(await listComments(task.id));
  };

  // Files ops
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task) return;
    const file = e.target.files?.[0]; if (!file) return;
    await addAttachment(task.id, file);
    setFiles(await listAttachments(task.id));
    e.currentTarget.value = '';
  };
  const removeFile = async (a: Attachment) => {
    if (!task) return;
    await deleteAttachment(task.id, a.id);
    setFiles(await listAttachments(task.id));
  };

  const headerColor = (st?: Task['status']) => ({
    borderLeft: '6px solid ' + (st==='done' ? '#16a34a' : st==='review' ? '#8b5cf6' : st==='in_progress' ? '#f59e0b' : st==='todo' ? '#3b82f6' : '#9ca3af')
  });

  if (!taskId) return null;

  return (
    <div style={{ position:'fixed', top:0, right:0, width:'min(720px, 96vw)', height:'100vh', background:'#fff', borderLeft:'1px solid #e5e7eb', boxShadow:'-16px 0 40px rgba(0,0,0,.08)', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
      {/* Title bar */}
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', ...headerColor(task?.status) }}>
        <div style={{ display:'grid' }}>
          <div style={{ fontWeight:800 }}>{task?.title || '—'}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{projName(task?.project_id)} • {task?.id}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>✕ {t('Đóng','Close')}</button>
        </div>
      </div>

      {/* Inline quick fields */}
      <div style={{ padding:'8px 12px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, alignItems:'center' }}>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Trạng thái','Status')}</span>
          <select value={task?.status||'todo'} onChange={e=>patch({ status: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {(['backlog','todo','in_progress','review','done'] as const).map(k => <option key={k} value={k}>{statusMeta[k][locale]}</option>)}
          </select>
        </label>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Ưu tiên','Priority')}</span>
          <select value={task?.priority||'medium'} onChange={e=>patch({ priority: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {(['low','medium','high','urgent'] as const).map(k => <option key={k} value={k}>{priMeta[k][locale]}</option>)}
          </select>
        </label>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Assignee','Assignee')}</span>
          <select value={task?.assignee_id||''} onChange={e=>patch({ assignee_id: e.target.value||undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="">{t('— Chưa giao —','— Unassigned —')}</option>
            {emps.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Hạn','Due')}</span>
          <input type="date" value={task?.due_date||''} onChange={e=>patch({ due_date: e.target.value || undefined })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Ước tính (giờ)','Estimate (h)')}</span>
          <input type="number" min={0} step={0.5} value={task?.estimate_hours||0} onChange={e=>patch({ estimate_hours: Number(e.target.value||0) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
        <label style={{ display:'grid', gap:4 }}>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Đã log (giờ)','Logged (h)')}</span>
          <input type="number" min={0} step={0.5} value={task?.logged_hours||0} onChange={e=>patch({ logged_hours: Number(e.target.value||0) })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        </label>
      </div>

      {/* Tabs */}
      <div style={{ padding:'6px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:8 }}>
        {(['overview','subtasks','comments','files'] as TabKey[]).map(k => (
          <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid ' + (tab===k ? '#4f46e5' : '#e5e7eb'), color: tab===k ? '#4f46e5' : '#111827', background:'#fff', borderRadius:999, padding:'6px 10px' }}>
            {k==='overview'?t('Tổng quan','Overview'):k==='subtasks'?t('Subtasks','Subtasks'):k==='comments'?t('Bình luận','Comments'):t('Tài liệu','Files')}
          </button>
        ))}
        <div style={{ marginLeft:'auto', color:'#6b7280' }}>{toast || ' '}</div>
      </div>

      {/* Body */}
      <div style={{ overflow:'auto' }}>
        {tab==='overview' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tiêu đề','Title')}</div>
              <input value={task?.title||''} onChange={e=>setTask(tk=>tk?{...tk, title:e.target.value}:tk)} onBlur={e=>patch({ title: e.target.value })} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Mô tả','Description')}</div>
              <textarea value={task?.description||''} onChange={e=>setTask(tk=>tk?{...tk, description:e.target.value}:tk)} onBlur={e=>patch({ description: task?.description || '' })} rows={6} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Nhãn (phân cách bởi dấu phẩy)','Labels (comma separated)')}</div>
              <input defaultValue={(task?.labels||[]).join(', ')} onBlur={e=>patch({ labels: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="frontend, backend, ..." style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                {(task?.labels||[]).map(lb => <span key={lb} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'2px 8px', fontSize:12, background:'#f9fafb' }}>#{lb}</span>)}
              </div>
            </div>
          </div>
        )}

        {tab==='subtasks' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Subtasks','Subtasks')}</div>
              <button onClick={addSub} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>＋ {t('Thêm','Add')}</button>
            </div>
            <div style={{ display:'grid', gap:8 }}>
              {subs.length===0 && <div style={{ color:'#6b7280' }}>—</div>}
              {subs.map(s => (
                <div key={s.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:8, alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>
                  <input type="checkbox" checked={s.done} onChange={()=>toggleSub(s)} />
                  <input defaultValue={s.title} onBlur={async e=>{ await upsertSubtask(s.task_id, { id: s.id, title: e.target.value }); setSubs(await listSubtasks(s.task_id)); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    <button onClick={()=>moveSub(s, -1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>↑</button>
                    <button onClick={()=>moveSub(s, +1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>↓</button>
                  </div>
                  <button onClick={()=>delSub(s)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Del')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='comments' && (
          <div style={{ padding:12, display:'grid', gap:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
              <input value={cmtDraft} onChange={e=>setCmtDraft(e.target.value)} placeholder={t('Viết bình luận... (hỗ trợ @tên ở UI)','Write a comment...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <button onClick={addCmt} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Gửi','Post')}</button>
            </div>
            <div style={{ display:'grid', gap:8 }}>
              {cmts.length===0 && <div style={{ color:'#6b7280' }}>—</div>}
              {cmts.map(c => (
                <div key={c.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div><b>{c.author_name}</b> <span style={{ color:'#6b7280', fontSize:12 }}>{new Date(c.created_at).toLocaleString()}</span></div>
                    <button onClick={()=>delCmt(c)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>✕</button>
                  </div>
                  <div style={{ marginTop:4, whiteSpace:'pre-wrap' }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='files' && (
          <div style={{ padding:12, display:'grid', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Tài liệu đính kèm','Attachments')}</div>
              <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
                {t('Tải tệp','Upload file')}
                <input type="file" onChange={onPickFile} style={{ display:'none' }} />
              </label>
            </div>
            <div style={{ display:'grid', gap:8 }}>
              {files.length===0 && <div style={{ color:'#6b7280' }}>—</div>}
              {files.map(a => (
                <div key={a.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{a.filename}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{(a.size||0).toLocaleString()} B • {a.mime||'file'} • {new Date(a.uploaded_at).toLocaleString()}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {a.url && <a href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                      <button style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Mở','Open')}</button>
                    </a>}
                    <button onClick={()=>removeFile(a)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Xoá','Delete')}</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: nên lưu file ở EIM/Doc service; UI chỉ quản lý metadata + link tải.','Tip: store files in EIM/Doc service; UI keeps metadata + download link only.')}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280', fontSize:12 }}>
          {t('Cập nhật','Updated')}: {task ? new Date(task.updated_at).toLocaleString() : '—'}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setTab('overview')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Overview','Overview')}</button>
          <button onClick={()=>setTab('subtasks')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Subtasks','Subtasks')}</button>
          <button onClick={()=>setTab('comments')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Comments','Comments')}</button>
          <button onClick={()=>setTab('files')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Files','Files')}</button>
        </div>
      </div>
    </div>
  );
};
