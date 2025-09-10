
// src/components/ux/DragDropBoard.tsx — optional multi-list board (move between lists)
import React, { useMemo, useState } from 'react';
import { DragDropList, type Item } from './DragDropList';

export type Column = { id: string; title: string; items: Item[] };

export const DragDropBoard: React.FC<{ initial: Column[] }> = ({ initial }) => {
  const [cols, setCols] = useState<Column[]>(initial);
  const keyOf = (it: Item) => it.id;

  // Allow moving item between columns using HTML5 DnD via dataTransfer key
  // We'll reuse DragDropList but wrap drop area to detect foreign drops.
  const onReorderCol = (colId: string, next: Item[]) => {
    setCols(cs => cs.map(c => c.id===colId ? { ...c, items: next } : c));
  };

  const onDropToCol = (colId: string, item: Item, fromColId: string, index?: number) => {
    setCols(cs => {
      const from = cs.find(c => c.id===fromColId)!;
      const to = cs.find(c => c.id===colId)!;
      const without = { ...from, items: from.items.filter(x => keyOf(x)!==keyOf(item)) };
      const inserted = { ...to, items: (()=>{ const arr=to.items.slice(); arr.splice(index ?? to.items.length, 0, item); return arr; })() };
      return cs.map(c => c.id===fromColId? without : c.id===colId? inserted : c);
    });
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols.length}, minmax(260px, 1fr))`, gap:12 }}>
      {cols.map(col => (
        <div key={col.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>{col.title} <span style={{ color:'#94a3b8' }}>({col.items.length})</span></div>
          <div
            onDragOver={(e)=> { e.preventDefault(); }}
            onDrop={(e)=> {
              e.preventDefault();
              try {
                const raw = e.dataTransfer.getData('application/json');
                if (!raw) return;
                const data = JSON.parse(raw);
                if (data && data.item && data.fromColId && data.item.id){
                  onDropToCol(col.id, data.item, data.fromColId);
                }
              } catch {}
            }}
          >
            <DragDropList
              items={col.items}
              onReorder={(next)=> onReorderCol(col.id, next)}
              ariaLabel={col.title}
              renderItem={(it)=> it.title}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
