import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend} from 'recharts'

const mockTalent = ()=>{
  const roles=['Engineer','Product','Sales','HR','Design']
  const stages=['Identified','Ready','Development','Backfill']
  const arr=[]
  for(let i=0;i<56;i++) arr.push({
    id:`T-${2000+i}`,
    name:`Person ${i+1}`,
    role: roles[i%roles.length],
    stage: stages[i%stages.length],
    readiness: Math.round(Math.random()*100),
    manager: `Manager ${1+(i%8)}`,
    updated: Date.now()-i*1000*60*60*24
  })
  return arr
}

function exportCSV(rows, filename='talent_succession.csv'){
  if(!rows || !rows.length) return
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

export default function UI86_TalentSuccession(){
  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [role,setRole] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockTalent()); setLoading(false) }, 300) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!role || d.role===role) ), [data,q,role])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const stageCounts = useMemo(()=>{
    const counts = {}
    data.forEach(d=> counts[d.stage] = (counts[d.stage]||0)+1)
    return Object.keys(counts).map(k=>({stage:k,count:counts[k]}))
  },[data])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Talent Succession</h1>
          <p className="text-sm text-neutral-500">Succession pipelines, readiness and backfill planning.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search people or id" aria-label="Search talent" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Role" value={role} onChange={e=>{setRole(e.target.value); setPage(1)}} className="w-48">
            <option value="">All roles</option>
            <option>Engineer</option>
            <option>Product</option>
            <option>Sales</option>
            <option>HR</option>
            <option>Design</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Total Talent (${data.length})`} subtitle="Snapshot">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Ready now {data.filter(d=>d.stage==='Ready').length}</div>
        </Card>

        <Card title="Pipeline stages">
          <div style={{height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageCounts} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setRole(''); setPage(1) }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Run readiness analysis (mock)')}>Analyze Readiness</Button>
          </div>
        </Card>
      </div>

      <Card title="Talent" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">Stage</th>
                <th className="p-2">Readiness</th>
                <th className="p-2">Manager</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.role}</td>
                  <td className="p-2"><Tag tone={r.stage==='Ready'?'green':r.stage==='Identified'?'indigo':'amber'}>{r.stage}</Tag></td>
                  <td className="p-2">{r.readiness}%</td>
                  <td className="p-2">{r.manager}</td>
                  <td className="p-2">{new Date(r.updated).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button onClick={()=>setSelected(r)}>Details</Button>
                      <Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(r.id)}>Copy</Button>
                    </div>
                  </td>
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={()=>setSelected(null)}>
          <div className="w-full md:w-1/3 bg-white p-4 h-full overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Role:</strong> {selected.role}</div>
              <div><strong>Stage:</strong> {selected.stage}</div>
              <div><strong>Readiness:</strong> {selected.readiness}%</div>
              <div><strong>Manager:</strong> {selected.manager}</div>
              <div><strong>Updated:</strong> {new Date(selected.updated).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
