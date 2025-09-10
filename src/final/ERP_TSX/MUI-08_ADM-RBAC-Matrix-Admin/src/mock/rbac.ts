// src/mock/rbac.ts
export type UUID = string;

export type Permission = {
  key: string;
  group: string;           // module/group name
  label: string;
  description?: string;
};

export type Role = {
  id: UUID;
  name: string;
  description?: string;
  active: boolean;
  built_in?: boolean;      // avoid delete
};

export type Assignments = Record<UUID, string[]>; // roleId -> perm keys

function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

const permissions: Permission[] = [
  // CORE / NAV
  { key:'core.app.view', group:'Core', label:'View application' },
  { key:'core.nav.access', group:'Core', label:'Access navigation' },
  { key:'audit.view', group:'Core', label:'View audit logs' },
  // PROJECT / TASK
  { key:'pm.project.view', group:'Projects', label:'View projects' },
  { key:'pm.project.edit', group:'Projects', label:'Edit project info' },
  { key:'pm.task.view', group:'Tasks', label:'View tasks' },
  { key:'pm.task.create', group:'Tasks', label:'Create tasks' },
  { key:'pm.task.edit', group:'Tasks', label:'Edit tasks' },
  { key:'pm.task.delete', group:'Tasks', label:'Delete tasks' },
  // FINANCE
  { key:'fin.expense.create', group:'Finance', label:'Create expense' },
  { key:'fin.expense.submit', group:'Finance', label:'Submit expense' },
  { key:'fin.expense.approve', group:'Finance', label:'Approve expense' },
  { key:'fin.budget.view', group:'Finance', label:'View budget' },
  { key:'fin.budget.edit', group:'Finance', label:'Edit budget' },
  // DOCUMENTS (EIM)
  { key:'eim.doc.view', group:'Documents', label:'View documents' },
  { key:'eim.doc.upload', group:'Documents', label:'Upload documents' },
  { key:'eim.doc.delete', group:'Documents', label:'Delete documents' },
  // HR
  { key:'hr.timesheet.fill', group:'HR', label:'Fill timesheet' },
  { key:'hr.timesheet.approve', group:'HR', label:'Approve timesheet' },
  // APPROVAL
  { key:'app.approval.inbox', group:'Approvals', label:'View approval inbox' },
  { key:'app.approval.act', group:'Approvals', label:'Approve/Reject' },
  // ADMIN
  { key:'adm.users.manage', group:'Admin', label:'Manage users' },
  { key:'adm.rbac.manage', group:'Admin', label:'Manage RBAC' },
  { key:'adm.settings.manage', group:'Admin', label:'Manage org settings' },
];

const groups = Array.from(new Set(permissions.map(p => p.group)));

const roles: Role[] = [
  { id: rid(), name:'Admin', description:'Full access', active:true, built_in:true },
  { id: rid(), name:'Manager', description:'Manage projects, approvals, and budgets', active:true },
  { id: rid(), name:'Employee', description:'Basic usage to do tasks and submit expenses', active:true },
  { id: rid(), name:'Finance', description:'Expense & budget approvals and edits', active:true },
  { id: rid(), name:'HR', description:'Timesheet approvals', active:true },
];

const assignments: Assignments = Object.fromEntries(roles.map(r => [r.id, []]));

// Seed default policies
function seed() {
  const mapName = Object.fromEntries(roles.map(r => [r.name, r.id]));
  const allow = (roleName: string, keys: string[]) => {
    const id = mapName[roleName]; if (!id) return;
    assignments[id] = Array.from(new Set([...(assignments[id] || []), ...keys]));
  };
  // Admin: all
  assignments[mapName['Admin']] = permissions.map(p => p.key);
  // Employee
  allow('Employee', [
    'core.app.view','core.nav.access',
    'pm.project.view','pm.task.view','pm.task.create','pm.task.edit',
    'fin.expense.create','fin.expense.submit',
    'eim.doc.view','eim.doc.upload',
    'app.approval.inbox'
  ]);
  // Manager
  allow('Manager', [
    'pm.project.view','pm.project.edit','pm.task.view','pm.task.create','pm.task.edit',
    'fin.expense.approve','fin.budget.view',
    'app.approval.inbox','app.approval.act',
    'eim.doc.view',
  ]);
  // Finance
  allow('Finance', [
    'fin.expense.approve','fin.budget.view','fin.budget.edit',
    'app.approval.inbox','app.approval.act','eim.doc.view'
  ]);
  // HR
  allow('HR', ['hr.timesheet.fill','hr.timesheet.approve','eim.doc.view']);
}
seed();

function delay(ms=150){ return new Promise(res=>setTimeout(res,ms)); }

export async function listPermissions(): Promise<Permission[]> { await delay(); return permissions; }
export async function listRoles(): Promise<Role[]> { await delay(); return roles; }
export async function listGroups(): Promise<string[]> { await delay(); return groups; }

export async function getAssignments(): Promise<Assignments> { await delay(); return JSON.parse(JSON.stringify(assignments)); }

export async function setAssignment(roleId: UUID, permKey: string, allowed: boolean): Promise<void> {
  await delay();
  const arr = new Set(assignments[roleId] || []);
  if (allowed) arr.add(permKey); else arr.delete(permKey);
  assignments[roleId] = Array.from(arr);
}

export async function setGroupForRole(roleId: UUID, group: string, allowed: boolean): Promise<void> {
  await delay();
  const keys = permissions.filter(p => p.group === group).map(p => p.key);
  const arr = new Set(assignments[roleId] || []);
  for (const k of keys) { if (allowed) arr.add(k); else arr.delete(k); }
  assignments[roleId] = Array.from(arr);
}

export async function createRole(input: { name: string; description?: string }): Promise<Role> {
  await delay();
  const r: Role = { id: rid(), name: input.name, description: input.description, active: true };
  roles.push(r);
  assignments[r.id] = [];
  return r;
}

export async function updateRole(id: UUID, patch: Partial<Omit<Role,'id'>>): Promise<Role> {
  await delay();
  const idx = roles.findIndex(r => r.id === id); if (idx<0) throw new Error('Role not found');
  roles[idx] = { ...roles[idx], ...patch };
  return roles[idx];
}

export async function deleteRole(id: UUID): Promise<void> {
  await delay();
  const r = roles.find(x => x.id === id);
  if (!r) return;
  if (r.built_in) throw new Error('Cannot delete built-in role');
  const idx = roles.findIndex(x => x.id === id);
  if (idx >= 0) roles.splice(idx, 1);
  delete assignments[id];
}

export async function exportJSON(): Promise<string> {
  await delay();
  const payload = { roles, permissions, assignments };
  return JSON.stringify(payload, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.roles || !data.permissions || !data.assignments) throw new Error('Invalid RBAC JSON');
  // Replace everything (simpler for admin)
  while (roles.length) roles.pop();
  for (const r of data.roles) roles.push(r);
  // replace permissions (optional; often fixed). We'll accept overwrite for demo.
  (permissions as any).length = 0;
  for (const p of data.permissions) (permissions as any).push(p);
  const keys = Object.keys(assignments);
  for (const k of keys) delete (assignments as any)[k];
  Object.assign(assignments, data.assignments);
}
