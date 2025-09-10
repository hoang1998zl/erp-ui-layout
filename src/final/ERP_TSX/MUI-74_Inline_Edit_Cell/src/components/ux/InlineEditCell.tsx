
// src/components/ux/InlineEditCell.tsx — UX-01
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type CellType = 'text'|'number'|'currency'|'date'|'select';

export type Option = { value: string|number; label: string };

export type InlineEditCellProps<T=any> = {
  value: T;
  type?: CellType;
  options?: Option[];                 // for select
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  align?: 'left'|'right'|'center';    // alignment for display
  format?: (v: T) => string;          // custom formatter for display
  parse?: (s: string) => T;           // custom parser for input
  validate?: (v: T) => string|null;   // return error message or null
  onCommit?: (v: T) => Promise<void>|void;
  onCancel?: () => void;
  // a11y
  ariaLabel?: string;
};

const fmtCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(v||0);
const parseCurrency = (s: string) => {
  const n = Number(String(s).replace(/[^\d.-]/g,''));
  return isNaN(n) ? 0 : n;
};

export const InlineEditCell: React.FC<InlineEditCellProps> = (props) => {
  const {
    value, type='text', options=[], placeholder='—', disabled=false, readOnly=false,
    align, format, parse, validate, onCommit, onCancel, ariaLabel
  } = props;

  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<any>(value);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string| null>(null);
  const inputRef = useRef<HTMLInputElement|HTMLSelectElement|null>(null);
  const cellRef = useRef<HTMLDivElement|null>(null);

  useEffect(()=> { if (editing){ setDraft(value); setTimeout(()=> inputRef.current?.focus(), 0); } }, [editing]);
  useEffect(()=> { if (!editing){ setDraft(value); setError(null); setSaving(false); } }, [value, editing]);

  const display = useMemo(()=> {
    if (format) return format(value as any);
    if (value===null || value===undefined || value==='') return placeholder;
    if (type==='currency') return fmtCurrency(Number(value));
    return String(value);
  }, [value, type, format, placeholder]);

  const textAlign = align || (type==='number' || type==='currency' ? 'right' : 'left');

  const commit = async () => {
    if (disabled || readOnly) return;
    const v = ((): any => {
      if (type==='number') return Number(draft);
      if (type==='currency') return typeof draft==='number'? draft : parseCurrency(String(draft||''));
      if (type==='date') return String(draft||'');
      return (parse ? parse(String(draft)) : draft);
    })();

    const err = validate ? validate(v) : null;
    setError(err);
    if (err) return;

    if (onCommit){
      try {
        setSaving(true);
        await onCommit(v);
        setSaving(false);
        setEditing(false);
      } catch (e: any){
        setSaving(false);
        setError(e?.message || String(e));
      }
    } else {
      setEditing(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
    setError(null);
    onCancel?.();
  };

  const onKeyDown: React.KeyboardEventHandler = async (e) => {
    if (e.key==='Enter'){ e.preventDefault(); await commit(); }
    else if (e.key==='Escape'){ e.preventDefault(); cancel(); }
    else if (e.key==='Tab'){ await commit(); /* allow browser to move focus */ }
  };

  const startEdit = () => {
    if (disabled || readOnly) return;
    setEditing(true);
  };

  return (
    <div ref={cellRef} role="gridcell" aria-label={ariaLabel} aria-invalid={!!error} style={{ position:'relative' }}>
      {!editing && (
        <div
          onDoubleClick={startEdit}
          onKeyDown={(e)=> { if (e.key==='F2'){ startEdit(); } }}
          tabIndex={0}
          style={{ padding:'6px 8px', minHeight:28, outline:'none', cursor: disabled||readOnly? 'not-allowed':'text', textAlign: textAlign as any }}
          onClick={(e)=> { /* single click focuses cell; double click to edit */ }}
          title={disabled? 'Disabled' : (readOnly? 'Read only' : 'Double‑click or press F2 to edit')}
        >
          <span style={{ color: (value===null || value===undefined || value==='')? '#94a3b8': '#0f172a' }}>{display}</span>
          {!disabled && !readOnly && <span style={{ position:'absolute', right:6, top:6, fontSize:10, color:'#cbd5e1' }}>✎</span>}
        </div>
      )}

      {editing && (
        <div style={{ padding:'4px 6px' }}>
          {(type==='text' || type==='number' || type==='currency' || type==='date') && (
            <input
              ref={inputRef as any}
              type={type==='date'? 'date' : (type==='number' ? 'number' : 'text')}
              value={type==='date' ? String(draft||'') : (draft ?? '')}
              onChange={e=> setDraft(type==='number' ? Number(e.target.value) : e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={()=> { /* commit on blur */ commit(); }}
              style={{ width:'100%', border:'1px solid #a5b4fc', borderRadius:6, padding:'6px 8px', textAlign: textAlign as any }}
              aria-invalid={!!error}
            />
          )}
          {type==='select' && (
            <select
              ref={inputRef as any}
              value={draft ?? ''}
              onChange={e=> setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={()=> commit()}
              style={{ width:'100%', border:'1px solid #a5b4fc', borderRadius:6, padding:'6px 8px' }}
            >
              <option value="" disabled>— Chọn —</option>
              {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
            </select>
          )}
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <button onClick={commit} disabled={saving} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>{saving? 'Saving…':'Save'}</button>
            <button onClick={cancel} disabled={saving} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', background:'#fff' }}>Cancel</button>
            {error && <span style={{ color:'#ef4444', fontSize:12 }}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
