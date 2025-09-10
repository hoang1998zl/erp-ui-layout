
// src/components/fin/CoATreeView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ensureSeed, listAccounts, setParent, buildTree, type TreeNode } from '../../mock/coa';
import { seedGLIfEmpty, usageCountMap } from '../../mock/gl';

type ViewNode = TreeNode & { expanded?: boolean };

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

export const CoATreeView: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [nodes, setNodes] = useState<ViewNode[]>([]);
  const [filter, setFilter] = useState('');
  const [flat, setFlat] = useState<Array<{ code:string; name:string; parent?:string; is_postable:boolean; type:string }>>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string>('');

  const load = () => {
    ensureSeed(); seedGLIfEmpty();
    const tree = buildTree() as ViewNode[];
    const fl = listAccounts().map(a => ({ code:a.code, name:a.name_vi||a.name_en||a.code, parent:a.parent_code, is_postable:a.is_postable, type:a.type }));
    const uc = usageCountMap();
    setUsage(uc);
    setNodes(tree);
    setFlat(fl);
  };
  useEffect(()=>{ load(); }, []);

  const toggle = (code: string) => {
    const recur = (arr:ViewNode[]): ViewNode[] => arr.map(n => ({ ...n, expanded: n.code===code ? !n.expanded : n.expanded, children: recur(n.children as ViewNode[]) }));
    setNodes(recur(nodes));
  };
  const expandAll = (on:boolean) => {
    const recur = (arr:ViewNode[]): ViewNode[] => arr.map(n => ({ ...n, expanded:on, children: recur(n.children as ViewNode[]) }));
    setNodes(recur(nodes));
  };

  const childrenOf = (code: string, arr:ViewNode[]): string[] => {
    let out: string[] = [];
    for (const n of arr) {
      if (n.code===code) { collect(n); break; }
      out = out.concat(childrenOf(code, n.children as ViewNode[]));
    }
    function collect(n: ViewNode) { out.push(n.code); (n.children||[]).forEach(c => collect(c as ViewNode)); }
    return out;
  };

  const subtreeUsage = (code: string): number => {
    const all = childrenOf(code, nodes);
    return all.reduce((sum, c) => sum + (usage[c]||0), 0);
  };

  // Drag & Drop
  const onDragStart = (ev: React.DragEvent, code: string) => { ev.dataTransfer.setData('text/plain', code); };
  const onDragOver = (ev: React.DragEvent) => { ev.preventDefault(); };
  const onDrop = (ev: React.DragEvent, targetCode?: string) => {
    ev.preventDefault();
    const src = ev.dataTransfer.getData('text/plain');
    if (!src) return;
    if (src===targetCode) return;
    // prevent drop into own descendant
    if (targetCode) {
      const desc = childrenOf(src, nodes);
      if (desc.includes(targetCode)) { alert(t('Không thể thả vào chính nhánh con của nó','Cannot drop into its own descendant')); return; }
    }
    const usageCount = subtreeUsage(src);
    if (usageCount>0) {
      if (!confirm(t('Tài khoản (hoặc nhánh) đã được sử dụng trong bút toán. Vẫn di chuyển?','This account (or subtree) has postings. Move anyway?'))) return;
    }
    setParent(src, targetCode||undefined);
    load();
  };

  const renderNode = (n: ViewNode, level=0) => {
    const uc = subtreeUsage(n.code);
    const match = (n.code+' '+n.name).toLowerCase().includes(filter.toLowerCase());
    const hiddenByFilter = filter && !match;
    if (hiddenByFilter) return null;
    return (
      <div key={n.code} style={{ paddingLeft: level*16 }}>
        <div
          draggable
          onDragStart={(e)=>onDragStart(e, n.code)}
          onDragOver={onDragOver}
          onDrop={(e)=>onDrop(e, n.code)}
          onClick={()=>setSelected(n.code)}
          style={{ display:'grid', gridTemplateColumns:'20px 1fr auto', gap:8, alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', margin:'4px 0', background: selected===n.code? '#eef2ff' : '#fff' }}
        >
          <button onClick={(e)=>{ e.stopPropagation(); toggle(n.code); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', width:20, height:20, lineHeight:'18px', textAlign:'center' }}>
            {n.children?.length ? (n.expanded ? '−' : '+') : '•'}
          </button>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'monospace' }}>{n.code}</span>
            <span>{n.name}</span>
            <Badge text={n.is_postable? 'postable':'header'} tone={n.is_postable?'green':'slate'} />
            <Badge text={n.type} tone="violet" />
            <Badge text={t('Sử dụng','Used')+': '+uc} tone={uc>0?'amber':'slate'} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={(e)=>{ e.stopPropagation(); onDrop(e as any, undefined); }} title={t('Thả vào gốc','Drop to root')} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 8px', background:'#fff' }}>⇤ root</button>
            <a href={"#"} onClick={(e)=>{ e.preventDefault(); alert(t('Mở FIN‑02 (mock): ' , 'Open FIN‑02 (mock): ') + n.code); }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 8px', textDecoration:'none' }}>{t('Chi tiết','Detail')}</a>
          </div>
        </div>
        {n.expanded && (n.children||[]).map(c => renderNode(c as ViewNode, level+1))}
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'grid', gap:6 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ fontWeight:800 }}>{t('Cây tài khoản (kéo‑thả)','CoA Tree (drag‑drop)')}</div>
            <Badge text="FIN-03" />
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Kéo một dòng và thả lên dòng khác để đổi parent; thả vào nút "⇤ root" để đưa ra gốc.','Drag an item and drop onto another to re-parent; drop on "⇤ root" to move to root.')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Tìm mã/tên','Search code/name')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:260 }} />
          <button onClick={()=>expandAll(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Mở tất cả','Expand all')}</button>
          <button onClick={()=>expandAll(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thu tất cả','Collapse all')}</button>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#6b7280', fontSize:12 }}>
          {t('Mẹo: với tài khoản đã có phát sinh, đổi cấu trúc sẽ yêu cầu xác nhận. Hệ thống chỉ thay đổi parent_code, không đổi mã.','Tip: when an account has postings, moving its node requires confirmation. Only parent_code changes; code remains unchanged.')}
        </div>
        <div>
          <span style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng số tài khoản','Total accounts')}: </span><b>{flat.length}</b>
        </div>
      </div>

      {/* Tree */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, overflow:'auto' }} onDragOver={onDragOver} onDrop={(e)=>onDrop(e as any, undefined)}>
        {nodes.length===0 ? <div style={{ color:'#6b7280' }}>—</div> : nodes.map(n => renderNode(n))}
      </div>
    </div>
  );
};
