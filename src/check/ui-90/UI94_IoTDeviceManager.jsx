import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockDevices = ()=>{
  const arr=[]
  const types=['Sensor','Gateway','Actuator']
  for(let i=0;i<36;i++) arr.push({ id:`D-${9000+i}`, name:`Device ${i+1}`, type: types[i%types.length], status: i%5===0? 'Offline':'Online', lastSeen: Date.now()-i*1000*60*5, battery: 50+Math.round(Math.random()*50) })
  return arr
}

function exportCSV(rows, filename='devices.csv'){
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

export default function UI94_IoTDeviceManager(){
  const [devices,setDevices] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [type,setType] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setDevices(mockDevices()); setLoading(false) }, 320) },[])

  const filtered = useMemo(()=> devices.filter(d=> (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!type || d.type===type) ), [devices,q,type])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">IoT Device Manager</h1>
          <p className="text-sm text-neutral-500">Device inventory, status and lightweight telemetry (mock).</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search devices" aria-label="Search devices" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Type" value={type} onChange={e=>{setType(e.target.value); setPage(1)}} className="w-44">
            <option value="">All types</option>
            <option>Sensor</option>
            <option>Gateway</option>
            <option>Actuator</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Devices (${devices.length})`} subtitle="Inventory">
          <div className="text-3xl font-semibold">{devices.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Online {devices.filter(d=>d.status==='Online').length}</div>
        </Card>

        <Card title="Health">
          <div className="text-2xl font-semibold">{Math.round(devices.reduce((s,d)=>s+d.battery,0)/Math.max(1,devices.length))}%</div>
          <div className="mt-2 text-sm text-neutral-500">Avg battery</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setType(''); setPage(1) }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Ping devices (mock)')}>Ping</Button>
          </div>
        </Card>
      </div>

      <Card title="Devices" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Status</th>
                <th className="p-2">Last seen</th>
                <th className="p-2">Battery</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2"><Tag tone={r.status==='Online'?'green':'rose'}>{r.status}</Tag></td>
                  <td className="p-2">{new Date(r.lastSeen).toLocaleString()}</td>
                  <td className="p-2">{r.battery}%</td>
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
              <div><strong>Type:</strong> {selected.type}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Last seen:</strong> {new Date(selected.lastSeen).toLocaleString()}</div>
              <div><strong>Battery:</strong> {selected.battery}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
