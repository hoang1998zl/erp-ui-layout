import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Select } from '../../ui-helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function mockScenarios() {
  return new Promise((res) => {
    setTimeout(() => {
      const regions = ['APAC', 'EMEA', 'AMER'];
      const data = Array.from({ length: 34 }).map((_, i) => ({
        id: `EX-${3000 + i}`,
        name: `Expansion scenario ${i + 1}`,
        region: regions[i % regions.length],
        capex: Math.round(100 + Math.random() * 900),
        irr: (5 + Math.random() * 15).toFixed(1),
        status: ['Draft', 'Review', 'Approved'][i % 3],
        owner: ['Strategy', 'Finance', 'BizDev'][i % 3],
        created: new Date(Date.now() - i * 86400000).toISOString().slice(0,10),
        summary: `Scenario ${i+1} summary with high level assumptions.`
      }));
      res(data);
    }, 300);
  });
}

export default function UI98_ExpansionPlanner(){
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [drawer, setDrawer] = useState(null);

  useEffect(()=>{ let m=true; mockScenarios().then(d=>m && setItems(d)); return ()=>m=false },[]);

  const filtered = useMemo(()=>{
    let out = items;
    if(query){ const q=query.toLowerCase(); out = out.filter(i=>i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)); }
    if(region) out = out.filter(i=>i.region===region);
    return out;
  },[items,query,region]);

  const total = filtered.length; const pages = Math.max(1, Math.ceil(total/pageSize));
  useEffect(()=>{ if(page>pages) setPage(1); },[pages]);
  const pageData = useMemo(()=>filtered.slice((page-1)*pageSize, page*pageSize),[filtered,page,pageSize]);

  const exportCSV = ()=>{
    const csv = ['id,name,region,capex,irr,status,owner', ...pageData.map(r=>`${r.id},"${r.name}",${r.region},${r.capex},${r.irr},${r.status},${r.owner}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`expansion_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const trend = useMemo(()=>{
    return items.slice(0,10).map((it, idx)=>({ name: it.created, value: it.capex }));
  },[items]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expansion Planner</h1>
          <p className="text-sm text-neutral-500">Model scenarios, CAPEX and IRR for strategic initiatives.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input aria-label="Search scenarios" placeholder="Search by name or id" value={query} onChange={e=>setQuery(e.target.value)} />
          <Select aria-label="Filter by region" value={region} onChange={e=>setRegion(e.target.value)}>
            <option value="">All regions</option>
            <option>APAC</option>
            <option>EMEA</option>
            <option>AMER</option>
          </Select>
          <Button variant="primary" onClick={exportCSV}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Scenarios`} subtitle={`Total ${items.length}`}>
          <div style={{ height: 160 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Quick actions">
          <div className="flex flex-col gap-2">
            <Button onClick={()=>alert('Run scenario analysis (mock)')}>Run analysis</Button>
            <Button variant="ghost" onClick={()=>alert('Clone scenario (mock)')}>Clone</Button>
          </div>
        </Card>

        <Card title="Tips">
          <div className="text-sm text-neutral-600">Use scenarios to compare CAPEX and IRR assumptions across regions. Export results to share with stakeholders.</div>
        </Card>
      </div>

      <section aria-labelledby="scenario-table">
        <h2 id="scenario-table" className="sr-only">Scenarios table</h2>
        <div className="overflow-x-auto bg-white/95 border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Region</th>
                <th className="p-3">CAPEX (k)</th>
                <th className="p-3">IRR %</th>
                <th className="p-3">Status</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.region}</td>
                  <td className="p-3">{r.capex}</td>
                  <td className="p-3">{r.irr}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.owner}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button onClick={()=>setDrawer(r)}>Details</Button>
                      <Button variant="ghost" onClick={()=>alert('Export scenario (mock)')}>Export</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-neutral-500">Showing {(page-1)*pageSize+1} - {Math.min(page*pageSize, total)} of {total}</div>
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
              <p><strong>Region:</strong> {drawer.region}</p>
              <p><strong>CAPEX (k):</strong> {drawer.capex}</p>
              <p><strong>IRR %:</strong> {drawer.irr}</p>
              <p className="mt-2"><strong>Summary</strong></p>
              <p className="mt-1 text-neutral-600">{drawer.summary}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={()=>alert('Open financial model (mock)')}>Open model</Button>
              <Button variant="ghost" onClick={()=>navigator.clipboard?.writeText(JSON.stringify(drawer)) || alert('Copied')}>Copy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
