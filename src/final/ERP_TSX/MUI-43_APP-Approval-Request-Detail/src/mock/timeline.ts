
// src/mock/timeline.ts — timeline of actions/events for a task
import { getTask, saveTask, type ApprovalTask } from './approvals';

export type EventType = 'submitted'|'routed'|'approved'|'rejected'|'delegated'|'comment'|'escalated'|'sla_warning'|'updated';
export type TimelineItem = {
  id: string;
  type: EventType;
  at: string;
  by?: string;
  message?: string;
  meta?: any;
};

const LS_TIMELINE = 'erp.app.approvals.timeline.v1';

function rid(): string { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export function listTimeline(taskId: string): TimelineItem[] {
  try {
    const map = JSON.parse(localStorage.getItem(LS_TIMELINE) || '{}');
    return Array.isArray(map[taskId]) ? map[taskId] : [];
  } catch { return []; }
}
export function saveTimeline(taskId: string, items: TimelineItem[]): void {
  const map = JSON.parse(localStorage.getItem(LS_TIMELINE) || '{}');
  map[taskId] = items;
  localStorage.setItem(LS_TIMELINE, JSON.stringify(map));
}
export function addEvent(taskId: string, ev: Omit<TimelineItem,'id'|'at'>): TimelineItem {
  const items = listTimeline(taskId);
  const item = { id: rid(), at: nowISO(), ...ev };
  items.push(item);
  saveTimeline(taskId, items);
  return item;
}

// Convenience wrappers to log events
export function logApproved(taskId: string, by: string, message?: string) { addEvent(taskId, { type:'approved', by, message }); }
export function logRejected(taskId: string, by: string, reason: string) { addEvent(taskId, { type:'rejected', by, message: reason }); }
export function logDelegated(taskId: string, by: string, to: string, note?: string) { addEvent(taskId, { type:'delegated', by, message: `to ${to}${note?': '+note:''}` }); }
export function logComment(taskId: string, by: string, text: string) { addEvent(taskId, { type:'comment', by, message: text }); }

// Seeder for a given task (if empty)
export function seedTimelineIfEmpty(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;
  const items = listTimeline(taskId);
  if (items.length>0) return;
  addEvent(taskId, { type:'submitted', by: t.requester.name, message: 'Request submitted' });
  addEvent(taskId, { type:'routed', by: 'system', message: `Sent to stage "${t.stage_name}"` });
}
