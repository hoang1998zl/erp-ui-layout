import React, { useEffect, useMemo, useState } from "react";
import { Card, Tag, Input, Select, Button } from "../../ui-helpers.jsx";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function UI68_HSECommandCenter() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const [detail, setDetail] = useState(null);

  // simulate realtime alerts
  useEffect(() => {
    let mounted = true;
    const seed = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      ts: new Date(Date.now() - (i * 60000)).toISOString(),
      title: ["Gas leak detected","Slip incident","Equipment failure","Near miss","Noise exceedance"][i % 5],
      severity: ["critical","high","medium","low"][i % 4],
      location: ["Plant A","Warehouse 3","Site 7","Plant B"][i % 4],
      acknowledged: false,
      details: "Auto-generated event for demo purposes",
    }));
    if (mounted) setAlerts(seed);

    const iv = setInterval(() => {
      if (paused) return;
      const s = ["critical","high","medium","low"][Math.floor(Math.random() * 4)];
      const titles = {
        critical: "Gas leak detected",
        high: "Chemical exposure report",
        medium: "Equipment failure",
        low: "Noise exceedance",
      };
      const a = {
        id: Date.now() + Math.random(),
        ts: new Date().toISOString(),
        title: titles[s],
        severity: s,
        location: ["Plant A","Warehouse 3","Site 7","Plant B"][Math.floor(Math.random() * 4)],
        acknowledged: false,
        details: `Simulated ${s} alert generated at ${new Date().toLocaleTimeString()}`,
      };
      setAlerts((prev) => [a, ...prev].slice(0, 200));
    }, 2500);

    return () => { mounted = false; clearInterval(iv); };
  }, [paused]);

  const acknowledge = (id) => setAlerts((s) => s.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  const clearAcknowledged = () => setAlerts((s) => s.filter((a) => !a.acknowledged));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => (filter === 'all' || a.severity === filter) && (q === '' || a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)));
  }, [alerts, filter, query]);

  const trend = useMemo(() => {
    // aggregate last 12 periods by severity count
    const points = Array.from({ length: 12 }).map((_, i) => ({
      period: `${11 - i}m`, critical: 0, high: 0, medium: 0, low: 0
    }));
    alerts.slice(0, 200).forEach((a) => {
      const minutesAgo = Math.min(11, Math.floor((Date.now() - new Date(a.ts)) / 60000));
      const idx = 11 - minutesAgo;
      if (idx >= 0 && idx < 12) points[idx][a.severity] = (points[idx][a.severity] || 0) + 1;
    });
    return points;
  }, [alerts]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), alerts: filtered }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `hse-alerts-${new Date().toISOString()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">HSE Command Center</h2>
          <div className="text-sm text-neutral-500">Realtime health, safety & environment alerts — simulated feed for demo.</div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Input placeholder="Search title or location" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
          <Button onClick={() => setPaused((p) => !p)} variant="ghost">{paused ? 'Resume' : 'Pause'}</Button>
          <Button onClick={exportJSON} variant="primary">Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Alert trend (12m)" subtitle="By severity">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" dot={false} />
                <Line type="monotone" dataKey="high" stroke="#f59e0b" dot={false} />
                <Line type="monotone" dataKey="medium" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="low" stroke="#10b981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Active alerts" subtitle={`${filtered.length} matching`}>
          <div className="space-y-2 max-h-64 overflow-auto">
            {filtered.map((a) => (
              <div key={a.id} className="p-3 border rounded bg-white/95">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs text-neutral-500 truncate">{a.ts} • {a.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag tone={a.severity === 'critical' ? 'rose' : a.severity === 'high' ? 'amber' : a.severity === 'medium' ? 'indigo' : 'slate'}>{a.severity}</Tag>
                  </div>
                </div>
                <div className="mt-2 text-sm text-neutral-700 truncate">{a.details}</div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => acknowledge(a.id)}>Acknowledge</Button>
                  <Button onClick={() => setDetail(a)} variant="ghost">Details</Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-sm text-neutral-500 p-3">No alerts match filters.</div>}
          </div>

          <div className="mt-3 flex gap-2">
            <Button onClick={() => setAlerts([])} variant="ghost">Clear feed</Button>
            <Button onClick={clearAcknowledged} variant="primary">Remove acknowledged</Button>
          </div>
        </Card>

        <Card title="Summary" subtitle="Recent counts">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><div>Last 12m critical</div><div className="font-medium text-rose-600">{trend.reduce((s,p)=>s+p.critical,0)}</div></div>
            <div className="flex items-center justify-between"><div>High</div><div className="font-medium text-amber-600">{trend.reduce((s,p)=>s+p.high,0)}</div></div>
            <div className="flex items-center justify-between"><div>Medium</div><div className="font-medium text-indigo-600">{trend.reduce((s,p)=>s+p.medium,0)}</div></div>
            <div className="flex items-center justify-between"><div>Low</div><div className="font-medium text-green-600">{trend.reduce((s,p)=>s+p.low,0)}</div></div>
          </div>
        </Card>
      </div>

      {detail && (
        <div className="fixed right-4 top-20 w-96 z-50">
          <Card title={`Alert — ${detail.title}`} subtitle={detail.location}>
            <div className="text-sm text-neutral-500">{detail.ts}</div>
            <div className="mt-2 text-sm">Severity: <strong>{detail.severity}</strong></div>
            <div className="mt-2 text-sm">Details: {detail.details}</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => { acknowledge(detail.id); setDetail(null); }}>Acknowledge</Button>
              <Button onClick={() => setDetail(null)} variant="ghost">Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
