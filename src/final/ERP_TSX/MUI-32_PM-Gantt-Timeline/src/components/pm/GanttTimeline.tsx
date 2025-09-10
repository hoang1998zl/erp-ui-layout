// src/components/pm/GanttTimeline.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listProjects, listWbs, flattenForGantt, pickColor, type GanttItem } from '../../mock/gantt';

type ZoomKey = 'month'|'week'|'quarter';

const zoomDayWidth: Record<ZoomKey, number> = {
  week: 28,     // 28px per day
  month: 18,    // 18px per day
  quarter: 8,   // 8px per day
};

function parseDate(s?: string): Date | null { if (!s) return null; const d = new Date(s); return isNaN(+d)? null : d; }
function fmtShort(d: Date){ return d.toLocaleDateString(undefined, { day:'2-digit', month:'2-digit' }); }
function fmtMonth(d: Date){ return d.toLocaleDateString(undefined, { month:'short', year:'numeric' }); }
function addDays(d: Date, n: number){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a: Date, b: Date){ const ms = (b.getTime() - a.getTime()); return Math.max(1, Math.ceil(ms / 86400000)); }

export const GanttTimeline: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [projects, setProjects] = useState<Array<{id:string;name:string;code?:string}>>([]);
  const [pid, setPid] = useState<string>('');
  const [rows, setRows] = useState<GanttItem[]>([]);
  const [zoom, setZoom] = useState<ZoomKey>('month');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}); // by id

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ listProjects().then(ps => { setProjects(ps); setPid(ps[0]?.id || ''); }); }, []);
  useEffect(()=>{ (async ()=>{
    if (!pid) return;
    const tree = await listWbs(pid);
    const flat = flattenForGantt(tree);
    setRows(flat);
    // default expand first two levels
    const exp: Record<string, boolean> = {};
    flat.forEach(r => { if (r.level<=1) exp[r.id] = true; });
    setExpanded(exp);
  })(); }, [pid]);

  const items = useMemo(()=> rows.filter(r => (r.name+' '+r.code).toLowerCase().includes(filter.toLowerCase())), [rows, filter]);

  const range = useMemo(()=>{
    let min: Date | null = null, max: Date | null = null;
    items.forEach(it => {
      const s = parseDate(it.start), f = parseDate(it.finish);
      if (s) min = !min || s < min ? s : min;
      if (f) max = !max || f > max ? f : max;
    });
    // fallback: today +- 30d
    const today = new Date(); today.setHours(0,0,0,0);
    if (!min) min = addDays(today, -30);
    if (!max) max = addDays(today, 90);
    // add padding
    min = addDays(min!, -3); max = addDays(max!, 3);
    return { min: min!, max: max!, days: diffDays(min!, max!) };
  }, [items]);

  const headers = useMemo(()=>{
    const dayW = zoomDayWidth[zoom];
    const days = Array.from({ length: range.days }, (_,i)=> addDays(range.min, i));
    // Build top header (months/quarters) and bottom header (days or weeks)
    type Cell = { label: string; width: number };
    const top: Cell[] = [];
    const bottom: Cell[] = [];
    if (zoom==='week' || zoom==='month') {
      // Top: months; Bottom: days
      let curLabel = ''; let curWidth = 0;
      days.forEach((d,i) => {
        const label = fmtMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        if (label!==curLabel) {
          if (curWidth>0) top.push({ label: curLabel, width: curWidth*dayW });
          curLabel = label; curWidth = 0;
        }
        curWidth++;
        bottom.push({ label: String(d.getDate()).padStart(2,'0'), width: dayW });
        if (i===days.length-1 && curWidth>0) top.push({ label: curLabel, width: curWidth*dayW });
      });
    } else {
      // quarter: Top = quarter; Bottom = months
      const qLabel = (d: Date) => `Q${Math.floor(d.getMonth()/3)+1} ${d.getFullYear()}`;
      let curQ = ''; let curQWidth = 0;
      let curM = ''; let curMWidth = 0;
      days.forEach((d,i) => {
        const q = qLabel(d);
        const m = fmtMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        if (q!==curQ) {
          if (curQWidth>0) top.push({ label: curQ, width: curQWidth*dayW });
          curQ = q; curQWidth = 0;
        }
        if (m!==curM) {
          if (curMWidth>0) bottom.push({ label: curM, width: curMWidth*dayW });
          curM = m; curMWidth = 0;
        }
        curQWidth++; curMWidth++;
        if (i===days.length-1) { top.push({ label: curQ, width: curQWidth*dayW }); bottom.push({ label: curM, width: curMWidth*dayW }); }
      });
    }
    return { top, bottom, dayW };
  }, [range, zoom]);

  const today = useMemo(()=>{ const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayX = useMemo(()=> diffDays(range.min, today) * headers.dayW, [range, headers.dayW, today]);

  const visibleItems = useMemo(()=>{
    // collapse logic: only show items if all ancestors expanded
    const id2idx = new Map(items.map((r,i)=>[r.id, i] as const));
    // need parent info -> infer from code (strip last segment). Since IDs don't include parent, use code logic.
    const codeParent = (code: string) => code.includes('.') ? code.slice(0, code.lastIndexOf('.')) : null;
    const codeSet = new Set(items.map(r=>r.code));
    const code2id = new Map(items.map(r=>[r.code, r.id] as const));
    const isVisible = (r: GanttItem): boolean => {
      let pCode = codeParent(r.code);
      while (pCode) {
        const pid = code2id.get(pCode);
        if (!pid) break;
        if (!expanded[pid]) return false;
        pCode = codeParent(pCode);
      }
      return true;
    };
    return items.filter(isVisible);
  }, [items, expanded]);

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = Math.max(0, todayX - 200);
  };

  const setAll = (v: boolean) => {
    const map: Record<string, boolean> = {};
    rows.forEach(r => map[r.id] = v);
    setExpanded(map);
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Gantt Timeline (đọc-only v1)','Gantt Timeline (read-only v1)')}</div>
          <select value={pid} onChange={e=>setPid(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={zoom} onChange={e=>setZoom(e.target.value as ZoomKey)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="week">{t('Tuần','Week')}</option>
            <option value="month">{t('Tháng','Month')}</option>
            <option value="quarter">{t('Quý','Quarter')}</option>
          </select>
          <button onClick={scrollToToday} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Về hôm nay','Center on Today')}</button>
          <button onClick={()=>setAll(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Mở tất cả','Expand all')}</button>
          <button onClick={()=>setAll(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thu tất cả','Collapse all')}</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Tìm theo mã/tiêu đề...','Search code/title...')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: dữ liệu lấy từ WBS (PM‑08).','Tip: data is sourced from WBS (PM‑08).')}</div>
      </div>

      {/* Grid */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateColumns:'520px 1fr', overflow:'hidden' }}>
        {/* Left pane */}
        <div style={{ borderRight:'1px solid #e5e7eb' }}>
          {/* Header */}
          <div style={{ position:'sticky', top:0, background:'#f9fafb', borderBottom:'1px solid #e5e7eb', padding:'6px 8px', fontWeight:700, zIndex:1 }}>
            {t('WBS & Tên mục','WBS & Item name')}
          </div>
          {/* Body */}
          <div>
            {visibleItems.map(r => {
              const isExpanded = !!expanded[r.id];
              const hasChildren = rows.some(x => x.code.startsWith(r.code + '.'));
              const toggle = () => setExpanded(m => ({ ...m, [r.id]: !isExpanded }));
              return (
                <div key={r.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center', padding:'6px 8px', borderTop:'1px solid #f1f5f9' }}>
                  <div style={{ width: 120, textAlign:'right', color:'#374151' }}>{r.code}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center' }}>
                    <div style={{ width: r.level*16 }}></div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {hasChildren && (
                        <button onClick={toggle} title={isExpanded?t('Thu gọn','Collapse'):t('Mở rộng','Expand')} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'0 6px', background:'#fff' }}>
                          {isExpanded ? '−' : '+'}
                        </button>
                      )}
                      <span style={{ fontWeight: r.type==='phase' ? 800 : 600 }}>{r.name}</span>
                      <span style={{ fontSize:12, color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:999, padding:'0px 8px', background:'#f9fafb' }}>{r.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane (timeline) */}
        <div style={{ position:'relative', overflow:'auto' }} ref={scrollRef}>
          {/* Headers */}
          <div style={{ position:'sticky', top:0, zIndex:2 }}>
            <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' }}>
              {headers.top.map((c, idx) => <div key={idx} style={{ width:c.width, padding:'6px 8px', borderRight:'1px solid #e5e7eb', fontWeight:700 }}>{c.label}</div>)}
            </div>
            <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
              {headers.bottom.map((c, idx) => <div key={idx} style={{ width:c.width, padding:'4px 8px', borderRight:'1px solid #f1f5f9', color:'#6b7280', fontSize:12 }}>{c.label}</div>)}
            </div>
          </div>

          {/* Today line */}
          <div style={{ position:'absolute', top:0, left: todayX, width:2, height:'100%', background:'#ef4444', opacity:.6, zIndex:1 }} title={t('Hôm nay','Today')}></div>

          {/* Rows */}
          <div>
            {visibleItems.map(r => {
              const s = parseDate(r.start); const f = parseDate(r.finish);
              const x = s ? diffDays(range.min, s) * headers.dayW : 0;
              const w = (s && f) ? Math.max(headers.dayW, diffDays(s, f) * headers.dayW) : headers.dayW;
              const color = pickColor(r.type);
              const isMilestone = r.type==='milestone' || (!!s && !!f && diffDays(s, f) <= 1);
              return (
                <div key={r.id} style={{ height:32, borderTop:'1px solid #f1f5f9', position:'relative' }}>
                  {!s && !f ? (
                    <div style={{ position:'absolute', left:8, top:8, color:'#9ca3af', fontSize:12 }}>{t('Chưa có ngày','No dates')}</div>
                  ) : isMilestone ? (
                    <div style={{ position:'absolute', left: x, top: 8, width: 16, height: 16, transform:'rotate(45deg)', background:'#f59e0b', border:'2px solid #b45309' }} title={r.name}></div>
                  ) : (
                    <div style={{ position:'absolute', left: x, top: 8, height: 16, width: w, background: color, border:'1px solid #cbd5e1', borderRadius:4 }} title={`${r.name} (${r.code})`}>
                      <div style={{ height:'100%', width: `${Math.max(0, Math.min(100, r.percent))}%`, background:'rgba(15, 118, 110, .6)', borderRadius:4 }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
