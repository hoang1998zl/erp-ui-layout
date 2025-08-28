import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button} from '../../ui-helpers'

const mockRooms = ()=>{
  const types=['Project','Team','Knowledge','Social']
  const arr=[]
  for(let i=0;i<36;i++) arr.push({ id:`R-${3000+i}`, name:`Room ${i+1}`, type: types[i%types.length], members: 3+ (i%10), updated: Date.now()-i*1000*60*60*24 })
  return arr
}

function exportCSV(rows, filename='collaboration_rooms.csv'){
  if(!rows||!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI87_CollaborationSpaces(){
  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [type,setType] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockRooms()); setLoading(false) }, 300) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!type || d.type===type) ), [data,q,type])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collaboration Spaces</h1>
          <p className="text-sm text-neutral-500">Team rooms, project spaces and knowledge hubs.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search rooms" aria-label="Search rooms" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Type" value={type} onChange={e=>{setType(e.target.value); setPage(1)}} className="w-44">
            <option value="">All types</option>
            <option>Project</option>
            <option>Team</option>
            <option>Knowledge</option>
            <option>Social</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && <div className="col-span-full p-6 text-center">Loading...</div>}
        {!loading && rows.map(r=> (
          <Card key={r.id} title={r.name} subtitle={`${r.members} members`} actions={<Button variant="ghost" onClick={()=>setSelected(r)}>Open</Button>}>
            <div className="text-xs text-neutral-500">Type: {r.type}</div>
            <div className="mt-2 text-xs">Updated: {new Date(r.updated).toLocaleDateString()}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <Button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
          <Button onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</Button>
        </div>
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-40 flex justify-center items-start p-6" onClick={()=>setSelected(null)}>
          <div className="w-full md:w-2/3 lg:w-1/3 bg-white p-4 rounded-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Type:</strong> {selected.type}</div>
              <div><strong>Members:</strong> {selected.members}</div>
              <div><strong>Updated:</strong> {new Date(selected.updated).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
