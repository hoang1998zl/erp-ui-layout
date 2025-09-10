
// src/mock/kpi_active_users.ts — compute 7-day active users KPI
import { listActivity, type Activity } from './activity';
export type Filter = { anchor?: string; windowDays?: number; dept?: string; role?: string; platform?: string };
export type KPIResult = {
  scope: string;
  anchor: string; // ISO date (00:00Z)
  windowDays: number;
  active_7d: number;       // unique users within [anchor-windowDays+1, anchor]
  dau_series: { date: string; dau: number; wau: number }[]; // last 30 days
  by_dept: { key: string; users: number }[];
  by_role: { key: string; users: number }[];
  by_platform: { key: string; users: number }[];
  top_users: { user: string; events: number }[];
};

function startOfDayUTC(date: Date){ return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
function dateKey(d: Date){ return d.toISOString().slice(0,10); }

export function activeUsers7d(f: Filter): KPIResult {
  const events = listActivity();
  const now = f.anchor ? new Date(f.anchor) : startOfDayUTC(new Date());
  const windowDays = f.windowDays || 7;
  const from = new Date(now.getTime() - (windowDays-1)*24*3600*1000);
  const inWindow = events.filter(e => {
    const t = new Date(e.ts);
    if (t < from || t > new Date(now.getTime()+24*3600*1000-1)) return false;
    if (f.dept && e.dept!==f.dept) return false;
    if (f.role && e.role!==f.role) return false;
    if (f.platform && e.platform!==f.platform) return false;
    return true;
  });
  const uniq = new Set(inWindow.map(e => e.user));
  const active_7d = uniq.size;

  // by segments
  const by_dept_map = new Map<string, Set<string>>();
  const by_role_map = new Map<string, Set<string>>();
  const by_platform_map = new Map<string, Set<string>>();
  inWindow.forEach(e => {
    if (!by_dept_map.has(e.dept)) by_dept_map.set(e.dept, new Set());
    if (!by_role_map.has(e.role)) by_role_map.set(e.role, new Set());
    if (!by_platform_map.has(e.platform)) by_platform_map.set(e.platform, new Set());
    by_dept_map.get(e.dept)!.add(e.user);
    by_role_map.get(e.role)!.add(e.user);
    by_platform_map.get(e.platform)!.add(e.user);
  });
  const by_dept = Array.from(by_dept_map.entries()).map(([k,s]) => ({ key:k, users:s.size })).sort((a,b)=> b.users-a.users);
  const by_role = Array.from(by_role_map.entries()).map(([k,s]) => ({ key:k, users:s.size })).sort((a,b)=> b.users-a.users);
  const by_platform = Array.from(by_platform_map.entries()).map(([k,s]) => ({ key:k, users:s.size })).sort((a,b)=> b.users-a.users);

  // daily series last 30 days
  const days=30;
  const series: { date:string; dau:number; wau:number }[] = [];
  for (let i=days-1; i>=0; i--){
    const d = startOfDayUTC(new Date(now.getTime() - i*24*3600*1000));
    const dNext = new Date(d.getTime()+24*3600*1000-1);
    const wFrom = new Date(d.getTime() - (windowDays-1)*24*3600*1000);
    const dayEvents = events.filter(e => {
      const t = new Date(e.ts);
      if (t < d || t > dNext) return false;
      if (f.dept && e.dept!==f.dept) return false;
      if (f.role && e.role!==f.role) return false;
      if (f.platform && e.platform!==f.platform) return false;
      return true;
    });
    const dau = new Set(dayEvents.map(e => e.user)).size;
    const wau = new Set(events.filter(e => {
      const t = new Date(e.ts);
      if (t < wFrom || t > dNext) return false;
      if (f.dept && e.dept!==f.dept) return false;
      if (f.role && e.role!==f.role) return false;
      if (f.platform && e.platform!==f.platform) return false;
      return true;
    }).map(e=>e.user)).size;
    series.push({ date: dateKey(d), dau, wau });
  }

  // top users by events within window
  const cnt = new Map<string, number>();
  inWindow.forEach(e => cnt.set(e.user, (cnt.get(e.user)||0)+1));
  const top_users = Array.from(cnt.entries()).map(([user, events]) => ({ user, events })).sort((a,b)=> b.events - a.events).slice(0,10);

  const scope = f.dept ? `Dept ${f.dept}` : (f.role ? `Role ${f.role}` : (f.platform? `Platform ${f.platform}` : 'All users'));
  return { scope, anchor: startOfDayUTC(now).toISOString(), windowDays, active_7d, dau_series: series, by_dept, by_role, by_platform, top_users };
}
