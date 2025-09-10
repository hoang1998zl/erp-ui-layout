
import React, { useEffect, useRef, useState } from 'react';
import { QuickCreateForms, type QuickKind } from './QuickCreateForms';

export const QuickCreateLauncher: React.FC<{ fromHeader?: boolean }> = ({ fromHeader=true }) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<QuickKind|null>(null);
  const ref = useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    const onClick = (e:MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick);
  }, [open]);

  // shortcut: Alt+N
  useEffect(()=>{
    const onKey = (e:KeyboardEvent) => { if (e.altKey && (e.key==='n' || e.key==='N')){ e.preventDefault(); setOpen(o=>!o);} };
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey);
  }, []);

  const Item = ({ icon, label, sub, onClick }: { icon:string; label:string; sub:string; onClick:()=>void }) => (
    <button onClick={onClick} style={{ display:'grid', gridTemplateColumns:'28px 1fr', gap:10, textAlign:'left', border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 10px', background:'#fff', cursor:'pointer' }}>
      <div style={{ fontSize:18 }}>{icon}</div>
      <div>
        <div style={{ fontWeight:600 }}>{label}</div>
        <div style={{ color:'#64748b', fontSize:12 }}>{sub}</div>
      </div>
    </button>
  );

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=> setOpen(o=>!o)} title="Quick create (Alt+N)" style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', background:'#fff' }}>＋ Create</button>
      {open && (
        <div style={{ position:'absolute', right:0, marginTop:8, width:320, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,.15)', padding:8, display:'grid', gap:8, zIndex:50 }}>
          <Item icon="📋" label="Task" sub="PM-03" onClick={()=> { setKind('Task'); setOpen(false);} } />
          <Item icon="💳" label="Expense" sub="FIN-08" onClick={()=> { setKind('Expense'); setOpen(false);} } />
          <Item icon="📄" label="Document" sub="EIM-01" onClick={()=> { setKind('Document'); setOpen(false);} } />
          <div style={{ borderTop:'1px dashed #e5e7eb', marginTop:4, paddingTop:4, color:'#64748b', fontSize:12 }}>Press <b>Alt+N</b> anytime to open.</div>
        </div>
      )}
      <QuickCreateForms kind={kind} onClose={()=> setKind(null)} />
    </div>
  );
};
