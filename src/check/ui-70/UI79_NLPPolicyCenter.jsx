import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer} from 'recharts'

const mockDocs = ()=>{
  const docs = []
  const topics = ['Privacy','Security','Compliance','Terms']
  for(let i=0;i<36;i++){
    const sentiment = ['positive','neutral','negative'][Math.floor(Math.random()*3)]
    docs.push({ id:`NP-${4000+i}`, title:`Policy doc ${i+1}`, topic: topics[i%topics.length], sentiment, pages: 1+Math.floor(Math.random()*12), uploaded: Date.now()-i*1000*60*60*24 })
  }
  return docs
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nlp-policy-docs.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI79_NLPPolicyCenter(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    setLoading(true)
    setTimeout(()=>{ setData(mockDocs()); setLoading(false) }, 320)
  },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.id} ${d.title}`.toLowerCase().includes(q.toLowerCase())) && (!topic || d.topic===topic) ), [data,q,topic])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const sentimentData = useMemo(()=>{
    const counts = {positive:0,neutral:0,negative:0}
    data.forEach(d=> counts[d.sentiment] = (counts[d.sentiment]||0)+1)
    return [
      {name:'Positive', value:counts.positive, key:'positive'},
      {name:'Neutral', value:counts.neutral, key:'neutral'},
      {name:'Negative', value:counts.negative, key:'negative'}
    ]
  },[data])
  const COLORS = ['#16a34a','#f59e0b','#ef4444']

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">NLP Policy Center</h1>
          <p className="text-sm text-neutral-500">Analyze and manage policy documents using NLP insights.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search documents" aria-label="Search documents" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Topic" value={topic} onChange={e=>{setTopic(e.target.value); setPage(1)}} className="w-44">
            <option value="">All topics</option>
            <option value="Privacy">Privacy</option>
            <option value="Security">Security</option>
            <option value="Compliance">Compliance</option>
            <option value="Terms">Terms</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Documents (${data.length})`} subtitle="Uploaded policies">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 flex gap-2">
            <Button onClick={()=>alert('Upload new document (mock)')}>Upload</Button>
            <Button variant="ghost" onClick={()=>alert('Run NLP analysis (mock)')}>Analyze</Button>
          </div>
        </Card>

        <Card title="Sentiment" subtitle="Document sentiment distribution">
          <div style={{height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={sentimentData} innerRadius={30} outerRadius={60} paddingAngle={2} label>
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setTopic('') }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Export summary (mock)')}>Export summary</Button>
          </div>
        </Card>
      </div>

      <Card title="Documents" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Topic</th>
                <th className="p-2">Pages</th>
                <th className="p-2">Sentiment</th>
                <th className="p-2">Uploaded</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.topic}</td>
                  <td className="p-2">{r.pages}</td>
                  <td className="p-2"><Tag tone={r.sentiment==='positive'?'green':r.sentiment==='neutral'?'amber':'rose'}>{r.sentiment}</Tag></td>
                  <td className="p-2">{new Date(r.uploaded).toLocaleDateString()}</td>
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
              <div><strong>Topic:</strong> {selected.topic}</div>
              <div><strong>Pages:</strong> {selected.pages}</div>
              <div><strong>Uploaded:</strong> {new Date(selected.uploaded).toLocaleString()}</div>
              <div className="mt-2 p-3 bg-neutral-50 rounded">Summary (mock): This document contains policy statements and clauses relevant to {selected.topic}.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
