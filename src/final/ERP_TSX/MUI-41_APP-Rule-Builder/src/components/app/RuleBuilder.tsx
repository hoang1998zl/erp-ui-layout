// src/components/app/RuleBuilder.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getRuleTree, saveRuleTree, seedIfEmpty, evaluate, newPredicate, newGroup, type RuleNode, type Group, type Predicate } from '../../mock/rules';

type NodePath = string[]; // array of ids from root to node

function findNode(tree: RuleNode, id: string, path: string[] = []): { node: RuleNode | null, path: string[] } {
  if ((tree as any).id === id) return { node: tree, path: [...path, id] };
  if (tree.kind === 'group') {
    for (const ch of (tree as Group).children) {
      const res = findNode(ch, id, [...path, (tree as any).id]);
      if (res.node) return res;
    }
  }
  return { node: null, path: [] };
}
function updateNode(tree: RuleNode, id: string, updater: (n: RuleNode) => RuleNode): RuleNode {
  if ((tree as any).id === id) return updater(tree);
  if (tree.kind === 'group') {
    return { ...(tree as Group), children: (tree as Group).children.map(ch => updateNode(ch, id, updater)) } as Group;
  }
  return tree;
}
function removeNode(tree: RuleNode, id: string): RuleNode {
  if ((tree as any).id === id) return tree; // caller must handle root delete
  if (tree.kind === 'group') {
    const g = tree as Group;
    const next = { ...g, children: g.children.filter(ch => (ch as any).id !== id).map(ch => removeNode(ch, id)) };
    return next;
  }
  return tree;
}
function insertChild(tree: RuleNode, parentId: string, child: RuleNode): RuleNode {
  if ((tree as any).id === parentId && tree.kind === 'group') {
    const g = tree as Group;
    return { ...g, children: [...g.children, child] };
  }
  if (tree.kind === 'group') {
    return { ...(tree as Group), children: (tree as Group).children.map(ch => insertChild(ch, parentId, child)) } as Group;
  }
  return tree;
}
function moveChild(tree: RuleNode, parentId: string, childId: string, dir: -1 | 1): RuleNode {
  if ((tree as any).id === parentId && tree.kind === 'group') {
    const g = tree as Group;
    const idx = g.children.findIndex(ch => (ch as any).id === childId);
    if (idx<0) return tree;
    const j = idx + dir;
    if (j<0 || j>=g.children.length) return tree;
    const arr = g.children.slice();
    const [x] = arr.splice(idx,1); arr.splice(j,0,x);
    return { ...g, children: arr };
  }
  if (tree.kind==='group') {
    return { ...(tree as Group), children: (tree as Group).children.map(ch => moveChild(ch, parentId, childId, dir)) } as Group;
  }
  return tree;
}

function Chip({ text }: { text:string }) {
  return <span style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'0 8px', fontSize:12, background:'#f9fafb' }}>{text}</span>;
}

export const RuleBuilder: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [tree, setTree] = useState<RuleNode | null>(null);
  const [payloadText, setPayloadText] = useState<string>(JSON.stringify({ total: 6000000, requester:{ department:'IT' } }, null, 2));
  const [evalRes, setEvalRes] = useState<any>(null);

  useEffect(()=>{ seedIfEmpty(); setTree(getRuleTree()); }, []);

  const onChangeRootLogic = (logic: 'all'|'any'|'none') => {
    if (!tree || tree.kind!=='group') return;
    setTree({ ...(tree as Group), logic });
  };

  const onAddChild = (parentId: string, kind: 'predicate'|'group') => {
    if (!tree) return;
    const child = kind==='predicate' ? newPredicate() : newGroup('all');
    setTree(insertChild(tree, parentId, child));
  };

  const onRemove = (id: string, parentId?: string) => {
    if (!tree) return;
    if ((tree as any).id === id) return; // do not remove root
    setTree(removeNode(tree, id));
  };

  const onMove = (parentId: string, childId: string, dir: -1|1) => {
    if (!tree) return; setTree(moveChild(tree, parentId, childId, dir));
  };

  const onSave = () => { if (!tree) return; saveRuleTree(tree); alert(t('Đã lưu rule JSON','Rule JSON saved')); };

  const runEval = () => {
    if (!tree) return;
    try {
      const payload = JSON.parse(payloadText);
      setEvalRes(evaluate(tree, payload));
    } catch {
      alert('Invalid JSON payload');
    }
  };

  const NodeEditor: React.FC<{ node: RuleNode; parent?: Group | null }> = ({ node, parent }) => {
    if (node.kind==='group') {
      const g = node as Group;
      return (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:8, background:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <strong>{t('Nhóm','Group')}</strong>
              <select value={g.logic} onChange={e=>setTree(updateNode(tree!, g.id, n => ({ ...(n as Group), logic: e.target.value as any }))) } style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
                <option value="all">{t('ALL (AND)','ALL (AND)')}</option>
                <option value="any">{t('ANY (OR)','ANY (OR)')}</option>
                <option value="none">{t('NONE (NOT any)','NONE (NOT any)')}</option>
              </select>
              <Chip text={`${g.children.length} ${t('điều kiện','conditions')}`} />
            </div>
            {parent && <button onClick={()=>onRemove(g.id, parent.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>}
          </div>
          <div style={{ marginTop:8, display:'grid', gap:8 }}>
            {g.children.map((ch, idx) => (
              <div key={(ch as any).id} style={{ borderLeft:'3px solid #e5e7eb', paddingLeft:8 }}>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:6, marginBottom:4 }}>
                  <button onClick={()=>onMove(g.id, (ch as any).id, -1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↑</button>
                  <button onClick={()=>onMove(g.id, (ch as any).id, 1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'2px 6px', background:'#fff' }}>↓</button>
                </div>
                <NodeEditor node={ch} parent={g} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>onAddChild(g.id, 'predicate')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Điều kiện','Predicate')}</button>
              <button onClick={()=>onAddChild(g.id, 'group')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>＋ {t('Nhóm','Group')}</button>
            </div>
          </div>
        </div>
      );
    } else {
      const p = node as Predicate;
      const setP = (patch: Partial<Predicate>) => setTree(updateNode(tree!, p.id, n => ({ ...(n as Predicate), ...patch })));
      const operatorList = ['eq','neq','gt','lt','gte','lte','in','contains','startsWith','endsWith','between','exists','notexists'];
      const vtList = ['string','number','boolean','date'];
      return (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:8, background:'#f9fafb' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr 1fr 1fr auto', gap:8, alignItems:'center' }}>
            <input value={p.field} onChange={e=>setP({ field: e.target.value })} placeholder={t('Trường (ví dụ: total, requester.department)','Field (e.g., total, requester.department)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }} />
            <select value={p.op} onChange={e=>setP({ op: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
              {operatorList.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <select value={p.valueType||'string'} onChange={e=>setP({ valueType: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
              {vtList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {(p.op==='between') ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <input defaultValue={String(p.value??'')} onBlur={e=>setP({ value: e.target.value })} placeholder={t('Từ','From')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }} />
                <input defaultValue={String(p.value2??'')} onBlur={e=>setP({ value2: e.target.value })} placeholder={t('Đến','To')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }} />
              </div>
            ) : (p.op==='exists'||p.op==='notexists') ? (
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Không cần giá trị','No value required')}</div>
            ) : (
              <input defaultValue={Array.isArray(p.value)? JSON.stringify(p.value) : String(p.value??'')} onBlur={e=>{
                let v:any = e.target.value;
                if (p.op==='in') {
                  try { const arr = JSON.parse(v); if (Array.isArray(arr)) v = arr; else throw new Error('x'); }
                  catch { v = v.split(',').map(s=>s.trim()).filter(Boolean); }
                }
                setP({ value: v });
              }} placeholder={t('Giá trị (VD: 5000000 hoặc A,B,C)','Value (e.g., 5000000 or A,B,C)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }} />
            )}
            {parent && <button onClick={()=>onRemove(p.id, parent.id)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'4px 8px', background:'#fff' }}>✕</button>}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>{t('Trình tạo rule điều kiện (IF/THEN)','Conditional rule builder (IF/THEN)')}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('JSON rules — dùng chung cho Workflow (APP‑01)','JSON rules — shared with Workflow (APP‑01)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={()=>{ seedIfEmpty(); setTree(getRuleTree()); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Nạp mẫu','Load sample')}</button>
          <button onClick={()=>{ const txt = prompt('Paste rule JSON'); if (txt) { try { const obj = JSON.parse(txt); saveRuleTree(obj); setTree(obj); } catch { alert('Invalid JSON'); } } }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Import</button>
          <button onClick={()=>{ const blob = new Blob([JSON.stringify(tree,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='rule.json'; a.click(); URL.revokeObjectURL(url); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
          <button onClick={onSave} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Lưu','Save')}</button>
        </div>
      </div>

      {/* Body: left editor, right JSON + test */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Editor */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8 }}>
          {!tree ? <div style={{ color:'#6b7280' }}>—</div> :
            <>
              {tree.kind==='group' ? (
                <div style={{ marginBottom:6 }}>
                  <label style={{ fontSize:12, color:'#6b7280' }}>{t('Logic gốc','Root logic')}</label>{' '}
                  <select value={(tree as Group).logic} onChange={e=>onChangeRootLogic(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px' }}>
                    <option value="all">{t('ALL (AND)','ALL (AND)')}</option>
                    <option value="any">{t('ANY (OR)','ANY (OR)')}</option>
                    <option value="none">{t('NONE (NOT any)','NONE (NOT any)')}</option>
                  </select>
                </div>
              ) : null}
              <NodeEditor node={tree} parent={null} />
            </>
          }
        </div>

        {/* JSON + Test */}
        <div style={{ display:'grid', gridTemplateRows:'1fr auto 1fr auto', gap:8 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Rule JSON','Rule JSON')}</div>
            <pre style={{ margin:0, padding:10, overflow:'auto' }}>{tree ? JSON.stringify(tree, null, 2) : '—'}</pre>
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Gợi ý: dùng rule này làm entryCondition phức tạp trong Workflow (APP‑01).','Tip: use this rule as complex entryCondition in Workflow (APP‑01).')}</div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Kiểm thử với payload','Test with payload')}</div>
            <textarea value={payloadText} onChange={e=>setPayloadText(e.target.value)} style={{ width:'100%', border:'none', outline:'none', padding:10, minHeight:180, fontFamily:'monospace' }}></textarea>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button onClick={runEval} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px' }}>{t('Chạy evaluate','Run evaluate')}</button>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Kiểm tra AND/OR/NOT và toán tử so sánh','Validates AND/OR/NOT and comparators')}</div>
            </div>
          </div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>{t('Kết quả evaluate','Evaluate result')}</div>
            <div style={{ padding:10, overflow:'auto' }}>
              {!evalRes ? <div style={{ color:'#6b7280' }}>—</div> :
                <>
                  <div style={{ marginBottom:8 }}>
                    {evalRes.ok ? <span style={{ color:'#16a34a', fontWeight:700 }}>TRUE</span> : <span style={{ color:'#ef4444', fontWeight:700 }}>FALSE</span>}
                  </div>
                  <pre style={{ margin:0 }}>{JSON.stringify(evalRes.logs, null, 2)}</pre>
                </>
              }
            </div>
            <div style={{ padding:'6px 10px', borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
              {t('Logs hiển thị cách từng node được đánh giá.','Logs show how each node was evaluated.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
