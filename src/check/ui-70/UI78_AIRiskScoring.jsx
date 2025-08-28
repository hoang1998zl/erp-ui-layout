import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid} from 'recharts'

const mockEntities = ()=>{
  const entities = []
  const names = ['Vendor A','Vendor B','Vendor C','Vendor D','Vendor E','Vendor F']
  for(let i=0;i<30;i++){
    const score = Math.round(40 + Math.random()*60)
    entities.push({ id:`R-${3000+i}`, name: names[i%names.length] + ` ${i+1}`, score, category: ['supplier','customer'][i%2], lastReviewed: Date.now()-i*1000*60*60*24 })
  }
  return entities
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ai-risk-scoring.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI78_AIRiskScoring(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    setLoading(true)
    setTimeout(()=>{ setData(mockEntities()); setLoading(false) }, 420)
  },[])

  const filtered = useMemo(()=> data.filter(d=>(!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!category || d.category===category)), [data,q,category])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const chartData = useMemo(()=>{
    // distribution buckets
    const buckets = {Low:0,Medium:0,High:0}
    data.forEach(d=>{
      if(d.score<60) buckets.Low++
      else if(d.score<80) buckets.Medium++
      else buckets.High++
    })
    return Object.keys(buckets).map(k=>({risk:k, count:buckets[k]}))
  },[data])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Risk Scoring</h1>
          <p className="text-sm text-neutral-500">Automated risk scoring with review workflow and audit trail.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search entities" aria-label="Search entities" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Category" value={category} onChange={e=>{setCategory(e.target.value); setPage(1)}} className="w-40">
            <option value="">All</option>
            <option value="supplier">Supplier</option>
            <option value="customer">Customer</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Entities (${data.length})`} subtitle="Risk distribution">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 flex gap-2">
            <Tag tone="green">Safe {data.filter(d=>d.score>=80).length}</Tag>
            <Tag tone="amber">Medium {data.filter(d=>d.score>=60 && d.score<80).length}</Tag>
            <Tag tone="rose">High {data.filter(d=>d.score<60).length}</Tag>
          </div>
        </Card>

        <Card title="Risk buckets" subtitle="By score">
          <div style={{height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="risk" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setCategory('') }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Flag high risk (mock)')}>Flag High Risk</Button>
          </div>
        </Card>
      </div>

      <Card title="Entities" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2">Score</th>
                <th className="p-2">Last reviewed</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2"><Tag tone={r.score>=80?'green':r.score>=60?'amber':'rose'}>{r.score}</Tag></td>
                  <td className="p-2">{new Date(r.lastReviewed).toLocaleDateString()}</td>
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
              <div><strong>Score:</strong> {selected.score}</div>
              <div><strong>Category:</strong> {selected.category}</div>
              <div><strong>Last reviewed:</strong> {new Date(selected.lastReviewed).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
