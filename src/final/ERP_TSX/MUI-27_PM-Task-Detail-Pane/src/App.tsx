// src/App.tsx — Runner: a simple list + slide-over TaskDetailPane
import React, { useEffect, useState } from 'react';
import { TaskDetailPane } from './components/pm/TaskDetailPane';
import { type Task } from './mock/task_detail';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(()=>{
    // lazy import to reuse listTasks from PM-03 if available, fallback to minimal loader
    (async () => {
      try {
        const mod = await import('./mock/task_detail');
        // @ts-ignore
        const all: Task[] = JSON.parse(localStorage.getItem('erp.pm.tasks.v1') || '[]');
        setTasks(all.slice(0, 200));
      } catch (e) {}
    })();
  }, []);

  const filtered = tasks.filter(t => (t.title+' '+(t.description||'')).toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', padding:16 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>PM-04 — Task Detail Pane (Slide-over)</div>
          <div style={{ color:'#6b7280' }}>Click task → mở chi tiết bên phải</div>
        </div>

        <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', marginBottom:8 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm task..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {filtered.length===0 && <div style={{ color:'#6b7280' }}>—</div>}
            {filtered.map(t => (
              <div key={t.id} onClick={()=>setOpenId(t.id)} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'8px 10px', background:'#fff', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{t.title}</div>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{t.status} • {t.priority}</div>
                </div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t.description || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TaskDetailPane taskId={openId} onClose={()=>setOpenId(null)} locale="vi" />
    </div>
  );
}
