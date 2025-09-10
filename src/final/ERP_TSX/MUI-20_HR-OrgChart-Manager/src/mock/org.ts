// src/mock/org.ts
export type UUID = string;

export type OrgNode = {
  id: UUID;
  name: string;
  code?: string;
  manager?: string;     // display name or email
  headcount?: number;   // optional
  children: OrgNode[];
};

const LS_KEY = 'erp.orgchart.v1';

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

function seed(): OrgNode {
  return {
    id: 'root',
    name: 'CÔNG TY TNHH ABC',
    code: 'COMP',
    manager: 'CEO: Nguyễn Quốc Minh',
    headcount: 120,
    children: [
      { id: rid(), name: 'Khối Kinh Doanh', code: 'SALES', manager: 'Sales Director', headcount: 35, children: [
        { id: rid(), name: 'Miền Bắc', code: 'SAL-N', manager: 'RSM North', headcount: 18, children: [] },
        { id: rid(), name: 'Miền Nam', code: 'SAL-S', manager: 'RSM South', headcount: 17, children: [] },
      ]},
      { id: rid(), name: 'Kỹ Thuật', code: 'ENG', manager: 'CTO', headcount: 42, children: [
        { id: rid(), name: 'Backend', code: 'ENG-BE', manager: 'BE Lead', headcount: 12, children: [] },
        { id: rid(), name: 'Frontend', code: 'ENG-FE', manager: 'FE Lead', headcount: 10, children: [] },
        { id: rid(), name: 'QA', code: 'ENG-QA', manager: 'QA Lead', headcount: 8, children: [] },
        { id: rid(), name: 'DevOps', code: 'ENG-OPS', manager: 'DevOps Lead', headcount: 12, children: [] },
      ]},
      { id: rid(), name: 'Tài Chính', code: 'FIN', manager: 'CFO', headcount: 16, children: []},
      { id: rid(), name: 'Nhân Sự', code: 'HR', manager: 'HR Manager', headcount: 10, children: []},
      { id: rid(), name: 'Marketing', code: 'MKT', manager: 'CMO', headcount: 17, children: []},
    ]
  };
}

export async function getOrg(): Promise<OrgNode> {
  await new Promise(r=>setTimeout(r,100));
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = seed();
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  return s;
}

function save(org: OrgNode) { localStorage.setItem(LS_KEY, JSON.stringify(org)); }
function clone<T>(x:T):T { return JSON.parse(JSON.stringify(x)); }

function findNode(root: OrgNode, id: string, parent: OrgNode | null = null): { node: OrgNode | null; parent: OrgNode | null; } {
  if (root.id === id) return { node: root, parent };
  for (const ch of root.children) {
    const res = findNode(ch, id, root);
    if (res.node) return res;
  }
  return { node: null, parent: null };
}

function isDescendant(root: OrgNode, id: string, maybeChild: string): boolean {
  const { node } = findNode(root, id, null);
  if (!node) return false;
  const dfs = (n: OrgNode): boolean => {
    if (n.id === maybeChild) return true;
    return n.children.some(dfs);
  };
  return dfs(node);
}

export async function addChild(parentId: string, payload: { name: string; code?: string; manager?: string; headcount?: number; }): Promise<OrgNode> {
  const org = await getOrg(); const o = clone(org);
  const { node: parent } = findNode(o, parentId, null);
  if (!parent) throw new Error('Parent not found');
  const child: OrgNode = { id: rid(), name: payload.name, code: payload.code, manager: payload.manager, headcount: payload.headcount, children: [] };
  parent.children.push(child);
  save(o); return child;
}

export async function updateNode(id: string, patch: Partial<Pick<OrgNode,'name'|'code'|'manager'|'headcount'>>): Promise<OrgNode> {
  const org = await getOrg(); const o = clone(org);
  const { node } = findNode(o, id, null); if (!node) throw new Error('Not found');
  Object.assign(node, patch);
  save(o); return node;
}

export async function moveNode(id: string, newParentId: string): Promise<void> {
  if (id==='root') throw new Error('Cannot move root');
  const org = await getOrg(); const o = clone(org);
  if (isDescendant(o, id, newParentId)) throw new Error('Cannot move into descendant');
  const found = findNode(o, id, null); if (!found.node || !found.parent) throw new Error('Node/parent not found');
  const dest = findNode(o, newParentId, null).node; if (!dest) throw new Error('Destination not found');
  // remove from old
  found.parent.children = found.parent.children.filter(ch => ch.id !== id);
  // add to new
  dest.children.push(found.node);
  save(o);
}

export async function deleteNode(id: string): Promise<void> {
  if (id==='root') throw new Error('Cannot delete root');
  const org = await getOrg(); const o = clone(org);
  const { parent } = findNode(o, id, null); if (!parent) throw new Error('Parent not found');
  parent.children = parent.children.filter(ch => ch.id !== id);
  save(o);
}

export async function searchNodes(query: string): Promise<string[]> {
  const org = await getOrg();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: string[] = [];
  const dfs = (n: OrgNode) => {
    const hay = (n.name+' '+(n.code||'')+' '+(n.manager||'')).toLowerCase();
    if (hay.includes(q)) out.push(n.id);
    n.children.forEach(dfs);
  };
  dfs(org);
  return out;
}

export async function exportJSON(): Promise<string> {
  const org = await getOrg();
  return JSON.stringify(org, null, 2);
}

export async function importJSON(file: File): Promise<OrgNode> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || !data.id || !Array.isArray(data.children)) throw new Error('Invalid org JSON');
  save(data);
  return data;
}
