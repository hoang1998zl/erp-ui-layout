
// src/mock/activity.ts — activity events (login/view/edit/approve)
export type UUID = string;
export type EventType = 'login'|'view'|'edit'|'approve';
export type Platform = 'web'|'mobile';
export type Activity = { id: UUID; user: string; dept: string; role: string; type: EventType; platform: Platform; ts: string };
const LS = 'erp.core.activity.v2';
function rid(): UUID { return Math.random().toString(36).slice(2); }
function iso(d: Date){ return d.toISOString(); }
export function seedActivityIfEmpty(totalUsers: number){
  if (localStorage.getItem(LS)) return;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-2, 1));
  const dayMs = 24*3600*1000;
  const arr: Activity[] = [];
  for (let day=0; day<92; day++){
    const d = new Date(start.getTime() + day*dayMs);
    const weekday = d.getUTCDay();
    const base = Math.max(30, Math.round(totalUsers*0.10));
    const weekend = (weekday===0 || weekday===6) ? 0.5 : 1.0;
    const wave = 0.7 + 0.4*Math.sin(day/5);
    const eventsToday = Math.round(base * weekend * wave);
    for (let i=0;i<eventsToday;i++){
      const dept = ['SALES','OPS','FIN','HR','IT','ADMIN'][Math.floor(Math.random()*6)];
      const role = Math.random()<0.05 ? 'admin' : (Math.random()<0.3 ? 'manager' : 'staff');
      const type = (['login','view','view','edit','approve'] as EventType[])[Math.floor(Math.random()*5)];
      const platform = Math.random()<0.25 ? 'mobile' : 'web';
      const hh = Math.floor(Math.random()*24), mm = Math.floor(Math.random()*60), ss=Math.floor(Math.random()*60);
      const ts = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm, ss));
      arr.push({ id: rid(), user: `${dept[0]}${Math.floor(Math.random()*200)}`, dept, role, type, platform, ts: iso(ts) });
    }
  }
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function listActivity(){ try { return JSON.parse(localStorage.getItem(LS)||'[]'); } catch { return []; } }
