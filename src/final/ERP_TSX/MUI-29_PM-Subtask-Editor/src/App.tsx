// src/App.tsx — Runner for PM-06 Subtask_Editor
import React, { useEffect, useState } from 'react';
import { SubtaskEditor } from './components/pm/SubtaskEditor';

type Task = { id: string; title: string; project_id?: string };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<string>('');

  useEffect(()=>{
    try {
      const rows: any[] = JSON.parse(localStorage.getItem('erp.pm.tasks.v1') || '[]');
      const list = rows.map(r => ({ id: r.id, title: r.title || r.id, project_id: r.project_id }));
      setTasks(list);
      setTaskId(list[0]?.id || '');
    } catch {}
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1400px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>PM-06 — Subtask Editor</div>
          <select value={taskId} onChange={e=>setTaskId(e.target.value)} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        {taskId ? (
          <div style={{ padding:12 }}>
            <SubtaskEditor taskId={taskId} locale="vi" />
          </div>
        ) : (
          <div style={{ padding:12, color:'#6b7280' }}>Không tìm thấy task trong `erp.pm.tasks.v1` — hãy tạo task ở PM‑03.</div>
        )}
      </div>
    </div>
  );
}
