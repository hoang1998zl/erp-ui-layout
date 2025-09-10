
// src/mock/budget.ts — simple budget scenario store
export type UUID = string;
export type MonthKey = 'M01'|'M02'|'M03'|'M04'|'M05'|'M06'|'M07'|'M08'|'M09'|'M10'|'M11'|'M12';
export const MONTHS: MonthKey[] = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12'];

export type BudgetLine = {
  id: UUID;
  account_code: string;
  project_code?: string;
  dept_code?: string;
  note?: string;
  amounts: Record<MonthKey, number>;
};

export type BudgetScenario = {
  id: UUID;
  name: string;
  fiscal_year: number;
  currency: string;
  status: 'draft'|'locked'|'submitted';
  locked_months: Partial<Record<MonthKey, boolean>>;
  lines: BudgetLine[];
  created_at?: string;
  updated_at?: string;
};

const LS_BUD_LIST = 'erp.fin.budget.scenarios.v1';
const LS_BUD_CURR = 'erp.fin.budget.current.v1';

function rid(): UUID { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function nowISO(){ return new Date().toISOString(); }

export function listScenarios(): BudgetScenario[] {
  try { return JSON.parse(localStorage.getItem(LS_BUD_LIST) || '[]'); } catch { return []; }
}
export function saveScenarios(arr: BudgetScenario[]) {
  localStorage.setItem(LS_BUD_LIST, JSON.stringify(arr));
}
export function getCurrent(): BudgetScenario | null {
  const id = localStorage.getItem(LS_BUD_CURR);
  const arr = listScenarios();
  return id ? (arr.find(x => x.id===id) || null) : (arr[0] || null);
}
export function setCurrent(id: string) {
  localStorage.setItem(LS_BUD_CURR, id);
}
export function newScenario(name: string, fiscal_year: number, currency='VND'): BudgetScenario {
  const s: BudgetScenario = {
    id: rid(), name, fiscal_year, currency, status:'draft', locked_months:{},
    lines: [], created_at: nowISO(), updated_at: nowISO()
  };
  const arr = listScenarios();
  arr.unshift(s); saveScenarios(arr); setCurrent(s.id);
  return s;
}
export function upsertScenario(s: BudgetScenario) {
  const arr = listScenarios();
  const i = arr.findIndex(x => x.id===s.id);
  s.updated_at = nowISO();
  if (i>=0) arr[i] = s; else arr.unshift(s);
  saveScenarios(arr);
}
export function addLine(s: BudgetScenario, line: Partial<BudgetLine>): BudgetLine {
  const base: BudgetLine = { id: rid(), account_code: '', amounts: Object.fromEntries(MONTHS.map(m => [m, 0])) as any, ...line };
  s.lines.push(base); upsertScenario(s); return base;
}
export function deleteLine(s: BudgetScenario, id: string) {
  s.lines = s.lines.filter(l => l.id!==id); upsertScenario(s);
}
export function spreadEven(line: BudgetLine, total: number) {
  const per = Math.round((total / 12) * 100) / 100;
  const rem = Math.round((total - per*11) * 100) / 100;
  MONTHS.forEach((m, idx) => line.amounts[m] = idx===11 ? rem : per);
}
export function sumLine(line: BudgetLine): number {
  return MONTHS.reduce((s,m)=> s + (Number(line.amounts[m])||0), 0);
}
export function sumByMonth(lines: BudgetLine[]): Record<MonthKey, number> {
  const m: any = {}; MONTHS.forEach(k => m[k]=0);
  lines.forEach(l => MONTHS.forEach(k => m[k]+= (Number(l.amounts[k])||0)));
  return m;
}
export function exportCSV(s: BudgetScenario): string {
  const header = ['account_code','project_code','dept_code','note',...MONTHS].join(',');
  const rows = s.lines.map(l => [l.account_code||'', l.project_code||'', l.dept_code||'', (l.note||'').replace(/,/g,' '), ...MONTHS.map(m => String(l.amounts[m]||0))].join(','));
  return [header, ...rows].join('\n');
}
export function importCSV(s: BudgetScenario, text: string) {
  const lines = text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if (lines.length<=1) return;
  const header = lines[0].split(',').map(x=>x.trim());
  const idx = (k:string)=> header.indexOf(k);
  s.lines = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',').map(x=>x.trim());
    const amounts: any = {}; MONTHS.forEach(m => amounts[m] = Number(cols[idx(m)]||0));
    s.lines.push({
      id: rid(),
      account_code: cols[idx('account_code')]||'',
      project_code: cols[idx('project_code')]||'',
      dept_code: cols[idx('dept_code')]||'',
      note: cols[idx('note')]||'',
      amounts
    });
  }
  upsertScenario(s);
}
export function validateScenario(s: BudgetScenario): { ok:boolean; errors:string[]; warnings:string[] } {
  const errors: string[] = []; const warnings: string[] = [];
  s.lines.forEach((l, i) => {
    if (!l.account_code) errors.push(`Dòng ${i+1}: thiếu account_code`);
    MONTHS.forEach(m => { const v = Number(l.amounts[m]); if (Number.isNaN(v)) errors.push(`Dòng ${i+1} ${m}: không phải số`); });
  });
  return { ok: errors.length===0, errors, warnings };
}
