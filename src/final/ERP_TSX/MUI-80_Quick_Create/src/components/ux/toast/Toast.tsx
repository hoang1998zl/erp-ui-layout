
import React, { createContext, useContext, useMemo, useState } from 'react';

type Toast = { id: string; type: 'success'|'error'|'info'; msg: string };
type API = { success: (msg:string)=>void; error:(msg:string)=>void; info:(msg:string)=>void; };

const Ctx = createContext<{toasts:Toast[],api:API}|null>(null);
const rid = () => Math.random().toString(36).slice(2);

export const useToast = () => {
  const c = useContext(Ctx); if(!c) throw new Error('useToast must be used within ToastProvider'); return c.api;
};

export const ToastProvider: React.FC<{children:React.ReactNode}> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (t:Toast) => { setToasts(arr => [...arr, t]); setTimeout(()=> setToasts(arr => arr.filter(x => x.id!==t.id)), 3000); };
  const api: API = useMemo(() => ({
    success:(m)=> push({ id:rid(), type:'success', msg:m }),
    error:(m)=> push({ id:rid(), type:'error', msg:m }),
    info:(m)=> push({ id:rid(), type:'info', msg:m })
  }), []);
  return (
    <Ctx.Provider value={{ toasts, api }}>
      {children}
      <div style={{ position:'fixed', right:10, bottom:10, display:'grid', gap:8, zIndex:60 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderLeft:'4px solid '+(t.type==='success'?'#16a34a':t.type==='error'?'#ef4444':'#3b82f6'), borderRadius:10, padding:'8px 10px', minWidth:220 }}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
};
