import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button} from '../../ui-helpers'

const mockSuppliers = ()=>{
  const arr=[]
  for(let i=0;i<30;i++) arr.push({ id:`S-${7000+i}`, name:`Supplier ${i+1}`, rating: (Math.round(Math.random()*5*10)/10), country: ['US','VN','CN','DE'][i%4], openOrders: i%5, lastContact: Date.now()-i*1000*60*60*24 })
  return arr
}

function exportCSV(rows, filename='suppliers.csv'){
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

export default function UI92_SupplierPortalLite(){
  const [suppliers,setSuppliers] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [country,setCountry] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setSuppliers(mockSuppliers()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> suppliers.filter(s=> (!q || `${s.name} ${s.id}`.toLowerCase().includes(q.toLowerCase())) && (!country || s.country===country) ), [suppliers,q,country])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Supplier Portal (Lite)</h1>
          <p className="text-sm text-neutral-500">Light supplier directory and order summary.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search suppliers" aria-label="Search suppliers" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Country" value={country} onChange={e=>{setCountry(e.target.value); setPage(1)}} className="w-44">
            <option value="">All countries</option>
            <option>US</option>
            <option>VN</option>
            <option>CN</option>
            <option>DE</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Suppliers (${suppliers.length})`} subtitle="Directory">
          <div className="text-3xl font-semibold">{suppliers.length}</div>
          <div className="mt-2 text-sm text-neutral-500">With open orders {suppliers.filter(s=>s.openOrders>0).length}</div>
        </Card>

        <Card title="Avg rating">
          <div className="text-2xl font-semibold">{(suppliers.reduce((s,x)=>s+x.rating,0)/Math.max(1,suppliers.length)).toFixed(1)}</div>
          <div className="mt-2 text-sm text-neutral-500">Based on mock data</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setCountry(''); setPage(1) }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Contact supplier (mock)')}>Contact</Button>
          </div>
        </Card>
      </div>

      <Card title="Suppliers" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Country</th>
                <th className="p-2">Open Orders</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Last Contact</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.country}</td>
                  <td className="p-2">{r.openOrders}</td>
                  <td className="p-2">{r.rating}</td>
                  <td className="p-2">{new Date(r.lastContact).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Open orders:</strong> {selected.openOrders}</div>
              <div><strong>Rating:</strong> {selected.rating}</div>
              <div><strong>Country:</strong> {selected.country}</div>
              <div><strong>Last contact:</strong> {new Date(selected.lastContact).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
