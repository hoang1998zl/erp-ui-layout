import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button} from '../../ui-helpers'

const mockEvents = ()=>{
  const arr=[]
  const types=['All-hands','Team','Training','Social']
  for(let i=0;i<42;i++) arr.push({ id:`EV-${4000+i}`, title:`Event ${i+1}`, type: types[i%types.length], date: new Date(Date.now()+ (i-7)*24*60*60*1000).toISOString(), host:`Host ${1+(i%6)}`, attendees: 5+(i%20) })
  return arr
}

function exportCSV(rows, filename='events.csv'){
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

export default function UI89_EventPlanner(){
  const [events,setEvents] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [type,setType] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setEvents(mockEvents()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> events.filter(e=> (!q || `${e.title} ${e.id}`.toLowerCase().includes(q.toLowerCase())) && (!type || e.type===type) ), [events,q,type])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Planner</h1>
          <p className="text-sm text-neutral-500">Create and manage internal events, invites and calendars.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search events" aria-label="Search events" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Type" value={type} onChange={e=>{setType(e.target.value); setPage(1)}} className="w-44">
            <option value="">All types</option>
            <option>All-hands</option>
            <option>Team</option>
            <option>Training</option>
            <option>Social</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Upcoming (${events.length})`} subtitle="Next 30 days">
          <div className="text-3xl font-semibold">{events.filter(e=> new Date(e.date) > Date.now()).length}</div>
          <div className="mt-2 text-sm text-neutral-500">Next event: {events.length? new Date(events[0].date).toLocaleDateString() : '—'}</div>
        </Card>

        <Card title="By type">
          <ul className="text-sm space-y-1">
            {['All-hands','Team','Training','Social'].map(t=> (
              <li key={t} className="flex items-center justify-between"><span>{t}</span><span className="text-neutral-500">{events.filter(ev=>ev.type===t).length}</span></li>
            ))}
          </ul>
        </Card>

        <Card title="Calendar preview">
          <div className="h-36 bg-white rounded border flex items-center justify-center text-sm text-neutral-500">Mini calendar preview (placeholder)</div>
        </Card>
      </div>

      <Card title="Events" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Type</th>
                <th className="p-2">Date</th>
                <th className="p-2">Host</th>
                <th className="p-2">Attendees</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{new Date(r.date).toLocaleString()}</td>
                  <td className="p-2">{r.host}</td>
                  <td className="p-2">{r.attendees}</td>
                  <td className="p-2"><div className="flex gap-2"><Button onClick={()=>setSelected(r)}>Details</Button><Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(r.id)}>Copy</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <div><strong>Type:</strong> {selected.type}</div>
              <div><strong>Date:</strong> {new Date(selected.date).toLocaleString()}</div>
              <div><strong>Host:</strong> {selected.host}</div>
              <div><strong>Attendees:</strong> {selected.attendees}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
