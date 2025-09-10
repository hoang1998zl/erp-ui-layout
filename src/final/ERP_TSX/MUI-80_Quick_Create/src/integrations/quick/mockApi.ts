
export type Role = 'Admin'|'Finance'|'PM'|'HR'|'Employee';
const DB_LS_KEY = 'erp.quick.create.db.v1';

type Tables = {
  tasks: any[];
  expenses: any[];
  documents: any[];
};

function load(): Tables {
  try { return JSON.parse(localStorage.getItem(DB_LS_KEY) || '{"tasks":[],"expenses":[],"documents":[]}'); }
  catch { return { tasks:[], expenses:[], documents:[] }; }
}
function save(db: Tables) { localStorage.setItem(DB_LS_KEY, JSON.stringify(db)); }

export async function createTask(data: any){ await new Promise(res=>setTimeout(res, 300)); const db=load(); const id='T-'+(1000+db.tasks.length); const row={ id, ...data, createdAt: new Date().toISOString() }; db.tasks.unshift(row); save(db); return row; }
export async function createExpense(data: any){ await new Promise(res=>setTimeout(res, 400)); const db=load(); const id='EX-'+(1000+db.expenses.length); const row={ id, ...data, createdAt: new Date().toISOString() }; db.expenses.unshift(row); save(db); return row; }
export async function createDocument(data: any){ await new Promise(res=>setTimeout(res, 350)); const db=load(); const id='DOC-'+(1000+db.documents.length); const row={ id, ...data, createdAt: new Date().toISOString() }; db.documents.unshift(row); save(db); return row; }

export function listAll(){ return load(); }
