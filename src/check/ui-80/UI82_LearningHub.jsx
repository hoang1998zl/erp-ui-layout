import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Select, Button, Tag} from '../../ui-helpers'

const mockCourses = ()=>{
  const courses=[]
  const subjects=['Compliance','Product','Leadership','Tech']
  for(let i=0;i<30;i++) courses.push({ id:`C-${5000+i}`, title:`Course ${i+1}`, subject: subjects[i%subjects.length], duration: 1+Math.floor(Math.random()*8), enrollment: Math.floor(Math.random()*200), updated: Date.now()-i*1000*60*60*24 })
  return courses
}

function exportCSV(rows){
  if(!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'learning_courses.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI82_LearningHub(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setData(mockCourses()); setLoading(false) }, 380) },[])

  const filtered = useMemo(()=> data.filter(d=> (!q || `${d.id} ${d.title}`.toLowerCase().includes(q.toLowerCase())) && (!subject || d.subject===subject) ), [data,q,subject])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Learning Hub</h1>
          <p className="text-sm text-neutral-500">Internal courses, progress tracking and recommended learning paths.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search courses" aria-label="Search courses" value={q} onChange={e=>setQ(e.target.value)} />
          <Select aria-label="Subject" value={subject} onChange={e=>setSubject(e.target.value)} className="w-44">
            <option value="">All subjects</option>
            <option value="Compliance">Compliance</option>
            <option value="Product">Product</option>
            <option value="Leadership">Leadership</option>
            <option value="Tech">Tech</option>
          </Select>
          <Button onClick={()=>exportCSV(filtered)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Courses (${data.length})`} subtitle="Available learning">
          <div className="text-3xl font-semibold">{data.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Popular: {data.slice(0,3).map(c=>c.title).join(', ')}</div>
        </Card>

        <Card title="Progress" subtitle="Avg completion">
          <div className="h-28 flex items-center justify-center text-sm text-neutral-500">Progress visualization (placeholder)</div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Create course (mock)')}>Create</Button>
            <Button variant="ghost" onClick={()=>alert('Recommend path (mock)')}>Recommend</Button>
          </div>
        </Card>
      </div>

      <Card title="Courses" subtitle={`Showing ${filtered.length}`} actions={<Button onClick={()=>exportCSV(filtered)}>Export CSV</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Enrollment</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>}
              {!loading && filtered.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.subject}</td>
                  <td className="p-2">{r.duration} hrs</td>
                  <td className="p-2">{r.enrollment}</td>
                  <td className="p-2">{new Date(r.updated).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Subject:</strong> {selected.subject}</div>
              <div><strong>Duration:</strong> {selected.duration} hrs</div>
              <div><strong>Enrollment:</strong> {selected.enrollment}</div>
              <div><strong>Updated:</strong> {new Date(selected.updated).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
