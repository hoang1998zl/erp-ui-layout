
// src/mock/users.ts — user directory
export type UUID = string;
export type Role = 'admin'|'manager'|'staff';
export type Dept = 'SALES'|'OPS'|'FIN'|'HR'|'IT'|'ADMIN';
export type User = { id: UUID; username: string; full_name: string; role: Role; dept: Dept; status: 'active'|'inactive' };

const LS = 'erp.core.users.v2';
function rid(): UUID { return Math.random().toString(36).slice(2); }

export function seedUsersIfEmpty(){
  if (localStorage.getItem(LS)) return;
  const depts: Dept[] = ['SALES','OPS','FIN','HR','IT','ADMIN'];
  const arr: User[] = [];
  let seq=1;
  for (const d of depts){
    const n = d==='SALES'?50 : d==='OPS'?40 : d==='IT'?25 : 18;
    for (let i=0;i<n;i++){
      const role: Role = i<2 ? 'manager' : 'staff';
      arr.push({ id: rid(), username: `${d.toLowerCase()}_${seq}`, full_name: `User ${seq}`, role, dept: d, status: 'active' });
      seq++;
    }
  }
  // add a few admins
  for (let i=0;i<5;i++){ arr.push({ id: rid(), username:`admin_${i}`, full_name:`Admin ${i}`, role:'admin', dept:'ADMIN', status:'active' }); }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listUsers(): User[]{ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
