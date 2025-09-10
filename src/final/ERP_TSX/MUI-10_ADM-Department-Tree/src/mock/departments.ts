// src/mock/departments.ts
export type UUID = string;

export type Dept = {
  id: UUID;
  name: string;
  code?: string;
  head?: string;        // email or name
  parent_id: UUID | null;
  order: number;        // position among siblings
  children?: Dept[];    // returned in listTree()
};

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

type Node = Omit<Dept,'children'>;
const store: Node[] = [];

function seed() {
  // top-level
  const ceo = push({ name:'CEO Office', code:'CEO', head:'ceo@ktest.vn', parent_id:null });
  const fin = push({ name:'Finance', code:'FIN', head:'fin@ktest.vn', parent_id:null });
  const pmo = push({ name:'PMO', code:'PMO', parent_id:null });
  const ops = push({ name:'Operations', code:'OPS', parent_id:null });
  // children
  const ap = push({ name:'Accounts Payable', code:'AP', parent_id:fin.id });
  const ar = push({ name:'Accounts Receivable', code:'AR', parent_id:fin.id });
  const tax = push({ name:'Tax', code:'TAX', parent_id:fin.id });
  const hr = push({ name:'HR', code:'HR', parent_id:ops.id });
  const prc = push({ name:'Procurement', code:'PRC', parent_id:ops.id });
  const qa = push({ name:'QA', code:'QA', parent_id:ops.id });
  push({ name:'Project A Team', code:'PRJ-A', parent_id:pmo.id });
  push({ name:'Project B Team', code:'PRJ-B', parent_id:pmo.id });
}
function push(input: { name:string; code?:string; head?:string; parent_id: UUID | null }): Node {
  const order = siblings(input.parent_id).length;
  const n: Node = { id: rid(), name: input.name, code: input.code, head: input.head, parent_id: input.parent_id, order };
  store.push(n); return n;
}
function siblings(parent_id: UUID | null) { return store.filter(x => x.parent_id === parent_id).sort((a,b)=>a.order-b.order); }
function childrenOf(parent_id: UUID | null): Dept[] {
  return siblings(parent_id).map(n => ({ ...n, children: childrenOf(n.id) }));
}
seed();

const delay = (ms=120)=> new Promise(res=>setTimeout(res, ms));

function reindex(parent_id: UUID | null) {
  siblings(parent_id).forEach((n, i) => n.order = i);
}

export async function listTree(): Promise<Dept[]> {
  await delay();
  return childrenOf(null);
}

export async function getById(id: UUID): Promise<Dept | undefined> {
  await delay();
  const n = store.find(x => x.id === id);
  if (!n) return undefined;
  return { ...n, children: childrenOf(n.id) };
}

export async function createDept(input: { name: string; code?: string; head?: string; parent_id: UUID | null }): Promise<Dept> {
  await delay();
  const n = push(input);
  return { ...n, children: [] };
}

export async function updateDept(id: UUID, patch: Partial<Omit<Dept,'id'|'parent_id'|'order'|'children'>> & { parent_id?: UUID | null }): Promise<Dept> {
  await delay();
  const idx = store.findIndex(x => x.id === id);
  if (idx < 0) throw new Error('Not found');
  const cur = store[idx];
  // handle parent change
  if (patch.parent_id !== undefined && patch.parent_id !== cur.parent_id) {
    const newParent = patch.parent_id ?? null;
    // remove from old siblings
    const oldParent = cur.parent_id;
    // temporarily set to end in new parent
    cur.parent_id = newParent;
    cur.order = siblings(newParent).length;
    reindex(oldParent);
    reindex(newParent);
  }
  store[idx] = { ...cur, ...patch, parent_id: cur.parent_id, order: cur.order };
  return { ...store[idx], children: childrenOf(id) };
}

export async function deleteDept(id: UUID): Promise<void> {
  await delay();
  const node = store.find(x => x.id === id);
  if (!node) return;
  if (store.some(x => x.parent_id === id)) throw new Error('Cannot delete: has children');
  const parent = node.parent_id;
  const idx = store.findIndex(x => x.id === id);
  if (idx >= 0) store.splice(idx, 1);
  reindex(parent);
}

export async function moveDept(id: UUID, targetParent: UUID | null, index?: number): Promise<void> {
  await delay();
  const node = store.find(x => x.id === id);
  if (!node) throw new Error('Not found');
  const oldParent = node.parent_id;
  node.parent_id = targetParent;
  const sibs = siblings(targetParent);
  const clampIndex = Math.max(0, Math.min(index ?? sibs.length, sibs.length));
  // Insert by shifting orders
  sibs.slice(clampIndex).forEach(n => n.order += 1);
  node.order = clampIndex;
  reindex(oldParent);
  reindex(targetParent);
}

export async function reorderSibling(id: UUID, direction: 'up'|'down'): Promise<void> {
  await delay();
  const node = store.find(x => x.id === id); if (!node) return;
  const sibs = siblings(node.parent_id);
  const i = sibs.findIndex(x => x.id === id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= sibs.length) return;
  const a = sibs[i], b = sibs[j];
  const tmp = a.order; a.order = b.order; b.order = tmp;
  reindex(node.parent_id);
}

export async function exportJSON(): Promise<string> {
  await delay();
  const payload = { nodes: store };
  return JSON.stringify(payload, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.nodes || !Array.isArray(data.nodes)) throw new Error('Invalid JSON');
  (store as any).length = 0;
  data.nodes.forEach((n:any)=> store.push(n));
  // reindex all parents
  const parents = Array.from(new Set(store.map(n=>n.parent_id)));
  parents.forEach(p => reindex(p as any));
}
