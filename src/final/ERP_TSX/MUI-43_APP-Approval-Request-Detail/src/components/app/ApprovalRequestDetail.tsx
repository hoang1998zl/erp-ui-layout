
// src/components/app/ApprovalRequestDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listTasks, getTask, saveTask, approve, reject, delegateTo, addComment, timeLeftText, type ApprovalTask } from '../../mock/approvals';
import { listTimeline, seedTimelineIfEmpty, logApproved, logRejected, logDelegated, logComment, type TimelineItem } from '../../mock/timeline';

type TabKey = 'summary'|'timeline'|'attachments'|'audit';

function Pill({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'sky'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='sky' ? '#e0f2fe' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

function Section({ title, children }: { title:string, children:any }) {
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{title}</div>
      <div style={{ padding:10 }}>{children}</div>
    </div>
  );
}

function EventRow({ ev }: { ev: TimelineItem }) {
  const palette: Record<string, string> = {
    submitted:'#e0f2fe', routed:'#e0f2fe', approved:'#dcfce7', rejected:'#fee2e2', delegated:'#fef9c3', comment:'#f1f5f9', escalated:'#fde68a', sla_warning:'#fde68a', updated:'#ede9fe'
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, padding:'6px 0', borderTop:'1px solid #f1f5f9' }}>
      <div style={{ color:'#6b7280', fontSize:12 }}>{new Date(ev.at).toLocaleString()}</div>
      <div style={{ background: palette[ev.type]||'#f1f5f9', borderRadius:8, padding:'6px 8px' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <Pill text={ev.type} tone={ev.type==='approved'?'green': ev.type==='rejected'?'red': ev.type==='delegated'?'amber':'slate'} />
          {ev.by && <span style={{ color:'#6b7280' }}>{ev.by}</span>}
        </div>
        {ev.message && <div style={{ marginTop:4 }}>{ev.message}</div>}
      </div>
    </div>
  );
}

export const ApprovalRequestDetail: React.FC<{ locale?: 'vi'|'en', taskId?: string }> = ({ locale='vi', taskId }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [id, setId] = useState<string>(taskId || '');
  const [task, setTask] = useState<ApprovalTask | null>(null);
  const [events, setEvents] = useState<TimelineItem[]>([]);
  const [tab, setTab] = useState<TabKey>('summary');
  const [list, setList] = useState<ApprovalTask[]>([]);
  const [commentText, setCommentText] = useState('');

  const toneByStatus = (s: string): 'slate'|'green'|'red'|'amber' => s==='approved' ? 'green' : s==='rejected' ? 'red' : s==='delegated' ? 'amber' : 'slate';
  const toneBySLA = (due?: string): 'green'|'amber'|'red' => {
    const ms = timeLeftText(due).ms;
    if (ms < 0) return 'red';
    if (ms < 8*3600000) return 'amber';
    return 'green';
  };

  // Load initial list and pick first if no id
  useEffect(()=>{
    seedIfEmpty();
    const l = listTasks(); setList(l);
    const urlId = new URLSearchParams(window.location.search).get('taskId') || id || l[0]?.id || '';
    setId(urlId);
  }, []);

  useEffect(()=>{
    if (!id) return;
    const tsk = getTask(id);
    if (tsk) {
      setTask(tsk);
      seedTimelineIfEmpty(id);
      setEvents(listTimeline(id));
    }
  }, [id]);

  const doApprove = () => {
    if (!task) return;
    const note = prompt(t('Ghi chú (tuỳ chọn)','Comment (optional)'))||undefined;
    approve(task.id, note);
    setTask(getTask(task.id)!);
    setEvents(listTimeline(task.id));
    logApproved(task.id, 'me', note||undefined);
  };
  const doReject = () => {
    if (!task) return;
    const reason = prompt(t('Lý do từ chối','Rejection reason'));
    if (!reason) return;
    reject(task.id, reason);
    setTask(getTask(task.id)!);
    setEvents(listTimeline(task.id));
    logRejected(task.id, 'me', reason);
  };
  const doDelegate = () => {
    if (!task) return;
    const to = prompt(t('Giao cho (email/userId)','Delegate to (email/userId)')); if (!to) return;
    const note = prompt(t('Ghi chú (tuỳ chọn)','Note (optional)'))||undefined;
    delegateTo(task.id, to, note);
    setTask(getTask(task.id)!);
    setEvents(listTimeline(task.id));
    logDelegated(task.id, 'me', to, note);
  };
  const doComment = () => {
    if (!task || !commentText.trim()) return;
    addComment(task.id, commentText.trim());
    logComment(task.id, 'me', commentText.trim());
    setTask(getTask(task.id)!);
    setEvents(listTimeline(task.id));
    setCommentText('');
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'grid', gap:6 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontWeight:800 }}>{t('Chi tiết yêu cầu phê duyệt','Approval request detail')}</div>
            {task && <Pill text={task.status.toUpperCase()} tone={toneByStatus(task.status)} />}
            {task && <Pill text={timeLeftText(task.due_at).text} tone={toneBySLA(task.due_at)} />}
          </div>
          {task && (
            <div style={{ display:'flex', gap:8, alignItems:'center', color:'#6b7280', flexWrap:'wrap' }}>
              <Pill text={task.entity_type} />
              <span><b>{task.entity_id}</b> — {task.title}</span>
              <span>• {t('Người gửi','Requester')}: <b>{task.requester.name}</b> ({task.requester.department})</span>
              <span>• {t('Bước','Stage')}: <b>{task.stage_name}</b> ({task.approval_rule||'—'})</span>
              <span>• {t('Số tiền','Amount')}: <b>{(task.amount||0).toLocaleString?.()}</b> {task.currency}</span>
              <span>• {t('Tạo lúc','Created')}: {new Date(task.created_at).toLocaleString()}</span>
              {task.assigned_to && <span>• {t('Giao cho','Assigned to')}: {task.assigned_to.type}:{task.assigned_to.ref}</span>}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {task?.status==='pending' && (
            <>
              <button onClick={doApprove} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Duyệt','Approve')}</button>
              <button onClick={doReject} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Từ chối','Reject')}</button>
              <button onClick={doDelegate} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Giao việc','Delegate')}</button>
            </>
          )}
          <select value={id} onChange={e=>setId(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {list.map(x => <option key={x.id} value={x.id}>{x.entity_id} — {x.title}</option>)}
          </select>
        </div>
      </div>

      {/* Body: left tabs + right sidebar */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Left: tabs */}
        <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:8 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', gap:8 }}>
            {(['summary','timeline','attachments','audit'] as TabKey[]).map(k => (
              <button key={k} onClick={()=>setTab(k)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background: tab===k ? '#eef2ff':'#fff' }}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr' }}>
            {/* Panel header */}
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>
              {tab==='summary' ? t('Tổng quan','Summary') : tab==='timeline' ? 'Timeline' : tab==='attachments' ? t('Tệp đính kèm','Attachments') : 'Audit'}
            </div>
            {/* Panel body */}
            <div style={{ padding:10, overflow:'auto' }}>
              {!task ? <div style={{ color:'#6b7280' }}>—</div> : (
                <>
                  {tab==='summary' && (
                    <div style={{ display:'grid', gap:10 }}>
                      <Section title={t('Dữ liệu yêu cầu','Request data')}>
                        <pre style={{ margin:0, overflow:'auto' }}>{JSON.stringify(task.payload||{}, null, 2)}</pre>
                      </Section>
                      <Section title={t('Bình luận','Comments')}>
                        <div style={{ display:'grid', gap:6 }}>
                          {(task.comments||[]).length===0 ? <div style={{ color:'#6b7280' }}>—</div> :
                            (task.comments||[]).map((c,i) => (
                              <div key={i} style={{ borderTop:'1px solid #f1f5f9', padding:'6px 0' }}>
                                <div style={{ fontSize:12, color:'#6b7280' }}>{c.by} • {new Date(c.at).toLocaleString()}</div>
                                <div>{c.text}</div>
                              </div>
                            ))
                          }
                          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                            <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={t('Nhập bình luận...','Write a comment...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                            <button onClick={doComment} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Gửi','Send')}</button>
                          </div>
                        </div>
                      </Section>
                    </div>
                  )}
                  {tab==='timeline' && (
                    <div>
                      {events.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : events.map(ev => <EventRow key={ev.id} ev={ev} />)}
                    </div>
                  )}
                  {tab==='attachments' && (
                    <div style={{ color:'#6b7280' }}>{t('Chưa có mock tệp đính kèm. Có thể gắn với EIM‑01/EIM‑03.','No mock attachments yet. Could link to EIM‑01/EIM‑03.')}</div>
                  )}
                  {tab==='audit' && (
                    <div style={{ color:'#6b7280' }}>{t('Audit log sẽ tích hợp ADM‑06.','Audit log integrates with ADM‑06.')}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display:'grid', gap:12 }}>
          <Section title={t('SLA & Trạng thái','SLA & Status')}>
            {task ? (
              <div style={{ display:'grid', gap:6 }}>
                <div><b>SLA:</b> <Pill text={timeLeftText(task.due_at).text} tone={toneBySLA(task.due_at)} /></div>
                <div><b>{t('Trạng thái','Status')}:</b> <Pill text={task.status.toUpperCase()} tone={toneByStatus(task.status)} /></div>
                <div><b>{t('Rule','Rule')}:</b> {task.approval_rule || '—'}</div>
                <div><b>{t('Workflow','Workflow')}:</b> {task.workflow_id || '—'}</div>
              </div>
            ) : <div style={{ color:'#6b7280' }}>—</div>}
          </Section>

          <Section title={t('Người tham gia','Participants')}>
            {task ? (
              <div style={{ display:'grid', gap:6 }}>
                <div><b>{t('Người gửi','Requester')}:</b> {task.requester.name} ({task.requester.department})</div>
                <div><b>{t('Đang giao cho','Assigned to')}:</b> {task.assigned_to ? `${task.assigned_to.type}:${task.assigned_to.ref}` : '—'}</div>
              </div>
            ) : <div style={{ color:'#6b7280' }}>—</div>}
          </Section>

          <Section title={t('Liên kết','Links')}>
            {task ? (
              <div style={{ display:'grid', gap:6 }}>
                <a href="#" onClick={e=>{ e.preventDefault(); alert('Open entity record in module (mock)'); }}>{t('Mở bản ghi','Open record')} — {task.entity_id}</a>
                <a href="#" onClick={e=>{ e.preventDefault(); setTab('timeline'); }}>{t('Xem timeline','View timeline')}</a>
              </div>
            ) : <div style={{ color:'#6b7280' }}>—</div>}
          </Section>
        </div>
      </div>
    </div>
  );
};
