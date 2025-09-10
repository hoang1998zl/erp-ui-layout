// src/mock/audit.ts
export type UUID = string;

export type AuditItem = {
  id: UUID;
  entity_type: string;   // 'project'|'task'|'expense'|'document'|'approval'|...
  entity_id: UUID;
  action: string;        // 'CREATE'|'UPDATE'|'DELETE'|'SUBMIT'|'APPROVE'|'REJECT'
  actor_email?: string;
  created_at: string;    // ISO
  data?: any;            // snapshot
};

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

const actors = ['ceo@ktest.vn','pm@ktest.vn','fin@ktest.vn','staff@ktest.vn'];
const entities = ['project','task','expense','document','approval'];
const actions = ['CREATE','UPDATE','DELETE','SUBMIT','APPROVE','REJECT'];

export function seedAudit(count = 120): AuditItem[] {
  const now = Date.now();
  const arr: AuditItem[] = [];
  for (let i=0; i<count; i++) {
    const et = entities[Math.floor(Math.random()*entities.length)];
    const ac = actions[Math.floor(Math.random()*actions.length)];
    const ts = new Date(now - Math.floor(Math.random()*1000*60*60*24*30)).toISOString(); // within ~30 days
    const item: AuditItem = {
      id: rid(),
      entity_type: et,
      entity_id: rid(),
      action: ac,
      actor_email: actors[Math.floor(Math.random()*actors.length)],
      created_at: ts,
      data: {
        sample: true,
        before: ac === 'UPDATE' ? { status: 'todo' } : undefined,
        after: ac === 'UPDATE' ? { status: 'in_progress' } : undefined,
        note: `Mock ${et} ${ac}`,
      }
    };
    arr.push(item);
  }
  // sort desc by created_at
  arr.sort((a,b) => b.created_at.localeCompare(a.created_at));
  return arr;
}

export async function fetchAudit(): Promise<AuditItem[]> {
  await new Promise(res => setTimeout(res, 200));
  return seedAudit(180);
}
