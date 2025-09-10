
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export const Modal: React.FC<{open:boolean; title:string; onClose:()=>void; width?:number; children:React.ReactNode; footer?:React.ReactNode}> = ({ open, title, onClose, width=720, children, footer }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const onKey = (e:KeyboardEvent)=> { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown', onKey); return ()=> document.removeEventListener('keydown', onKey);
  },[onClose]);
  const root = (()=>{ let r=document.getElementById('modal-root'); if(!r){ r=document.createElement('div'); r.id='modal-root'; document.body.appendChild(r); } return r; })();
  if(!open) return null;
  return ReactDOM.createPortal(
    <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(2,6,23,.5)', display:'grid', placeItems:'start center', paddingTop:'8vh', zIndex:70 }}>
      <div ref={ref} style={{ width:'min(96vw,'+width+'px)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden', boxShadow:'0 30px 80px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ marginLeft:'auto', border:'1px solid #e5e7eb', borderRadius:8, width:28, height:28, background:'#fff' }}>✕</button>
        </div>
        <div style={{ padding:12 }}>
          {children}
        </div>
        <div style={{ borderTop:'1px solid #e5e7eb', padding:10, display:'flex', gap:8, justifyContent:'flex-end', background:'#f8fafc' }}>
          {footer}
        </div>
      </div>
    </div>,
    root
  );
};
