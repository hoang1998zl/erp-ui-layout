import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button} from '../../ui-helpers'
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts'

const mockReports = ()=>{
  const arr = []
  const teams = ['Engineering','Sales','HR','Ops']
  for(let i=0;i<48;i++) arr.push({ id: `W-${3000+i}`, score: Math.round(60 + Math.random()*40), mood: ['Good','Neutral','Poor'][i%3], team: teams[i%teams.length], date: Date.now() - i*1000*60*60*24 })
  return arr
}

function exportCSV(rows, filename='wellbeing_reports.csv'){
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

export default function UI90_WellbeingDashboard(){
  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [team,setTeam] = useState('')
  const [page,setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockReports()); setLoading(false) }, 300) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.id} ${d.team}`.toLowerCase().includes(q.toLowerCase())) && (!team || d.team===team) ), [data,q,team])
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/pageSize))
  const rows = filtered.slice((page-1)*pageSize, page*pageSize)

  const trend = useMemo(()=>{
    const groups = {}
    data.slice(0,20).reverse().forEach((d,i)=>{ const k = new Date(d.date).toLocaleDateString(); groups[k] = (groups[k]||0) + d.score })
    return Object.keys(groups).map(k=>({date:k, value: Math.round(groups[k]/1)}))
  },[data])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wellbeing Dashboard</h1>
          <p className="text-sm text-neutral-500">Employee wellbeing metrics, sentiment and trends.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search reports" aria-label="Search wellbeing reports" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} />
          <Select aria-label="Team" value={team} onChange={e=>{setTeam(e.target.value); setPage(1)}} className="w-44">
            <option value="">All teams</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>HR</option>
            <option>Ops</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Avg Score`} subtitle="Last 30">
          <div className="text-3xl font-semibold">{data.length? Math.round(data.reduce((s,x)=>s+x.score,0)/data.length) : '—'}</div>
          <div className="mt-2 text-sm text-neutral-500">Reports {data.length}</div>
        </Card>

        <Card title="Sentiment">
          <div className="text-sm">
            <div>Good: {data.filter(d=>d.mood==='Good').length}</div>
            <div className="mt-2">Neutral: {data.filter(d=>d.mood==='Neutral').length}</div>
            <div className="mt-2">Poor: {data.filter(d=>d.mood==='Poor').length}</div>
          </div>
        </Card>

        <Card title="Trend">
          <div style={{height:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip />
                <Line dataKey="value" stroke="#60A5FA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Reports" subtitle={`Showing ${rows.length} of ${total}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Score</th>
                <th className="p-2">Mood</th>
                <th className="p-2">Team</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>}
              {!loading && rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.score}</td>
                  <td className="p-2">{r.mood}</td>
                  <td className="p-2">{r.team}</td>
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
              <h3 className="text-lg font-semibold">Report {selected.id}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>Score:</strong> {selected.score}</div>
              <div><strong>Mood:</strong> {selected.mood}</div>
              <div><strong>Team:</strong> {selected.team}</div>
              <div><strong>Date:</strong> {new Date(selected.date).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
