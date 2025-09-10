// src/components/app/ApprovalInbox.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { seedIfEmpty, listTasks, approve, reject, delegate, comment, bulkApprove, bulkReject, timeLeftText, type ApprovalTask } from '../../mock/approvals';

type EntityFilter = 'all'|'expense_claim'|'purchase_request'|'contract'|'invoice'|'generic';
type SortKey = 'sla'|'created_at'|'amount';
type StatusFilter = 'all'|'pending'|'approved'|'rejected'|'delegated';

function Pill({ text, tone='default' }: { text:string, tone?: 'default'|'green'|'red'|'amber'|'sky'|'slate' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='sky' ? '#e0f2fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const ApprovalInbox: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [q, setQ] = useState('');
  const [entity, setEntity] = useState<EntityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [role, setRole] = useState(''); // e.g., Manager, Finance
  const [sort, setSort] = useState<SortKey>('sla');
  const [asc, setAsc] = useState(false);

  const [rows, setRows] = useState<ApprovalTask[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<ApprovalTask|null>(null);

  const reload = async () => {
    seedIfEmpty();
    const list = await listTasks({ q, status, entity_type: entity, role: role||undefined, sort, asc });
    setRows(list);
  };
  useEffect(()=>{ reload(); }, [q, entity, status, role, sort, asc]);

  const allSelected = useMemo(()=> Object.keys(selected).filter(id => selected[id]), [selected]);
  const anySelected = allSelected.length>0;

  const colorBySLA = (due?: string): 'green'|'amber'|'red' => {
    const { ms } = timeLeftText(due);
    if (ms < 0) return 'red';
    if (ms < 8*3600000) return 'amber'; // <8h
    return 'green';
  };

  const doApprove = async (id: string) => {
    const text = prompt(t('Ghi chú (tuỳ chọn)','Comment (optional)'));
    await approve(id, text||undefined);
    await reload();
  };
  const doReject = async (id: string) => {
    const reason = prompt(t('Lý do từ chối','Rejection reason'));
    if (!reason) return;
    await reject(id, reason);
    await reload();
  };
  const doDelegate = async (id: string) => {
    const to = prompt(t('Giao cho (email hoặc userId)','Delegate to (email or userId)'));
    if (!to) return;
    const note = prompt(t('Ghi chú (tuỳ chọn)','Note (optional)'))||undefined;
    await delegate(id, to, note);
    await reload();
  };
  const doComment = async (id: string) => {
    const text = prompt(t('Nhập bình luận','Enter comment'));
    if (!text) return;
    await comment(id, text);
    await reload();
  };

  const bulkDoApprove = async () => {
    if (!anySelected) return alert(t('Chưa chọn bản ghi','No selection'));
    const note = prompt(t('Ghi chú chung (tuỳ chọn)','Bulk comment (optional)'))||undefined;
    await bulkApprove(allSelected, note);
    setSelected({});
    await reload();
  };
  const bulkDoReject = async () => {
    if (!anySelected) return alert(t('Chưa chọn bản ghi','No selection'));
    const reason = prompt(t('Lý do chung','Bulk rejection reason'));
    if (!reason) return;
    await bulkReject(allSelected, reason);
    setSelected({});
    await reload();
  };

  const Header = () => (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ fontWeight:800 }}>{t('Hộp thư phê duyệt','Approval inbox')}</div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Tìm ID/Tiêu đề/Người gửi/Stage','Search ID/Title/Requester/Stage')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:320 }} />
        <select value={entity} onChange={e=>setEntity(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {['all','expense_claim','purchase_request','contract','invoice','generic'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
          {['all','pending','approved','rejected','delegated'].map(x => <option key={x} value={x}>{x.toUpperCase()}</option>)}
        </select>
        <input value={role} onChange={e=>setRole(e.target.value)} placeholder={t('Vai trò (VD: Manager, Finance)','Role (e.g., Manager, Finance)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:180 }} />
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span>{t('Sort','Sort')}</span>
          <select value={sort} onChange={e=>setSort(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="sla">{t('SLA','SLA')}</option>
            <option value="created_at">{t('Created','Created')}</option>
            <option value="amount">{t('Amount','Amount')}</option>
          </select>
          <button onClick={()=>setAsc(a=>!a)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{asc ? '↑' : '↓'}</button>
        </label>
      </div>
    </div>
  );

  const RowCard: React.FC<{ r: ApprovalTask }> = ({ r }) => {
    const sla = timeLeftText(r.due_at);
    const tone = colorBySLA(r.due_at);
    return (
      <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'8px 10px', display:'grid', gridTemplateColumns:'24px 1fr auto', gap:8, alignItems:'start' }}>
        <input type="checkbox" checked={!!selected[r.id]} onChange={e=>setSelected(m => ({ ...m, [r.id]: e.target.checked }))} />
        <div onClick={()=>setActive(r)} style={{ cursor:'pointer' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <strong>{r.entity_id}</strong>
            <span>{r.title}</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', color:'#6b7280', fontSize:12, marginTop:4, flexWrap:'wrap' }}>
            <Pill text={r.entity_type} />
            <Pill text={r.stage_name} tone="sky" />
            <Pill text={`${r.amount?.toLocaleString?.()||''} ${r.currency||''}`} />
            <Pill text={r.requester.name} />
            <Pill text={new Date(r.created_at).toLocaleString()} />
            <Pill text={sla.text} tone={tone} />
            <Pill text={r.assigned_to ? `${r.assigned_to.type}:${r.assigned_to.ref}` : ''} />
            <Pill text={r.status.toUpperCase()} tone={r.status==='pending'?'slate': r.status==='approved'?'green': r.status==='rejected'?'red':'amber'} />
          </div>
        </div>
        <div style={{ display:'grid', gap:6, justifyItems:'end' }}>
          {r.status==='pending' && (
            <>
              <button onClick={()=>doApprove(r.id)} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'4px 10px' }}>{t('Duyệt','Approve')}</button>
              <button onClick={()=>doReject(r.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 10px', background:'#fff' }}>{t('Từ chối','Reject')}</button>
              <button onClick={()=>doDelegate(r.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 10px', background:'#fff' }}>{t('Giao việc','Delegate')}</button>
            </>
          )}
          <button onClick={()=>doComment(r.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 10px', background:'#fff' }}>{t('Bình luận','Comment')}</button>
        </div>
      </div>
    );
  };

  const DetailDrawer: React.FC = () => {
    if (!active) return null;
    return (
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:420, borderLeft:'1px solid #e5e7eb', background:'#fff', boxShadow:'-8px 0 20px rgba(0,0,0,.06)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
        <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{active.entity_id} — {active.title}</div>
          <button onClick={()=>setActive(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>
        </div>
        <div style={{ overflow:'auto', padding:10, display:'grid', gap:10 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Thông tin chung','Summary')}</div>
            <div style={{ padding:10, display:'grid', gap:6, fontSize:14 }}>
              <div><b>{t('Người gửi','Requester')}:</b> {active.requester.name} ({active.requester.department})</div>
              <div><b>{t('Bước','Stage')}:</b> {active.stage_name} • <b>Rule:</b> {active.approval_rule || '—'}</div>
              <div><b>{t('Số tiền','Amount')}:</b> {(active.amount||0).toLocaleString?.()} {active.currency}</div>
              <div><b>{t('Tạo lúc','Created')}:</b> {new Date(active.created_at).toLocaleString()}</div>
              <div><b>SLA:</b> {timeLeftText(active.due_at).text}</div>
              <div><b>{t('Giao cho','Assigned to')}:</b> {active.assigned_to ? `${active.assigned_to.type}:${active.assigned_to.ref}` : '—'}</div>
            </div>
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Dữ liệu yêu cầu','Request data')}</div>
            <pre style={{ margin:0, padding:10, overflow:'auto' }}>{JSON.stringify(active.payload||{}, null, 2)}</pre>
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Bình luận','Comments')}</div>
            <div style={{ padding:10 }}>
              {(active.comments||[]).length===0 ? <div style={{ color:'#6b7280' }}>—</div> :
                (active.comments||[]).map((c,i) => <div key={i} style={{ borderTop:'1px solid #f1f5f9', padding:'6px 0' }}><div style={{ fontSize:12, color:'#6b7280' }}>{c.by} • {new Date(c.at).toLocaleString()}</div><div>{c.text}</div></div>)
              }
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
              {active.status==='pending' && (
                <>
                  <button onClick={()=>doApprove(active.id)} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Duyệt','Approve')}</button>
                  <button onClick={()=>doReject(active.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Từ chối','Reject')}</button>
                  <button onClick={()=>doDelegate(active.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Giao việc','Delegate')}</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tip: sắp xếp theo SLA để xử lý ưu tiên trước.','Tip: sort by SLA to prioritize hot items.')}</div>
          <button onClick={()=>setActive(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      <Header />
      {/* Bulk actions */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Đang chọn','Selected')}: {allSelected.length}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={bulkDoApprove} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Duyệt hàng loạt','Bulk approve')}</button>
          <button onClick={bulkDoReject} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Từ chối hàng loạt','Bulk reject')}</button>
        </div>
      </div>

      {/* List */}
      <div style={{ display:'grid', gap:10 }}>
        {rows.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : rows.map(r => <RowCard key={r.id} r={r} />)}
      </div>

      {/* Drawer */}
      <DetailDrawer />
    </div>
  );
};
