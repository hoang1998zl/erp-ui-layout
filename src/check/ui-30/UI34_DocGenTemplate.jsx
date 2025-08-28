import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, Tag, Input, Select, Button } from '../../ui-helpers.jsx'

export default function UI34_DocGenTemplate(){
  const [vars, setVars] = useState({ vendor:'Công ty ABC', amount: 120000000, date:'2025-08-21' })
  const [tpl, setTpl] = useState('Hợp đồng với {{vendor}} trị giá {{amount}} VND, ngày {{date}}.')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [toasts, setToasts] = useState([])
  const [autosave, setAutosave] = useState(false)
  const fileRef = useRef(null)

  const render = ()=> tpl.replace(/{{(\w+)}}/g, (_,k)=> String(vars[k]??''))

  // Toast helper
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

  // helpers
  function downloadJSON(name, data){ const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
  function downloadCSV(name, rows){ const keys = Object.keys(rows[0]||{}); const csv = [keys.join(',')].concat(rows.map(r => keys.map(k=> JSON.stringify(r[k]??'')).join(','))).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

  // mock load templates
  function fetchTemplates(){ setLoading(true); setError(null); setTimeout(()=>{
    try{
      const raw = localStorage.getItem('doc_templates_v1')
      if(raw){ setTemplates(JSON.parse(raw)) }
      else {
        // seed with default
        const seed = [
          { id: 'T-001', name: 'Hợp đồng mua bán', tpl: tpl, vars, updatedAt: new Date().toISOString() },
          { id: 'T-002', name: 'Thư mời báo giá', tpl: tpl.replace('Hợp đồng','Thư mời'), vars, updatedAt: new Date().toISOString() }
        ]
        setTemplates(seed); localStorage.setItem('doc_templates_v1', JSON.stringify(seed))
      }
      showToast('Templates loaded')
    }catch(e){ setError('Failed to load templates'); showToast('Failed to load templates','error') }
    setLoading(false)
  }, 500) }

  useEffect(()=>{ fetchTemplates() }, [])

  // keyboard shortcut: Ctrl/Cmd+S save current as template
  useEffect(()=>{
    const onKey = (e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); saveAsTemplate() } }
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey)
  }, [tpl, vars, templates])

  function saveAsTemplate(){ const id = 'T-' + (Math.random().toString(36).slice(2,6)).toUpperCase(); const t = { id, name: 'Template ' + id, tpl, vars, updatedAt: new Date().toISOString() }; const next = [t, ...templates]; setTemplates(next); localStorage.setItem('doc_templates_v1', JSON.stringify(next)); showToast('Template saved') }

  function deleteSelected(){ if(selectedIds.length===0){ showToast('No templates selected','warn'); return } const setIds = new Set(selectedIds); const next = templates.filter(t => !setIds.has(t.id)); setTemplates(next); localStorage.setItem('doc_templates_v1', JSON.stringify(next)); setSelectedIds([]); showToast(`Deleted ${selectedIds.length} templates`,'warn') }

  function importJSONFile(file){ const reader = new FileReader(); reader.onload = (ev)=>{ try{ const data = JSON.parse(ev.target.result); if(Array.isArray(data)){ const next = [...data, ...templates]; setTemplates(next); localStorage.setItem('doc_templates_v1', JSON.stringify(next)); showToast('Imported templates') } else showToast('Invalid import format','error') }catch(e){ showToast('Invalid JSON','error') } }; reader.readAsText(file) }

  // filtering & pagination
  const filtered = useMemo(()=> templates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())), [templates, search])
  const sorted = useMemo(()=> { const arr = [...filtered]; arr.sort((a,b)=> sortDir==='asc' ? (a[sortBy]||'').localeCompare(b[sortBy]||'') : (b[sortBy]||'').localeCompare(a[sortBy]||'')); return arr }, [filtered, sortBy, sortDir])
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(()=>{ if(page > totalPages) setPage(1) }, [totalPages])
  const pageItems = sorted.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-5 space-y-4">
      <Toasts items={toasts} onClose={(id)=> setToasts(t => t.filter(x=> x.id !== id))} />
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">UI34 · Document Template & Generation</div>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={()=> { saveAsTemplate(); }}>{autosave? 'Quick Save':'Save as Template'}</Button>
          <Button onClick={()=> { fileRef.current?.click() }}>Import</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e=> e.target.files?.[0] && importJSONFile(e.target.files[0])} />
          <Button onClick={()=> { downloadJSON('templates.json', templates); showToast('Exported JSON') }}>Export JSON</Button>
          <Button onClick={()=> { downloadCSV('templates.csv', templates); showToast('Exported CSV') }}>Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-3">
          <Card title="Templates">
            <div className="flex items-center gap-2 mb-3">
              <Input placeholder="Tìm template..." value={search} onChange={e=> { setSearch(e.target.value); setPage(1) }} />
              <Select value={sortBy} onChange={e=> setSortBy(e.target.value)}>
                <option value="updatedAt">Updated</option>
                <option value="name">Name</option>
                <option value="id">ID</option>
              </Select>
              <button onClick={()=> setSortDir(d=> d==='asc'?'desc':'asc')} className="px-2 py-1 border rounded">{sortDir==='asc'?'↑':'↓'}</button>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ) : error ? (
              <div className="text-sm text-rose-600">{error} <button onClick={fetchTemplates} className="ml-2 underline">Retry</button></div>
            ) : (
              <div>
                <ul className="space-y-2 overflow-auto max-h-64">
                  {pageItems.map(t => (
                    <li key={t.id} className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={()=> setSelectedIds(s => s.includes(t.id)? s.filter(x=> x!==t.id) : [...s,t.id])} />
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-neutral-400">{t.id} · {new Date(t.updatedAt).toLocaleString()}</div>
                        </div>
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={()=> { setTpl(t.tpl); setVars(t.vars||vars); showToast('Loaded into editor') }}>Load</Button>
                        <Button onClick={()=> { setTemplates(prev => prev.filter(x=> x.id !== t.id)); localStorage.setItem('doc_templates_v1', JSON.stringify(templates.filter(x=> x.id !== t.id))); showToast('Deleted','warn') }}>Del</Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button onClick={()=> { setSelectedIds(templates.map(t=>t.id)); showToast('Selected all') }}>Select all</Button>
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

          <Card title="Variables">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="mb-1 text-xs text-neutral-500">vendor</div>
                <Input value={vars.vendor} onChange={e=>setVars(v=>({...v, vendor:e.target.value}))}/>
              </div>
              <div>
                <div className="mb-1 text-xs text-neutral-500">amount (VND)</div>
                <Input type="number" value={vars.amount} onChange={e=>setVars(v=>({...v, amount:Number(e.target.value)}))}/>
              </div>
              <div>
                <div className="mb-1 text-xs text-neutral-500">date</div>
                <Input type="date" value={vars.date} onChange={e=>setVars(v=>({...v, date:e.target.value}))}/>
              </div>
            </div>
            <div className="mt-2 text-xs text-neutral-500">Autosave <input type="checkbox" checked={autosave} onChange={e=> setAutosave(e.target.checked)} className="ml-2"/></div>
          </Card>
        </div>

        <div className="col-span-7 space-y-3">
          <Card title="Template">
            <textarea className="w-full p-3 text-sm border h-60 rounded-xl border-neutral-200" value={tpl} onChange={e=>setTpl(e.target.value)} />
            <div className="mt-2 text-xs text-neutral-500">Sử dụng cú pháp {'{'}{'{'}key{'}'}{'}'} · key hợp lệ: vendor, amount, date</div>
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={()=> { downloadJSON('document.json', { tpl, vars }); showToast('Exported doc JSON') }}>Export DOC JSON</Button>
              <Button onClick={()=> { alert('Export DOCX (demo)'); showToast('Export DOCX (demo)') }}>Export DOCX</Button>
              <Button onClick={()=> { alert('Export PDF (demo)'); showToast('Export PDF (demo)') }}>Export PDF</Button>
              <Button variant="primary" onClick={()=> { alert('Send for e-sign (demo)'); showToast('Sent for e-sign (demo)') }}>Send Sign</Button>
            </div>
          </Card>

          <Card title="Preview">
            <div className="p-4 text-sm whitespace-pre-wrap border rounded-xl border-neutral-200 bg-neutral-50">{render()}</div>
          </Card>
        </div>
      </div>
    </div>
  )
 }
