
// src/components/ux/modals/ModalBase.tsx — base modal with focus trap, ESC, overlay click
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export type ModalBaseProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  width?: number;                  // px
  dismissible?: boolean;           // close on overlay/Esc
  initialFocusRef?: React.RefObject<HTMLElement>;
  footer?: React.ReactNode;
};

export const ModalBase: React.FC<ModalBaseProps> = ({
  open, onClose, title, description, children, width=560, dismissible=true, initialFocusRef, footer
}) => {
  const overlayRef = useRef<HTMLDivElement|null>(null);
  const dialogRef = useRef<HTMLDivElement|null>(null);
  const titleId = useRef('mdl-title-'+Math.random().toString(36).slice(2));
  const descId = useRef('mdl-desc-'+Math.random().toString(36).slice(2));

  // focus trap
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current!;
    const focusable = () => Array.from(el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(n => !n.hasAttribute('disabled'));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible){ e.stopPropagation(); onClose?.(); }
      if (e.key === 'Tab'){
        const nodes = focusable();
        if (nodes.length === 0) return;
        const first = nodes[0]; const last = nodes[nodes.length-1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey){
          if (active === first || !el.contains(active)) { last.focus(); e.preventDefault(); }
        } else {
          if (active === last) { first.focus(); e.preventDefault(); }
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, dismissible, onClose]);

  // initial focus
  useLayoutEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (initialFocusRef?.current){ initialFocusRef.current.focus(); return; }
      const first = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // portal root
  const portalRoot = (() => {
    let root = document.getElementById('modal-root');
    if (!root){
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    return root;
  })();

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
      aria-describedby={description ? descId.current : undefined}
      style={{
        position:'fixed', inset:0, zIndex:50, display:'grid', placeItems:'center'
      }}
    >
      <div
        ref={overlayRef}
        onClick={()=> { if (dismissible) onClose?.(); }}
        style={{ position:'absolute', inset:0, background:'rgba(15, 23, 42, 0.5)' }}
      />
      <div
        ref={dialogRef}
        style={{
          position:'relative',
          width: 'min(96vw, '+width+'px)',
          maxHeight: '86vh',
          overflow:'hidden',
          background:'#fff',
          border:'1px solid #e5e7eb',
          borderRadius:14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display:'grid',
          gridTemplateRows: 'auto 1fr auto'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid #e5e7eb', gap:8 }}>
          <div id={titleId.current} style={{ fontWeight:800 }}>{title}</div>
          {description && <div id={descId.current} style={{ marginLeft:8, color:'#64748b', fontSize:12 }}>{description}</div>}
          <button
            onClick={()=> onClose?.()}
            aria-label="Close"
            title="Esc to close"
            style={{ marginLeft:'auto', border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, width:28, height:28 }}
          >✕</button>
        </div>
        <div style={{ padding:14, overflow:'auto' }}>
          {children}
        </div>
        <div style={{ borderTop:'1px solid #e5e7eb', padding:10, display:'flex', gap:8, justifyContent:'flex-end', background:'#f8fafc' }}>
          {footer}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, portalRoot);
};
