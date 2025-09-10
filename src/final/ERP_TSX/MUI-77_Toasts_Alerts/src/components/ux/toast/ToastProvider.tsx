
// src/components/ux/toast/ToastProvider.tsx — UX‑04 Toasts (Provider + hook + components)
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ToastType = 'success'|'error'|'info'|'warning';
export type ToastPosition = 'top-right'|'top-left'|'bottom-right'|'bottom-left';

export type ToastOptions = {
  id?: string;
  type?: ToastType;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void | Promise<void>;
  durationMs?: number;         // 0 = sticky until closed
  canClose?: boolean;          // default true
};

export type ToastItem = Required<Pick<ToastOptions,'id'>> & ToastOptions & {
  createdAt: number;
  count?: number;              // merged duplicates count
};

export type ToastAPI = {
  show: (opts: ToastOptions) => string;
  success: (msg: string, opts?: Omit<ToastOptions,'message'|'type'>) => string;
  error: (msg: string, opts?: Omit<ToastOptions,'message'|'type'>) => string;
  info: (msg: string, opts?: Omit<ToastOptions,'message'|'type'>) => string;
  warning: (msg: string, opts?: Omit<ToastOptions,'message'|'type'>) => string;
  close: (id: string) => void;
  clear: () => void;
};

type Ctx = {
  toasts: ToastItem[];
  api: ToastAPI;
  position: ToastPosition;
};

const ToastCtx = createContext<Ctx | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.api;
};

const rid = () => Math.random().toString(36).slice(2);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
  position?: ToastPosition;
  max?: number;                  // max on screen; older will queue
  mergeWithinMs?: number;        // merge duplicates within this window
}> = ({ children, position='bottom-right', max=5, mergeWithinMs=1500 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const queueRef = useRef<ToastItem[]>([]);

  const add = useCallback((opts: ToastOptions) => {
    const now = Date.now();
    const id = opts.id || rid();
    const item: ToastItem = {
      id,
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message,
      actionText: opts.actionText,
      onAction: opts.onAction,
      durationMs: opts.durationMs ?? (opts.type==='error' ? 6000 : 4000),
      canClose: opts.canClose ?? true,
      createdAt: now,
      count: 1
    };

    // Merge duplicates (same type+title+message within mergeWithinMs)
    const existing = toasts.find(t => (now - t.createdAt) < mergeWithinMs && t.type===item.type && t.title===item.title && t.message===item.message);
    if (existing){
      existing.count = (existing.count||1)+1;
      setToasts(ts => ts.map(t => t.id===existing.id ? { ...existing } : t));
      return existing.id;
    }

    // Add to screen or queue
    if (toasts.length < max){
      setToasts(ts => [...ts, item]);
    } else {
      queueRef.current.push(item);
    }
    return id;
  }, [toasts, max, mergeWithinMs]);

  const close = useCallback((id: string) => {
    setToasts(ts => {
      const next = ts.filter(t => t.id!==id);
      // Pull from queue if any
      if (queueRef.current.length && next.length < max){
        const q = queueRef.current.shift()!;
        return [...next, q];
      }
      return next;
    });
  }, [max]);

  const clear = useCallback(() => {
    setToasts([]);
    queueRef.current = [];
  }, []);

  const api: ToastAPI = useMemo(() => ({
    show: (opts) => add(opts),
    success: (msg, opts={}) => add({ ...opts, type:'success', message: msg }),
    error:   (msg, opts={}) => add({ ...opts, type:'error', message: msg }),
    info:    (msg, opts={}) => add({ ...opts, type:'info', message: msg }),
    warning: (msg, opts={}) => add({ ...opts, type:'warning', message: msg }),
    close, clear
  }), [add, close, clear]);

  const value: Ctx = useMemo(() => ({ toasts, api, position }), [toasts, api, position]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastCtx.Provider>
  );
};

// ---------- Viewport & Toast item UI ----------

const tone = (type: ToastType) => {
  if (type==='success') return { bg:'#ecfdf5', bd:'#a7f3d0', fg:'#065f46', icon:'✔' };
  if (type==='error')   return { bg:'#fef2f2', bd:'#fecaca', fg:'#991b1b', icon:'⚠' };
  if (type==='warning') return { bg:'#fffbeb', bd:'#fde68a', fg:'#92400e', icon:'⚠' };
  return { bg:'#eff6ff', bd:'#bfdbfe', fg:'#1e40af', icon:'ℹ' };
};

function Progress({ value, color='#94a3b8' }: { value: number; color?: string }){
  return (
    <div style={{ position:'absolute', left:0, right:0, bottom:0, height:3, background:'#e5e7eb' }}>
      <div style={{ width:`${Math.max(0, Math.min(100, value))}%`, height:'100%', background:color, transition:'width 120ms linear' }} />
    </div>
  );
}

export const ToastViewport: React.FC = () => {
  const ctx = useContext(ToastCtx)!;
  if (!ctx) return null;
  const { toasts, api, position } = ctx;

  const posStyle = (() => {
    const base: React.CSSProperties = { position:'fixed', zIndex:60, display:'grid', gap:8, padding:12 };
    if (position==='top-right') return { ...base, right: 0, top: 0, justifyItems:'end' as const };
    if (position==='top-left') return { ...base, left: 0, top: 0 };
    if (position==='bottom-left') return { ...base, left: 0, bottom: 0 };
    return { ...base, right: 0, bottom: 0, justifyItems:'end' as const };
  })();

  return (
    <div aria-live="polite" aria-relevant="additions" style={posStyle}>
      {toasts.map(t => <ToastView key={t.id} item={t} onClose={()=> api.close(t.id)} />)}
    </div>
  );
};

const useInterval = (fn: ()=>void, ms: number) => {
  useEffect(() => { const id = setInterval(fn, ms); return () => clearInterval(id); }, [fn, ms]);
};

const ToastView: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const t = tone(item.type||'info');

  const duration = item.durationMs ?? 0;
  useInterval(() => {
    if (paused || duration===0) return;
    setProgress(p => {
      const next = p + (100 / Math.max(1, duration/120)); // update ~8x/s
      if (next >= 100){ onClose(); return 100; }
      return next;
    });
  }, 120);

  // assertive for errors, polite for others
  const role = item.type==='error' ? 'alert' : 'status';
  const ariaLive = item.type==='error' ? 'assertive' : 'polite';

  return (
    <div
      role={role as any}
      aria-live={ariaLive as any}
      onMouseEnter={()=> setPaused(true)}
      onMouseLeave={()=> setPaused(false)}
      style={{
        position:'relative',
        maxWidth: 420,
        border:'1px solid '+t.bd,
        background:t.bg,
        color:t.fg,
        borderRadius:12,
        padding:'10px 12px',
        boxShadow:'0 10px 28px rgba(0,0,0,0.12)',
        display:'grid',
        gridTemplateColumns:'22px 1fr auto',
        gap:10,
        alignItems:'start'
      }}
    >
      <div aria-hidden style={{ fontSize:16, lineHeight:'20px' }}>{t.icon}</div>
      <div style={{ display:'grid', gap:4 }}>
        {(item.title || item.type) && <div style={{ fontWeight:800 }}>{item.title || (item.type==='success'?'Success':item.type==='error'?'Error':item.type==='warning'?'Warning':'Info')}</div>}
        {item.message && <div style={{ fontSize:13, color:'inherit' }}>{item.message}</div>}
        {item.count && item.count>1 && <div style={{ fontSize:11, color:'#64748b' }}>×{item.count}</div>}
        {item.actionText && (
          <div>
            <button onClick={async ()=> { try { await item.onAction?.(); } finally { onClose(); } }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{item.actionText}</button>
          </div>
        )}
      </div>
      <div style={{ display:'grid', gap:6, alignItems:'start', justifyItems:'end' }}>
        {item.canClose!==false && <button onClick={onClose} aria-label="Close" title="Close" style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, width:26, height:26, color:'#0f172a' }}>✕</button>}
      </div>
      {duration>0 && <Progress value={100-progress} color={t.bd} />}
    </div>
  );
};
