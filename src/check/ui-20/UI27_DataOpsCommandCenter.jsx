import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ErrorBoundary from "../../components/ErrorBoundary";
import Skeleton from "../../components/Skeleton";

function StatusBadge({ s }){
  const map = {
    running: ['bg-emerald-600/10','text-emerald-300','Running'],
    paused: ['bg-yellow-600/10','text-amber-300','Paused'],
    failed: ['bg-rose-600/10','text-rose-300','Failed'],
    idle: ['bg-slate-700/10','text-slate-300','Idle']
  };
  const cls = map[s] || map.idle;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[0]} ${cls[1]}`}>{cls[2]}</span>;
}

export default function UI27_DataOpsCommandCenter(){
  const [loading, setLoading] = useState(true);
  const [throughput, setThroughput] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(()=>{
    // simulate fetch
    setLoading(true);
    const t = setTimeout(()=>{
      setThroughput(Array.from({length:24}).map((_,i)=>({ hour: `${i}:00`, rows: Math.floor(200 + Math.random()*800) })));
      setPipelines(Array.from({length:12}).map((_,i)=>({
        id: `pl-${1000 + i}`,
        owner: ['DataOps','ML','Infra','Analytics'][i%4],
        status: ['running','paused','idle','failed'][i%4],
        lastRun: `${Math.max(1, (i%12))}h ago`,
        sla: `${["1h","4h","24h"][i%3]}`,
        successRate: Math.floor(80 + (i%5)*4)
      })));
      setIncidents([
        { id: 'INC-901', sev: 'P1', createdAt: '2025-08-24 11:12', title: 'Pipeline pl-1003 failing on transform', ack: false },
        { id: 'INC-902', sev: 'P2', createdAt: '2025-08-25 09:02', title: 'Delayed runs for pl-1007', ack: false }
      ]);
      setLoading(false);
    }, 450);
    return ()=> clearTimeout(t);
  },[]);

  const filtered = useMemo(()=> pipelines, [pipelines]);

  const act = (id, action) => {
    setPipelines(prev => prev.map(p => p.id === id ? ({...p, status: action === 'toggle' ? (p.status === 'running' ? 'paused' : 'running') : p.status}) : p));
    // simulate retry effect
    if(action === 'retry'){
      // toast could be used; keep simple
      setTimeout(()=>{
        setPipelines(prev => prev.map(p => p.id === id ? ({...p, status: 'running'}) : p));
      }, 800);
    }
  };

  const ack = (id) => {
    setIncidents(prev => prev.map(i => i.id === id ? ({...i, ack: true}) : i));
  };

  return (
    <ErrorBoundary>
      <div className="p-6">
        <header className="mb-4">
          <h2 className="text-xl font-semibold">DataOps Command Center</h2>
          <div className="text-sm text-gray-400">Throughput, pipelines, and incidents overview</div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-9">
            <div className="p-4 mb-4 border rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-zinc-400">Throughput (rows / hour)</div>
                <div className="text-xs text-zinc-500">Live (mock)</div>
              </div>

              {loading ? (
                <Skeleton className="h-40" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={throughput}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="hour" stroke="#a1a1aa"/>
                      <YAxis stroke="#a1a1aa"/>
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                      <Area type="monotone" dataKey="rows" stroke="#10b981" fill="url(#g1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-hidden border rounded-2xl">
              <div className="px-4 py-3 text-sm border-b text-zinc-400">Pipelines</div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr className="text-zinc-400">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Owner</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Last Run</th>
                      <th className="px-4 py-2 text-left">SLA</th>
                      <th className="px-4 py-2 text-left">Success %</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-gray-200">
                        <td className="px-4 py-2 font-mono">{p.id}</td>
                        <td className="px-4 py-2">{p.owner}</td>
                        <td className="px-4 py-2"><StatusBadge s={p.status} /></td>
                        <td className="px-4 py-2">{p.lastRun}</td>
                        <td className="px-4 py-2">{p.sla}</td>
                        <td className="px-4 py-2">{p.successRate}%</td>
                        <td className="px-4 py-2 space-x-2 text-right">
                          <button onClick={() => act(p.id, "toggle")} className="px-3 py-1 rounded-lg">{p.status === "running" ? "Pause" : "Run"}</button>
                          <button onClick={() => act(p.id, "retry")} className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Retry</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Incidents panel */}
          <div className="col-span-12 xl:col-span-3">
            <div className="border rounded-2xl">
              <div className="px-4 py-3 text-sm border-b text-zinc-400">Incidents</div>
              <div className="p-3 space-y-2">
                {incidents.map((i) => (
                  <div key={i.id} className="p-3 border rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono">{i.id}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${i.sev === 'P1' ? 'text-rose-300 border-rose-700/40 bg-rose-500/10' : 'text-amber-300 border-amber-700/40 bg-amber-500/10'}`}>{i.sev}</span>
                      <span className="ml-auto text-[11px]">{i.createdAt}</span>
                    </div>
                    <div className="mt-1 text-sm">{i.title}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => ack(i.id)} disabled={i.ack} className="px-3 py-1 rounded-lg disabled:opacity-50">{i.ack ? 'Acknowledged' : 'Acknowledge'}</button>
                      <button className="px-3 py-1 rounded-lg">Open</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}