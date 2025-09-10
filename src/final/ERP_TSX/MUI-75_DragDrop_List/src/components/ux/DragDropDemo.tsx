
// src/components/ux/DragDropDemo.tsx — demo using DragDropList and DragDropBoard
import React, { useState } from 'react';
import { DragDropList, type Item } from './DragDropList';
import { DragDropBoard } from './DragDropBoard';

function gen(n: number, prefix='IT'): Item[]{
  return Array.from({ length: n }).map((_,i) => ({
    id: `${prefix}-${i+1}`,
    title: `Item ${i+1}`,
    subtitle: i%3===0 ? 'Has extra notes' : undefined,
    avatar: i%4===0 ? '📝' : (i%4===1 ? '📎' : (i%4===2 ? '📌' : '🗂️')),
    meta: i%5===0 ? 'high' : '',
    disabled: i%11===0
  }));
}

export const DragDropDemo: React.FC = () => {
  const [items, setItems] = useState<Item[]>(()=> gen(10));
  const [boardMode, setBoardMode] = useState<boolean>(false);

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:700 }}>UX‑02 — Drag & Drop List</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>Used by PM‑03 (Task ordering), HR‑07 (Candidate ranking)</div>
        </div>
        <label style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="checkbox" checked={boardMode} onChange={e=> setBoardMode(e.target.checked)} />
          <span>Board mode (multi-list)</span>
        </label>
      </div>

      {!boardMode && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, background:'#fff' }}>
          <DragDropList items={items} onReorder={setItems} />
        </div>
      )}

      {boardMode && (
        <div>
          <DragDropBoard initial={[
            { id:'todo', title:'To Do', items: gen(5,'TD') },
            { id:'doing', title:'Doing', items: gen(4,'DG') },
            { id:'done', title:'Done', items: gen(3,'DN') }
          ]} />
        </div>
      )}
    </div>
  );
};
