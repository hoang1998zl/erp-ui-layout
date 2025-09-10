// src/App.tsx — Runner for CORE-06 Context_RightPane
import React, { useEffect, useState } from 'react';
import { ContextRightPane } from './components/core/ContextRightPane';
import { listEntities, demoEntities, EntityType } from './mock/context';

type ERef = { type: EntityType; id: string };

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [sel, setSel] = useState<ERef | undefined>(undefined);

  useEffect(() => { listEntities().then(setItems); }, []);

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'48px 1fr', background:'#f3f4f6' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', padding:'0 12px', gap:10 }}>
        <div style={{ fontWeight:800 }}>CORE-06 — Context Right Pane</div>
        <div style={{ color:'#6b7280' }}>Click an item below to open the right pane. Upload/link docs; view activity; run quick actions.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', padding:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {items.map(e => (
            <button key={e.id} onClick={()=>setSel({ type: e.type, id: e.id })}
              style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff', cursor:'pointer' }}>
              <div style={{ fontWeight:700 }}>{e.title}</div>
              {e.subtitle && <div style={{ color:'#6b7280', fontSize:12 }}>{e.subtitle}</div>}
            </button>
          ))}
        </div>
      </div>

      <ContextRightPane
        entity={sel}
        onClose={()=>setSel(undefined)}
        locale="vi"
        actions={[
          { key:'copy-id', label:'Copy Entity ID', onClick:(ent)=>{ navigator.clipboard.writeText(ent.id); alert('Copied: ' + ent.id);} },
          { key:'open-route', label:'Open Route (mock)', onClick:(ent)=> alert('Navigate to: /' + ent.type + 's/' + ent.id) },
        ]}
      />
    </div>
  );
}
