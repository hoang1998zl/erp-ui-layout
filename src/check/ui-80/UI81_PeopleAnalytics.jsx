import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'
import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from 'recharts'

const mockPeople = ()=>{
  const arr=[]
  const depts=['Engineering','Sales','HR','Ops']
  for(let i=0;i<48;i++) arr.push({ id:`P-${1000+i}`, name:`Employee ${i+1}`, dept:depts[i%depts.length], tenure: Math.round(Math.random()*10), gender: ['male','female','other'][i%3], joined: Date.now()-i*1000*60*60*24*30 })
  return arr
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'people_analytics.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI81_PeopleAnalytics(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockPeople()); setLoading(false) }, 420) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!dept || d.dept===dept) ), [data,q,dept])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const genderDist = useMemo(()=>{
    const c = {male:0,female:0,other:0}
    data.forEach(d=> c[d.gender] = (c[d.gender]||0)+1)
    return [{name:'Male', value:c.male},{name:'Female', value:c.female},{name:'Other', value:c.other}]
  },[data])
  const COLORS=['#60A5FA','#f97316','#a78bfa']

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">People Analytics</h1>
          <p className="text-sm text-neutral-500">Workforce metrics, DEI and turnover insights.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search people" aria-label="Search people" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Department" value={dept} onChange={e=>{setDept(e.target.value); setPage(1)}} className="w-44">
            <option value="">All departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Ops">Ops</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Workforce (${data.length})`} subtitle="Snapshot">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Avg tenure {data.length? (Math.round(data.reduce((s,x)=>s+x.tenure,0)/data.length*10)/10) : 0} yrs</div>
        </Card>

        <Card title="Gender distribution">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderDist} dataKey="value" nameKey="name" innerRadius={30} outerRadius={50}>
                  {genderDist.map((entry, idx)=>(<Cell key={idx} fill={COLORS[idx%COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>{ setQ(''); setDept('') }}>Reset</Button>
            <Button variant="primary" onClick={()=>alert('Run attrition simulation (mock)')}>Simulate</Button>
          </div>
        </Card>
      </div>

      <Card title="People" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Department</th>
                <th className="p-2">Tenure</th>
                <th className="p-2">Gender</th>
                <th className="p-2">Joined</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.dept}</td>
                  <td className="p-2">{r.tenure} yrs</td>
                  <td className="p-2"><Tag tone={r.gender==='male'?'slate':r.gender==='female'?'indigo':'rose'}>{r.gender}</Tag></td>
                  <td className="p-2">{new Date(r.joined).toLocaleDateString()}</td>
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
              <div><strong>Department:</strong> {selected.dept}</div>
              <div><strong>Tenure:</strong> {selected.tenure} yrs</div>
              <div><strong>Gender:</strong> {selected.gender}</div>
              <div><strong>Joined:</strong> {new Date(selected.joined).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
