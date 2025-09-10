// src/mock/roleAssignments.ts
import type { UUID } from './users';
import type { Role } from './rbac';

export type UserRoleAssignments = Record<UUID, UUID[]>;   // userId -> roleIds[]
export type DeptRoleAssignments = Record<string, UUID[]>;  // department -> roleIds[]

const userRoles: UserRoleAssignments = {};
const deptRoles: DeptRoleAssignments = {};

const delay = (ms=120)=> new Promise(res=>setTimeout(res, ms));

export async function getUserRoles(): Promise<UserRoleAssignments> { await delay(); return JSON.parse(JSON.stringify(userRoles)); }
export async function setUserRole(userId: UUID, roleId: UUID, allowed: boolean): Promise<void> {
  await delay();
  const set = new Set(userRoles[userId] || []);
  if (allowed) set.add(roleId); else set.delete(roleId);
  userRoles[userId] = Array.from(set);
}

export async function getDeptRoles(): Promise<DeptRoleAssignments> { await delay(); return JSON.parse(JSON.stringify(deptRoles)); }
export async function setDeptRole(dept: string, roleId: UUID, allowed: boolean): Promise<void> {
  await delay();
  const set = new Set(deptRoles[dept] || []);
  if (allowed) set.add(roleId); else set.delete(roleId);
  deptRoles[dept] = Array.from(set);
}

export async function exportJSON(): Promise<string> {
  await delay();
  const payload = { userRoles, deptRoles };
  return JSON.stringify(payload, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.userRoles || !data.deptRoles) throw new Error('Invalid assignment JSON');
  const keysU = Object.keys(userRoles); keysU.forEach(k => delete (userRoles as any)[k]);
  Object.assign(userRoles, data.userRoles);
  const keysD = Object.keys(deptRoles); keysD.forEach(k => delete (deptRoles as any)[k]);
  Object.assign(deptRoles, data.deptRoles);
}
