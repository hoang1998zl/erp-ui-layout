import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Select, Button, Tag } from "../../ui-helpers.jsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function UI73_SmartRecruitment() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const mockFetch = () => new Promise((resolve) => setTimeout(() => resolve([
    { id: 'c-001', name: 'Alice Tran', role: 'Product Manager', score: 0.88, stage: 'Phone Screen', applied: '2025-07-25', notes: 'Strong PM experience.' },
    { id: 'c-002', name: 'Bob Nguyen', role: 'Backend Engineer', score: 0.76, stage: 'Onsite', applied: '2025-07-20', notes: 'Great system design.' },
    { id: 'c-003', name: 'Carla Lee', role: 'Data Scientist', score: 0.82, stage: 'Offer', applied: '2025-07-10', notes: 'Excellent modeling skills.' },
  ]), 300));

  const fetchData = async () => { setLoading(true); try { const data = await mockFetch(); setCandidates(Array.isArray(data)?data:[]); } catch (e) {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => candidates.filter(c => (!stage || c.stage===stage) && (!query || c.name.toLowerCase().includes(query.toLowerCase()))), [candidates, stage, query]);

  const exportJSON = (payload, filename='candidates.json') => { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); };

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI73 — Smart Recruitment</h1>
          <p className="mt-2 text-gray-600">Candidate screening and ranking demo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={stage} onChange={(e)=>setStage(e.target.value)} className="w-40">
            <option value="">All stages</option>
            {[...new Set(candidates.map(c=>c.stage))].map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input placeholder="Search candidates" value={query} onChange={(e)=>setQuery(e.target.value)} className="w-64" />
          <Button onClick={fetchData}>Refresh</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <Card title="Scores distribution" subtitle="Candidates">
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={candidates.map(c=>({ name: c.name, score: Math.round(c.score*100) }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions" subtitle="Export / filters">
          <div className="flex flex-col gap-2">
            <Button onClick={() => exportJSON(candidates)}>Export candidates</Button>
            <div className="text-xs text-gray-500">Total: {candidates.length}</div>
          </div>
        </Card>

        <Card title={`Candidates (${filtered.length})`} className="lg:col-span-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_,i)=> <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="p-3 border rounded flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{c.name} <span className="text-xs text-gray-500">• {c.role}</span></div>
                    <div className="text-xs text-gray-500">Applied: {c.applied} • Stage: {c.stage}</div>
                    <div className="text-xs mt-1 text-gray-600">{c.notes}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => setDetail(c)}>Details</Button>
                    <Button onClick={() => exportJSON(c, `${c.id}.json`)} className="bg-blue-600 text-white">Export</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-11/12 max-w-lg p-4 bg-white rounded shadow-lg">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold">{detail.name}</h3>
                <button onClick={() => setDetail(null)} className="text-gray-500">Close</button>
              </div>
              <div className="mt-3 text-sm">
                <div><strong>ID:</strong> {detail.id}</div>
                <div><strong>Role:</strong> {detail.role}</div>
                <div><strong>Score:</strong> {Math.round(detail.score*100)}%</div>
                <div className="mt-2"><strong>Notes:</strong><pre className="p-2 bg-gray-50 rounded text-xs">{detail.notes}</pre></div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)); }}>Copy JSON</Button>
                <Button onClick={() => exportJSON(detail, `${detail.id}_candidate.json`)}>Export</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
