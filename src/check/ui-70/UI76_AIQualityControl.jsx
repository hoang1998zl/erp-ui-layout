import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts'

const mockInspections = () => {
  const items = []
  for(let i=1;i<=42;i++){
    const severity = ['ok','minor','major'][Math.floor(Math.random()*3)]
    items.push({
      id: `IQ-${1000+i}`,
      imageRef: `img_${i}.jpg`,
      inspector: ['Alice','Bob','Carmen','Diego'][i%4],
      score: Math.round(60 + Math.random()*40),
      severity,
      timestamp: Date.now() - Math.floor(Math.random()*1000*60*60*24*30)
    })
  }
  return items
}

function formatDate(ts){
  const d = new Date(ts)
  return d.toLocaleString()
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ai-quality-inspections.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI76_AIQualityControl(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({q:'',severity:'all'})
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    setLoading(true)
    // mock API
    setTimeout(()=>{
      setData(mockInspections())
      setLoading(false)
    }, 450)
  },[])

  const filtered = useMemo(()=>{
    return data.filter(d=>{
      if(filter.severity!=='all' && d.severity!==filter.severity) return false
      if(filter.q && !(`${d.id} ${d.inspector} ${d.imageRef}`.toLowerCase().includes(filter.q.toLowerCase()))) return false
      return true
    })
  },[data,filter])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageRows = filtered.slice((page-1)*pageSize, page*pageSize)

  const trend = useMemo(()=>{
    // simple daily counts
    const buckets = {}
    for(let i=0;i<14;i++) buckets[i]=0
    data.forEach((d,idx)=>{
      const days = Math.floor((Date.now()-d.timestamp)/(1000*60*60*24))
      const k = Math.min(13, days)
      buckets[k] = (buckets[k]||0)+1
    })
    return Object.keys(buckets).map(k=>({day:`-${k}d`, count: buckets[k]})).reverse()
  },[data])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Quality Control</h1>
          <p className="text-sm text-neutral-500">Image-based quality inspections, trends and remediation actions.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input aria-label="Search inspections" placeholder="Search by id, inspector or image" value={filter.q} onChange={e=>{setFilter({...filter,q:e.target.value}); setPage(1)}} />
          <Select aria-label="Severity filter" value={filter.severity} onChange={e=>{setFilter({...filter,severity:e.target.value}); setPage(1)}} className="w-40">
            <option value="all">All severities</option>
            <option value="ok">OK</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </Select>
          <Button variant="ghost" onClick={()=>exportCSV(filtered)} aria-label="Export CSV">Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Inspections (${total})`} subtitle="Last 30 days">
          <div className="flex flex-col gap-2">
            <div className="text-3xl font-semibold">{data.length}</div>
            <div className="flex gap-2">
              <Tag tone="green">OK {data.filter(d=>d.severity==='ok').length}</Tag>
              <Tag tone="amber">Minor {data.filter(d=>d.severity==='minor').length}</Tag>
              <Tag tone="rose">Major {data.filter(d=>d.severity==='major').length}</Tag>
            </div>
          </div>
        </Card>

        <Card title="Trend" subtitle="Inspections over time">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setFilter({q:'', severity:'all'}); setPage(1)}}>Reset filters</Button>
            <Button variant="primary" onClick={()=>alert('Trigger bulk re-inspect (mock)')} className="mt-2">Bulk Re-inspect</Button>
          </div>
        </Card>
      </div>

      <Card title="Inspections table" subtitle={`Showing ${pageRows.length} of ${total}`} actions={<div className="flex items-center gap-2"><Button onClick={()=>exportCSV(filtered)}>Export CSV</Button></div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Inspections table">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Image</th>
                <th className="p-2">Inspector</th>
                <th className="p-2">Score</th>
                <th className="p-2">Severity</th>
                <th className="p-2">When</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && pageRows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.imageRef}</td>
                  <td className="p-2">{r.inspector}</td>
                  <td className="p-2">{r.score}</td>
                  <td className="p-2"><Tag tone={r.severity==='ok'?'green':r.severity==='minor'?'amber':'rose'}>{r.severity}</Tag></td>
                  <td className="p-2">{formatDate(r.timestamp)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button onClick={()=>setSelected(r)} aria-label={`Open details ${r.id}`}>Details</Button>
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
            <Button onClick={()=>setPage(p=>Math.max(1,p-1))} aria-label="Previous page">Prev</Button>
            <Button onClick={()=>setPage(p=>Math.min(pages,p+1))} aria-label="Next page">Next</Button>
          </div>
        </div>
      </Card>

      {/* detail drawer */}
      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Inspection details" className="fixed inset-0 bg-black/30 z-40 flex justify-end">
          <div className="w-full md:w-1/3 bg-white p-4 h-full overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.id}</h3>
              <Button onClick={()=>setSelected(null)} aria-label="Close details">Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>Image:</strong> {selected.imageRef}</div>
              <div><strong>Inspector:</strong> {selected.inspector}</div>
              <div><strong>Score:</strong> {selected.score}</div>
              <div><strong>Severity:</strong> {selected.severity}</div>
              <div><strong>Captured:</strong> {formatDate(selected.timestamp)}</div>
              <div className="mt-2">
                <img alt={`preview ${selected.id}`} src={`https://via.placeholder.com/400x200?text=${selected.id}`} className="w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
