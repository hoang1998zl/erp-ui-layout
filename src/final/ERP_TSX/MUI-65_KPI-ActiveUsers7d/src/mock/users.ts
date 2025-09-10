
// src/mock/users.ts — mock user directory for KPI-05
export type UUID = string;
export type Role = 'admin'|'manager'|'staff';
export type Dept = 'SALES'|'OPS'|'FIN'|'HR'|'IT'|'ADMIN';

export type User = {
  id: UUID;
  username: string;
  full_name: string;
  role: Role;
  dept: Dept;
  status: 'active'|'inactive';
};

const LS = 'erp.core.users.v1';

function rid(): UUID { return Math.random().toString(36).slice(2); }

export function seedUsersIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const roles: Role[] = ['admin','manager','staff'];
  const depts: Dept[] = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const arr: User[] = [];
  let seq=1;
  for (const d of depts){
    const n = d==='SALES'?60 : d==='OPS'?50 : d==='IT'?30 : 20;
    for (let i=0;i<n;i++){
      const role = i<2 ? 'admin' : (i<8 ? 'manager' : 'staff');
      arr.push({
        id: rid(),
        username: `${d.toLowerCase()}_${seq}`,
        full_name: `User ${seq}`,
        role: role as Role,
        dept: d as Dept,
        status: 'active'
      });
      seq++;
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listUsers(): User[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
