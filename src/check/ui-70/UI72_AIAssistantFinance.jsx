import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Select, Button, Tag } from "../../ui-helpers.jsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function UI72_AIAssistantFinance() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);

  const mockFetch = () => new Promise((resolve) => setTimeout(() => resolve([
    { id: 's-001', type: 'anomaly', score: 0.92, ts: '2025-08-20', summary: 'Large revenue variance in APAC', details: 'Transactions spike in region X, investigate FX and booking dates.' },
    { id: 's-002', type: 'suggestion', score: 0.75, ts: '2025-08-18', summary: 'Suggested accrual reclassification', details: 'Reclassify accruals from account A to B for consistency.' },
    { id: 's-003', type: 'anomaly', score: 0.60, ts: '2025-08-15', summary: 'Unusual AR aging', details: 'Several invoices older than 90 days with partial payments.' },
  ]), 300));

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await mockFetch();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => suggestions.filter(s => (!filterType || s.type === filterType) && (!query || s.summary.toLowerCase().includes(query.toLowerCase()))), [suggestions, filterType, query]);

  const exportJSON = (payload, filename = 'finance_suggestions.json') => { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); };

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI72 — AI Assistant (Finance)</h1>
          <p className="mt-2 text-gray-600">Mock assistant providing anomaly detection and accounting suggestions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-40">
            <option value="">All types</option>
            <option value="anomaly">Anomaly</option>
            <option value="suggestion">Suggestion</option>
          </Select>
          <Input placeholder="Search summary" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
          <Button onClick={fetchData}>Refresh</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <Card title="Anomaly scores" subtitle="Recent">
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suggestions}>
                <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                <YAxis domain={[0,1]} tickFormatter={(v)=>Math.round(v*100)+'%'} />
                <Tooltip formatter={(v)=>Math.round(v*100)+'%'} />
                <Bar dataKey="score" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions" subtitle="Export / filters">
          <div className="flex flex-col gap-2">
            <Button onClick={() => exportJSON(suggestions)}>Export all</Button>
            <div className="text-xs text-gray-500">Total: {suggestions.length}</div>
          </div>
        </Card>

        <Card title="Suggestions" subtitle={`${filtered.length} items`} className="lg:col-span-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_,i)=> <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => (
                <div key={s.id} className="p-3 border rounded flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.summary}</div>
                    <div className="text-xs text-gray-500">{s.ts} • {s.type}</div>
                    <div className="text-xs mt-1 text-gray-600">{s.details.slice(0,100)}{s.details.length>100 ? '…' : ''}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => setDetail(s)}>Details</Button>
                    <Button onClick={() => exportJSON(s, `${s.id}.json`)} className="bg-blue-600 text-white">Export</Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-sm text-gray-500">No suggestions match.</div>}
            </div>
          )}
        </Card>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-11/12 max-w-lg p-4 bg-white rounded shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold">{detail.summary}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-500">Close</button>
            </div>
            <div className="mt-3 text-sm">
              <div><strong>ID:</strong> {detail.id}</div>
              <div><strong>Type:</strong> {detail.type}</div>
              <div><strong>Score:</strong> {Math.round(detail.score*100)}%</div>
              <div className="mt-2"><strong>Details:</strong><pre className="p-2 bg-gray-50 rounded text-xs">{detail.details}</pre></div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)); }}>Copy JSON</Button>
              <Button onClick={() => exportJSON(detail, `${detail.id}_detail.json`)}>Export</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
