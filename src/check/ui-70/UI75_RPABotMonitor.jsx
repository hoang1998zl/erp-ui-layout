import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Tag } from "../../ui-helpers.jsx";

export default function UI75_RPABotMonitor() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detail, setDetail] = useState(null);

  const mockFetch = () => new Promise((resolve) => setTimeout(() => resolve([
    { id: 'b-01', name: 'InvoiceBot', status: 'Idle', lastRun: '2025-08-22 10:00', errors: 0 },
    { id: 'b-02', name: 'PayrollBot', status: 'Error', lastRun: '2025-08-23 02:12', errors: 3 },
    { id: 'b-03', name: 'OnboardBot', status: 'Running', lastRun: '2025-08-23 04:30', errors: 0 },
  ]), 300));

  const fetchData = async () => { setLoading(true); try { const d = await mockFetch(); setBots(d); } catch(e){} finally{ setLoading(false);} };
  useEffect(() => { fetchData(); }, []);

  const toggleSelect = (id) => setSelectedIds(prev=>{ const next=new Set(prev); next.has(id)?next.delete(id):next.add(id); return next; });
  const selectAll = () => setSelectedIds(new Set(bots.map(b=>b.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const retryBot = (id) => setBots(list => list.map(b => b.id===id ? { ...b, status: 'Running', lastRun: new Date().toISOString().slice(0,16).replace('T',' ') } : b));
  const bulkRetry = () => { const ids = Array.from(selectedIds); if(ids.length===0) return; setBots(list=> list.map(b => ids.includes(b.id) ? { ...b, status: 'Running', lastRun: new Date().toISOString().slice(0,16).replace('T',' ') } : b)); clearSelection(); };

  const exportLogs = (id) => { const bot = bots.find(b=>b.id===id); const payload = { id: bot.id, name: bot.name, logs: [{ts: new Date().toISOString(), msg: 'mock log'}] }; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`bot_logs_${id}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">UI75 — RPA Bot Monitor</h1>
      <p className="mt-2 text-gray-600">Monitor RPA bots, retry failed runs, and export logs.</p>

      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
        <Card title="Bots" className="lg:col-span-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_,i)=> <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {bots.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-start gap-3">
                    <input aria-label={`Select ${b.name}`} type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} />
                    <div>
                      <button onClick={() => setDetail(b)} className="text-left font-medium text-blue-600 underline">{b.name}</button>
                      <div className="text-xs text-gray-500">Last run: {b.lastRun}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag tone={b.status==='Running'?'green':b.status==='Error'?'rose':'slate'}>{b.status}</Tag>
                    <div className="flex gap-2">
                      <Button onClick={() => retryBot(b.id)}>Retry</Button>
                      <Button onClick={() => exportLogs(b.id)} className="bg-blue-600 text-white">Export logs</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-2">
            <Button onClick={selectAll}>Select all</Button>
            <Button onClick={clearSelection}>Clear</Button>
            <Button onClick={bulkRetry} className="bg-green-600 text-white">Retry selected</Button>
            <div className="text-xs text-gray-500">Selected: {selectedIds.size}</div>
          </div>
        </Card>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-11/12 max-w-md p-4 bg-white rounded shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-500">Close</button>
            </div>
            <div className="mt-3 text-sm">
              <div><strong>ID:</strong> {detail.id}</div>
              <div><strong>Status:</strong> {detail.status}</div>
              <div><strong>Last run:</strong> {detail.lastRun}</div>
              <div><strong>Errors:</strong> {detail.errors}</div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)); }}>Copy JSON</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
