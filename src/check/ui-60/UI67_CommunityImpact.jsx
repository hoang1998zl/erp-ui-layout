import React, { useEffect, useMemo, useState } from "react";
import { Card, Tag, Input, Select, Button } from "../../ui-helpers.jsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function UI67_CommunityImpact(){
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('All');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(()=>{
    let mounted = true;
    setLoading(true);
    const t = setTimeout(()=>{
      if(!mounted) return;
      const sample = Array.from({length:20}).map((_,i)=>({
        id: i+1,
        name: `Local Outreach ${i+1}`,
        region: ['Hanoi','HCMC','Da Nang','Can Tho'][i%4],
        participants: Math.round(20 + Math.random()*180),
        sentiment: ['Positive','Neutral','Negative'][i%3],
        impact: Math.round(10 + Math.random()*90),
      }));
      setProjects(sample);
      setLoading(false);
    },500);
    return ()=>{ mounted=false; clearTimeout(t); }
  },[]);

  const filtered = useMemo(()=>projects.filter(p=>{
    if(region!=='All' && p.region!==region) return false;
    if(!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || String(p.participants).includes(q);
  }),[projects,region,search]);

  const summary = useMemo(()=>{
    const total = filtered.length;
    const participants = filtered.reduce((s,p)=>s+p.participants,0);
    const bySent = filtered.reduce((acc,p)=>{acc[p.sentiment]=(acc[p.sentiment]||0)+1; return acc;},{})
    return {total, participants, bySent};
  },[filtered]);

  if(loading) return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-3">Community Impact</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0,1,2].map(i=> <Card key={i} title="Loading"><div className="h-12 animate-pulse bg-neutral-100 rounded"/></Card>)}
      </div>
    </div>
  );

  if(error) return (
    <div className="p-6"><Card title="Error"><div className="text-rose-600">{String(error)}</div></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Community Impact</h2>
          <div className="text-sm text-neutral-500">Track outreach events, attendance, sentiment and community value.</div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={region} onChange={(e)=>setRegion(e.target.value)} className="w-40">
            <option>All</option>
            <option>Hanoi</option>
            <option>HCMC</option>
            <option>Da Nang</option>
            <option>Can Tho</option>
          </Select>
          <Input placeholder="Search events" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-56" />
          <Button onClick={()=>{ const rows=[['id','name','region','participants','sentiment','impact'],...filtered.map(r=>[r.id,r.name,r.region,r.participants,r.sentiment,r.impact])]; const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='community-impact.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }}>Export</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Events (${summary.total})`} subtitle="Filtered">
          <div className="text-sm text-neutral-500">Total participants: <strong>{summary.participants}</strong></div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2"><Tag tone="green">Positive</Tag><div className="text-sm">{summary.bySent.Positive || 0}</div></div>
            <div className="flex items-center gap-2"><Tag tone="slate">Neutral</Tag><div className="text-sm">{summary.bySent.Neutral || 0}</div></div>
            <div className="flex items-center gap-2"><Tag tone="rose">Negative</Tag><div className="text-sm">{summary.bySent.Negative || 0}</div></div>
          </div>
        </Card>

        <Card title="Participants distribution" subtitle="Per event">
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered.map(p=>({name:p.name, participants:p.participants})).slice(0,8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Map" subtitle="Event locations">
          <div className="h-44 bg-neutral-50 rounded flex items-center justify-center text-xs text-neutral-400">Map placeholder — integrate leaflet/tiles as needed</div>
        </Card>
      </section>

      <section>
        <Card title="Events list" subtitle="Recent & filtered">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500">
                <tr>
                  <th className="py-2">Event</th>
                  <th className="py-2">Region</th>
                  <th className="py-2">Participants</th>
                  <th className="py-2">Sentiment</th>
                  <th className="py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=> (
                  <tr key={p.id} className="border-t">
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">{p.region}</td>
                    <td className="py-3">{p.participants}</td>
                    <td className="py-3"><Tag tone={p.sentiment==='Positive'?'green':p.sentiment==='Neutral'?'slate':'rose'}>{p.sentiment}</Tag></td>
                    <td className="py-3">{p.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
