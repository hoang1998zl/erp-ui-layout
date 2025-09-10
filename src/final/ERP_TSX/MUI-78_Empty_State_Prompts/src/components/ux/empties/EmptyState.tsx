
// src/components/ux/empties/EmptyState.tsx — UX-05
import React from 'react';

export type EmptyKind =
  | 'first-use'        // brand new space
  | 'no-data'          // no records yet
  | 'no-results'       // filters/search returned nothing
  | 'error'            // system error
  | 'permission'       // user doesn't have rights
  | 'offline';         // network offline

export type Action = { label: string; onClick: () => void; variant?: 'primary'|'secondary'|'link' };

export type Suggestion = { label: string; onClick: () => void };

export type EmptyStateProps = {
  kind?: EmptyKind;
  title: string;
  description?: string;
  illustration?: React.ReactNode;        // emoji/SVG
  actions?: Action[];                    // up to 2 buttons + link
  tips?: string[];                       // bullet list
  suggestions?: Suggestion[];            // chips to drive first actions
  helpLink?: { label: string; href: string };
  dense?: boolean;                       // compact (inline) vs full
  align?: 'center'|'left';
  tone?: 'neutral'|'brand'|'warning'|'danger';
  testId?: string;
};

const toneColors = (tone: NonNullable<EmptyStateProps['tone']>) => {
  switch (tone){
    case 'brand': return { icon:'#6366f1', accent:'#eef2ff' };
    case 'warning': return { icon:'#d97706', accent:'#fffbeb' };
    case 'danger': return { icon:'#ef4444', accent:'#fef2f2' };
    default: return { icon:'#64748b', accent:'#f8fafc' };
  }
};

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
  const {
    kind='no-data', title, description, illustration, actions=[], tips=[], suggestions=[],
    helpLink, dense=false, align='center', tone='neutral', testId
  } = props;
  const t = toneColors(tone);

  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div data-testid={testId} style={{
      border:'1px dashed #e5e7eb',
      background:t.accent,
      borderRadius:16,
      padding: dense? '12px 14px' : '24px',
      display:'grid',
      justifyItems: align==='center' ? 'center' : 'start',
      gap: dense? 8 : 12
    }}>{children}</div>
  );

  const Title = () => <div style={{ fontWeight:800, fontSize: dense? 16 : 18, textAlign: align as any }}>{title}</div>;
  const Desc = () => description ? <div style={{ color:'#64748b', fontSize:13, textAlign: align as any }}>{description}</div> : null;

  const Icon: React.FC = () => (
    <div aria-hidden style={{ fontSize: dense? 28 : 42, lineHeight:1, color:t.icon }}>
      {illustration ?? (kind==='no-results' ? '🔎' : kind==='first-use' ? '✨' : kind==='error' ? '🛑' : kind==='permission' ? '🔒' : kind==='offline' ? '📴' : '📭')}
    </div>
  );

  const Buttons = () => (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
      {actions.slice(0,2).map((a,i) => (
        <button key={i} onClick={a.onClick} style={{
          border:'1px solid #e5e7eb',
          borderRadius:10,
          padding:'8px 12px',
          background: a.variant==='primary' ? '#fff' : '#fff',
          boxShadow: a.variant==='primary' ? '0 2px 0 rgba(99,102,241,.25)' : 'none',
          color: '#0f172a',
          fontWeight: a.variant==='primary' ? 700 : 500
        }}>{a.label}</button>
      ))}
      {actions.slice(2).map((a,i) => (
        <button key={'lnk'+i} onClick={a.onClick} style={{ border:'none', background:'transparent', color:'#1d4ed8', textDecoration:'underline' }}>{a.label}</button>
      ))}
    </div>
  );

  const Tips = () => tips.length ? (
    <ul style={{ margin:0, paddingLeft: align==='center'? 16 : 18, color:'#64748b', fontSize:13, textAlign: align as any }}>
      {tips.map((t,i) => <li key={i}>{t}</li>)}
    </ul>
  ) : null;

  const Suggests = () => suggestions.length ? (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
      {suggestions.map((s,i) => (
        <button key={i} onClick={s.onClick} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 10px', background:'#fff', fontSize:12 }}>{s.label}</button>
      ))}
    </div>
  ) : null;

  const Help = () => helpLink ? (
    <a href={helpLink.href} target="_blank" rel="noreferrer" style={{ color:'#1d4ed8', fontSize:12 }}>{helpLink.label}</a>
  ) : null;

  return (
    <Card>
      <Icon />
      <Title />
      <Desc />
      <Buttons />
      <Tips />
      <Suggests />
      <Help />
    </Card>
  );
};

// Convenience wrappers
export const PageEmpty: React.FC<EmptyStateProps> = (p) => (
  <div style={{ display:'grid', placeItems:'center', minHeight: '50vh' }}>
    <div style={{ width:'min(720px, 92vw)' }}><EmptyState {...p} dense={false} align="center" /></div>
  </div>
);

export const InlineEmpty: React.FC<EmptyStateProps> = (p) => (
  <div style={{ width:'100%' }}><EmptyState {...p} dense align={p.align||'left'} /></div>
);
