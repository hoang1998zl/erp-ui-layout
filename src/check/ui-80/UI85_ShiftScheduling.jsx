import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button} from '../../ui-helpers'

const mockShifts = ()=>{
  const shifts=[]
  const teams=['A','B','C']
  for(let i=0;i<28;i++) shifts.push({ id:`SH-${7000+i}`, person:`Employee ${i+1}`, team: teams[i%teams.length], start: `2025-09-${(i%30)+1} 08:00`, end: `2025-09-${(i%30)+1} 17:00`, role: ['Operator','Lead'][i%2] })
  return shifts
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shift_schedule.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI85_ShiftScheduling(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockShifts()); setLoading(false) }, 420) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.person} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (!team || d.team===team) ), [data,q,team])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shift Scheduling</h1>
          <p className="text-sm text-neutral-500">Create and manage shift rosters with conflict detection.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search shifts" aria-label="Search shifts" value={q} onChange={e=>setQ(e.target.value)} />
          <Select aria-label="Team" value={team} onChange={e=>setTeam(e.target.value)} className="w-40">
            <option value="">All teams</option>
            <option value="A">Team A</option>
            <option value="B">Team B</option>
            <option value="C">Team C</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Shifts (${data.length})`} subtitle="Upcoming">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Conflicts: {0}</div>
        </Card>

        <Card title="Heatmap" subtitle="Coverage">
          <div className="h-28 flex items-center justify-center text-sm text-neutral-500">Coverage heatmap (placeholder)</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Auto-schedule (mock)')}>Auto-schedule</Button>
            <Button variant="ghost" onClick={()=>alert('Bulk edit (mock)')}>Bulk edit</Button>
          </div>
        </Card>
      </div>

      <Card title="Shifts" subtitle={`Showing ${filtered.length}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Person</th>
                <th className="p-2">Team</th>
                <th className="p-2">Role</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && filtered.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.person}</td>
                  <td className="p-2">{r.team}</td>
                  <td className="p-2">{r.role}</td>
                  <td className="p-2">{r.start}</td>
                  <td className="p-2">{r.end}</td>
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
              <h3 className="text-lg font-semibold">{selected.person}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Team:</strong> {selected.team}</div>
              <div><strong>Start:</strong> {selected.start}</div>
              <div><strong>End:</strong> {selected.end}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
