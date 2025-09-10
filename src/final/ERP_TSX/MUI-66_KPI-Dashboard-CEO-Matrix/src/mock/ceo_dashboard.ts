
// src/mock/ceo_dashboard.ts — KPI-06 CEO Matrix aggregator (mock)
export type Dept = 'SALES'|'OPS'|'FIN'|'HR'|'IT'|'ADMIN';
export type Process = 'Revenue'|'Projects'|'Expenses'|'Hiring'|'Support';
export type RAG = 'green'|'amber'|'red';

export type Cell = {
  dept: Dept;
  process: Process;
  score: number;        // 0..100 composite score
  rag: RAG;             // traffic light
  kpis: { key:string; label:string; value:number; unit?:string }[]; // small set per cell
};

export type QuadPoint = {
  dept: Dept;
  spend_util_pct: number;  // 0..150 (% of budget used YTD) — lower is better
  task_health_pct: number; // 0..100 (% tasks on-time/closed) — higher is better
  size: number;            // bubble size (e.g., headcount or revenue proxy)
};
export type Dashboard = {
  asOf: string;
  period: 'M'|'Q'|'Y';
  year: number;
  month?: number; // for M
  quarter?: number; // for Q
  processes: Process[];
  depts: Dept[];
  matrix: Cell[];
  quadrant: QuadPoint[];
  highlights: { title:string; detail:string; severity:RAG }[];
};

const DEPTS: Dept[] = ['SALES','OPS','FIN','HR','IT','ADMIN'];
const PROCESSES: Process[] = ['Revenue','Projects','Expenses','Hiring','Support'];

function seededRandom(seed:number){ let t = seed % 2147483647; return ()=> (t = t*16807 % 2147483647) / 2147483647; }

export function buildDashboard(anchor?: string, period:'M'|'Q'|'Y'='M'): Dashboard {
  const now = anchor ? new Date(anchor) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth()+1;
  const quarter = Math.floor((month-1)/3)+1;
  const rnd = seededRandom(year*100+month);
  // Quadrant points per dept
  const quad: QuadPoint[] = DEPTS.map((d, i) => {
    const spend = Math.round(60 + rnd()*80 + (d==='SALES'?10:0) + (d==='OPS'?5:0)); // 60..150
    const health = Math.round(55 + rnd()*40 - (d==='OPS'?5:0) + (d==='IT'?+5:0));  // 55..95
    const size = Math.round(50 + rnd()*150 + (d==='SALES'?100:0));
    return { dept:d, spend_util_pct: spend, task_health_pct: Math.min(100, health), size };
  });

  // Matrix cells per dept x process with composite scores & RAG
  const cells: Cell[] = [];
  for (const d of DEPTS){
    for (const p of PROCESSES){
      const base = 65 + rnd()*25;
      const adj = (d==='SALES' && p==='Revenue') ? +10 : 0;
      const adj2 = (d==='FIN' && p==='Expenses') ? +8 : 0;
      const adj3 = (d==='HR' && p==='Hiring') ? +6 : 0;
      const score = Math.max(0, Math.min(100, Math.round(base + adj + adj2 + adj3 + (rnd()*6-3))));
      const rag: RAG = score>=80 ? 'green' : (score>=60 ? 'amber' : 'red');
      // KPIs per process
      const kpis = (() => {
        if (p==='Revenue') return [
          { key:'sales_growth', label:'Sales YoY', value: Math.round((rnd()*20-5)), unit:'%' },
          { key:'pipeline', label:'Pipeline cover', value: Math.round(1.5 + rnd()*2), unit:'x' }
        ];
        if (p==='Projects') return [
          { key:'on_time', label:'On-time', value: Math.round(70 + rnd()*25), unit:'%' },
          { key:'overdue', label:'Overdue', value: Math.round(2 + rnd()*15), unit:'t' }
        ];
        if (p==='Expenses') return [
          { key:'util', label:'Budget util', value: Math.round(60 + rnd()*60), unit:'%' },
          { key:'pending', label:'Pending approvals', value: Math.round(3 + rnd()*12) }
        ];
        if (p==='Hiring') return [
          { key:'open', label:'Open positions', value: Math.round(1 + rnd()*8) },
          { key:'time_to_hire', label:'Time to hire', value: Math.round(15 + rnd()*25), unit:'d' }
        ];
        return [ // Support
          { key:'sla', label:'SLA met', value: Math.round(70 + rnd()*25), unit:'%' },
          { key:'backlog', label:'Backlog', value: Math.round(5 + rnd()*20) }
        ];
      })();
      cells.push({ dept:d, process:p, score, rag, kpis });
    }
  }

  // Highlights (top 5 worst cells + best 2)
  const worst = [...cells].sort((a,b)=> a.score-b.score).slice(0,5).map(c => ({
    title: `${c.dept} • ${c.process} thấp (${c.score})`,
    detail: `KPI: ${c.kpis.map(k => `${k.label}=${k.value}${k.unit||''}`).join(', ')}`,
    severity: c.score<60 ? 'red':'amber' as RAG
  }));
  const best = [...cells].sort((a,b)=> b.score-a.score).slice(0,2).map(c => ({
    title: `${c.dept} • ${c.process} tốt (${c.score})`,
    detail: `KPI: ${c.kpis.map(k => `${k.label}=${k.value}${k.unit||''}`).join(', ')}`,
    severity: 'green' as RAG
  }));

  return {
    asOf: new Date(Date.UTC(year, month-1, 1)).toISOString(),
    period, year, month, quarter,
    processes: PROCESSES, depts: DEPTS,
    matrix: cells,
    quadrant: quad,
    highlights: [...worst, ...best],
  };
}
