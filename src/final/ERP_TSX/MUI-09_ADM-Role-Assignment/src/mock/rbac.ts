// src/mock/rbac.ts
export type UUID = string;
export type Permission = { key: string; group: string; label: string; };
export type Role = { id: UUID; name: string; description?: string; active: boolean; built_in?: boolean; };
export type Assignments = Record<UUID, string[]>; // roleId -> perm keys
function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
export const permissions: Permission[] = [
  { key:'core.app.view', group:'Core', label:'View application' },
  { key:'core.nav.access', group:'Core', label:'Access navigation' },
  { key:'audit.view', group:'Core', label:'View audit logs' },
  { key:'pm.project.view', group:'Projects', label:'View projects' },
  { key:'pm.project.edit', group:'Projects', label:'Edit project info' },
  { key:'pm.task.view', group:'Tasks', label:'View tasks' },
  { key:'pm.task.create', group:'Tasks', label:'Create tasks' },
  { key:'pm.task.edit', group:'Tasks', label:'Edit tasks' },
  { key:'pm.task.delete', group:'Tasks', label:'Delete tasks' },
  { key:'fin.expense.create', group:'Finance', label:'Create expense' },
  { key:'fin.expense.submit', group:'Finance', label:'Submit expense' },
  { key:'fin.expense.approve', group:'Finance', label:'Approve expense' },
  { key:'fin.budget.view', group:'Finance', label:'View budget' },
  { key:'fin.budget.edit', group:'Finance', label:'Edit budget' },
  { key:'eim.doc.view', group:'Documents', label:'View documents' },
  { key:'eim.doc.upload', group:'Documents', label:'Upload documents' },
  { key:'eim.doc.delete', group:'Documents', label:'Delete documents' },
  { key:'hr.timesheet.fill', group:'HR', label:'Fill timesheet' },
  { key:'hr.timesheet.approve', group:'HR', label:'Approve timesheet' },
  { key:'app.approval.inbox', group:'Approvals', label:'View approval inbox' },
  { key:'app.approval.act', group:'Approvals', label:'Approve/Reject' },
  { key:'adm.users.manage', group:'Admin', label:'Manage users' },
  { key:'adm.rbac.manage', group:'Admin', label:'Manage RBAC' },
  { key:'adm.settings.manage', group:'Admin', label:'Manage org settings' },
];
export const roles: Role[] = [
  { id: rid(), name:'Admin', description:'Full access', active:true, built_in:true },
  { id: rid(), name:'Manager', description:'Manage projects & approvals', active:true },
  { id: rid(), name:'Employee', description:'Basic usage', active:true },
  { id: rid(), name:'Finance', description:'Finance ops', active:true },
  { id: rid(), name:'HR', description:'HR ops', active:true },
];
export const assignments: Assignments = Object.fromEntries(roles.map(r => [r.id, []]));
(function seed(){
  const byName = Object.fromEntries(roles.map(r=>[r.name,r.id]));
  const allow = (roleName: string, keys: string[]) => {
    const id = byName[roleName]; if (!id) return;
    assignments[id] = Array.from(new Set([...(assignments[id] || []), ...keys]));
  };
  assignments[byName['Admin']] = permissions.map(p=>p.key);
  allow('Employee',['core.app.view','core.nav.access','pm.task.view','pm.task.create','pm.task.edit','fin.expense.create','fin.expense.submit','eim.doc.view','eim.doc.upload','app.approval.inbox']);
  allow('Manager',['pm.project.view','pm.project.edit','pm.task.view','pm.task.create','pm.task.edit','fin.expense.approve','fin.budget.view','app.approval.inbox','app.approval.act','eim.doc.view']);
  allow('Finance',['fin.expense.approve','fin.budget.view','fin.budget.edit','app.approval.inbox','app.approval.act','eim.doc.view']);
  allow('HR',['hr.timesheet.fill','hr.timesheet.approve','eim.doc.view']);
})();
export async function listRoles(){ await new Promise(res=>setTimeout(res,80)); return roles; }
export async function listPermissions(){ await new Promise(res=>setTimeout(res,80)); return permissions; }
export async function getAssignments(){ await new Promise(res=>setTimeout(res,80)); return assignments; }
