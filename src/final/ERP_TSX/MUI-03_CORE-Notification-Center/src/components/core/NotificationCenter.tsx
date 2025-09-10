// src/components/core/NotificationCenter.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { NotificationItem, SubscribeFn, markAllRead as _markAllRead, markRead as _markRead } from '../../mock/notifications';
import { mockSubscribe, seedInitial, markAllRead, markRead } from '../../mock/notifications';

export type NotificationCenterProps = {
  subscribe?: SubscribeFn;                 // live updates (SSE/WebSocket adapter). default: mockSubscribe(3s)
  initial?: NotificationItem[];            // initial list. default: seedInitial(6)
  onNavigate?: (route: string) => void;    // open item
  locale?: 'vi'|'en';
};

const typeIcon: Record<NotificationItem['type'], string> = {
  approval: '✅',
  comment: '💬',
  task_status: '🗂️',
  document: '📄',
};

const typeLabel = (t: NotificationItem['type'], locale:'vi'|'en') => {
  const vi: Record<NotificationItem['type'], string> = {
    approval: 'Phê duyệt',
    comment: 'Bình luận',
    task_status: 'Trạng thái công việc',
    document: 'Tài liệu',
  };
  const en: Record<NotificationItem['type'], string> = {
    approval: 'Approvals',
    comment: 'Comments',
    task_status: 'Task status',
    document: 'Documents',
  };
  return locale === 'vi' ? vi[t] : en[t];
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  subscribe = mockSubscribe(3000),
  initial = seedInitial(6),
  onNavigate,
  locale = 'vi',
}) => {
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all'|NotificationItem['type']>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    const stop = subscribe((n) => setItems(list => [n, ...list].slice(0, 50)));
    return () => { stop && stop(); };
  }, [subscribe]);

  const unreadCount = items.filter(i => i.unread).length;

  const filtered = useMemo(() => {
    let arr = [...items];
    if (filter !== 'all') arr = arr.filter(i => i.type === filter);
    if (q) {
      const qq = q.toLowerCase();
      arr = arr.filter(i =>
        i.title.toLowerCase().includes(qq) ||
        (i.subtitle || '').toLowerCase().includes(qq)
      );
    }
    return arr;
  }, [items, filter, q]);

  const onOpen = (it: NotificationItem) => {
    if (it.route) onNavigate?.(it.route);
    setItems(prev => markRead(prev, it.id));
    setOpen(false);
  };

  const Button = (
    <button onClick={() => setOpen(v=>!v)} style={{ position:'relative', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }} title="Notifications">
      🔔
      {unreadCount > 0 && (
        <span style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'#fff', padding:'2px 6px', borderRadius:999, fontSize:12, minWidth:18, textAlign:'center' }}>
          {unreadCount}
        </span>
      )}
    </button>
  );

  if (!open) return Button;

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      {Button}
      <div style={{ position:'absolute', right:0, marginTop:8, width:520, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.18)', zIndex:1000 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700 }}>{locale==='vi' ? 'Thông báo' : 'Notifications'}</div>
          <div style={{ display:'flex', gap:8 }}>
            <select value={filter} onChange={e=>setFilter(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="all">{locale==='vi'?'Tất cả':'All'}</option>
              <option value="approval">{typeLabel('approval', locale)}</option>
              <option value="comment">{typeLabel('comment', locale)}</option>
              <option value="task_status">{typeLabel('task_status', locale)}</option>
              <option value="document">{typeLabel('document', locale)}</option>
            </select>
            <button onClick={()=>setItems(list => markAllRead(list))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', background:'#fff' }}>{locale==='vi'?'Đánh dấu đã đọc':'Mark all read'}</button>
          </div>
        </div>
        {/* Search */}
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
          <input placeholder={locale==='vi'?'Lọc nhanh...':'Quick filter...'} value={q} onChange={e=>setQ(e.target.value)} style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
        </div>
        {/* List */}
        <div style={{ maxHeight:360, overflow:'auto', display:'flex', flexDirection:'column', gap:6, padding:10 }}>
          {filtered.length === 0 && (
            <div style={{ color:'#6b7280' }}>{locale==='vi'?'Không có thông báo':'No notifications'}</div>
          )}
          {filtered.map(it => (
            <button key={it.id} onClick={()=>onOpen(it)} style={{ textAlign:'left', border:'1px solid #e5e7eb', background: it.unread ? '#eef2ff' : '#fff', borderRadius:8, padding:'8px 10px', cursor:'pointer' }}>
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ width:20, textAlign:'center' }}>{typeIcon[it.type]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{it.title}</div>
                  {it.subtitle && <div style={{ fontSize:12, color:'#6b7280' }}>{it.subtitle}</div>}
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{new Date(it.time).toLocaleString()}</div>
                </div>
                {it.unread && <span style={{ fontSize:10, color:'#4f46e5', fontWeight:700 }}>NEW</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Optional: Topbar wrapper for convenience
export const NotificationBell: React.FC<NotificationCenterProps> = (props) => {
  return <NotificationCenter {...props} />;
};
