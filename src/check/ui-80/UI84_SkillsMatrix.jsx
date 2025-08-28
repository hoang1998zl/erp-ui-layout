import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockSkills = ()=>{
  const skills=[]
  const people = 30
  const skillNames = ['React','Node','SQL','Design','PM']
  for(let i=0;i<people;i++){
    const person = { id:`E-${200+i}`, name:`Employee ${i+1}`, skills: {} }
    skillNames.forEach(s=> person.skills[s] = Math.round(Math.random()*5))
    skills.push(person)
  }
  return {people:skills, skillNames}
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'skills_matrix.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI84_SkillsMatrix(){
  const [data, setData] = useState({people:[], skillNames:[]})
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockSkills()); setLoading(false) }, 420) },[])

  const filtered = useMemo(()=> data.people.filter(p=> !q || `${p.name} ${p.id}`.toLowerCase().includes(q.toLowerCase())), [data,q])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Skills Matrix</h1>
          <p className="text-sm text-neutral-500">Skills inventory and gap analysis for teams.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search people" aria-label="Search people" value={q} onChange={e=>setQ(e.target.value)} />
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`People (${data.people.length})`} subtitle="Skill coverage">
          <div className="text-3xl font-semibold">{data.people.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Skills tracked: {data.skillNames.join(', ')}</div>
        </Card>

        <Card title="Matrix preview">
          <div className="h-28 flex items-center justify-center text-sm text-neutral-500">Matrix heatmap (placeholder)</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Generate training plan (mock)')}>Plan</Button>
            <Button variant="ghost" onClick={()=>alert('Export skill gaps (mock)')}>Export gaps</Button>
          </div>
        </Card>
      </div>

      <Card title="People & skills" subtitle={`Showing ${filtered.length}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                {data.skillNames.map(s=> <th key={s} className="p-2">{s}</th>)}
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3+data.skillNames.length} className="p-6 text-center">Loading...</td></tr>}
              {!loading && filtered.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.name}</td>
                  {data.skillNames.map(s=> <td key={s} className="p-2">{r.skills[s]}</td>)}
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
              <div className="mt-2 p-3 bg-neutral-50 rounded">Skills breakdown: {Object.entries(selected.skills).map(([k,v])=> `${k}:${v}`).join(', ')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
