// src/App.tsx — Runner for PM-03 Task_Kanban_Board
import React from 'react';
import { TaskKanbanBoard } from './components/pm/TaskKanbanBoard';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(1800px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>PM-03 — Task Kanban Board</div>
        <TaskKanbanBoard locale="vi" />
      </div>
    </div>
  );
}
