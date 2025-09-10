// src/components/core/GlobalSearch.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProjects, fetchTasks, fetchDocuments, fetchUsers,
         Project, Task, Document, User } from '../../mock/data';

type EntityType = 'project'|'task'|'document'|'user';

type ResultItem = {
  id: string;
  type: EntityType;
  label: string;
  sub?: string;
  route: string;
  score: number;
};

export type GlobalSearchProps = {
  open?: boolean;
  onClose?: () => void;
  onNavigate?: (route: string) => void;
  hotkey?: boolean;         // open with Ctrl/Cmd+K
  locale?: 'vi'|'en';
  defaultType?: EntityType | 'all';
  fetchers?: {
    projects?: () => Promise<Project[]>;
    tasks?: () => Promise<Task[]>;
    documents?: () => Promise<Document[]>;
    users?: () => Promise<User[]>;
  }
};

const icons: Record<EntityType, string> = {
  project: '📁',
  task: '✅',
  document: '📄',
  user: '👤',
};

// Simple fuzzy score
function score(query: string, text: string) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q); // earlier match better
  // partial subsequence
  let qi = 0, hits = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { hits++; qi++; }
  }
  return hits;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (<>
    {text.slice(0, i)}<mark>{text.slice(i, i+query.length)}</mark>{text.slice(i+query.length)}
  </>);
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  open: openProp,
  onClose,
  onNavigate,
  hotkey = true,
  locale = 'vi',
  defaultType = 'all',
  fetchers = {}
}) => {
  const [open, setOpen] = useState(!!openProp);
  const [q, setQ] = useState('');
  const [activeType, setActiveType] = useState<EntityType | 'all'>(defaultType);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // sync prop
  useEffect(() => setOpen(!!openProp), [openProp]);

  // hotkey
  useEffect(() => {
    if (!hotkey) return;
    const handler = (e: KeyboardEvent) => {
      const isOpen = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      if (isOpen) { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hotkey, onClose]);

  useEffect(() => { if (open) setTimeout(()=>inputRef.current?.focus(), 0); }, [open]);

  const t = (vi: string, en: string) => locale === 'vi' ? vi : en;

  const load = async () => {
    setLoading(true);
    const [ps, ts, ds, us] = await Promise.all([
      (fetchers.projects || fetchProjects)(),
      (fetchers.tasks || fetchTasks)(),
      (fetchers.documents || fetchDocuments)(),
      (fetchers.users || fetchUsers)(),
    ]);
    // project results
    const pr = ps.map(p => ({
      id: p.id, type: 'project' as const,
      label: `${p.code} — ${p.name}`,
      sub: `status: ${p.status}`,
      route: `/projects/${p.id}`,
      score: score(q, `${p.code} ${p.name}`)
    }));
    const tr = ts.map(tk => ({
      id: tk.id, type: 'task' as const,
      label: tk.title,
      sub: `status: ${tk.status}`,
      route: `/tasks/${tk.id}`,
      score: score(q, `${tk.title}`)
    }));
    const dr = ds.map(d => ({
      id: d.id, type: 'document' as const,
      label: `${d.doc_type.toUpperCase()} — ${d.title}`,
      sub: d.uri,
      route: `/docs/${d.id}`,
      score: score(q, `${d.doc_type} ${d.title}`)
    }));
    const ur = us.map(u => ({
      id: u.id, type: 'user' as const,
      label: u.full_name,
      sub: u.email,
      route: `/users/${u.id}`,
      score: score(q, `${u.full_name} ${u.email}`)
    }));
    let all = [...pr, ...tr, ...dr, ...ur];
    if (q) all = all.filter(x => x.score > 0);
    if (activeType !== 'all') all = all.filter(x => x.type === activeType);
    all.sort((a,b) => b.score - a.score);
    setResults(all.slice(0, 80));
    setIndex(0);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open, q, activeType]);

  const grouped = useMemo(() => {
    const g: Record<EntityType, ResultItem[]> = { project:[], task:[], document:[], user:[] };
    results.forEach(r => g[r.type].push(r));
    return g;
  }, [results]);

  const flat = results;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i+1, flat.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIndex(i => Math.max(i-1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = flat[index];
      if (sel) { onNavigate?.(sel.route); setOpen(false); onClose?.(); }
    }
  };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80, zIndex:1000 }}
         onClick={() => { setOpen(false); onClose?.(); }}>
      <div style={{ width:860, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }}
           onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div style={{ display:'flex', gap:8, padding:10, borderBottom:'1px solid #e5e7eb' }}>
          <input
            ref={inputRef}
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('Tìm dự án, công việc, tài liệu, người dùng...','Search projects, tasks, documents, users...')}
            style={{ flex:1, padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }}
          />
          <select value={activeType} onChange={e=>setActiveType(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
            <option value="all">{t('Tất cả','All')}</option>
            <option value="project">{t('Dự án','Projects')}</option>
            <option value="task">{t('Công việc','Tasks')}</option>
            <option value="document">{t('Tài liệu','Documents')}</option>
            <option value="user">{t('Người dùng','Users')}</option>
          </select>
          <button onClick={()=>{ setOpen(false); onClose?.(); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>Esc</button>
        </div>

        {/* Results */}
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:300 }}>
          {/* Left summary */}
          <div style={{ borderRight:'1px solid #e5e7eb', padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Nhóm kết quả','Result groups')}</div>
            <div style={{ lineHeight:1.9, fontSize:14 }}>
              <div>{icons['project']} {t('Dự án','Projects')} <b>({grouped.project.length})</b></div>
              <div>{icons['task']} {t('Công việc','Tasks')} <b>({grouped.task.length})</b></div>
              <div>{icons['document']} {t('Tài liệu','Documents')} <b>({grouped.document.length})</b></div>
              <div>{icons['user']} {t('Người dùng','Users')} <b>({grouped.user.length})</b></div>
            </div>
            <div style={{ marginTop:12, fontSize:12, color:'#6b7280' }}>
              {t('Mẹo: dùng Ctrl/⌘+K để mở nhanh. ↑/↓ chọn, Enter đi đến.','Tip: use Ctrl/⌘+K. ↑/↓ to select, Enter to go.')}
            </div>
          </div>

          {/* Right list */}
          <div style={{ padding:10, maxHeight:420, overflow:'auto' }}>
            {loading && <div style={{ color:'#6b7280' }}>{t('Đang tải...','Loading...')}</div>}
            {!loading && flat.length === 0 && (
              <div style={{ color:'#6b7280' }}>{t('Không có kết quả. Hãy gõ từ khóa.','No results. Type to search.')}</div>
            )}
            {!loading && flat.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {flat.map((r, i) => (
                  <button key={`${r.type}-${r.id}`}
                          onClick={()=>{ onNavigate?.(r.route); setOpen(false); onClose?.(); }}
                          style={{
                            textAlign:'left',
                            border:'1px solid ' + (i===index ? '#4f46e5' : '#e5e7eb'),
                            background: i===index ? '#eef2ff' : '#fff',
                            borderRadius:8, padding:'8px 10px', cursor:'pointer'
                          }}
                          onMouseEnter={()=>setIndex(i)}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ width:20, textAlign:'center' }}>{icons[r.type]}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600 }}>{highlight(r.label, q)}</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>{r.sub}</div>
                      </div>
                      <code style={{ fontSize:12, opacity:0.6 }}>{r.route}</code>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
