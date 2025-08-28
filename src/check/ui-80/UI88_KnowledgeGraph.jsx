import React, {useEffect, useMemo, useState} from "react";
import {Card, Input, Button} from '../../ui-helpers'

const mockKG = ()=>{
  const nodes=[]
  const edges=[]
  for(let i=0;i<20;i++) nodes.push({ id:`N-${i}`, label:`Entity ${i}`, type: i%3===0? 'Person' : i%3===1? 'Product':'Org', updated: Date.now()-i*1000*60*60*24 })
  for(let i=0;i<28;i++) edges.push({ id:`E-${i}`, from:`N-${Math.floor(Math.random()*20)}`, to:`N-${Math.floor(Math.random()*20)}`, rel: ['owns','reports','related'][i%3] })
  return {nodes,edges}
}

function exportJSON(obj, filename='knowledge_graph.json'){
  const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function UI88_KnowledgeGraph(){
  const [kg,setKg] = useState({nodes:[],edges:[]})
  const [loading,setLoading] = useState(true)
  const [q,setQ] = useState('')
  const [selected,setSelected] = useState(null)

  useEffect(()=>{ setLoading(true); setTimeout(()=>{ setKg(mockKG()); setLoading(false) }, 320) },[])

  const filteredNodes = useMemo(()=> kg.nodes.filter(n=> !q || `${n.label} ${n.id}`.toLowerCase().includes(q.toLowerCase())), [kg,q])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          <p className="text-sm text-neutral-500">Lightweight exploration of entities and their relationships.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Search nodes" aria-label="Search nodes" value={q} onChange={e=>setQ(e.target.value)} />
          <Button onClick={()=>exportJSON(kg)}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Nodes (${kg.nodes.length})`} subtitle="Overview">
          <div className="text-3xl font-semibold">{kg.nodes.length}</div>
          <div className="mt-2 text-sm text-neutral-500">Edges {kg.edges.length}</div>
        </Card>

        <Card title="Top types">
          <ul className="text-sm space-y-1">
            {['Person','Product','Org'].map(t=> (
              <li key={t} className="flex items-center justify-between"><span>{t}</span><span className="text-neutral-500">{kg.nodes.filter(n=>n.type===t).length}</span></li>
            ))}
          </ul>
        </Card>

        <Card title="Preview">
          <div className="text-sm text-neutral-500">Graph preview placeholder — integrate vis-lib when needed.</div>
          <div className="mt-2 h-36 bg-gradient-to-br from-white to-neutral-50 rounded flex items-center justify-center text-sm text-neutral-400">Nodes: {filteredNodes.length}</div>
        </Card>
      </div>

      <Card title="Nodes" subtitle={`Showing ${filteredNodes.length}`} actions={<Button onClick={()=>exportJSON(kg)}>Export JSON</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="p-2">ID</th>
                <th className="p-2">Label</th>
                <th className="p-2">Type</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>}
              {!loading && filteredNodes.map(n=> (
                <tr key={n.id} className="border-t">
                  <td className="p-2 font-mono">{n.id}</td>
                  <td className="p-2">{n.label}</td>
                  <td className="p-2">{n.type}</td>
                  <td className="p-2">{new Date(n.updated).toLocaleDateString()}</td>
                  <td className="p-2"><div className="flex gap-2"><Button onClick={()=>setSelected(n)}>View</Button><Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(n.id)}>Copy</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 z-40 flex justify-center items-start p-6" onClick={()=>setSelected(null)}>
          <div className="w-full md:w-2/3 lg:w-1/3 bg-white p-4 rounded-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.label}</h3>
              <Button onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 space-y-3">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Type:</strong> {selected.type}</div>
              <div><strong>Updated:</strong> {new Date(selected.updated).toLocaleString()}</div>
              <div className="text-sm text-neutral-500">Related edges: {kg.edges.filter(e=> e.from===selected.id || e.to===selected.id).length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
