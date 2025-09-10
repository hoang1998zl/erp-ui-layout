
// src/components/ux/command/CommandProvider.tsx — provider + hook + palette component
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Role = 'Admin'|'Finance'|'PM'|'HR'|'Employee';

export type Command = {
  id: string;
  title: string;                 // visible label
  section?: 'Go to'|'Create'|'Actions'|'Admin';
  keywords?: string[];           // for search
  shortcut?: string;             // hint (e.g., G then E)
  icon?: React.ReactNode;        // emoji/SVG
  run: () => void | Promise<void>;
  allowedRoles?: Role[];         // role-based visibility
  pinned?: boolean;              // appear at top when empty query
};

export type CommandAPI = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setCommands: (cmds: Command[]) => void;
  setRole: (r: Role) => void;
};

type Ctx = {
  api: CommandAPI;
  isOpen: boolean;
  role: Role;
  commands: Command[];
};

const CmdCtx = createContext<Ctx|null>(null);

const rid = () => Math.random().toString(36).slice(2);

// simple fuzzy score: sum of token matches with prefix bonus
function score(q: string, text: string, kw: string[] = []): number {
  if (!q.trim()) return 0.1;
  const t = (text||'').toLowerCase();
  const words = [t, ...kw.map(s=>s.toLowerCase())];
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  let s = 0;
  for (const token of tokens){
    let best = 0;
    for (const w of words){
      if (w===token) best = Math.max(best, 5);
      else if (w.startsWith(token)) best = Math.max(best, 3);
      else if (w.includes(token)) best = Math.max(best, 1);
    }
    if (best===0) return 0; // hard fail if any token missing
    s += best;
  }
  // length penalty
  return s - Math.max(0, t.length/80);
}

const LS_RECENTS = 'erp.ux.cmd.recents.v1';
type Recent = { id: string, at: number };

export const CommandProvider: React.FC<{ children: React.ReactNode; initialRole?: Role }> = ({ children, initialRole='Employee' }) => {
  const [isOpen, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(initialRole);
  const [commands, setCommands] = useState<Command[]>([]);

  const api: CommandAPI = useMemo(() => ({
    open: ()=> setOpen(true),
    close: ()=> setOpen(false),
    toggle: ()=> setOpen(o => !o),
    setCommands: (cmds)=> setCommands(cmds),
    setRole: (r)=> setRole(r)
  }), []);

  // keyboard shortcut Ctrl/Cmd + K
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase()==='k';
      if ((e.ctrlKey || e.metaKey) && isK){
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <CmdCtx.Provider value={{ api, isOpen, role, commands }}>
      {children}
      <CommandPalette />
    </CmdCtx.Provider>
  );
};

export const useCommand = () => {
  const ctx = useContext(CmdCtx);
  if (!ctx) throw new Error('useCommand must be used within CommandProvider');
  return ctx.api;
};

// --------------- Palette UI ----------------

const useRecents = () => {
  const load = (): Recent[] => { try { return JSON.parse(localStorage.getItem(LS_RECENTS)||'[]'); } catch { return []; } };
  const save = (arr: Recent[]) => localStorage.setItem(LS_RECENTS, JSON.stringify(arr.slice(0, 12)));
  return {
    list: load,
    push: (id: string) => {
      const arr = load().filter(x => x.id!==id);
      arr.unshift({ id, at: Date.now() });
      save(arr);
    }
  };
};

const PaletteRow: React.FC<{
  active: boolean; title: string; subtitle?: string; icon?: React.ReactNode; shortcut?: string; onClick: () => void;
}> = ({ active, title, subtitle, icon, shortcut, onClick }) => (
  <button
    onClick={onClick}
    role="option"
    aria-selected={active}
    style={{
      display:'grid',
      gridTemplateColumns:'24px 1fr auto',
      gap:10, alignItems:'center',
      width:'100%',
      textAlign:'left',
      background: active? '#eef2ff' : '#fff',
      border:'1px solid #e5e7eb',
      borderRadius:10,
      padding:'8px 10px',
      cursor:'pointer'
    }}
  >
    <div aria-hidden style={{ fontSize:16, color:'#334155' }}>{icon || '⌘'}</div>
    <div style={{ display:'grid' }}>
      <div style={{ fontWeight:600 }}>{title}</div>
      {subtitle && <div style={{ color:'#64748b', fontSize:12 }}>{subtitle}</div>}
    </div>
    {shortcut && <div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12, color:'#64748b' }}>{shortcut}</div>}
  </button>
);

export const CommandPalette: React.FC = () => {
  const ctx = useContext(CmdCtx)!;
  const { isOpen, api, role } = ctx;
  const inputRef = useRef<HTMLInputElement|null>(null);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const [tab, setTab] = useState<'All'|'Go to'|'Create'|'Actions'|'Admin'>('All');
  const recents = useRecents();

  // filter by role
  const visible = ctx.commands.filter(c => !c.allowedRoles || c.allowedRoles.includes(role));

  // search + rank
  const ranked = useMemo(()=> {
    if (!q.trim()){
      const pinned = visible.filter(c => c.pinned);
      const recentIds = recents.list().map(r => r.id);
      const recent = visible.filter(c => recentIds.includes(c.id) && !c.pinned);
      const rest = visible.filter(c => !pinned.includes(c) && !recent.includes(c));
      return [...pinned, ...recent, ...rest];
    }
    const withScore = visible.map(c => ({
      c, s: score(q, c.title, c.keywords||[])
    })).filter(x => x.s>0).sort((a,b) => b.s - a.s);
    return withScore.map(x => x.c);
  }, [q, visible]);

  const filteredByTab = ranked.filter(c => tab==='All' ? true : (c.section||'Actions')===tab);

  useEffect(()=> {
    if (isOpen){
      setTimeout(()=> inputRef.current?.focus(), 0);
    } else {
      setQ(''); setCursor(0); setTab('All');
    }
  }, [isOpen]);

  const onKey: React.KeyboardEventHandler = (e) => {
    if (e.key==='ArrowDown'){ e.preventDefault(); setCursor(c => Math.min(filteredByTab.length-1, c+1)); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); setCursor(c => Math.max(0, c-1)); }
    else if (e.key==='Enter'){
      e.preventDefault();
      const hit = filteredByTab[cursor];
      if (hit){
        recents.push(hit.id);
        api.close();
        Promise.resolve(hit.run());
      }
    } else if (e.key==='Escape'){ e.preventDefault(); api.close(); }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, zIndex:70, display:'grid', placeItems:'start center', background:'rgba(2,6,23,.5)', paddingTop: '10vh' }}>
      <div style={{ width:'min(720px, 95vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden', boxShadow:'0 30px 80px rgba(0,0,0,.25)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb', gap:10 }}>
          <input
            ref={inputRef}
            value={q}
            onChange={e=> setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Tìm lệnh… (gõ để lọc, ↑/↓ chọn, Enter chạy)"
            style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 10px', width:'100%' }}
          />
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#64748b', fontSize:12 }}>
            <kbd style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#f8fafc' }}>Ctrl</kbd>+<kbd style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#f8fafc' }}>K</kbd>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, padding:'6px 8px', borderBottom:'1px solid #e5e7eb' }}>
          {(['All','Go to','Create','Actions','Admin'] as const).map(t => (
            <button key={t} onClick={()=> setTab(t)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 10px', background: tab===t? '#eef2ff':'#fff' }}>{t}</button>
          ))}
          <div style={{ marginLeft:'auto', color:'#64748b', fontSize:12 }}>Role: <b>{role}</b></div>
        </div>
        <div style={{ maxHeight: '50vh', overflow:'auto', padding:10, display:'grid', gap:8 }}>
          {filteredByTab.map((c, i) => (
            <PaletteRow
              key={c.id}
              active={i===cursor}
              title={c.title}
              subtitle={c.keywords?.join(', ')}
              icon={c.icon}
              shortcut={c.shortcut}
              onClick={()=> { recents.push(c.id); api.close(); Promise.resolve(c.run()); }}
            />
          ))}
          {filteredByTab.length===0 && (
            <div style={{ padding:20, color:'#64748b', textAlign:'center' }}>Không có lệnh phù hợp.</div>
          )}
        </div>
      </div>
    </div>
  );
};
