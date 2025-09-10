// src/mock/subtree.ts
export type UUID = string;

export type Employee = { id: UUID; name: string; email: string; active: boolean };

export type SubNode = {
  id: UUID;
  task_id: UUID;
  parent_id: UUID | null;
  title: string;
  done: boolean;
  order: number;            // sort within same parent
  estimate_hours?: number;
  assignee_id?: UUID;
  due_date?: string;        // YYYY-MM-DD
  expanded?: boolean;       // UI hint
  created_at: string;
  updated_at: string;
};

export type TreeNode = SubNode & { children: TreeNode[] };

const LS_SUBTREE = 'erp.pm.task.subtree.v1';   // Map<task_id, SubNode[]>
const LS_SUBFLAT = 'erp.pm.task.subtasks.v1';  // from PM-04 (flat subtasks) Map<task_id, Subtask[]>
const LS_EMP     = 'erp.dir.emps.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString(); }
function delay(ms=80){ return new Promise(res=>setTimeout(res, ms)); }

function getMap(): Record<string, SubNode[]> {
  try { return JSON.parse(localStorage.getItem(LS_SUBTREE) || '{}'); } catch { return {}; }
}
function setMap(map: Record<string, SubNode[]>) {
  localStorage.setItem(LS_SUBTREE, JSON.stringify(map));
}

export async function listEmployees(): Promise<Employee[]> {
  await delay();
  try { return JSON.parse(localStorage.getItem(LS_EMP) || '[]'); } catch { return []; }
}

export async function migrateFromFlat(task_id: string): Promise<number> {
  await delay();
  const flatMap: Record<string, any[]> = JSON.parse(localStorage.getItem(LS_SUBFLAT) || '{}');
  const rows = (flatMap[task_id] || []);
  if (!rows.length) return 0;
  const tree = rows.map((s:any, idx:number) => ({
    id: s.id || rid(),
    task_id, parent_id: null,
    title: s.title || 'Item',
    done: !!s.done,
    order: idx+1,
    estimate_hours: 0,
    assignee_id: undefined,
    due_date: undefined,
    expanded: true,
    created_at: s.created_at || nowISO(),
    updated_at: s.updated_at || nowISO(),
  }));
  const map = getMap(); map[task_id] = tree; setMap(map);
  return tree.length;
}

function buildTree(rows: SubNode[]): TreeNode[] {
  const byParent = new Map<string|null, SubNode[]>();
  rows.forEach(r => {
    const k = (r.parent_id as any) || null;
    const arr = byParent.get(k) || [];
    arr.push(r);
    byParent.set(k, arr);
  });
  const attach = (parent_id: string|null): TreeNode[] => {
    const arr = (byParent.get(parent_id) || []).slice().sort((a,b)=> a.order - b.order);
    return arr.map(n => ({ ...n, children: attach(n.id) }));
  };
  return attach(null);
}

export async function listTree(task_id: string): Promise<TreeNode[]> {
  await delay();
  const map = getMap();
  const rows = (map[task_id] || []);
  return buildTree(rows);
}

export async function upsertNode(task_id: string, payload: Partial<SubNode> & { id?: string, parent_id?: string | null }): Promise<SubNode> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const now = nowISO();
  if (payload.id) {
    const i = rows.findIndex(n => n.id===payload.id);
    if (i<0) throw new Error('Node not found');
    rows[i] = { ...rows[i], ...payload, updated_at: now } as SubNode;
  } else {
    const order = (rows.filter(r => (r.parent_id||null)===(payload.parent_id||null)).reduce((m,r)=>Math.max(m, r.order), 0)) + 1;
    const n: SubNode = {
      id: rid(),
      task_id,
      parent_id: payload.parent_id || null,
      title: payload.title || 'New item',
      done: !!payload.done,
      order,
      estimate_hours: payload.estimate_hours || 0,
      assignee_id: payload.assignee_id,
      due_date: payload.due_date,
      expanded: true,
      created_at: now, updated_at: now
    };
    rows.push(n);
  }
  map[task_id] = rows; setMap(map);
  return rows.find(n=>n.id===(payload.id||'')) || rows[rows.length-1];
}

export async function deleteNode(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = (map[task_id] || []);
  // remove node and all descendants
  const toDelete = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop() as string;
    toDelete.add(cur);
    rows.filter(r => r.parent_id===cur).forEach(ch => stack.push(ch.id));
  }
  map[task_id] = rows.filter(r => !toDelete.has(r.id));
  setMap(map);
}

export async function moveNode(task_id: string, id: string, newParent: string | null, newOrder: number): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const idx = rows.findIndex(r => r.id===id); if (idx<0) return;
  rows[idx].parent_id = newParent;
  rows[idx].order = newOrder;
  rows[idx].updated_at = nowISO();
  // Re-number siblings under the same parent to be 1..N
  const renum = (pid: string | null) => {
    const sibs = rows.filter(r => (r.parent_id||null)===pid).sort((a,b)=> a.order - b.order);
    sibs.forEach((r,i)=> r.order = i+1);
  };
  renum(newParent);
  map[task_id] = rows; setMap(map);
}

export async function reorderUp(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<=0) return;
  const prev = sibs[idx-1];
  const tmp = me.order; me.order = prev.order; prev.order = tmp;
  me.updated_at = nowISO(); prev.updated_at = nowISO();
  map[task_id] = rows; setMap(map);
}

export async function reorderDown(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<0 || idx>=sibs.length-1) return;
  const next = sibs[idx+1];
  const tmp = me.order; me.order = next.order; next.order = tmp;
  me.updated_at = nowISO(); next.updated_at = nowISO();
  map[task_id] = rows; setMap(map);
}

export async function indentNode(task_id: string, id: string): Promise<void> {
  // indent under previous sibling
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const sibs = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).sort((a,b)=> a.order - b.order);
  const idx = sibs.findIndex(r => r.id===id);
  if (idx<=0) return;
  const newParent = sibs[idx-1].id;
  me.parent_id = newParent;
  me.order = rows.filter(r => (r.parent_id||null)===newParent).reduce((m,r)=>Math.max(m,r.order),0)+1;
  me.updated_at = nowISO();
  map[task_id] = rows; setMap(map);
}

export async function outdentNode(task_id: string, id: string): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  const parent = rows.find(r => r.id===me.parent_id);
  if (!parent) { return; } // already top-level
  me.parent_id = parent.parent_id || null;
  me.order = rows.filter(r => (r.parent_id||null)===(me.parent_id||null)).reduce((m,r)=>Math.max(m,r.order),0)+1;
  me.updated_at = nowISO();
  map[task_id] = rows; setMap(map);
}

export async function toggleDone(task_id: string, id: string, done: boolean): Promise<void> {
  await delay();
  const map = getMap();
  const rows = map[task_id] || [];
  const me = rows.find(r => r.id===id); if (!me) return;
  me.done = done; me.updated_at = nowISO();
  // cascade: if mark as done -> mark all children done; if unmark -> unmark all parents
  const markChildren = (pid: string, v: boolean) => {
    rows.filter(r => r.parent_id===pid).forEach(ch => { ch.done = v; ch.updated_at = nowISO(); markChildren(ch.id, v); });
  };
  const unmarkParents = (cid: string) => {
    const p = rows.find(r => r.id===rows.find(x=>x.id===cid)?.parent_id);
    if (!p) return;
    p.done = false; p.updated_at = nowISO();
    unmarkParents(p.id);
  };
  if (done) markChildren(id, true); else unmarkParents(id);
  map[task_id] = rows; setMap(map);
}

export async function importJSON(task_id: string, jsonStr: string): Promise<number> {
  await delay();
  const data = JSON.parse(jsonStr);
  if (!Array.isArray(data)) throw new Error('Invalid JSON');
  const now = nowISO();
  const flat: SubNode[] = [];
  const walk = (arr: any[], parent_id: string | null) => {
    arr.forEach((n: any, idx: number) => {
      const id = rid();
      flat.push({
        id, task_id, parent_id,
        title: String(n.title || n.name || 'Item'),
        done: !!n.done,
        order: idx+1,
        estimate_hours: Number(n.estimate_hours||0),
        assignee_id: n.assignee_id || undefined,
        due_date: n.due_date || undefined,
        expanded: true,
        created_at: now, updated_at: now
      });
      if (Array.isArray(n.children)) walk(n.children, id);
    });
  };
  walk(data, null);
  const map = getMap(); map[task_id] = flat; setMap(map);
  return flat.length;
}

export async function exportJSON(task_id: string): Promise<Blob> {
  await delay();
  const tree = await listTree(task_id);
  const clean = (arr: TreeNode[]) => arr.map(n => ({ title: n.title, done: n.done, estimate_hours: n.estimate_hours||0, assignee_id: n.assignee_id, due_date: n.due_date, children: clean(n.children) }));
  const blob = new Blob([JSON.stringify(clean(tree), null, 2)], { type:'application/json' });
  return blob;
}

export async function bulkAdd(task_id: string, text: string): Promise<number> {
  // Each line is an item. Use leading tabs or 2 spaces to indicate depth.
  await delay();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length>0);
  let count = 0;
  const map = getMap();
  const rows = map[task_id] || [];
  const stack: { depth: number; id: string | null }[] = [{ depth: -1, id: null }];
  const nextOrder = (pid: string | null) => rows.filter(r => (r.parent_id||null)===pid).reduce((m,r)=>Math.max(m,r.order),0)+1;
  lines.forEach(line => {
    const m = /^(\t+| +)?(.*)$/.exec(line);
    const indent = m && m[1] ? (m[1].replace(/\t/g, '  ').length / 2) : 0;
    const title = (m && m[2] ? m[2] : line).trim();
    while (stack.length && indent <= stack[stack.length-1].depth) stack.pop();
    const parent_id = stack[stack.length-1].id;
    const n: SubNode = { id: rid(), task_id, parent_id, title, done: false, order: nextOrder(parent_id||null), estimate_hours: 0, expanded: true, created_at: nowISO(), updated_at: nowISO() };
    rows.push(n); count++;
    stack.push({ depth: indent, id: n.id });
  });
  map[task_id] = rows; setMap(map);
  return count;
}
