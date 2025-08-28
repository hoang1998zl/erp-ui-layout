import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts'

const mockSurveys = ()=>{
  const s=[]
  for(let i=0;i<24;i++) s.push({ id:`S-${6000+i}`, title:`Pulse ${i+1}`, responses: 10+Math.floor(Math.random()*90), score: Math.round(40+Math.random()*60), created: Date.now()-i*1000*60*60*24 })
  return s
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'engagement_surveys.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI83_EngagementSurvey(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockSurveys()); setLoading(false) }, 360) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.id} ${d.title}`.toLowerCase().includes(q.toLowerCase())) ), [data,q])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const trend = useMemo(()=> Array.from({length:12}).map((_,i)=>({month:`M${i+1}`, score: Math.round(50+10*Math.sin(i/2)+Math.random()*5)})),[])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Engagement Surveys</h1>
          <p className="text-sm text-neutral-500">Pulse checks and engagement analytics.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search surveys" aria-label="Search surveys" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Surveys (${data.length})`} subtitle="Recent pulses">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Avg responses {data.length? Math.round(data.reduce((s,x)=>s+x.responses,0)/data.length) : 0}</div>
        </Card>

        <Card title="Sentiment trend" subtitle="Avg score">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="score" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Create survey (mock)')}>Create</Button>
            <Button variant="ghost" onClick={()=>alert('Send reminder (mock)')}>Remind</Button>
          </div>
        </Card>
      </div>

      <Card title="Surveys" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Responses</th>
                <th className="p-2">Avg score</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.responses}</td>
                  <td className="p-2">{r.score}%</td>
                  <td className="p-2">{new Date(r.created).toLocaleDateString()}</td>
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-40 flex justify-end">
          <div className="w-full md:w-1/3 bg-white p-4 h-full overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Responses:</strong> {selected.responses}</div>
              <div><strong>Avg score:</strong> {selected.score}%</div>
              <div><strong>Created:</strong> {new Date(selected.created).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
