import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockCases = ()=>{
  const arr=[]
  const statuses=['Open','Under Review','Resolved']
  for(let i=0;i<26;i++) arr.push({ id:`C-${10000+i}`, country:['US','CN','DE','VN'][i%4], goods:`Goods ${i+1}`, status: statuses[i%statuses.length], created: Date.now()-i*1000*60*60*24 })
  return arr
}

function exportCSV(rows, filename='trade_cases.csv'){
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

export default function UI95_GlobalTradeCompliance(){
  const [cases,setCases] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [country,setCountry] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setCases(mockCases()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> cases.filter(c=> (!q || `${c.id} ${c.goods}`.toLowerCase().includes(q.toLowerCase())) && (!country || c.country===country) ), [cases,q,country])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Global Trade Compliance</h1>
          <p className="text-sm text-neutral-500">Customs, HS codes and compliance case tracking (mock).</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search cases" aria-label="Search cases" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Country" value={country} onChange={e=>{setCountry(e.target.value); setPage(1)}} className="w-44">
            <option value="">All countries</option>
            <option>US</option>
            <option>CN</option>
            <option>DE</option>
            <option>VN</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Cases (${cases.length})`} subtitle="Snapshot">
          <div className="text-3xl font-semibold">{cases.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Open {cases.filter(c=>c.status==='Open').length}</div>
        </Card>

        <Card title="By country">
          <ul className="text-sm space-y-1">
            {['US','CN','DE','VN'].map(ct=> (<li key={ct} className="flex items-center justify-between"><span>{ct}</span><span className="text-neutral-500">{cases.filter(c=>c.country===ct).length}</span></li>))}
          </ul>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setCountry(''); setPage(1) }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Run HS code scan (mock)')}>Scan HS codes</Button>
          </div>
        </Card>
      </div>

      <Card title="Cases" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Goods</th>
                <th className="p-2">Country</th>
                <th className="p-2">Status</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.goods}</td>
                  <td className="p-2">{r.country}</td>
                  <td className="p-2"><Tag tone={r.status==='Resolved'?'green':r.status==='Under Review'?'indigo':'amber'}>{r.status}</Tag></td>
                  <td className="p-2">{new Date(r.created).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold">Case {selected.id}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>Goods:</strong> {selected.goods}</div>
              <div><strong>Country:</strong> {selected.country}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Created:</strong> {new Date(selected.created).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
