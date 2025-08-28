import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockJobs = ()=>{
  const arr=[]
  const statuses=['Assigned','In Progress','Completed','Blocked']
  for(let i=0;i<40;i++) arr.push({ id:`J-${8000+i}`, title:`Job ${i+1}`, tech:`Tech ${1+(i%10)}`, status: statuses[i%statuses.length], due: new Date(Date.now()+ ((i%10)-5)*24*60*60*1000).toISOString(), notes: `Note ${i+1}` })
  return arr
}

function exportCSV(rows, filename='field_jobs.csv'){
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

export default function UI93_FieldServiceApp(){
  const [jobs,setJobs] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [status,setStatus] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setJobs(mockJobs()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> jobs.filter(j=> (!q || `${j.title} ${j.id} ${j.tech}`.toLowerCase().includes(q.toLowerCase())) && (!status || j.status===status) ), [jobs,q,status])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Field Service</h1>
          <p className="text-sm text-neutral-500">Mobile-first job list and status updates (mock).</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input placeholder="Search jobs" aria-label="Search jobs" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Status" value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="w-40">
            <option value="">All</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Blocked</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <Card title={`Active jobs (${jobs.length})`} subtitle="Realtime-ish">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading && <div className="p-4 text-sm text-neutral-500">Loading...</div>}
          {!loading && rows.map(j=> (
            <div key={j.id} className="p-3 bg-white rounded border flex items-center justify-between">
              <div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-xs text-neutral-500">{j.tech} — due {new Date(j.due).toLocaleDateString()}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Tag tone={j.status==='Completed'?'green':j.status==='Blocked'?'rose':j.status==='In Progress'?'indigo':'amber'}>{j.status}</Tag>
                <div className="flex gap-2">
                  <Button onClick={()=>setSelected(j)}>View</Button>
                  <Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(j.id)}>Copy</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-neutral-500">Page {page} of {pages}</div>
          <div className="flex gap-2">
            <Button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
            <Button onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</Button>
          </div>
        </div>
      </Card>

      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-40 flex justify-center items-start p-6" onClick={()=>setSelected(null)}>
          <div className="w-full md:w-2/3 lg:w-1/3 bg-white p-4 rounded-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Tech:</strong> {selected.tech}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Due:</strong> {new Date(selected.due).toLocaleString()}</div>
              <div><strong>Notes:</strong> {selected.notes}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
