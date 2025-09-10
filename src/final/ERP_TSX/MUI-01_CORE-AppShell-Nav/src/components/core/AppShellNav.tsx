// src/components/core/AppShellNav.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { navItems as defaultNav, NavItem } from '../../mock/nav';
import { workspaces as defaultWorkspaces } from '../../mock/workspaces';

export type AppShellNavProps = {
  navItems?: NavItem[];
  workspaces?: { id: string; name: string }[];
  locale?: 'vi'|'en';
  onLocaleChange?: (loc: 'vi'|'en') => void;
  onNavigate?: (route: string) => void;
  children?: React.ReactNode;     // main content
  rightPane?: React.ReactNode;    // context panel (optional)
  breadcrumbs?: string[];         // ['Home','Projects','PRJ-001']
};

export const AppShellNav: React.FC<AppShellNavProps> = (props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const [workspace, setWorkspace] = useState(props.workspaces?.[0]?.id || 'main');
  const [locale, setLocale] = useState<'vi'|'en'>(props.locale || 'vi');
  const nav = props.navItems || defaultNav;
  const workspaces = props.workspaces || defaultWorkspaces;
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { props.onLocaleChange?.(locale); }, [locale]);

  const flatRoutes = useMemo(() => {
    const arr: {key:string,label:string,route?:string}[] = [];
    const walk = (items: NavItem[]) => items.forEach(i => {
      arr.push({key:i.key, label:i.label, route:i.route});
      if (i.children) walk(i.children);
    });
    walk(nav);
    return arr.filter(x => !!x.route);
  }, [nav]);

  const filteredCmd = flatRoutes.filter(x => x.label.toLowerCase().includes(query.toLowerCase()));

  const toggle = (key: string) => setOpenKeys(s => ({...s, [key]: !s[key]}));
  const onGo = (route?: string) => {
    if (!route) return;
    props.onNavigate?.(route);
    setCmdOpen(false);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns: collapsed ? '56px 1fr' : '260px 1fr', height:'100vh' }}>
      {/* Sidebar */}
      <aside style={{ borderRight:'1px solid #e5e7eb', background:'#ffffff', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', padding:'12px 10px', borderBottom:'1px solid #e5e7eb' }}>
          {!collapsed && <div style={{ fontWeight:800 }}>ERP</div>}
          <button onClick={() => setCollapsed(v=>!v)} title="Collapse" style={{ border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', padding:'6px 8px' }}>{collapsed?'›':'‹'}</button>
        </div>
        {!collapsed && (
          <div style={{ padding:10 }}>
            <label style={{ fontSize:12, color:'#6b7280' }}>Workspace</label>
            <select value={workspace} onChange={e=>setWorkspace(e.target.value)} style={{ width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:6 }}>
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <nav style={{ padding:6 }}>
          {nav.map(item => (
            <div key={item.key} style={{ marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding: collapsed? '10px 8px':'10px 12px',
                            cursor:'pointer', borderRadius:8 }}
                   onClick={() => item.children ? toggle(item.key) : onGo(item.route)}>
                <span style={{ width:20, textAlign:'center' }}>{item.icon || '•'}</span>
                {!collapsed && <span style={{ fontWeight:600 }}>{item.label}</span>}
                {!collapsed && item.children && <span style={{ marginLeft:'auto', opacity:0.6 }}>{openKeys[item.key] ? '▾':'▸'}</span>}
              </div>
              {!collapsed && item.children && openKeys[item.key] && (
                <div style={{ paddingLeft:34, display:'flex', flexDirection:'column', gap:6 }}>
                  {item.children.map(ch => (
                    <button key={ch.key} onClick={() => onGo(ch.route)} style={{ textAlign:'left', border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'8px 10px', cursor:'pointer' }}>
                      {ch.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{ display:'grid', gridTemplateRows:'48px 36px 1fr', height:'100%', background:'#f8fafc' }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#ffffff', borderBottom:'1px solid #e5e7eb', padding:'0 10px' }}>
          <button onClick={() => setCmdOpen(true)} style={{ flex:1, textAlign:'left', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            ⌘K / Ctrl+K — Search & Commands / Tìm nhanh
          </button>
          <select value={locale} onChange={e=>setLocale(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px' }}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
          <button title="Notifications" style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>🔔</button>
          <button title="Profile" style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}>🙂</button>
        </div>

        {/* Breadcrumbs */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 12px', background:'#ffffff', borderBottom:'1px solid #e5e7eb', fontSize:13 }}>
          {(props.breadcrumbs || ['Home']).map((bc, i) => (
            <React.Fragment key={i}>
              <span>{bc}</span>
              {i < (props.breadcrumbs?.length||1)-1 && <span style={{ opacity:0.5 }}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Content with optional right pane */}
        <div style={{ display:'grid', gridTemplateColumns: props.rightPane ? '1fr 360px' : '1fr', gap:12, padding:12 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:10, minHeight: 320 }}>
            {props.children || <EmptyState />}
          </div>
          {props.rightPane && (
            <aside style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:10, minHeight: 320, padding:10 }}>
              {props.rightPane}
            </aside>
          )}
        </div>
      </div>

      {/* Command palette (simple) */}
      {cmdOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.15)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80 }} onClick={()=>setCmdOpen(false)}>
          <div style={{ width:720, background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb' }}>
              <input autoFocus placeholder="Type to search commands / Nhập để tìm..." value={query} onChange={e=>setQuery(e.target.value)}
                     style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div style={{ maxHeight:360, overflow:'auto', padding:10, display:'flex', flexDirection:'column', gap:6 }}>
              {filteredCmd.map((c) => (
                <button key={c.key} onClick={()=>onGo(c.route)} style={{ textAlign:'left', border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, padding:'8px 10px', cursor:'pointer' }}>
                  {c.label} <span style={{ opacity:0.6, fontSize:12 }}>— {c.route}</span>
                </button>
              ))}
              {filteredCmd.length === 0 && <div style={{ color:'#6b7280' }}>No commands. / Không có lệnh.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
    Chọn menu ở thanh bên trái hoặc mở Command Palette (Ctrl/⌘+K).<br/>Select a menu on the left or open Command Palette.
  </div>
);
