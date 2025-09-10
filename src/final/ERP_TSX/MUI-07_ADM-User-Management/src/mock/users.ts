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

export type ListParams = {
  q?: string;
  status?: 'all'|Status;
  department?: string;
  page?: number;
  pageSize?: number;
};

export type ListResult = {
  rows: User[];
  total: number;
  page: number;
  pageSize: number;
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

function randomName() {
  const n = names[Math.floor(Math.random()*names.length)];
  const s = surnames[Math.floor(Math.random()*surnames.length)];
  return `${s} ${n}`;
}

function randomEmail(full_name: string) {
  const normalized = full_name.toLowerCase().replace(/[^\w]+/g,'.');
  return `${normalized}@ktest.vn`;
}

const users: User[] = [];
(function seed(){
  const now = Date.now();
  for (let i=0;i<46;i++){
    const full_name = randomName();
    users.push({
      id: rid(),
      email: randomEmail(full_name) + (i<2 ? '.admin' : ''),
      full_name,
      department: departments[Math.floor(Math.random()*departments.length)],
      title: ['Manager','Engineer','Analyst','Specialist','Intern'][Math.floor(Math.random()*5)],
      status: i<2 ? 'active' : (Math.random()<0.85 ? 'active' : 'inactive'),
      created_at: new Date(now - Math.floor(Math.random()*1000*60*60*24*180)).toISOString(),
      last_login_at: Math.random()<0.7 ? new Date(now - Math.floor(Math.random()*1000*60*60*24*30)).toISOString() : undefined,
    });
  }
  // add an invited user
  users.push({
    id: rid(),
    email: 'new.hire@ktest.vn',
    full_name: 'New Hire',
    department: 'HR',
    title: 'Assistant',
    status: 'invited',
    created_at: new Date().toISOString(),
  });
})();

function delay(ms=200){ return new Promise(res=>setTimeout(res,ms)); }

export async function listUsers(params: ListParams = {}): Promise<ListResult> {
  await delay();
  const { q='', status='all', department='', page=1, pageSize=20 } = params;
  let arr = [...users];
  const qq = q.toLowerCase().trim();
  if (qq) {
    arr = arr.filter(u =>
      u.full_name.toLowerCase().includes(qq) ||
      u.email.toLowerCase().includes(qq) ||
      (u.department || '').toLowerCase().includes(qq) ||
      (u.title || '').toLowerCase().includes(qq)
    );
  }
  if (status !== 'all') arr = arr.filter(u => u.status === status);
  if (department) arr = arr.filter(u => (u.department || '') === department);
  const total = arr.length;
  const start = (page-1)*pageSize;
  const rows = arr.slice(start, start+pageSize);
  return { rows, total, page, pageSize };
}

export async function getDepartments(): Promise<string[]> {
  await delay(); return departments;
}

export async function createUser(input: Omit<User,'id'|'created_at'|'status'> & { status?: Status }): Promise<User> {
  await delay();
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email');
  if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error('Email already exists');
  const u: User = {
    id: rid(),
    email: input.email,
    full_name: input.full_name,
    department: input.department,
    title: input.title,
    status: input.status || 'invited',
    created_at: new Date().toISOString(),
  };
  users.unshift(u);
  return u;
}

export async function updateUser(id: UUID, patch: Partial<Omit<User,'id'|'created_at'>>): Promise<User> {
  await delay();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) throw new Error('User not found');
  users[idx] = { ...users[idx], ...patch };
  return users[idx];
}

export async function setUserStatus(id: UUID, status: Status): Promise<User> {
  await delay();
  const u = users.find(x => x.id === id);
  if (!u) throw new Error('User not found');
  u.status = status;
  return u;
}

export async function deleteUser(id: UUID): Promise<void> {
  await delay();
  const idx = users.findIndex(u => u.id === id);
  if (idx >= 0) users.splice(idx, 1);
}

export async function importCSV(file: File): Promise<{ inserted: number; skipped: number }> {
  await delay();
  const text = await file.text();
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let inserted = 0, skipped = 0;
  // Expect header: email,full_name,department,title
  const [header, ...rows] = lines;
  const cols = header.toLowerCase().split(',').map(s=>s.trim());
  const idx = {
    email: cols.indexOf('email'),
    full_name: cols.indexOf('full_name'),
    department: cols.indexOf('department'),
    title: cols.indexOf('title'),
  };
  for (const r of rows) {
    const parts = r.split(',');
    const email = (parts[idx.email] || '').trim();
    const full_name = (parts[idx.full_name] || '').trim();
    const department = (parts[idx.department] || '').trim();
    const title = (parts[idx.title] || '').trim();
    if (!email || !full_name) { skipped++; continue; }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { skipped++; continue; }
    users.push({ id: rid(), email, full_name, department, title, status:'invited', created_at: new Date().toISOString() });
    inserted++;
  }
  return { inserted, skipped };
}
