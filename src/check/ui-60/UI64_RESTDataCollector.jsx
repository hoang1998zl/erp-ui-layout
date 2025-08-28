import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Select, Button, Tag } from "../../ui-helpers.jsx";

function nowISO() {
  return new Date().toISOString();
}

function mockSendRequest({ method, url, headers, body }) {
  // Simulate a REST call with random success/error and mock payloads
  return new Promise((resolve, reject) => {
    const latency = 300 + Math.random() * 700;
    setTimeout(() => {
      // Basic validation
      if (!url) return reject(new Error("Missing URL"));
      // Simulate network error 8% of time
      if (Math.random() < 0.08) return reject(new Error("Network error"));

      const status = Math.random() < 0.85 ? 200 : 500;
      const json = {
        url,
        method,
        timestamp: nowISO(),
        echo: { headers: headers || {}, body: body || null },
        syntheticValue: Math.round(Math.random() * 1000),
      };

      resolve({ status, body: JSON.stringify(json, null, 2) });
    }, latency);
  });
}

export default function UI64_RESTDataCollector() {
  const [endpoints, setEndpoints] = useState(() => [
    { id: 1, name: "Inventory API (mock)", url: "https://api.example.com/inventory", method: "GET" },
    { id: 2, name: "Emissions ingest", url: "https://api.example.com/ingest/emissions", method: "POST" },
  ]);

  const [selectedId, setSelectedId] = useState(endpoints[0]?.id || null);
  const selected = useMemo(() => endpoints.find((e) => e.id === selectedId) || null, [endpoints, selectedId]);

  const [method, setMethod] = useState(selected?.method || "GET");
  const [url, setUrl] = useState(selected?.url || "");
  const [headersText, setHeadersText] = useState('{"content-type":"application/json"}');
  const [bodyText, setBodyText] = useState("");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync form when selected endpoint changes
  useEffect(() => {
    if (selected) {
      setMethod(selected.method || "GET");
      setUrl(selected.url || "");
    }
  }, [selected]);

  const sendRequest = async (opts = {}) => {
    const payload = {
      method: opts.method ?? method,
      url: opts.url ?? url,
      headers: opts.headers ?? (() => {
        try { return JSON.parse(headersText); } catch { return {}; }
      })(),
      body: opts.body ?? (() => {
        try { return bodyText ? JSON.parse(bodyText) : null; } catch { return bodyText; }
      })(),
    };

    setLoading(true);
    setError(null);
    try {
      const res = await mockSendRequest(payload);
      const entry = {
        id: Date.now() + Math.random(),
        ts: nowISO(),
        method: payload.method,
        url: payload.url,
        status: res.status,
        response: res.body,
      };
      setLogs((s) => [entry, ...s].slice(0, 500));
    } catch (err) {
      const entry = {
        id: Date.now() + Math.random(),
        ts: nowISO(),
        method: payload.method,
        url: payload.url,
        status: null,
        response: String(err.message),
        error: true,
      };
      setLogs((s) => [entry, ...s].slice(0, 500));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEndpoint = () => {
    const id = Date.now();
    const newEp = { id, name: `Custom ${id}`, url: url || "https://api.example.com/new", method: method || "GET" };
    setEndpoints((s) => [newEp, ...s]);
    setSelectedId(id);
  };

  const removeEndpoint = (id) => setEndpoints((s) => s.filter((e) => e.id !== id));

  // Table state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => (q ? l.url.toLowerCase().includes(q) || (l.response || "").toLowerCase().includes(q) : true));
  }, [logs, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);

  const replay = (entry) => {
    // replay uses raw stored request info
    try {
      sendRequest({ method: entry.method, url: entry.url });
    } catch (err) {
      setError(String(err));
    }
  };

  const copyResponse = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setLogs((s) => [{ id: Date.now()+1, ts: nowISO(), method: "COPY", url: "clipboard", status: 200, response: "copied" }, ...s].slice(0,500));
    } catch (err) {
      setError("Copy failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI64_RESTDataCollector</h1>
          <div className="max-w-xl mt-2 text-sm text-gray-600">
            Tool for configuring and testing REST ingestion endpoints. Build a request, send it, and review logs/responses.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))} className="w-full sm:w-64">
            {endpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>{ep.name}</option>
            ))}
            <option value="">-- none --</option>
          </Select>
          <Button onClick={addEndpoint} variant="primary">Add endpoint</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Request builder" subtitle="Method / URL / headers / body">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-28">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </Select>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" className="flex-1 min-w-0" />
            </div>

            <div>
              <div className="mb-1 text-xs text-neutral-500">Headers (JSON)</div>
              <textarea value={headersText} onChange={(e) => setHeadersText(e.target.value)} className="w-full h-24 px-3 py-2 text-sm border rounded-xl border-neutral-200" />
            </div>

            <div>
              <div className="mb-1 text-xs text-neutral-500">Body (JSON) - optional</div>
              <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-xl border-neutral-200 h-28" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => sendRequest()} variant="primary" disabled={loading}>{loading ? "Sending…" : "Send"}</Button>
              <Button onClick={() => { setHeadersText('{"content-type":"application/json"}'); setBodyText(""); }}>Reset</Button>
              <Button onClick={() => { setLogs([]); setError(null); }}>Clear logs</Button>
            </div>

            {error && <div className="text-sm text-rose-700">Error: {error}</div>}
          </div>
        </Card>

        <Card title="Live preview" subtitle="Last response">
          <div className="mb-2 text-xs text-neutral-500">Most recent</div>
          {logs.length === 0 ? (
            <div className="text-sm text-neutral-500">No responses yet</div>
          ) : (
            <div>
              <div className="mb-2 text-sm">{logs[0].ts} • {logs[0].method} • {logs[0].url}</div>
              <div className="mb-2">
                <Tag tone={logs[0].status >= 400 || logs[0].error ? 'rose' : 'green'}>{logs[0].status ?? 'ERR'}</Tag>
              </div>
              <pre className="p-3 overflow-auto text-xs rounded bg-gray-50 max-h-40">{logs[0].response}</pre>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => replay(logs[0])}>Replay</Button>
                <Button onClick={() => copyResponse(logs[0].response)}>Copy response</Button>
              </div>
            </div>
          )}
        </Card>

        <Card title="Endpoints" subtitle="Manage saved endpoints">
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div key={ep.id} className="flex items-center justify-between gap-2 p-2 border rounded">
                <div>
                  <div className="text-sm font-medium">{ep.name}</div>
                  <div className="text-xs text-neutral-500">{ep.method} • {ep.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => { setSelectedId(ep.id); setUrl(ep.url); setMethod(ep.method); }}>Use</Button>
                  <Button onClick={() => { setUrl(ep.url); setMethod(ep.method); }}>Load</Button>
                  <Button onClick={() => removeEndpoint(ep.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Request logs" subtitle={`Total: ${logs.length}`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Input placeholder="Search URL or response" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
          <div className="text-xs text-neutral-500">Page {page} / {pageCount}</div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</Button>
            <Button onClick={() => setPage((p) => Math.min(pageCount, p+1))}>Next</Button>
          </div>
        </div>

        {/* Mobile-friendly list (visible on small screens) */}
        <div className="space-y-2 sm:hidden">
          {filtered.slice((page-1)*pageSize, page*pageSize).map((l) => (
            <div key={l.id} className="p-3 border rounded bg-white/95">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.url}</div>
                  <div className="text-xs truncate text-neutral-500">{l.ts} • {l.method}</div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <Tag tone={l.status >= 400 || l.error ? 'rose' : 'green'} className="whitespace-nowrap">{l.status ?? 'ERR'}</Tag>
                </div>
              </div>
              <div className="mt-2 text-xs">
                <pre className="p-2 overflow-auto text-xs rounded max-h-36 bg-gray-50">{l.response}</pre>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => replay(l)}>Replay</Button>
                <Button onClick={() => copyResponse(l.response)}>Copy</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Table view for sm+ */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="text-xs text-left text-neutral-500">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2">Method</th>
                <th className="py-2">URL</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page-1)*pageSize, page*pageSize).map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-2 text-xs">{l.ts}</td>
                  <td className="py-2"><Tag tone={l.method === 'GET' ? 'slate' : 'indigo'}>{l.method}</Tag></td>
                  <td className="max-w-sm py-2 truncate">{l.url}</td>
                  <td className="py-2">{l.status ?? 'ERR'}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button onClick={() => replay(l)}>Replay</Button>
                      <Button onClick={() => copyResponse(l.response)}>Copy</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
