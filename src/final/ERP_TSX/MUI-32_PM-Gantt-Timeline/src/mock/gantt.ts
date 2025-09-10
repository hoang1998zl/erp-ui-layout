// src/mock/gantt.ts
export type UUID = string;
export type Employee = { id: UUID; name: string; active: boolean };
export type Project = { id: UUID; general: { name: string; code?: string } };

export type WbsType = 'phase'|'deliverable'|'work_package'|'task'|'milestone';

export type WbsNode = {
  id: UUID;
  project_id: UUID;
  parent_id: UUID | null;
  order: number;
  code?: string;
  name: string;
  type: WbsType;
  owner_id?: UUID;
  start_date?: string;
  finish_date?: string;
  effort_hours?: number;
  percent_complete?: number;
  predecessors?: UUID[];
};

export type TreeNode = WbsNode & {
  code: string;
  children: TreeNode[];
  rollup?: {
    start_date?: string;
    finish_date?: string;
    effort_hours: number;
    percent_complete: number;
  };
};

const LS_WBS   = 'erp.pm.wbs.v1';        // Map<project_id, WbsNode[]>
const LS_PROJ  = 'erp.pm.projects.v1';   // from PM-01
const LS_EMPS  = 'erp.dir.emps.v1';      // from HR-07

function delay(ms=50){ return new Promise(res=>setTimeout(res, ms)); }

function minDate(a?: string, b?: string){ if (!a) return b; if (!b) return a; return a<b?a:b; }
function maxDate(a?: string, b?: string){ if (!a) return b; if (!b) return a; return a>b?a:b; }

export async function listProjects(): Promise<Array<{ id: string; name: string; code?: string }>> {
  await delay();
  const rows: Project[] = JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
  return rows.map(p => ({ id: p.id, name: p.general?.name || p.id, code: p.general?.code }));
}

export async function listWbs(project_id: string): Promise<TreeNode[]> {
  await delay();
  const map: Record<string, WbsNode[]> = JSON.parse(localStorage.getItem(LS_WBS) || '{}');
  const rows: WbsNode[] = map[project_id] || [];
  // build tree + compute code + rollups
  const byParent = new Map<string|null, WbsNode[]>();
  rows.forEach(r => {
    const k = (r.parent_id as any) || null;
    const arr = byParent.get(k) || [];
    arr.push(r);
    byParent.set(k, arr);
  });
  const attach = (parent_id: string|null, prefix: string): TreeNode[] => {
    const arr = (byParent.get(parent_id) || []).slice().sort((a,b)=> a.order - b.order);
    const out: TreeNode[] = [];
    arr.forEach((n, idx) => {
      const code = (prefix ? `${prefix}.${idx+1}` : `${idx+1}`);
      const ch = attach(n.id, code);
      const withCode: TreeNode = { ...n, code, children: ch };
      out.push(withCode);
    });
    return out;
  };
  const roots = attach(null, '');
  const compute = (arr: TreeNode[]) => {
    arr.forEach(n => {
      compute(n.children);
      const child = n.children.reduce((acc, c) => ({
        start_date: minDate(acc.start_date, c.rollup?.start_date || c.start_date),
        finish_date: maxDate(acc.finish_date, c.rollup?.finish_date || c.finish_date),
        eff: acc.eff + (c.rollup?.effort_hours || c.effort_hours || 0),
        pctw: acc.pctw + ((c.rollup?.percent_complete || c.percent_complete || 0)/100) * (c.rollup?.effort_hours || c.effort_hours || 0),
      }), { start_date: undefined as string|undefined, finish_date: undefined as string|undefined, eff: 0, pctw: 0 });
      const selfEff = n.effort_hours || 0;
      const totalEff = selfEff + child.eff;
      const pct = totalEff>0 ? Math.round(((n.percent_complete||0)/100 * selfEff + child.pctw) * 100 / totalEff) : (n.percent_complete||0);
      n.rollup = {
        start_date: minDate(child.start_date, n.start_date),
        finish_date: maxDate(child.finish_date, n.finish_date),
        effort_hours: totalEff,
        percent_complete: pct,
      };
    });
  };
  compute(roots);
  return roots;
}

export type GanttItem = {
  id: string;
  code: string;
  name: string;
  type: WbsType;
  level: number; // depth
  start?: string;
  finish?: string;
  percent: number;
};

export function flattenForGantt(tree: TreeNode[]): GanttItem[] {
  const out: GanttItem[] = [];
  const walk = (arr: TreeNode[], depth: number) => {
    arr.forEach(n => {
      out.push({
        id: n.id,
        code: n.code,
        name: n.name,
        type: n.type,
        level: depth,
        start: n.start_date || n.rollup?.start_date,
        finish: n.finish_date || n.rollup?.finish_date,
        percent: n.rollup?.percent_complete ?? n.percent_complete ?? 0,
      });
      walk(n.children||[], depth+1);
    });
  };
  walk(tree, 0);
  return out;
}

export function pickColor(type: WbsType): string {
  switch(type){
    case 'phase': return '#e0f2fe';        // light blue
    case 'deliverable': return '#e9d5ff';  // light purple
    case 'work_package': return '#d1fae5'; // light green
    case 'task': return '#fee2e2';         // light red
    case 'milestone': return '#fde68a';    // light amber
    default: return '#e5e7eb';
  }
}
