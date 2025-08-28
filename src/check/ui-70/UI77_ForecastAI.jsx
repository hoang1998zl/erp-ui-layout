import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid} from 'recharts'

const mockScenarios = () => {
  const items = []
  for(let i=1;i<=28;i++){
    items.push({
      id: `FC-${2000+i}`,
      name: `Scenario ${i}`,
      createdBy: ['Planner','AI','Scheduler'][i%3],
      horizon: [7,14,30,90][i%4],
      accuracy: Math.round(60 + Math.random()*40),
      createdAt: Date.now() - Math.floor(Math.random()*1000*60*60*24*60)
    })
  }
  return items
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'forecast-scenarios.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI77_ForecastAI(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    setLoading(true)
    setTimeout(()=>{ setData(mockScenarios()); setLoading(false) }, 350)
  },[])

  const filtered = useMemo(()=> data.filter(d=> !q || (`${d.id} ${d.name} ${d.createdBy}`).toLowerCase().includes(q.toLowerCase())), [data,q])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const trend = useMemo(()=>{
    // fake forecast quality trend
    return Array.from({length:12}).map((_,i)=>({month:`M${i+1}`, score: Math.round(60 + 30*Math.sin(i/2) + Math.random()*10)}))
  },[])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Forecast AI</h1>
          <p className="text-sm text-neutral-500">Scenario driven forecasting with model-backed confidence and comparison tools.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search scenarios" aria-label="Search scenarios" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Horizon filter" className="w-44" onChange={e=>{ /* placeholder */ }}>
            <option value="">All horizons</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)} aria-label="Export scenarios">Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Scenarios (${data.length})`} subtitle="Editable scenarios">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 flex gap-2">
            <Button onClick={()=>alert('Create new scenario (mock)')}>New</Button>
            <Button variant="ghost" onClick={()=>alert('Clone baseline (mock)')}>Clone</Button>
          </div>
        </Card>

        <Card title="Forecast quality" subtitle="Recent months">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#111827" fill="#e6e7eb" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>setQ('')}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Run batch compare (mock)')} className="mt-2">Compare</Button>
          </div>
        </Card>
      </div>

      <Card title="Scenarios" subtitle={`Showing ${rows.length} of ${total}`} actions={<div><Button onClick={()=>exportCSV(filtered)}>Export CSV</Button></div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Created by</th>
                <th className="p-2">Horizon</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.createdBy}</td>
                  <td className="p-2">{r.horizon}d</td>
                  <td className="p-2"><Tag tone={r.accuracy>80?'green':r.accuracy>70?'amber':'rose'}>{r.accuracy}%</Tag></td>
                  <td className="p-2">{new Date(r.createdAt).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Horizon:</strong> {selected.horizon} days</div>
              <div><strong>Accuracy:</strong> {selected.accuracy}%</div>
              <div><strong>Created by:</strong> {selected.createdBy}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
