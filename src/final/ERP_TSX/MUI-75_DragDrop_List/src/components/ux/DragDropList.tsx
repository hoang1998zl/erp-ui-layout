
// src/components/ux/DragDropList.tsx — UX-02 (single list) with HTML5 DnD + keyboard reordering
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type Item = {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;           // optional emoji/url
  disabled?: boolean;        // cannot be moved
  meta?: string;             // right-side meta text
};

export type DragDropListProps = {
  items: Item[];
  onReorder: (next: Item[]) => void;
  getKey?: (item: Item) => string;
  renderItem?: (item: Item) => React.ReactNode;
  searchable?: boolean;
  ariaLabel?: string;
};

function reorder<T>(arr: T[], from: number, to: number): T[]{
  const next = arr.slice();
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

export const DragDropList: React.FC<DragDropListProps> = ({ items, onReorder, getKey, renderItem, searchable=true, ariaLabel='Reorderable list' }) => {
  const [query, setQuery] = useState('');
  const [dragIndex, setDragIndex] = useState<number|null>(null);
  const [overIndex, setOverIndex] = useState<number|null>(null);
  const [kbdGrab, setKbdGrab] = useState<number|null>(null); // index being "grabbed" by keyboard
  const listRef = useRef<HTMLDivElement|null>(null);

  const keyOf = (it: Item) => getKey ? getKey(it) : it.id;

  const filtered = useMemo(()=> {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i => (i.title+' '+(i.subtitle||'')).toLowerCase().includes(q));
  }, [items, query]);

  // Map filtered indices back to original indices
  const indexInOriginal = (idxFiltered: number) => items.findIndex(i => keyOf(i)===keyOf(filtered[idxFiltered]));

  const onDragStart = (e: React.DragEvent, idxFiltered: number) => {
    const idxOrig = indexInOriginal(idxFiltered);
    if (items[idxOrig].disabled) { e.preventDefault(); return; }
    setDragIndex(idxOrig);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', keyOf(items[idxOrig]));
  };

  const onDragOver = (e: React.DragEvent, idxFiltered: number) => {
    e.preventDefault();
    const idxOrig = indexInOriginal(idxFiltered);
    setOverIndex(idxOrig);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, idxFiltered: number) => {
    e.preventDefault();
    e.stopPropagation();
    const toOrig = indexInOriginal(idxFiltered);
    if (dragIndex===null) return;
    if (toOrig===dragIndex) { setDragIndex(null); setOverIndex(null); return; }
    const next = reorder(items, dragIndex, toOrig);
    onReorder(next);
    setDragIndex(null); setOverIndex(null);
  };

  const onDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  // Keyboard reordering
  const startGrab = (i:number) => { if (!items[i].disabled) setKbdGrab(i); };
  const cancelGrab = () => setKbdGrab(null);
  const commitGrab = () => setKbdGrab(null);
  const moveGrab = (delta: number) => {
    if (kbdGrab===null) return;
    const from = kbdGrab;
    const to = Math.max(0, Math.min(items.length-1, from+delta));
    if (to!==from){
      onReorder(reorder(items, from, to));
      setKbdGrab(to);
    }
  };

  const row = (it: Item, idxFiltered: number) => {
    const idxOrig = indexInOriginal(idxFiltered);
    const active = dragIndex===idxOrig;
    const over = overIndex===idxOrig && dragIndex!==null;
    const grabbing = kbdGrab===idxOrig;

    return (
      <div
        key={keyOf(it)}
        role="option"
        aria-selected={false}
        aria-grabbed={grabbing}
        draggable={!it.disabled}
        onDragStart={(e)=> onDragStart(e, idxFiltered)}
        onDragOver={(e)=> onDragOver(e, idxFiltered)}
        onDrop={(e)=> onDrop(e, idxFiltered)}
        onDragEnd={onDragEnd}
        style={{
          display:'grid',
          gridTemplateColumns:'28px 1fr auto',
          gap:8,
          alignItems:'center',
          padding:'8px 10px',
          border:'1px solid #e5e7eb',
          borderRadius:10,
          background: active? '#eef2ff' : '#fff',
          boxShadow: over? 'inset 0 0 0 2px #a5b4fc' : 'none',
          opacity: it.disabled? 0.6 : 1,
          cursor: it.disabled? 'not-allowed' : 'grab'
        }}
      >
        <button
          aria-label="Drag handle"
          onKeyDown={(e)=> {
            if (e.key===' '){ e.preventDefault(); grabbing ? commitGrab() : startGrab(idxOrig); }
            else if (e.key==='Escape'){ e.preventDefault(); cancelGrab(); }
            else if (e.key==='ArrowUp'){ e.preventDefault(); if (grabbing) moveGrab(-1); }
            else if (e.key==='ArrowDown'){ e.preventDefault(); if (grabbing) moveGrab(1); }
          }}
          title="Space: grab/drop • ↑/↓ move • Esc cancel"
          style={{ border:'1px solid #e5e7eb', borderRadius:8, width:28, height:28, display:'grid', placeItems:'center', background:'#fff', cursor:'grab' }}
        >≡</button>
        <div style={{ display:'grid' }}>
          <div style={{ fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
            {it.avatar && <span style={{ fontSize:18 }}>{it.avatar}</span>}
            <span>{renderItem ? renderItem(it) : it.title}</span>
            {it.disabled && <span style={{ marginLeft:6, fontSize:12, color:'#ef4444' }}>locked</span>}
          </div>
          {it.subtitle && <div style={{ color:'#6b7280', fontSize:12 }}>{it.subtitle}</div>}
        </div>
        <div style={{ color:'#6b7280', fontSize:12 }}>{it.meta||''}</div>
      </div>
    );
  };

  return (
    <div role="listbox" aria-label={ariaLabel} style={{ display:'grid', gap:8 }}>
      {searchable && (
        <input
          placeholder="Tìm kiếm..."
          value={query}
          onChange={e=> setQuery(e.target.value)}
          style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 10px' }}
        />
      )}
      <div ref={listRef} style={{ display:'grid', gap:8 }}>
        {filtered.map((it, idxF) => row(it, idxF))}
        {filtered.length===0 && <div style={{ color:'#94a3b8', fontStyle:'italic' }}>— Không có mục —</div>}
      </div>
      <div style={{ color:'#64748b', fontSize:12 }}>Tip: Kéo-thả bằng chuột, hoặc dùng **Space** để bắt/nhả, **↑/↓** để di chuyển, **Esc** để hủy.</div>
    </div>
  );
};
