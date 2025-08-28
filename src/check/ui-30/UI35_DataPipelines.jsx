import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Card, Input, Select, Button, Tag } from '../../ui-helpers.jsx'

export default function UI35_DataPipelines(){
  const STORAGE_KEY = 'data_pipelines_v1'
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [toasts, setToasts] = useState([])
  const [pollEnabled, setPollEnabled] = useState(false)
  const [drawer, setDrawer] = useState(null) // pipeline object for detail panel
  const [editing, setEditing] = useState(null) // pipeline being edited in form
  const importRef = useRef(null)

  // helper: toasts
  function showToast(text, tone='default'){ const id = Math.random().toString(36).slice(2,9); setToasts(t => [...t, { id, text, tone }]); setTimeout(()=> setToasts(t=> t.filter(x=> x.id !== id)), 4500); }
  function Toasts({ items, onClose }){ return (
    <div className="fixed z-50 flex flex-col gap-2 right-4 bottom-4">
      {items.map(t => (
        <div key={t.id} className={`px-3 py-2 rounded-lg shadow-md text-sm ${t.tone==='error'? 'bg-rose-600 text-white': t.tone==='warn'? 'bg-amber-500 text-black':'bg-zinc-900 text-white'}`}>
          <div className="flex items-start gap-3"><div className="flex-1">{t.text}</div><button onClick={()=> onClose(t.id)} className="opacity-80">✕</button></div>
        </div>
      ))}
    </div>
  ) }

  // utils for import/export
  function downloadJSON(name, data){ const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
  function downloadCSV(name, rows){ if(!rows || rows.length===0){ showToast('No data to export','warn'); return } const keys = Object.keys(rows[0]); const csv = [keys.join(',')].concat(rows.map(r => keys.map(k=> JSON.stringify(r[k]??'')).join(','))).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

  // mock fetch
  function fetchPipelines(){ setLoading(true); setError(null); setTimeout(()=>{
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw){ setPipelines(JSON.parse(raw)) }
      else {
        const now = new Date().toISOString()
        const seed = Array.from({length:10}).map((_,i)=>({ id: `PL-${String(i+101).padStart(3,'0')}`, name: `Pipeline ${i+1}`, status: i%3===0? 'running': i%3===1? 'failed': 'idle', steps: 3 + (i%4), owner: `team-${(i%4)+1}`, updatedAt: now }))
        setPipelines(seed); localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      }
      showToast('Pipelines loaded')
    }catch(e){ setError('Failed to load pipelines'); showToast('Failed to load pipelines','error') }
    setLoading(false)
  }, 400) }

  useEffect(()=>{ fetchPipelines() }, [])

  // polling mock updates
  useEffect(()=>{
    if(!pollEnabled) return;
    const id = setInterval(()=>{
      setPipelines(prev => {
        if(prev.length===0) return prev;
        const idx = Math.floor(Math.random()*prev.length);
        const next = prev.map((p,i)=> i===idx ? {...p, updatedAt: new Date().toISOString(), status: p.status==='failed'?'running': p.status} : p)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }, 5000)
    return ()=> clearInterval(id)
  }, [pollEnabled])

  // debounce search
  useEffect(()=>{ const t = setTimeout(()=> setDebounced(search.trim()), 250); return ()=> clearTimeout(t) }, [search])

  // derived data: filter, sort, paginate
  const filtered = useMemo(()=> pipelines.filter(p => !debounced || p.name.toLowerCase().includes(debounced.toLowerCase()) || (p.id||'').toLowerCase().includes(debounced.toLowerCase()) ), [pipelines, debounced])
  const sorted = useMemo(()=> { const arr = [...filtered]; arr.sort((a,b)=>{ const A = (a[sortBy]||'').toString(); const B = (b[sortBy]||'').toString(); return sortDir==='asc' ? A.localeCompare(B) : B.localeCompare(A) }); return arr }, [filtered, sortBy, sortDir])
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(()=>{ if(page > totalPages) setPage(1) }, [totalPages])
  const pageItems = sorted.slice((page-1)*pageSize, page*pageSize)

  // selection helpers
  function toggleSelect(id){ setSelectedIds(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]) }
  function selectAllOnPage(){ setSelectedIds(p => Array.from(new Set([...p, ...pageItems.map(x=>x.id)]))) }
  function clearSelection(){ setSelectedIds([]) }

  // actions
  function deleteSelected(){ if(selectedIds.length===0){ showToast('No pipelines selected','warn'); return } if(!confirm(`Delete ${selectedIds.length} pipelines?`)) return; const setIds = new Set(selectedIds); setPipelines(prev => { const next = prev.filter(p => !setIds.has(p.id)); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next }); setSelectedIds([]); showToast(`Deleted ${selectedIds.length} pipelines`,'warn') }

  function retryPipeline(id){ showToast(`Retrying ${id} (mock)`);
    setPipelines(prev => { const next = prev.map(p => p.id===id? {...p, status:'running', updatedAt: new Date().toISOString()} : p ); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next }) }

  function bulkRetry(){ if(selectedIds.length===0){ showToast('No pipelines selected','warn'); return } showToast(`Retrying ${selectedIds.length} pipelines (mock)`); setPipelines(prev=>{ const setIds = new Set(selectedIds); const next = prev.map(p=> setIds.has(p.id)? {...p, status:'running', updatedAt: new Date().toISOString()} : p); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next }); setSelectedIds([]) }

  function savePipeline(p){ setPipelines(prev => {
    const exists = prev.some(x=> x.id===p.id)
    let next;
    if(exists){ next = prev.map(x=> x.id===p.id? {...p, updatedAt: new Date().toISOString()} : x) }
    else { next = [{...p, id: p.id || 'PL-'+Math.random().toString(36).slice(2,6).toUpperCase(), updatedAt: new Date().toISOString()}, ...prev] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next
  }); showToast('Saved pipeline') }

  function importFile(file){ const reader = new FileReader(); reader.onload = (ev)=>{ try{ const data = JSON.parse(ev.target.result); if(Array.isArray(data)){ const next = [...data, ...pipelines]; setPipelines(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); showToast('Imported pipelines') } else showToast('Invalid import format','error') }catch(e){ showToast('Invalid JSON','error') } }; reader.readAsText(file) }

  // export selected
  function exportSelectedJSON(){ const sel = pipelines.filter(p=> selectedIds.includes(p.id)); if(sel.length===0){ showToast('No selection','warn'); return } downloadJSON('pipelines_selected.json', sel); showToast('Exported selected JSON') }
  function exportSelectedCSV(){ const sel = pipelines.filter(p=> selectedIds.includes(p.id)); if(sel.length===0){ showToast('No selection','warn'); return } downloadCSV('pipelines_selected.csv', sel); showToast('Exported selected CSV') }

  // keyboard shortcut: Ctrl/Cmd+S to save open editing pipeline
  useEffect(()=>{
    const onKey = (e)=>{
      // save
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ if(editing){ e.preventDefault(); savePipeline(editing) } }
      // select page
      if((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase()==='a'){ e.preventDefault(); selectAllOnPage(); showToast('Selected page') }
      // delete selection
      if(e.key === 'Delete'){ deleteSelected() }
      // export selected: Ctrl/Cmd+Shift+E
      if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='e'){ e.preventDefault(); exportSelectedJSON() }
    }
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey)
  }, [editing, pipelines, selectedIds])

  return (
    <div className="relative p-5 space-y-4">
      <Toasts items={toasts} onClose={(id)=> setToasts(t => t.filter(x=> x.id !== id))} />

      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">UI35 · Data Pipelines</div>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={()=> { const p = { name: 'New Pipeline', status: 'idle', steps: 3, owner: 'team-1' }; setEditing(p); setDrawer(p); showToast('Creating new pipeline') }}>New</Button>
          <Button onClick={()=> importRef.current?.click() }>Import</Button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={e=> e.target.files?.[0] && importFile(e.target.files[0])} />
          <Button onClick={()=> { downloadJSON('pipelines.json', pipelines); showToast('Exported JSON') }}>Export JSON</Button>
          <Button onClick={()=> { downloadCSV('pipelines.csv', pipelines); showToast('Exported CSV') }}>Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-3">
          <Card title="Pipelines">
            <div className="flex items-center gap-2 mb-3">
              <Input placeholder="Search pipeline..." value={search} onChange={e=> { setSearch(e.target.value); setPage(1) }} />
              <Select value={sortBy} onChange={e=> setSortBy(e.target.value)}>
                <option value="updatedAt">Updated</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="owner">Owner</option>
              </Select>
              <button onClick={()=> setSortDir(d=> d==='asc'?'desc':'asc')} className="px-2 py-1 border rounded">{sortDir==='asc'?'↑':'↓'}</button>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            ) : error ? (
              <div className="text-sm text-rose-600">{error} <button onClick={fetchPipelines} className="ml-2 underline">Retry</button></div>
            ) : (
              <div>
                <ul className="space-y-2 overflow-auto max-h-72">
                  {pageItems.map(p => (
                    <li key={p.id} className="flex items-center justify-between px-2 py-2 rounded hover:bg-neutral-50">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={()=> toggleSelect(p.id)} />
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-neutral-400">{p.id} · {new Date(p.updatedAt).toLocaleString()}</div>
                        </div>
                      </label>

                      <div className="flex items-center gap-2">
                        <Tag>{p.status}</Tag>
                        <Button onClick={()=> { setDrawer(p); setEditing(p); showToast('Opened detail') }}>Open</Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button onClick={selectAllOnPage}>Select page</Button>
                    <Button onClick={clearSelection} className="border">Clear</Button>
                    <Button onClick={deleteSelected} className="border">Delete</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=> setPage(p=> Math.max(1, p-1))} className="px-2 py-1 border rounded">Prev</button>
                    <span className="text-sm">{page} / {totalPages}</span>
                    <button onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="px-2 py-1 border rounded">Next</button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Quick Actions">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Button onClick={()=> { setPipelines(prev => { const next = prev.map(p => ({...p, status: 'paused'})); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next }); showToast('All set to paused') }}>Pause All (mock)</Button>
                <Button onClick={()=> { fetchPipelines(); showToast('Refreshed') }}>Refresh</Button>
                <Button onClick={()=> exportSelectedJSON() }>Export Selected JSON</Button>
                <Button onClick={()=> exportSelectedCSV() }>Export Selected CSV</Button>
                <Button onClick={()=> { bulkRetry() }} className="border">Bulk Retry</Button>
                <Button onClick={()=> setPollEnabled(p=> !p)} className={pollEnabled? 'border bg-green-50':'border'}>{pollEnabled? 'Polling: ON':'Polling: OFF'}</Button>
              </div>
              <div className="text-xs text-neutral-500">Tip: Open a pipeline to edit details — press Ctrl/Cmd+S to save. Ctrl/Cmd+A to select page. Del to delete selection. Ctrl/Cmd+Shift+E export selected.</div>
            </div>
          </Card>
        </div>

        <div className="relative col-span-7 space-y-3">
          <Card title="Overview">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 border rounded">Total <div className="text-lg font-semibold">{pipelines.length}</div></div>
              <div className="p-3 border rounded">Running <div className="text-lg font-semibold">{pipelines.filter(p=>p.status==='running').length}</div></div>
              <div className="p-3 border rounded">Failed <div className="text-lg font-semibold">{pipelines.filter(p=>p.status==='failed').length}</div></div>
            </div>
          </Card>

          <Card title="Pipeline Editor / Detail">
            {drawer ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-sm">ID: {editing?.id || '—'}</div>
                  <div className="mb-2 text-xs text-neutral-500">Name</div>
                  <Input value={editing?.name||''} onChange={e=> setEditing(prev => ({...(prev||{}), name: e.target.value}))} />

                  <div className="mt-2 text-xs text-neutral-500">Owner</div>
                  <Input value={editing?.owner||''} onChange={e=> setEditing(prev => ({...(prev||{}), owner: e.target.value}))} />

                  <div className="mt-2 text-xs text-neutral-500">Status</div>
                  <Select value={editing?.status||'idle'} onChange={e=> setEditing(prev => ({...(prev||{}), status: e.target.value}))}>
                    <option value="idle">idle</option>
                    <option value="running">running</option>
                    <option value="failed">failed</option>
                    <option value="paused">paused</option>
                  </Select>

                  <div className="mt-2 text-xs text-neutral-500">Steps</div>
                  <Input type="number" value={editing?.steps||0} onChange={e=> setEditing(prev => ({...(prev||{}), steps: Number(e.target.value)}))} />

                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="primary" onClick={()=> { savePipeline(editing); setDrawer(null) }}>Save</Button>
                    <Button onClick={()=> { setDrawer(null); setEditing(null) }}>Close</Button>
                    <Button onClick={()=> { retryPipeline(editing.id) }} className="border">Retry</Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs text-neutral-500">Recent runs (mock)</div>
                  <ul className="space-y-2">
                    {Array.from({length:3}).map((_,i)=> (
                      <li key={i} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm">Run #{i+1}</div>
                        <div className="text-xs text-neutral-400">{new Date(Date.now() - i*60000).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Select a pipeline to view details or create a new one.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
