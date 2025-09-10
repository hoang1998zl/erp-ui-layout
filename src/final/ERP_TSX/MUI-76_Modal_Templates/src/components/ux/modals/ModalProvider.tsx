
// src/components/ux/modals/ModalProvider.tsx — context + imperative hooks to open templates (confirm/form/wizard)
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ModalBase } from './ModalBase';

type AnyObj = Record<string, any>;

type ModalApi = {
  confirm(opts: ConfirmOptions): Promise<boolean>;
  form<T extends AnyObj = AnyObj>(opts: FormOptions<T>): Promise<T|null>;
  wizard<T extends AnyObj = AnyObj>(opts: WizardOptions<T>): Promise<T|null>;
};

const ModalCtx = createContext<ModalApi | null>(null);

export const useModal = () => {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<React.ReactNode[]>([]);

  const push = (node: React.ReactNode) => setStack(s => [...s, node]);
  const pop = () => setStack(s => s.slice(0, -1));

  // Confirm
  const confirm: ModalApi['confirm'] = useCallback((opts) => new Promise<boolean>((resolve) => {
    const close = (v:boolean) => { pop(); resolve(v); };
    const footer = (
      <>
        <button onClick={()=> close(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{opts.cancelText||'Cancel'}</button>
        <button onClick={()=> close(true)} style={{ border:'1px solid #ef4444', background:'#fee2e2', color:'#b91c1c', borderRadius:8, padding:'6px 10px' }}>{opts.okText||'Confirm'}</button>
      </>
    );
    push(
      <ModalBase open title={opts.title||'Confirm action'} description={opts.description} onClose={()=> close(false)} dismissible={opts.dismissible??true} footer={footer} width={opts.width||480}>
        <div style={{ display:'grid', gap:8 }}>
          {opts.content && <div>{opts.content}</div>}
          {opts.warning && <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', color:'#9a3412', borderRadius:8, padding:'8px 10px' }}>{opts.warning}</div>}
        </div>
      </ModalBase>
    );
  }), []);

  // Form
  const form: ModalApi['form'] = useCallback((opts) => new Promise<any>((resolve) => {
    let draft = { ...(opts.initial||{}) };
    const close = (v:any) => { pop(); resolve(v); };
    const onSubmit = async () => {
      const err = opts.validate?.(draft) || null;
      if (err){ setErr(err); return; }
      try { setBusy(true); await opts.onSubmit?.(draft); close(draft); } catch (e:any){ setErr(e?.message||String(e)); } finally { setBusy(false); }
    };
    const [ErrComp, setErr] = (()=>{
      let setter: (s:any)=>void; let val: any = null;
      const Comp: React.FC = () => {
        const [e, se] = React.useState<any>(null); setter = se; val = e;
        return e ? <div style={{ color:'#ef4444', fontSize:12 }}>{String(e)}</div> : null;
      };
      return [Comp, (s:any)=> setter(s)] as const;
    })();
    const [BusyComp, setBusy] = (()=>{
      let setter: (b:boolean)=>void;
      const Comp: React.FC = () => {
        const [b, sb] = React.useState<boolean>(false); setter = sb;
        return b ? <div style={{ color:'#64748b', fontSize:12 }}>Saving…</div> : null;
      };
      return [Comp, (b:boolean)=> setter(b)] as const;
    })();
    const footer = (
      <>
        <button onClick={()=> close(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{opts.cancelText||'Cancel'}</button>
        <button onClick={onSubmit} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{opts.okText||'Save'}</button>
      </>
    );
    push(
      <ModalBase open title={opts.title||'Form'} description={opts.description} onClose={()=> close(null)} dismissible={opts.dismissible??true} footer={footer} width={opts.width||600}>
        <div style={{ display:'grid', gap:10 }}>
          {opts.render({ draft, set: (k:string, v:any)=> { draft={ ...draft, [k]: v }; }, all: draft })}
          <BusyComp />
          <ErrComp />
        </div>
      </ModalBase>
    );
  }), []);

  // Wizard
  const wizard: ModalApi['wizard'] = useCallback((opts) => new Promise<any>((resolve) => {
    let draft = { ...(opts.initial||{}) };
    let step = 0;
    const close = (v:any) => { pop(); resolve(v); };
    const setStep = (n:number) => { step = n; rerender(); };
    const next = async () => {
      const v = opts.steps[step];
      const err = v.validate?.(draft) || null;
      if (err){ setErr(err); return; }
      if (step < opts.steps.length-1){ setStep(step+1); }
      else {
        try { setBusy(true); await opts.onFinish?.(draft); close(draft); } catch (e:any){ setErr(e?.message||String(e)); } finally { setBusy(false); }
      }
    };
    const prev = () => { if (step>0) setStep(step-1); };
    const [ErrComp, setErr] = (()=>{
      let setter: (s:any)=>void;
      const Comp: React.FC = () => { const [e, se] = React.useState<any>(null); setter = se; return e? <div style={{ color:'#ef4444', fontSize:12 }}>{String(e)}</div> : null; };
      return [Comp, (s:any)=> setter(s)] as const;
    })();
    const [BusyComp, setBusy] = (()=>{
      let setter: (b:boolean)=>void;
      const Comp: React.FC = () => { const [b, sb] = React.useState<boolean>(false); setter = sb; return b? <div style={{ color:'#64748b', fontSize:12 }}>Processing…</div> : null; };
      return [Comp, (b:boolean)=> setter(b)] as const;
    })();

    const rerender = () => {
      const s = opts.steps[step];
      const footer = (
        <>
          <button onClick={()=> close(null)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{opts.cancelText||'Cancel'}</button>
          <div style={{ flex:1 }} />
          <button onClick={prev} disabled={step===0} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{opts.prevText||'Back'}</button>
          <button onClick={next} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{step<opts.steps.length-1 ? (opts.nextText||'Next') : (opts.finishText||'Finish')}</button>
        </>
      );
      const progress = `${step+1} / ${opts.steps.length}`;
      const bar = (100 * (step+1) / opts.steps.length) + '%';
      setStack(prev => prev.slice(0, -1).concat(
        <ModalBase open title={opts.title||'Wizard'} description={opts.description} onClose={()=> close(null)} dismissible={opts.dismissible??false} footer={footer} width={opts.width||720}>
          <div style={{ marginBottom:10 }}>
            <div style={{ height:8, borderRadius:999, background:'#eef2ff', overflow:'hidden' }}>
              <div style={{ width:bar, height:'100%', background:'#6366f1' }} />
            </div>
            <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>Step {progress}: <b>{s.title}</b></div>
          </div>
          <div style={{ display:'grid', gap:10 }}>
            {s.render({ draft, set:(k:string, v:any)=> { draft={ ...draft, [k]: v }; }, all: draft })}
            <BusyComp />
            <ErrComp />
          </div>
        </ModalBase>
      ));
    };

    // initial render
    push(<div />); // placeholder
    rerender();
  }), []);

  const api: ModalApi = useMemo(() => ({ confirm, form, wizard }), [confirm, form, wizard]);

  return (
    <ModalCtx.Provider value={api}>
      {children}
      {stack.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
    </ModalCtx.Provider>
  );
};

// ----- types for templates -----
export type ConfirmOptions = {
  title?: string;
  description?: string;
  content?: React.ReactNode;
  warning?: React.ReactNode;
  dismissible?: boolean;
  okText?: string;
  cancelText?: string;
  width?: number;
};

export type FormOptions<T> = {
  title?: string;
  description?: string;
  initial?: T;
  render: (ctx: { draft: T; set: (k: keyof T & string, v:any) => void; all: T }) => React.ReactNode;
  validate?: (draft: T) => string|null;
  onSubmit?: (draft: T) => Promise<void>|void;
  okText?: string;
  cancelText?: string;
  width?: number;
  dismissible?: boolean;
};

export type WizardStep<T> = {
  title: string;
  render: (ctx: { draft: T; set: (k: keyof T & string, v:any) => void; all: T }) => React.ReactNode;
  validate?: (draft: T) => string|null;
};
export type WizardOptions<T> = {
  title?: string;
  description?: string;
  initial?: T;
  steps: WizardStep<T>[];
  onFinish?: (draft: T) => Promise<void>|void;
  cancelText?: string;
  prevText?: string;
  nextText?: string;
  finishText?: string;
  width?: number;
  dismissible?: boolean; // default false
};
