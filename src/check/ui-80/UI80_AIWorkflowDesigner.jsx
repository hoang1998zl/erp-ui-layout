import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts'

const mockSuggestions = ()=>{
  const items = []
  const types = ['automation','integration','cleanup']
  for(let i=1;i<=24;i++) items.push({ id:`WF-${100+i}`, title:`Suggestion ${i}`, type: types[i%types.length], score: Math.round(60+Math.random()*40), createdBy: ['AI','System','User'][i%3], createdAt: Date.now()-i*1000*60*60*6 })
  return items
}

function exportJSON(rows, name='workflow_suggestions.json'){
  const blob = new Blob([JSON.stringify(rows, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI80_AIWorkflowDesigner(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    setLoading(true)
    setTimeout(()=>{ setData(mockSuggestions()); setLoading(false) }, 380)
  },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.id} ${d.title}`.toLowerCase().includes(q.toLowerCase())) && (!type || d.type===type) ), [data,q,type])

  const trend = useMemo(()=> Array.from({length:8}).map((_,i)=>({x:`-${i}h`, value: Math.round(10+Math.random()*40)})),[])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Workflow Designer</h1>
          <p className="text-sm text-neutral-500">Actionable workflow suggestions derived from usage telemetry.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search suggestions" aria-label="Search suggestions" value={q} onChange={e=>setQ(e.target.value)} />
          <Select aria-label="Type filter" value={type} onChange={e=>setType(e.target.value)} className="w-44">
            <option value="">All types</option>
            <option value="automation">Automation</option>
            <option value="integration">Integration</option>
            <option value="cleanup">Cleanup</option>
          </Select>
          <Button onClick={()=>exportJSON(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Suggestions (${data.length})`} subtitle="Prioritized list">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 flex gap-2">
            <Button onClick={()=>alert('Apply top suggestion (mock)')}>Apply</Button>
            <Button variant="ghost" onClick={()=>alert('Bulk apply (mock)')}>Bulk</Button>
          </div>
        </Card>

        <Card title="Trend" subtitle="Suggestion volume">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Flow preview">
          <div className="h-28 flex items-center justify-center text-sm text-neutral-500">Graphical flow preview (placeholder)</div>
        </Card>
      </div>

      <Card title="Suggestions" subtitle={`Showing ${filtered.length}`} actions={<Button onClick={()=>exportJSON(filtered)}>Export JSON</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Type</th>
                <th className="p-2">Score</th>
                <th className="p-2">Created by</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>}
              {!loading && filtered.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.score}</td>
                  <td className="p-2">{r.createdBy}</td>
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
              <div><strong>Type:</strong> {selected.type}</div>
              <div><strong>Score:</strong> {selected.score}</div>
              <div><strong>Created by:</strong> {selected.createdBy}</div>
              <div className="mt-2 p-3 bg-neutral-50 rounded">Details (mock): This suggestion is generated from usage patterns and has estimated impact score {selected.score}.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
