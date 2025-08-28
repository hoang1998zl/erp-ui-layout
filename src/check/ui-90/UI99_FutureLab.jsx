import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Tag } from '../../ui-helpers';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function mockExperiments(){
  return new Promise((res)=>{
    setTimeout(()=>{
      const tech=['AI','Blockchain','IoT','Robotics','Quantum'];
      const data = Array.from({length:28}).map((_,i)=>({
        id:`FL-${4000+i}`,
        name:`Experiment ${i+1}`,
        tech: tech[i%tech.length],
        progress: Math.round(Math.random()*100),
        owner: ['Team A','Team B','Incubator'][i%3],
        created: new Date(Date.now()-i*86400000).toISOString().slice(0,10),
        summary:`Playground run ${i+1} of ${tech[i%tech.length]}`
      }));
      res(data);
    },200)
  })
}

export default function UI99_FutureLab(){
  const [items,setItems]=useState([]);
  const [query,setQuery]=useState('');
  const [tech,setTech]=useState('');
  const [page,setPage]=useState(1);
  const [pageSize]=useState(8);
  const [drawer,setDrawer]=useState(null);

  useEffect(()=>{ let m=true; mockExperiments().then(d=>m && setItems(d)); return ()=>m=false },[])

  const filtered = useMemo(()=>{
    let out = items;
    if(query){ const q=query.toLowerCase(); out = out.filter(i=>i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)); }
    if(tech) out = out.filter(i=>i.tech===tech);
    return out;
  },[items,query,tech])

  const total=filtered.length; const pages=Math.max(1,Math.ceil(total/pageSize));
  useEffect(()=>{ if(page>pages) setPage(1) },[pages])
  const pageData = useMemo(()=>filtered.slice((page-1)*pageSize,page*pageSize),[filtered,page,pageSize])

  const exportCSV = ()=>{
    const csv = ['id,name,tech,progress,owner,created', ...pageData.map(r=>`${r.id},"${r.name}",${r.tech},${r.progress},${r.owner},${r.created}`)].join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`futurelab_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const progressTrend = useMemo(()=>items.slice(0,10).map((it,idx)=>({ name: it.created, value: it.progress })),[items])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Future Lab</h1>
          <p className="text-sm text-neutral-500">Sandbox for experiments across emerging tech. Monitor progress and share results.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input aria-label="Search experiments" placeholder="Search by name or id" value={query} onChange={e=>setQuery(e.target.value)} />
          <select aria-label="Filter by tech" className="rounded-xl border px-3 py-2 text-sm" value={tech} onChange={e=>setTech(e.target.value)}>
            <option value="">All tech</option>
            <option>AI</option>
            <option>Blockchain</option>
            <option>IoT</option>
            <option>Robotics</option>
            <option>Quantum</option>
          </select>
          <Button variant="primary" onClick={exportCSV}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Experiments`} subtitle={`Total ${items.length}`}>
          <div style={{height:140}} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressTrend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0f172a" fill="#e6eef6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Launch new experiment (mock)')}>New experiment</Button>
            <Button variant="ghost" onClick={()=>alert('Share workspace (mock)')}>Share</Button>
          </div>
        </Card>

        <Card title="Tags">
          <div className="flex flex-wrap gap-2">
            <Tag>AI</Tag>
            <Tag>Blockchain</Tag>
            <Tag>IoT</Tag>
            <Tag>Robotics</Tag>
            <Tag>Quantum</Tag>
          </div>
        </Card>
      </div>

      <section aria-labelledby="experiments-table">
        <h2 id="experiments-table" className="sr-only">Experiments table</h2>
        <div className="overflow-x-auto bg-white/95 border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Tech</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.tech}</td>
                  <td className="p-3">{r.progress}%</td>
                  <td className="p-3">{r.owner}</td>
                  <td className="p-3">{r.created}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button onClick={()=>setDrawer(r)}>Details</Button>
                      <Button variant="ghost" onClick={()=>alert('Export experiment (mock)')}>Export</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-neutral-500">Showing {(page-1)*pageSize+1} - {Math.min(page*pageSize,total)} of {total}</div>
          <div className="flex items-center gap-2">
            <Button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
            <div className="px-3 py-1 rounded-xl border text-sm">{page} / {pages}</div>
            <Button onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</Button>
          </div>
        </div>
      </section>

      {drawer && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full sm:w-3/5 rounded-xl shadow-xl p-4" onClick={e=>e.stopPropagation()}>
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{drawer.id} — {drawer.name}</h3>
              <Button onClick={()=>setDrawer(null)}>Close</Button>
            </header>
            <div className="mt-3 text-sm text-neutral-700">
              <p><strong>Tech:</strong> {drawer.tech}</p>
              <p><strong>Progress:</strong> {drawer.progress}%</p>
              <p className="mt-2"><strong>Summary</strong></p>
              <p className="mt-1 text-neutral-600">{drawer.summary}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={()=>alert('Open experiment details (mock)')}>Open</Button>
              <Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(JSON.stringify(drawer)) || alert('Copied')}>Copy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
