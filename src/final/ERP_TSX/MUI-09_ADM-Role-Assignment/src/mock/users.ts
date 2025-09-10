// src/mock/users.ts
export type UUID = string;
export type Status = 'active'|'inactive'|'invited';
export type User = {
  id: UUID;
  email: string;
  full_name: string;
  department?: string;
  title?: string;
  status: Status;
  created_at: string;
  last_login_at?: string;
};
function rid(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
const departments = ['CEO Office','Finance','PMO','R&D','Operations','HR','Sales','Procurement'];
const names = ['An','Bình','Chi','Dung','Em','Giang','Hà','Hùng','Khanh','Lan','Minh','Nam','Oanh','Phúc','Quân','Quỳnh','Sơn','Trang','Uyên','Vinh'];
const surnames = ['Lê','Nguyễn','Trần','Phạm','Hoàng','Vũ','Võ','Đặng','Bùi','Đỗ'];
function randomName(){ const n=names[Math.floor(Math.random()*names.length)]; const s=surnames[Math.floor(Math.random()*surnames.length)]; return `${s} ${n}`; }
function randomEmail(full_name:string){ const norm=full_name.toLowerCase().replace(/[^\w]+/g,'.'); return `${norm}@ktest.vn`; }
export const users: User[] = [];
(function seed(){
  const now = Date.now();
  for (let i=0;i<40;i++){
    const full_name = randomName();
    users.push({
      id: rid(),
      email: randomEmail(full_name) + (i<1 ? '.admin' : ''),
      full_name,
      department: departments[Math.floor(Math.random()*departments.length)],
      title: ['Manager','Engineer','Analyst','Specialist','Intern'][Math.floor(Math.random()*5)],
      status: Math.random()<0.9 ? 'active' : 'inactive',
      created_at: new Date(now - Math.floor(Math.random()*1000*60*60*24*180)).toISOString(),
      last_login_at: Math.random()<0.7 ? new Date(now - Math.floor(Math.random()*1000*60*60*24*30)).toISOString() : undefined,
    });
  }
})();
export async function listUsers(): Promise<User[]> { await new Promise(res=>setTimeout(res,120)); return users; }
export async function getDepartments(): Promise<string[]> { await new Promise(res=>setTimeout(res,80)); return Array.from(new Set(users.map(u=>u.department).filter(Boolean))) as string[]; }
