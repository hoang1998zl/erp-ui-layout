import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockOrders = ()=>{
  const arr=[]
  const statuses = ['Pending','Shipped','Delivered','Cancelled']
  for(let i=0;i<42;i++) arr.push({ id:`O-${5000+i}`, customer:`Customer ${1+(i%12)}`, total: (50+Math.round(Math.random()*950)), status: statuses[i%statuses.length], date: new Date(Date.now()-i*1000*60*60*24).toISOString(), items: 1+(i%5) })
  return arr
}

function exportCSV(rows, filename='customer_orders.csv'){
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

export default function UI91_CustomerPortal(){
  const [orders,setOrders] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [status,setStatus] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setOrders(mockOrders()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> orders.filter(o=> (!q || `${o.id} ${o.customer}`.toLowerCase().includes(q.toLowerCase())) && (!status || o.status===status) ), [orders,q,status])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Portal</h1>
          <p className="text-sm text-neutral-500">Customer orders, invoices and self-service actions (mock).</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search orders or customer" aria-label="Search orders" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Status" value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="w-48">
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Orders (${orders.length})`} subtitle="Snapshot">
          <div className="text-3xl font-semibold">{orders.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Open {orders.filter(o=>o.status==='Pending').length}</div>
        </Card>

        <Card title="Revenue">
          <div className="text-2xl font-semibold">${orders.reduce((s,o)=>s+o.total,0)}</div>
          <div className="mt-2 text-sm text-neutral-500">Total from mock orders</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setStatus(''); setPage(1) }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Send invoice (mock)')}>Send Invoice</Button>
          </div>
        </Card>
      </div>

      <Card title="Orders" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Items</th>
                <th className="p-2">Total</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.customer}</td>
                  <td className="p-2">{r.items}</td>
                  <td className="p-2">${r.total}</td>
                  <td className="p-2"><Tag tone={r.status==='Delivered'?'green':r.status==='Shipped'?'indigo':r.status==='Cancelled'?'rose':'amber'}>{r.status}</Tag></td>
                  <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold">Order {selected.id}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>Customer:</strong> {selected.customer}</div>
              <div><strong>Items:</strong> {selected.items}</div>
              <div><strong>Total:</strong> ${selected.total}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Date:</strong> {new Date(selected.date).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
