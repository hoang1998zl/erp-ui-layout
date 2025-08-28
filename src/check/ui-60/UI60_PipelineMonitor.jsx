import React, { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function UI60_PipelineMonitor() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshRef = useRef(null);

  const mockFetch = () => new Promise((resolve) => setTimeout(() => resolve([
    { id: "pl-001", name: "daily-ingest", status: "Running", lastRun: "2025-08-25 04:00", owner: "etl-team", duration: "12m" },
    { id: "pl-002", name: "etl-sales", status: "Failed", lastRun: "2025-08-25 03:30", owner: "etl-team", duration: "3m" },
  ]), 400));

  const fetchPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch();
      setPipelines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh handler
  useEffect(() => {
    if (autoRefresh) {
      refreshRef.current = setInterval(() => fetchPipelines(), 5000);
    } else {
      clearInterval(refreshRef.current);
    }
    return () => clearInterval(refreshRef.current);
  }, [autoRefresh]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => setSelectedIds(new Set(pipelines.map(p => p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const mockRetryPipeline = (p) => {
    // Simulate a retry by marking it Running and updating lastRun/duration
    setPipelines((list) => list.map((x) => x.id === p.id ? { ...x, status: 'Running', lastRun: new Date().toISOString().slice(0,16).replace('T',' '), duration: '0m' } : x));
  };

  const bulkRetry = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPipelines((list) => list.map((p) => ids.includes(p.id) ? { ...p, status: 'Running', lastRun: new Date().toISOString().slice(0,16).replace('T',' '), duration: '0m' } : p));
    clearSelection();
  };

  const bulkAcknowledge = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPipelines((list) => list.map((p) => ids.includes(p.id) ? { ...p, status: p.status === 'Failed' ? 'Acknowledged' : p.status } : p));
    clearSelection();
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const exportJSON = (payload, filename = "pipelines.json") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => exportJSON({ exportedAt: new Date().toISOString(), pipelines }, `pipelines_${new Date().toISOString()}.json`);
  const exportOne = (p) => exportJSON({ exportedAt: new Date().toISOString(), pipeline: p }, `pipeline_${p.id}_${new Date().toISOString()}.json`);

  // Derived metric: simple trend for chart
  const trendData = pipelines.map((p, i) => ({ name: p.name, value: parseInt((p.duration || '0m').replace('m','')) || (i+1) }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">UI60 — Pipeline Monitor</h1>
      <p className="mt-2 text-gray-600">CI/CD and data pipeline status overview.</p>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">Pipelines</div>
        <div className="flex gap-2">
          <button onClick={fetchPipelines} aria-label="Refresh pipelines" className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
          <button onClick={() => setAutoRefresh(a => !a)} aria-pressed={autoRefresh} className={`px-3 py-1 rounded ${autoRefresh ? 'bg-green-100' : 'bg-gray-100'}`}>{autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}</button>
          <button onClick={exportAll} aria-label="Export all pipelines" className="px-3 py-1 text-white bg-blue-600 rounded">Export JSON</button>
        </div>
      </div>

      {/* Trend chart */}
      <div className="p-4 mt-4 bg-white rounded shadow-sm">
        <div className="mb-2 text-sm text-neutral-500">Recent duration trend (minutes)</div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between p-3 mt-4 text-sm text-red-500 bg-white rounded shadow-sm">
          <div>{error}</div>
          <div><button onClick={fetchPipelines} className="px-2 py-1 bg-gray-100 rounded">Retry</button></div>
        </div>
      ) : (
        <div className="p-4 mt-4 bg-white rounded shadow-sm">
          <div role="table" aria-label="Pipelines table">
            {pipelines.map((p) => (
              <div key={p.id} role="row" className="flex items-center justify-between p-3 border rounded" aria-selected={selectedIds.has(p.id)}>
                <div className="flex items-center gap-3">
                  <input aria-label={`Select ${p.name}`} type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  <div>
                    <button onClick={() => setDetail(p)} className="text-sm font-medium text-left text-blue-600 underline" aria-label={`View details for ${p.name}`}>{p.name}</button>
                    <div className="text-xs text-gray-500">{p.lastRun} — {p.owner}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`text-sm ${p.status === 'Running' ? 'text-green-600' : p.status === 'Failed' ? 'text-red-600' : 'text-gray-600'}`}>{p.status}</div>
                  <div className="flex gap-2">
                    <button onClick={() => mockRetryPipeline(p)} className="px-2 py-1 bg-gray-100 rounded">Retry</button>
                    <button onClick={() => { setPipelines((list) => list.map(x => x.id === p.id ? { ...x, status: 'Acknowledged' } : x)); }} className="px-2 py-1 bg-gray-100 rounded">Acknowledge</button>
                    <button onClick={() => exportOne(p)} className="px-2 py-1 text-white bg-blue-600 rounded">Export</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

           <div className="mt-3 text-xs text-gray-500">Tip: click a pipeline to view details and export its run metadata.</div>

          <div className="flex gap-2 mt-3">
            <button onClick={selectAllVisible} className="px-3 py-1 bg-gray-100 rounded">Select all</button>
            <button onClick={clearSelection} className="px-3 py-1 bg-gray-100 rounded">Clear selection</button>
            <button onClick={bulkRetry} className="px-3 py-1 text-white bg-green-600 rounded">Retry selected</button>
            <button onClick={bulkAcknowledge} className="px-3 py-1 bg-yellow-100 rounded">Acknowledge selected</button>
          </div>
         </div>
       )}

       {detail && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
           <div className="w-11/12 max-w-md p-4 bg-white rounded shadow-lg">
             <div className="flex items-start justify-between">
               <h3 className="text-lg font-bold">Pipeline — {detail.name}</h3>
               <button onClick={() => setDetail(null)} className="text-gray-500">Close</button>
             </div>
             <div className="mt-3 text-sm">
               <div><strong>ID:</strong> {detail.id}</div>
               <div><strong>Status:</strong> {detail.status}</div>
               <div><strong>Last Run:</strong> {detail.lastRun}</div>
               <div><strong>Owner:</strong> {detail.owner}</div>
               <div><strong>Duration:</strong> {detail.duration}</div>
             </div>
             <div className="flex justify-end gap-2 mt-4">
               <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)); }} className="px-3 py-1 bg-gray-100 rounded">Copy JSON</button>
               <button onClick={() => exportOne(detail)} className="px-3 py-1 text-white bg-blue-600 rounded">Export</button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
