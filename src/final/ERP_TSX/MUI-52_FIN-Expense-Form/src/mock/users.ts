
// src/mock/users.ts — minimal employee profile (EIM‑04 dependency placeholder)
export type UUID = string;
export type Employee = { id: UUID; code: string; name: string; dept_code?: string; default_project?: string };
const LS = 'erp.eim.users.v1';
function rid(): UUID { return Math.random().toString(36).slice(2); }
export function seedUsersIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const arr: Employee[] = [
    { id: rid(), code: 'E0001', name: 'Nguyen Van A', dept_code: 'IT', default_project: 'PRJ-001' },
    { id: rid(), code: 'E0002', name: 'Tran Thi B', dept_code: 'HR' },
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function currentUser(): Employee {
  try {
    const arr: Employee[] = JSON.parse(localStorage.getItem(LS) || '[]');
    return arr[0] || { id: rid(), code:'E0000', name:'Demo User' };
  } catch {
    return { id: rid(), code:'E0000', name:'Demo User' };
  }
}
