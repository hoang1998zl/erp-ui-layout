// src/mock/notifications.ts
export type UUID = string;
export type NotiType = 'approval'|'comment'|'task_status'|'document';

export type NotificationItem = {
  id: UUID;
  type: NotiType;
  title: string;      // short
  subtitle?: string;  // context line
  time: string;       // ISO
  unread: boolean;
  route?: string;     // navigate target
  entity?: { type: string; id: UUID };
};

// Simple UUID (mock)
function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

const samples = {
  approvals: [
    { title: 'Expense waiting for approval', subtitle: 'E-102 · Travel 2,350,000 VND', route: '/approvals/E-102' },
    { title: 'Task status change needs review', subtitle: 'Setup Approval Inbox', route: '/approvals/T-441' },
  ],
  comments: [
    { title: 'New comment on task', subtitle: '“Please attach the receipt” — fin@ktest.vn', route: '/tasks/T-220' },
    { title: 'Mention @you in project', subtitle: 'PRJ-HAPPY — meeting notes updated', route: '/projects/PRJ-HAPPY' },
  ],
  task: [
    { title: 'Task moved to In Progress', subtitle: 'Define CoA & Dimensions', route: '/tasks/T-118' },
    { title: 'Task completed', subtitle: 'Build App Shell', route: '/tasks/T-119' },
  ],
  docs: [
    { title: 'New document linked', subtitle: 'Receipt — Taxi 850,000 VND', route: '/docs/D-778' },
    { title: 'Contract uploaded', subtitle: 'Service Agreement — Happy Square', route: '/docs/D-421' },
  ]
};

export type SubscribeFn = (cb: (n: NotificationItem)=>void) => () => void;

export function mockSubscribe(intervalMs = 3000): SubscribeFn {
  return (cb) => {
    const id = setInterval(() => {
      const bucket = Math.random();
      let n: NotificationItem;
      const now = new Date().toISOString();
      if (bucket < 0.25) {
        const s = samples.approvals[Math.floor(Math.random()*samples.approvals.length)];
        n = { id: rid(), type:'approval', title: s.title, subtitle: s.subtitle, time: now, unread:true, route: s.route, entity: { type:'approval', id: rid() } };
      } else if (bucket < 0.5) {
        const s = samples.comments[Math.floor(Math.random()*samples.comments.length)];
        n = { id: rid(), type:'comment', title: s.title, subtitle: s.subtitle, time: now, unread:true, route: s.route, entity: { type:'task', id: rid() } };
      } else if (bucket < 0.75) {
        const s = samples.task[Math.floor(Math.random()*samples.task.length)];
        n = { id: rid(), type:'task_status', title: s.title, subtitle: s.subtitle, time: now, unread:true, route: s.route, entity: { type:'task', id: rid() } };
      } else {
        const s = samples.docs[Math.floor(Math.random()*samples.docs.length)];
        n = { id: rid(), type:'document', title: s.title, subtitle: s.subtitle, time: now, unread:true, route: s.route, entity: { type:'document', id: rid() } };
      }
      cb(n);
    }, intervalMs);
    return () => clearInterval(id);
  };
}

// Seed initial list
export function seedInitial(count = 6): NotificationItem[] {
  const arr: NotificationItem[] = [];
  for (let i=0; i<count; i++) {
    const sub = mockSubscribe(0); // immediate
    const push = (n: NotificationItem) => arr.push({ ...n, unread: i < 3 }); // half unread
    const stop = sub(push); // will not schedule when interval=0
    stop && stop();
  }
  // sort by time desc
  arr.sort((a,b)=> (b.time.localeCompare(a.time)));
  return arr.slice(0, count);
}

// Utility: mark items read
export function markAllRead(items: NotificationItem[]): NotificationItem[] {
  return items.map(n => ({ ...n, unread:false }));
}

export function markRead(items: NotificationItem[], id: UUID): NotificationItem[] {
  return items.map(n => n.id === id ? { ...n, unread:false } : n);
}
