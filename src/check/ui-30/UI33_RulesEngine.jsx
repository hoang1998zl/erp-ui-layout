import React from 'react'
import { Card, Tag, Input, Select, Button } from '../../ui-helpers.jsx'

function useDebounced(value, delay = 300){
  const [v, setV] = React.useState(value)
  React.useEffect(()=>{
    const t = setTimeout(()=>setV(value), delay)
    return ()=>clearTimeout(t)
  },[value, delay])
  return v
}

export default function UI33_RulesEngine(){
  const STORAGE_KEY = 'ui33_rules_v1'
  const [rules, setRules] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [query, setQuery] = React.useState('')
  const q = useDebounced(query, 250)
  const [selected, setSelected] = React.useState(new Set())
  const [sortBy, setSortBy] = React.useState({col:'priority', dir:'desc'})
  const [page, setPage] = React.useState(1)
  const [perPage, setPerPage] = React.useState(8)
  const [drawer, setDrawer] = React.useState({open:false, rule:null})
  const [toasts, setToasts] = React.useState([])
  const searchRef = React.useRef()

  // Simple toast helper
  const pushToast = React.useCallback((msg, type='info')=>{
    const id = Date.now()+Math.random()
    setToasts(t=>[...t, {id, msg, type}])
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 4000)
  },[])

  // mock API fetch
  const fetchRules = React.useCallback((opts={force:false})=>{
    setLoading(true); setError(null)
    setTimeout(()=>{
      // simulate failure sometimes unless forced
      if(!opts.force && Math.random() < 0.12){
        setLoading(false); setError('Failed to fetch rules (mock)')
        pushToast('Failed to load rules','error')
        return
      }

      // attempt load from localStorage first
      const saved = localStorage.getItem(STORAGE_KEY)
      if(saved && !opts.force){
        try{
          const parsed = JSON.parse(saved)
          setRules(parsed)
          setLoading(false)
          pushToast('Loaded rules from localStorage','success')
          return
        }catch(e){ /* fallthrough */ }
      }

      // generate mock rules
      const mock = Array.from({length:28}).map((_,i)=>({
        id: 'R-'+String(100+i).padStart(3,'0'),
        name: ['Auto-approve low', 'PO threshold', 'Vendor active', 'Blacklist check', 'Tax check'][i%5] + ' ' + (i+1),
        expr: ['amount > 1000000','vendor.status == "active"','true','vendor.blacklist == true','doc.type == "invoice"'][i%5],
        priority: (i%6)+1,
        status: ['Active','Draft','Disabled'][i%3]
      }))
      setRules(mock)
      setLoading(false)
      pushToast('Rules loaded (mock)','success')
    }, 600 + Math.random()*600)
  },[pushToast])

  React.useEffect(()=>fetchRules(),[fetchRules])

  // Persist rules to localStorage on change
  React.useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)) }catch(e){}
  },[rules])

  // Keyboard shortcuts
  React.useEffect(()=>{
    const handler = (e)=>{
      const cmd = e.metaKey || e.ctrlKey
      if((cmd && e.key.toLowerCase()==='f')){ e.preventDefault(); searchRef.current?.focus(); }
      if((cmd && e.key.toLowerCase()==='a')){ e.preventDefault();
        // select all visible
        const ids = filtered.map(r=>r.id)
        setSelected(new Set(ids))
        pushToast('Selected all visible','info')
      }
      if((cmd && e.key.toLowerCase()==='e')){ e.preventDefault(); exportSelectedJSON(); }
      if(e.key === 'Delete'){ if(selected.size) { if(confirm('Delete selected rules?')){ bulkDelete() } } }
      if((cmd && e.key.toLowerCase()==='s') && drawer.open){ e.preventDefault(); saveRule(drawer.rule) }
    }
    window.addEventListener('keydown', handler)
    return ()=>window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selected, drawer, rules])

  // Filtering, sorting, pagination derived data
  const filtered = React.useMemo(()=>{
    const qq = q.trim().toLowerCase()
    let arr = rules.slice()
    if(qq){ arr = arr.filter(r=> (r.id+ ' ' + r.name + ' ' + r.expr + ' ' + r.status).toLowerCase().includes(qq)) }
    if(sortBy){ arr.sort((a,b)=>{
      const vA = a[sortBy.col]; const vB = b[sortBy.col]
      if(typeof vA === 'number') return (vA - vB) * (sortBy.dir==='asc'?1:-1)
      return String(vA).localeCompare(String(vB)) * (sortBy.dir==='asc'?1:-1)
    }) }
    return arr
  },[rules, q, sortBy])

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const pageSafe = Math.min(page, lastPage)
  React.useEffect(()=>{ if(page !== pageSafe) setPage(pageSafe) },[pageSafe])
  const pageItems = filtered.slice((pageSafe-1)*perPage, pageSafe*perPage)

  // Actions
  function toggleSelect(id){
    setSelected(s=>{
      const ns = new Set(s)
      if(ns.has(id)) ns.delete(id)
      else ns.add(id)
      return ns
    })
  }

  function toggleSort(col){
    setSortBy(s=>{
      if(s.col === col) return {col, dir: s.dir==='asc'?'desc':'asc'}
      return {col, dir:'asc'}
    })
  }

  function addRule(){
    const next = { id:'R-'+String(1000+rules.length+1).slice(-4), name:'New rule', expr:'true', priority:5, status:'Draft' }
    setRules(r=>[next, ...r])
    pushToast('New rule created','success')
    setDrawer({open:true, rule:next})
  }

  function saveRule(updated){
    setRules(r=>r.map(x=> x.id===updated.id? {...updated}: x))
    setDrawer({open:false, rule:null})
    pushToast('Saved rule','success')
  }

  function bulkDelete(){
    setRules(r=> r.filter(x=> !selected.has(x.id)))
    setSelected(new Set())
    pushToast('Deleted selected rules','success')
  }

  function exportSelectedJSON(){
    const arr = rules.filter(r=> selected.has(r.id))
    if(arr.length===0){ pushToast('No rules selected to export','error'); return }
    const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='rules.json'; a.click(); URL.revokeObjectURL(url)
    pushToast('Exported selected rules (JSON)','success')
  }

  function exportSelectedCSV(){
    const arr = rules.filter(r=> selected.has(r.id))
    if(arr.length===0){ pushToast('No rules selected to export','error'); return }
    const keys = ['id','name','expr','priority','status']
    const csv = [keys.join(',')].concat(arr.map(r=> keys.map(k=> '"'+String(r[k]).replace(/"/g,'""')+'"').join(','))).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='rules.csv'; a.click(); URL.revokeObjectURL(url)
    pushToast('Exported selected rules (CSV)','success')
  }

  function retry(){ fetchRules({force:true}) }

  // UI pieces
  const header = (
    <div className="flex items-center gap-3">
      <div className="text-lg font-semibold">UI33 · Rules Engine</div>
      <div className="ml-4 flex items-center gap-2">
        <Input ref={searchRef} placeholder="Search rules... (Ctrl/Cmd+F)" value={query} onChange={e=>{ setQuery(e.target.value); setPage(1) }} className="w-64" />
        <Select value={perPage} onChange={e=>{ setPerPage(Number(e.target.value)); setPage(1) }}>
          <option value={5}>5 / page</option>
          <option value={8}>8 / page</option>
          <option value={12}>12 / page</option>
          <option value={20}>20 / page</option>
        </Select>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button onClick={addRule}>+ New rule</Button>
        <Button onClick={()=>{ setSelected(new Set(rules.map(r=>r.id))); pushToast('Selected all rules','info') }}>Select All</Button>
        <Button variant="danger" onClick={bulkDelete} disabled={!selected.size}>Delete ({selected.size})</Button>
        <Button onClick={exportSelectedJSON} disabled={!selected.size}>Export JSON</Button>
        <Button onClick={exportSelectedCSV} disabled={!selected.size}>Export CSV</Button>
      </div>
    </div>
  )

  return (
    <div className="p-5 space-y-4">
      {header}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Card title={`Rules (${total})`}>
            {loading ? (
              <div className="space-y-2">
                {Array.from({length: Math.min(perPage,6)}).map((_,i)=> (
                  <div key={i} className="animate-pulse flex items-center gap-3 py-3">
                    <div className="w-5 h-5 bg-neutral-300 rounded" />
                    <div className="h-4 bg-neutral-300 rounded w-28" />
                    <div className="h-4 bg-neutral-300 rounded w-56 ml-4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="mb-3 text-red-600">{error}</div>
                <div className="flex justify-center gap-2">
                  <Button onClick={retry}>Retry</Button>
                  <Button onClick={()=>fetchRules({force:true})}>Force reload</Button>
                </div>
              </div>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-500">
                    <tr>
                      <th className="py-2 w-6"><input type="checkbox" checked={pageItems.every(r=>selected.has(r.id)) && pageItems.length>0} onChange={e=>{
                        if(e.target.checked){ setSelected(s=> new Set([...Array.from(s), ...pageItems.map(x=>x.id)])) }
                        else { setSelected(s=>{ const ns = new Set(s); pageItems.forEach(x=>ns.delete(x.id)); return ns }) }
                      }} /></th>
                      <th className="py-2 cursor-pointer" onClick={()=>toggleSort('id')}>ID {sortBy.col==='id'? (sortBy.dir==='asc'?'↑':'↓') : ''}</th>
                      <th className="py-2">Name / Expr</th>
                      <th className="py-2 cursor-pointer" onClick={()=>toggleSort('priority')}>Priority {sortBy.col==='priority'? (sortBy.dir==='asc'?'↑':'↓') : ''}</th>
                      <th className="py-2 cursor-pointer" onClick={()=>toggleSort('status')}>Status {sortBy.col==='status'? (sortBy.dir==='asc'?'↑':'↓') : ''}</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r)=> (
                      <tr key={r.id} className="border-t hover:bg-neutral-50">
                        <td className="py-2"><input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleSelect(r.id)} /></td>
                        <td className="py-2"><button className="text-sm text-left" onClick={()=>setDrawer({open:true, rule:r})}>{r.id}</button></td>
                        <td>
                          <div className="text-sm font-medium">{r.name}</div>
                          <div className="text-xs text-neutral-500">{r.expr}</div>
                        </td>
                        <td className="py-2">{r.priority}</td>
                        <td className="py-2"><Tag>{r.status}</Tag></td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button onClick={()=>{ setDrawer({open:true, rule:r}) }}>Edit</Button>
                            <Button variant="danger" onClick={()=>{ if(confirm('Delete '+r.id+'?')){ setRules(cur=>cur.filter(x=>x.id!==r.id)); pushToast('Deleted '+r.id,'success') } }}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-neutral-500">Showing { (pageSafe-1)*perPage + 1 } - { Math.min(pageSafe*perPage, total) } of {total}</div>
                  <div className="flex items-center gap-2">
                    <Button onClick={()=>setPage(1)} disabled={pageSafe===1}>First</Button>
                    <Button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={pageSafe===1}>Prev</Button>
                    <div className="px-2">Page {pageSafe} / {lastPage}</div>
                    <Button onClick={()=>setPage(p=>Math.min(lastPage,p+1))} disabled={pageSafe===lastPage}>Next</Button>
                    <Button onClick={()=>setPage(lastPage)} disabled={pageSafe===lastPage}>Last</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-4 space-y-3">
          <Card title="Inspector / Quick actions">
            <div className="space-y-2 text-sm">
              <div className="text-neutral-500">Selection</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{selected.size}</div>
                <div className="ml-auto flex gap-2">
                  <Button onClick={exportSelectedJSON} disabled={!selected.size}>Export JSON</Button>
                  <Button onClick={exportSelectedCSV} disabled={!selected.size}>Export CSV</Button>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-neutral-500">Quick Filters</div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={()=>{ setQuery('vendor'); setPage(1) }}>vendor</Button>
                  <Button onClick={()=>{ setQuery('blacklist'); setPage(1) }}>blacklist</Button>
                  <Button onClick={()=>{ setQuery('PO'); setPage(1) }}>PO</Button>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-neutral-500">Persistence</div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); pushToast('Saved to localStorage','success') }}>Save</Button>
                  <Button onClick={()=>{ localStorage.removeItem(STORAGE_KEY); fetchRules({force:true}); pushToast('Cleared local and reloaded','info') }}>Reset</Button>
                </div>
              </div>

            </div>
          </Card>

          <Card title="Status">
            <div className="text-sm text-neutral-600">
              <div>Rules: <strong>{rules.length}</strong></div>
              <div>Visible: <strong>{total}</strong></div>
              <div>Loading: <strong>{String(loading)}</strong></div>
              <div>Error: <strong className="text-red-600">{error || '-'}</strong></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Drawer */}
      {drawer.open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" onClick={()=>setDrawer({open:false, rule:null})} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-lg p-4 overflow-auto">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">Rule {drawer.rule.id}</div>
              <div className="ml-auto">
                <Button onClick={()=>{ setDrawer({open:false, rule:null}) }}>Close</Button>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs text-neutral-500">Name</div>
                <Input value={drawer.rule.name} onChange={e=> setDrawer(d=>({...d, rule:{...d.rule, name:e.target.value}}))} />
              </div>
              <div>
                <div className="text-xs text-neutral-500">Expression</div>
                <Input value={drawer.rule.expr} onChange={e=> setDrawer(d=>({...d, rule:{...d.rule, expr:e.target.value}}))} />
              </div>
              <div>
                <div className="text-xs text-neutral-500">Priority</div>
                <Input type="number" value={drawer.rule.priority} onChange={e=> setDrawer(d=>({...d, rule:{...d.rule, priority: Number(e.target.value)}}))} />
              </div>
              <div>
                <div className="text-xs text-neutral-500">Status</div>
                <Select value={drawer.rule.status} onChange={e=> setDrawer(d=>({...d, rule:{...d.rule, status:e.target.value}}))}>
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Disabled</option>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" onClick={()=>saveRule(drawer.rule)}>Save</Button>
                <Button onClick={()=>{ navigator.clipboard?.writeText(JSON.stringify(drawer.rule, null, 2)); pushToast('Copied rule JSON','info') }}>Copy JSON</Button>
                <Button variant="danger" onClick={()=>{ if(confirm('Delete '+drawer.rule.id+'?')){ setRules(cur=>cur.filter(x=>x.id!==drawer.rule.id)); setDrawer({open:false, rule:null}); pushToast('Deleted '+drawer.rule.id,'success') } }}>Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map(t=> (
          <div key={t.id} className={`px-3 py-2 rounded shadow ${t.type==='error'? 'bg-red-100 text-red-800' : t.type==='success'? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-900'}`}>
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  )
}
