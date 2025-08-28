import React, { useEffect, useMemo, useRef, useState } from "react";

export default function UI62_SecretsManagerUI() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef(null);

  const initialSecrets = useMemo(
    () => [
      { id: "s-2001", name: "db/password", type: "credential", environment: "prod", owner: "infra-team", createdAt: "2025-06-10", masked: true },
      { id: "s-2002", name: "api/key/payment", type: "api-key", environment: "staging", owner: "payments", createdAt: "2025-07-15", masked: true },
      { id: "s-2003", name: "oauth/client_secret", type: "credential", environment: "prod", owner: "auth", createdAt: "2025-08-01", masked: true },
      { id: "s-2004", name: "smtp/password", type: "credential", environment: "dev", owner: "comm", createdAt: "2025-08-12", masked: true },
      // ... add more mock rows if desired
    ],
    []
  );

  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // table controls
  const [sortBy, setSortBy] = useState({ field: "name", dir: "asc" });
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  // detail drawer
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // revealed secrets (store actual values in map when revealed or rotated)
  const [revealedValues, setRevealedValues] = useState({});

  // audit logs: { secretId: [{ts, action, by, note}] }
  const [auditLogs, setAuditLogs] = useState({});

  // simple toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (msg, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 3000);
  };

  const mockFetch = (shouldFail = false) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (shouldFail) return reject(new Error("Simulated network error"));
        resolve(initialSecrets);
      }, 450)
    );

  const fetchSecrets = async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch(opts.fail);
      setSecrets(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
      setPage(1);
    } catch (err) {
      setError(err?.message || "Failed to load secrets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce query
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // filtering
  const filtered = useMemo(() => {
    if (!debouncedQuery) return secrets;
    const q = debouncedQuery.toLowerCase();
    return secrets.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.environment.toLowerCase().includes(q)
    );
  }, [secrets, debouncedQuery]);

  // sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { field, dir } = sortBy;
    arr.sort((a, b) => {
      const va = (a[field] || "").toString();
      const vb = (b[field] || "").toString();
      if (field === "createdAt") {
        return dir === "asc" ? new Date(va) - new Date(vb) : new Date(vb) - new Date(va);
      }
      return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return arr;
  }, [filtered, sortBy]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount]);
  const paginated = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  // selection helpers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllPage = () => setSelectedIds(new Set(paginated.map((s) => s.id)));
  const selectAllMatching = () => setSelectedIds(new Set(sorted.map((s) => s.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // exports
  const exportJSON = (payload, filename = "secrets_export.json") => {
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

  const exportCSV = (rows, filename = "secrets_export.csv") => {
    if (!rows || rows.length === 0) return;
    const keys = ["id", "name", "type", "environment", "owner", "createdAt"];
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${(r[k] || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportSelected = () => {
    const selected = secrets.filter((s) => selectedIds.has(s.id));
    exportJSON({ exportedAt: new Date().toISOString(), count: selected.length, secrets: selected }, `secrets_selected_${new Date().toISOString()}.json`);
  };

  const exportAll = () => {
    exportJSON({ exportedAt: new Date().toISOString(), count: secrets.length, secrets }, `secrets_all_${new Date().toISOString()}.json`);
  };

  const exportSelectedCSV = () => {
    const selected = secrets.filter((s) => selectedIds.has(s.id));
    exportCSV(selected, `secrets_selected_${new Date().toISOString()}.csv`);
  };

  // detail drawer
  const openDetail = (row) => { setDetail(row); setDetailTab("overview"); }
  const closeDetail = () => setDetail(null);

  // utilities
  const toggleSort = (field) => {
    setSortBy((curr) => ({ field, dir: curr.field === field ? (curr.dir === "asc" ? "desc" : "asc") : "asc" }));
  };

  const highlightText = (text = "", q = "") => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}<mark className="text-orange-800 bg-yellow-200">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}
      </>
    );
  };

  // mock secrets value fetch
  const mockGetSecretValue = (id) => new Promise((resolve) => {
    setTimeout(() => resolve(`value-${id}-${Math.random().toString(36).slice(2, 8)}`), 200);
  });

  const revealSecret = async (id) => {
    if (revealedValues[id]) return; // already revealed
    try {
      pushToast(`Revealing secret ${id}`);
      const val = await mockGetSecretValue(id);
      setRevealedValues((r) => ({ ...r, [id]: val }));
      // add audit log
      setAuditLogs((a) => ({ ...a, [id]: [...(a[id] || []), { ts: new Date().toISOString(), action: 'reveal', by: 'mock-user' }] }));
    } catch (err) {
      pushToast(`Failed to reveal ${id}`);
    }
  };

  const hideSecret = (id) => {
    setRevealedValues((r) => {
      const copy = { ...r };
      delete copy[id];
      return copy;
    });
    setAuditLogs((a) => ({ ...a, [id]: [...(a[id] || []), { ts: new Date().toISOString(), action: 'hide', by: 'mock-user' }] }));
    pushToast(`Hidden secret ${id}`);
  };

  const mockRotateSecret = (id) => new Promise((resolve) => {
    setTimeout(() => resolve(`rotated-${id}-${Math.random().toString(36).slice(2, 10)}`), 300);
  });

  const rotateSecret = async (id) => {
    pushToast(`Rotating secret ${id}`);
    try {
      const newVal = await mockRotateSecret(id);
      setRevealedValues((r) => ({ ...r, [id]: newVal }));
      setAuditLogs((a) => ({ ...a, [id]: [...(a[id] || []), { ts: new Date().toISOString(), action: 'rotate', by: 'mock-user', note: 'rotated via UI' }] }));
      pushToast(`Secret ${id} rotated`);
    } catch (err) {
      pushToast(`Failed to rotate ${id}`);
    }
  };

  // bulk copy (copies actual values; will reveal if needed)
  const bulkCopyValues = async () => {
    const selected = secrets.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return pushToast('No secrets selected to copy');
    // ensure values
    const values = {};
    for (const s of selected) {
      if (!revealedValues[s.id]) {
        // fetch a mock value (simulate secret fetch)
        // do sequential for simplicity
        // eslint-disable-next-line no-await-in-loop
        const v = await mockGetSecretValue(s.id);
        setRevealedValues((r) => ({ ...r, [s.id]: v }));
        setAuditLogs((a) => ({ ...a, [s.id]: [...(a[s.id] || []), { ts: new Date().toISOString(), action: 'reveal (bulk)', by: 'mock-user' }] }));
        values[s.id] = v;
      } else values[s.id] = revealedValues[s.id];
    }

    const text = selected.map((s) => `${s.id}: ${values[s.id]}`).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      pushToast(`Copied ${selected.length} secret values to clipboard`);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      pushToast(`Copied ${selected.length} secret values to clipboard`);
    }
  };

  const bulkDownloadValuesJSON = async () => {
    const selected = secrets.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return pushToast('No secrets selected to download');
    const payload = { exportedAt: new Date().toISOString(), secrets: [] };
    for (const s of selected) {
      if (!revealedValues[s.id]) {
        // eslint-disable-next-line no-await-in-loop
        const v = await mockGetSecretValue(s.id);
        setRevealedValues((r) => ({ ...r, [s.id]: v }));
        setAuditLogs((a) => ({ ...a, [s.id]: [...(a[s.id] || []), { ts: new Date().toISOString(), action: 'reveal (download)', by: 'mock-user' }] }));
        payload.secrets.push({ ...s, value: v });
      } else payload.secrets.push({ ...s, value: revealedValues[s.id] });
    }
    exportJSON(payload, `secrets_values_${new Date().toISOString()}.json`);
    pushToast(`Downloaded ${selected.length} secrets (with values)`);
  };

  // export helpers preserving existing ones
  const exportSelectedWithValues = () => {
    const selected = secrets.filter((s) => selectedIds.has(s.id));
    const payload = selected.map((s) => ({ ...s, value: revealedValues[s.id] ? revealedValues[s.id] : '***masked***' }));
    exportJSON({ exportedAt: new Date().toISOString(), count: payload.length, secrets: payload }, `secrets_selected_values_${new Date().toISOString()}.json`);
  };

  // detail drawer helpers
  const viewAudit = (id) => {
    setDetail(secrets.find((s) => s.id === id));
    setDetailTab('audit');
  };

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">UI62 — Secrets Manager UI (Mock)</h1>
        <p className="mt-1 text-gray-600">Mock interface for viewing secret metadata. Do not store real secrets here.</p>
      </header>

      <div className="p-4 mb-4 bg-white rounded shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <input
            aria-label="Search secrets"
            className="flex-1 p-2 border rounded"
            placeholder="Search by name, id, owner, or environment"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="flex gap-2">
            <button aria-label="Refresh secrets" onClick={() => fetchSecrets()} className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
            <button aria-label="Simulate error" onClick={() => fetchSecrets({ fail: true })} className="px-3 py-1 text-red-700 bg-red-100 rounded">Simulate Error</button>

            <div className="relative inline-flex">
              <button aria-label="Select page" onClick={selectAllPage} className="px-3 py-1 bg-gray-100 rounded">Select page</button>
              <button aria-label="Select all matching" onClick={selectAllMatching} className="px-3 py-1 bg-gray-100 rounded">Select all matching</button>
              <button aria-label="Clear selection" onClick={clearSelection} className="px-3 py-1 bg-gray-100 rounded">Clear</button>
            </div>

            <button aria-label="Export selected JSON" onClick={exportSelected} className="px-3 py-1 text-white bg-blue-600 rounded">Export JSON</button>
            <button aria-label="Export selected CSV" onClick={exportSelectedCSV} className="px-3 py-1 text-white bg-green-600 rounded">Export CSV</button>
            <button aria-label="Export all JSON" onClick={exportAll} className="px-3 py-1 bg-gray-100 rounded">Export all JSON</button>

            <div className="ml-2 inline-flex">
              <button aria-label="Bulk copy values" onClick={bulkCopyValues} className="px-3 py-1 bg-indigo-600 text-white rounded">Copy values</button>
              <button aria-label="Bulk download values" onClick={bulkDownloadValuesJSON} className="px-3 py-1 bg-indigo-100 rounded">Download values</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="w-1/4 h-8 mb-2 bg-gray-200 rounded" />
            <div className="space-y-2">
              {Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between text-sm text-red-600">
            <div>{error}</div>
            <div>
              <button onClick={() => fetchSecrets()} className="px-3 py-1 mr-2 bg-gray-100 rounded">Retry</button>
              <button onClick={() => fetchSecrets({ fail: false })} className="px-3 py-1 bg-gray-100 rounded">Reload</button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="p-2">
                    <input
                      aria-label="Select all on page"
                      type="checkbox"
                      checked={paginated.length > 0 && paginated.every(s => selectedIds.has(s.id))}
                      onChange={(e) => e.target.checked ? selectAllPage() : clearSelection()}
                    />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('id')}>ID {sortBy.field === 'id' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('name')}>Name {sortBy.field === 'name' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('type')}>Type</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('environment')}>Environment</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('owner')}>Owner</th>
                  <th className="p-2">Value</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('createdAt')}>Created {sortBy.field === 'createdAt' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-2"><input aria-label={`Select ${s.id}`} type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                    <td className="p-2" onClick={() => openDetail(s)}>{highlightText(s.id, debouncedQuery)}</td>
                    <td className="p-2" onClick={() => openDetail(s)}>{highlightText(s.name, debouncedQuery)}</td>
                    <td className="p-2" onClick={() => openDetail(s)}>{s.type}</td>
                    <td className="p-2" onClick={() => openDetail(s)}>{highlightText(s.environment, debouncedQuery)}</td>
                    <td className="p-2" onClick={() => openDetail(s)}>{highlightText(s.owner, debouncedQuery)}</td>
                    <td className="p-2">
                      {revealedValues[s.id] ? (
                        <span className="font-mono text-xs">{revealedValues[s.id]}</span>
                      ) : (
                        <span className="font-mono text-xs text-gray-400">••••••••</span>
                      )}
                    </td>
                    <td className="p-2" onClick={() => openDetail(s)}>{s.createdAt}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {revealedValues[s.id] ? (
                          <button aria-label={`Hide ${s.id}`} onClick={() => hideSecret(s.id)} className="px-2 py-1 bg-gray-100 rounded">Hide</button>
                        ) : (
                          <button aria-label={`Reveal ${s.id}`} onClick={() => revealSecret(s.id)} className="px-2 py-1 bg-yellow-100 rounded">Reveal</button>
                        )}

                        <button aria-label={`Rotate ${s.id}`} onClick={() => rotateSecret(s.id)} className="px-2 py-1 bg-blue-100 rounded">Rotate</button>
                        <button aria-label={`Download ${s.id}`} onClick={() => exportJSON({ secret: s, value: revealedValues[s.id] ? revealedValues[s.id] : '***masked***' }, `${s.id}_value.json`)} className="px-2 py-1 bg-green-100 rounded">Download</button>
                        <button aria-label={`View audit ${s.id}`} onClick={() => viewAudit(s.id)} className="px-2 py-1 bg-gray-100 rounded">Audit</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-4 text-gray-500">No secrets match the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page</span>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 bg-gray-100 rounded">Prev</button>
                <span className="px-2">{page} / {pageCount}</span>
                <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="px-2 py-1 bg-gray-100 rounded">Next</button>
                <select aria-label="Page size" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="p-1 ml-2 border rounded">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">Showing {Math.min(sorted.length, (page - 1) * pageSize + 1)}-
                {Math.min(sorted.length, page * pageSize)} of {sorted.length}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 text-xs text-gray-500">
        Note: This is a mock viewer for metadata only. Secrets values are intentionally omitted until revealed. Revealing or rotating is simulated and recorded in the audit log.
      </div>

      {/* detail drawer */}
      {detail && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l shadow-lg z-50 flex flex-col" role="dialog" aria-modal="true" aria-label={`Secret details ${detail.id}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <div className="text-lg font-semibold">{detail.name}</div>
              <div className="text-xs text-gray-500">{detail.id} • {detail.environment} • {detail.owner}</div>
            </div>
            <div>
              <button onClick={closeDetail} className="px-2 py-1 bg-gray-100 rounded">Close</button>
            </div>
          </div>

          <div className="p-3 border-b">
            <div className="flex gap-2 text-sm">
              <button onClick={() => setDetailTab('overview')} className={`px-2 py-1 rounded ${detailTab === 'overview' ? 'bg-gray-200' : ''}`}>Overview</button>
              <button onClick={() => setDetailTab('raw')} className={`px-2 py-1 rounded ${detailTab === 'raw' ? 'bg-gray-200' : ''}`}>Raw JSON</button>
              <button onClick={() => setDetailTab('audit')} className={`px-2 py-1 rounded ${detailTab === 'audit' ? 'bg-gray-200' : ''}`}>Audit</button>
            </div>
          </div>

          <div className="p-4 overflow-auto">{
            detailTab === 'overview' ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {detail.id}</div>
                <div><strong>Name:</strong> {detail.name}</div>
                <div><strong>Type:</strong> {detail.type}</div>
                <div><strong>Environment:</strong> {detail.environment}</div>
                <div><strong>Owner:</strong> {detail.owner}</div>
                <div><strong>Created:</strong> {detail.createdAt}</div>
                <div>
                  <strong>Value:</strong>
                  <div className="mt-2">
                    {revealedValues[detail.id] ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm">{revealedValues[detail.id]}</span>
                        <div className="flex gap-2">
                          <button onClick={() => hideSecret(detail.id)} className="px-2 py-1 bg-gray-100 rounded">Hide</button>
                          <button onClick={() => rotateSecret(detail.id)} className="px-2 py-1 bg-blue-100 rounded">Rotate</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-400">••••••••</span>
                        <button onClick={() => revealSecret(detail.id)} className="px-2 py-1 bg-yellow-100 rounded">Reveal</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : detailTab === 'raw' ? (
              <pre className="p-2 overflow-auto text-xs rounded bg-gray-50">{JSON.stringify(detail, null, 2)}</pre>
            ) : (
              <div className="text-sm">
                <div className="mb-2"><strong>Audit log for {detail.id}</strong></div>
                <div className="max-h-64 overflow-auto text-xs bg-gray-50 p-2 rounded">
                  {(auditLogs[detail.id] || []).slice().reverse().map((a, i) => (
                    <div key={i} className="border-b py-1">
                      <div className="text-xs text-gray-600">{a.ts} — <strong>{a.action}</strong> by {a.by}</div>
                      {a.note && <div className="text-xs text-gray-500">Note: {a.note}</div>}
                    </div>
                  ))}
                  {(auditLogs[detail.id] || []).length === 0 && <div className="text-gray-500">No audit activity yet.</div>}
                </div>
                <div className="mt-3 text-right">
                  <button onClick={() => { exportJSON({ id: detail.id, audit: auditLogs[detail.id] || [] }, `${detail.id}_audit.json`); pushToast('Audit exported'); }} className="px-2 py-1 bg-gray-100 rounded">Export audit</button>
                </div>
              </div>
            )
          }</div>

          <div className="p-3 text-right border-t">
            <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail)); pushToast('Copied JSON to clipboard'); }} className="px-3 py-1 bg-gray-100 rounded">Copy JSON</button>
          </div>
        </div>
      )}

      {/* toasts */}
      <div className="fixed right-4 bottom-4 space-y-2 z-60">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="px-3 py-2 bg-black text-white text-sm rounded shadow">{t.msg}</div>
        ))}
      </div>

    </div>
  );
}
