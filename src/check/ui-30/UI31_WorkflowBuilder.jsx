import React, { useEffect, useRef, useState } from 'react'
import { Card, Tag, Input, Select, Button } from '../../ui-helpers.jsx'

const defaultNodes = [
  { id: 'start', type: 'start', label: 'Start', x: 40, y: 40 },
  { id: 'val', type: 'task', label: 'Validate Input', x: 240, y: 40 },
  { id: 'branch', type: 'gateway', label: 'Approved?', x: 440, y: 40 },
  { id: 'appr', type: 'task', label: 'Create PO', x: 240, y: 180 },
  { id: 'rej', type: 'task', label: 'Notify Rejection', x: 440, y: 180 },
  { id: 'end', type: 'end', label: 'End', x: 640, y: 110 },
]

const initialEdges = [
  { id: 'e1', source: 'start', target: 'val' },
  { id: 'e2', source: 'val', target: 'branch' },
  { id: 'e3', source: 'branch', target: 'appr' },
  { id: 'e4', source: 'branch', target: 'rej' },
  { id: 'e5', source: 'appr', target: 'end' },
  { id: 'e6', source: 'rej', target: 'end' },
]

const NODE_SIZE = { w: 160, h: 64 }
const types = { start: 'bg-emerald-50 border-emerald-200', end: 'bg-slate-50 border-slate-200', task: 'bg-indigo-50 border-indigo-200', gateway: 'bg-amber-50 border-amber-200' }

function downloadJSON(name, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

function pushToLocalHistory(key, payload){
  try{ localStorage.setItem(key, JSON.stringify(payload)) }catch(e){/* ignore */}
}

function Toasts({ items, onClose }){
  return (
    <div className="fixed z-50 flex flex-col gap-2 right-4 bottom-4">
      {items.map(t => (
        <div key={t.id} className={`px-3 py-2 rounded-lg shadow-md text-sm ${t.tone==='error'? 'bg-rose-600 text-white': t.tone==='warn'? 'bg-amber-500 text-black':'bg-zinc-900 text-white'}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">{t.text}</div>
            <button onClick={()=> onClose(t.id)} className="opacity-80">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UI31_WorkflowBuilder(){
  const [nodes, setNodes] = useState(defaultNodes)
  const [edges, setEdges] = useState(initialEdges)
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({x:0,y:0})
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [toasts, setToasts] = useState([])
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  // new UI states: search, multi-select, error, autosave
  const [nodeQuery, setNodeQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState(null)
  const [autosave, setAutosave] = useState(false)

  // push initial snapshot to history
  useEffect(()=>{ pushHistory(nodes, edges) }, [])

  // keyboard shortcuts
  useEffect(()=>{
    const onKey = (e)=>{
      const mod = e.ctrlKey || e.metaKey
      if(mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo() }
      if((mod && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase()==='z')))){ e.preventDefault(); redo() }
      if(e.key === 'Delete' || e.key === 'Backspace'){ if(selected) { removeSelected(); } }
      if(e.key === 'Escape'){ setConnectMode(false); setConnectFrom(null); setSelected(null) }
      // additional shortcuts: save, load, export selected, bulk delete
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); saveMock() }
      if(e.key.toLowerCase() === 'r'){ loadMockLatest(); showToast('Load requested') }
      if(e.key.toLowerCase() === 'e'){ exportSelectedNodes() }
      if(e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')){ bulkDeleteSelected() }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [selected, history, future, nodes, edges, selectedIds])

  function pushHistory(n, e){
    setHistory(h => {
      const next = [...h, { nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) }]
      // limit history
      return next.slice(-50)
    })
    setFuture([])
  }

  function undo(){
    setHistory(h => {
      if(h.length <= 1) return h
      const last = h[h.length-1]
      const prev = h[h.length-2]
      setFuture(f => [last, ...f])
      setNodes(JSON.parse(JSON.stringify(prev.nodes)))
      setEdges(JSON.parse(JSON.stringify(prev.edges)))
      setSelected(null)
      return h.slice(0, h.length-1)
    })
  }

  function redo(){
    setFuture(f => {
      if(f.length === 0) return f
      const [next, ...rest] = f
      setNodes(JSON.parse(JSON.stringify(next.nodes)))
      setEdges(JSON.parse(JSON.stringify(next.edges)))
      setHistory(h => [...h, next])
      return rest
    })
  }

  // node dragging handlers
  function onNodeMouseDown(e, node){
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect()
    setDragging(node.id)
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
    setSelected(node)
  }

  function onCanvasMouseMove(e){
    if(!dragging) return
    const rect = containerRef.current.getBoundingClientRect()
    const nx = e.clientX - rect.left - dragOffset.x
    const ny = e.clientY - rect.top - dragOffset.y
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n))
  }

  function onCanvasMouseUp(){
    if(dragging){
      pushHistory(nodes, edges)
    }
    setDragging(null)
  }

  function addNode(){
    const id = 'node' + (Math.random().toString(36).slice(2,7))
    const newNode = { id, type: 'task', label: 'New Task', x: 120 + Math.random()*200, y: 120 + Math.random()*120 }
    const next = [...nodes, newNode]
    setNodes(next)
    pushHistory(next, edges)
    showToast('Node added')
  }

  function removeSelected(){
    if(!selected) return
    const nid = selected.id
    const nextNodes = nodes.filter(n => n.id !== nid)
    const nextEdges = edges.filter(e => e.source !== nid && e.target !== nid)
    setNodes(nextNodes); setEdges(nextEdges); setSelected(null)
    pushHistory(nextNodes, nextEdges)
    showToast('Node removed')
  }

  function startConnect(node){
    if(!connectMode){ setConnectMode(true); setConnectFrom(node.id); setSelected(node); showToast('Connect mode ON — select target node') ; return }
    if(connectFrom && connectFrom === node.id){ setConnectFrom(null); setConnectMode(false); showToast('Connect cancelled'); return }
    if(connectFrom){
      const id = 'e' + (Math.random().toString(36).slice(2,7))
      const next = [...edges, { id, source: connectFrom, target: node.id }]
      setEdges(next); setConnectFrom(null); setConnectMode(false); pushHistory(nodes, next)
      showToast('Edge created')
    }
  }

  function removeEdgeById(eid){
    const next = edges.filter(x=> x.id !== eid)
    setEdges(next); pushHistory(nodes, next); showToast('Edge removed')
  }

  function exportJSON(){
    downloadJSON('workflow-' + Date.now() + '.json', { nodes, edges })
    showToast('Exported workflow JSON')
  }

  function importJSONFile(file){
    const reader = new FileReader()
    reader.onload = (ev)=>{
      try{
        const obj = JSON.parse(ev.target.result)
        if(obj.nodes && obj.edges){ setNodes(obj.nodes); setEdges(obj.edges); pushHistory(obj.nodes, obj.edges); showToast('Imported workflow') }
        else showToast('Invalid workflow JSON', 'error')
      }catch(e){ showToast('Invalid JSON file', 'error') }
    }
    reader.readAsText(file)
  }

  function saveMock(){
    setLoading(true)
    setTimeout(()=>{
      try{
        const payload = { nodes, edges, savedAt: new Date().toISOString() }
        const list = JSON.parse(localStorage.getItem('workflows')||'[]')
        list.push(payload)
        localStorage.setItem('workflows', JSON.stringify(list))
        pushToLocalHistory('workflow_current', payload)
        showToast('Saved to localStorage (mock)')
        if(autosave) showToast('Autosave enabled — snapshot saved')
      }catch(e){ showToast('Save failed', 'error') }
      setLoading(false)
    }, 400)
  }

  function loadMockLatest(){
    setLoading(true); setError(null)
    setTimeout(()=>{
      try{
        const list = JSON.parse(localStorage.getItem('workflows')||'[]')
        if(list.length){ const latest = list[list.length-1]; setNodes(latest.nodes||[]); setEdges(latest.edges||[]); pushHistory(latest.nodes||[], latest.edges||[]) ; showToast('Loaded latest mock') }
        else { setError('No saved mock workflows'); showToast('No saved mock workflows','warn') }
      }catch(e){ setError('Load failed'); showToast('Load failed', 'error') }
      setLoading(false)
    }, 300)
  }

  function applyInspectorUpdates(changes){
    if(!selected) return
    const nid = selected.id
    const next = nodes.map(n => n.id === nid ? { ...n, ...changes } : n)
    setNodes(next)
    setSelected(next.find(n => n.id === nid))
    pushHistory(next, edges)
    showToast('Node updated')
  }

  function showToast(text, tone='default'){
    const id = Math.random().toString(36).slice(2,9)
    setToasts(t => [...t, { id, text, tone }])
    setTimeout(()=> setToasts(t => t.filter(x=> x.id !== id)), 5000)
  }

  // CSV helper (nodes)
  function downloadCSV(name, rows){
    const keys = Object.keys(rows[0]||{})
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k=> JSON.stringify(r[k]??'')).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  // node multi-select helpers
  function toggleSelectId(id){ setSelectedIds(s => s.includes(id) ? s.filter(x=> x!==id) : [...s, id]) }
  function clearSelectedIds(){ setSelectedIds([]) }
  function bulkDeleteSelected(){
    if(selectedIds.length === 0){ showToast('No nodes selected', 'warn'); return }
    const setIds = new Set(selectedIds)
    const nextNodes = nodes.filter(n => !setIds.has(n.id))
    const nextEdges = edges.filter(e => !setIds.has(e.source) && !setIds.has(e.target))
    setNodes(nextNodes); setEdges(nextEdges); setSelected(null); clearSelectedIds(); pushHistory(nextNodes, nextEdges)
    showToast(`Deleted ${selectedIds.length} nodes`, 'warn')
  }

  function exportSelectedNodes(){
    const sel = nodes.filter(n => selectedIds.includes(n.id))
    if(sel.length === 0){ showToast('No nodes selected', 'warn'); return }
    downloadJSON('nodes-selected.json', sel)
    downloadCSV('nodes-selected.csv', sel)
    showToast(`Exported ${sel.length} nodes`)
  }

  // render helpers
  function getNodeCenter(n){ return { x: n.x + NODE_SIZE.w/2, y: n.y + NODE_SIZE.h/2 } }
  function findNode(id){ return nodes.find(n=>n.id===id) }
  const canUndo = history.length > 1
  const canRedo = future.length > 0

  // curve path helper
  function pathFor(a, b){
    const mx = (a.x + b.x) / 2
    return `M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`
  }

  return (
    <div className="p-5 space-y-4">
      <Toasts items={toasts} onClose={(id)=> setToasts(t => t.filter(x=> x.id !== id))} />

      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">UI31 · Workflow Builder (mock canvas)</div>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={addNode}>+ Node</Button>
          <Button onClick={()=>{ setConnectMode(m=>!m); setConnectFrom(null)}} className={connectMode? 'ring-2 ring-amber-300':''}>{connectMode? 'Connecting...' : 'Connect'}</Button>
          <Button onClick={undo} disabled={!canUndo}>Undo</Button>
          <Button onClick={redo} disabled={!canRedo}>Redo</Button>
          <Button variant="primary" onClick={saveMock} disabled={loading}>{loading? 'Saving...':'Save'}</Button>
          <Button onClick={exportJSON}>Export</Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e)=>{ if(e.target.files && e.target.files[0]) importJSONFile(e.target.files[0]) }} />
          <Button onClick={()=>fileInputRef.current?.click()}>Import</Button>
          <Button onClick={loadMockLatest}>Load latest</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9">
          <Card title="Canvas" subtitle={connectMode? `Click nodes to connect (from: ${connectFrom||'—'})` : 'Drag nodes to reposition'}>
            <div
              ref={containerRef}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
              onDoubleClick={(e)=>{
                // add node at click
                const rect = containerRef.current.getBoundingClientRect()
                const id = 'node' + (Math.random().toString(36).slice(2,7))
                const nx = e.clientX - rect.left
                const ny = e.clientY - rect.top
                const next = [...nodes, { id, type:'task', label:'New Node', x: nx, y: ny }]
                setNodes(next); pushHistory(next, edges); showToast('Node added')
              }}
              onClick={(e)=>{ if(e.target === containerRef.current) setSelected(null) }}
              className="relative bg-white rounded-2xl border p-3 h-[520px] overflow-hidden"
              style={{ minHeight: 420 }}
            >
              {/* SVG edges with arrowheads */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
                  </marker>
                </defs>
                {edges.map(ed => {
                  const s = findNode(ed.source); const t = findNode(ed.target)
                  if(!s || !t) return null
                  const a = getNodeCenter(s); const b = getNodeCenter(t)
                  const d = pathFor(a,b)
                  return <path key={ed.id} d={d} stroke="#64748b" strokeWidth={2} fill="none" markerEnd="url(#arrow)" />
                })}
                {connectMode && connectFrom && (()=>{
                  const from = findNode(connectFrom); if(!from) return null
                  const c = getNodeCenter(from); return <circle cx={c.x} cy={c.y} r={6} fill="#f59e0b" />
                })()}
              </svg>

              {/* nodes */}
              {nodes.map(n => (
                <div
                  key={n.id}
                  onMouseDown={(e)=> onNodeMouseDown(e, n)}
                  onDoubleClick={(e)=>{ e.stopPropagation(); setSelected(n) }}
                  onClick={(e)=>{ e.stopPropagation(); if(connectMode) startConnect(n); else setSelected(n) }}
                  className={`absolute rounded-2xl border p-3 text-sm shadow-sm cursor-move ${types[n.type]}`}
                  style={{ left: n.x, top: n.y, width: NODE_SIZE.w, height: NODE_SIZE.h, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">{n.type}</div>
                  <div className="font-medium truncate">{n.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">{n.id}</div>
                </div>
              ))}

            </div>
          </Card>
        </div>

        <div className="col-span-3 space-y-3">
          <Card title="Inspector" subtitle={selected? selected.id : '—'} actions={selected && <Tag tone="indigo">{selected.type}</Tag>}>
            {selected ? (
              <div className="space-y-2 text-sm">
                <div>
                  <div className="mb-1 text-xs text-neutral-500">Label</div>
                  <Input value={selected.label} onChange={e=> setSelected({...selected, label: e.target.value})} />
                </div>
                <div>
                  <div className="mb-1 text-xs text-neutral-500">Type</div>
                  <Select value={selected.type} onChange={e=> setSelected({...selected, type: e.target.value})}>
                    <option value="start">start</option>
                    <option value="task">task</option>
                    <option value="gateway">gateway</option>
                    <option value="end">end</option>
                  </Select>
                </div>

                <div>
                  <div className="mb-1 text-xs text-neutral-500">Position</div>
                  <div className="flex gap-2">
                    <Input type="number" value={Math.round(selected.x)} onChange={e=> setSelected({...selected, x: Number(e.target.value)})} />
                    <Input type="number" value={Math.round(selected.y)} onChange={e=> setSelected({...selected, y: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={()=>{ applyInspectorUpdates({ label: selected.label, type: selected.type, x: Number(selected.x), y: Number(selected.y) }) }}>Apply</Button>
                  <Button onClick={()=>{ setSelected(null) }}>Close</Button>
                </div>

                <div className="mt-2 text-xs text-neutral-500">Tips: Double-click canvas to add node. Click Connect then two nodes to create edge. Use Ctrl/Cmd+Z to undo.</div>
              </div>
            ) : <div className="text-sm text-neutral-500">Chọn 1 node để chỉnh sửa.</div>}
          </Card>

          <Card title="Nodes" subtitle="Search & bulk actions">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Input placeholder="Tìm nodes..." value={nodeQuery} onChange={e=> setNodeQuery(e.target.value)} />
                <button onClick={()=> { setAutosave(a=>!a); showToast(`Autosave ${!autosave ? 'ON' : 'OFF'}`) }} className="px-2 py-1 border rounded">{autosave? 'Autosave: ON' : 'Autosave: OFF'}</button>
              </div>
              <div className="flex gap-2">
                <button onClick={bulkDeleteSelected} className="px-2 py-1 border rounded">Delete selected</button>
                <button onClick={exportSelectedNodes} className="px-2 py-1 border rounded">Export selected</button>
                <button onClick={()=> { clearSelectedIds(); showToast('Selection cleared') }} className="px-2 py-1 border rounded">Clear</button>
              </div>
              <ul className="mt-2 space-y-1 overflow-auto max-h-44">
                {nodes.filter(n=> !nodeQuery || n.name?.toLowerCase()?.includes(nodeQuery.toLowerCase()) || n.label?.toLowerCase()?.includes(nodeQuery.toLowerCase()) || n.id.toLowerCase().includes(nodeQuery.toLowerCase())).map(n => (
                  <li key={n.id} className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedIds.includes(n.id)} onChange={()=> toggleSelectId(n.id)} />
                      <div className="text-sm">{n.label} <span className="ml-1 text-xs text-neutral-400">{n.id}</span></div>
                    </label>
                    <div className="flex gap-2">
                      <Button onClick={()=> { setSelected(n); showToast('Selected '+n.label) }} >Edit</Button>
                      <Button onClick={()=> { setNodes(prev => prev.filter(x=> x.id !== n.id)); setEdges(prev => prev.filter(e=> e.source !== n.id && e.target !== n.id)); pushHistory(nodes.filter(x=> x.id !== n.id), edges.filter(e=> e.source !== n.id && e.target !== n.id)); showToast('Deleted '+n.label,'warn') }}>Del</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Edges" subtitle="Connections">
            <div className="text-sm">
              <ul className="space-y-2 overflow-auto max-h-48">
                {edges.map(ed => (
                  <li key={ed.id} className="flex items-center justify-between">
                    <div className="text-sm">{ed.source} → {ed.target}</div>
                    <div className="flex gap-2">
                      <Button onClick={()=> removeEdgeById(ed.id) }>Remove</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Workflow JSON">
            <div className="text-sm">
              <Button onClick={exportJSON}>Download JSON</Button>
              <Button onClick={()=>{ const obj = { nodes, edges }; downloadJSON('workflow-snapshot.json', obj); showToast('Snapshot downloaded') }}>Snapshot</Button>
              <div className="mt-2 text-xs text-neutral-500">Mock save loads to localStorage. Use Load latest to restore.</div>
              {error && (
                <div className="mt-2 text-sm text-rose-600">{error} <button onClick={loadMockLatest} className="ml-2 underline">Retry</button></div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
