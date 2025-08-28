import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Button, Tag } from "../../ui-helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function mockFetchCases() {
  return new Promise((res) => {
    setTimeout(() => {
      const statuses = ["Open", "In Progress", "Closed", "Escalated"];
      const data = Array.from({ length: 57 }).map((_, i) => ({
        id: `LC-${1000 + i}`,
        title: `Contract dispute ${i + 1}`,
        court: ["District Court", "State Court", "Arbitration"][i % 3],
        status: statuses[i % statuses.length],
        opened: new Date(Date.now() - (i % 60) * 24 * 3600 * 1000).toISOString().slice(0, 10),
        owner: [`Alice`, `Bob`, `Carol`, `Dan`][i % 4],
        summary: `Summary of case ${i + 1} — factual details, key dates, and stakeholders.`,
      }));
      res(data);
    }, 400);
  });
}

export default function UI96_LegalCaseManager() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [drawer, setDrawer] = useState(null);

  useEffect(() => {
    let mounted = true;
    mockFetchCases().then((d) => {
      if (mounted) setItems(d);
    });
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    let out = items;
    if (query) {
      const q = query.toLowerCase();
      out = out.filter((it) => it.title.toLowerCase().includes(q) || it.id.toLowerCase().includes(q) || it.owner.toLowerCase().includes(q));
    }
    if (statusFilter) out = out.filter((it) => it.status === statusFilter);
    return out;
  }, [items, query, statusFilter]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > pages) setPage(1);
  }, [pages]);

  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const clearSelection = () => setSelected(new Set());

  const exportCSV = () => {
    const rows = Array.from(selected).length ? items.filter((i) => selected.has(i.id)) : pageData;
    const csv = ["id,title,court,status,opened,owner", ...rows.map((r) => `${r.id},"${r.title}",${r.court},${r.status},${r.opened},${r.owner}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legal_cases_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkClose = () => {
    if (!selected.size) return alert("No cases selected");
    setItems((prev) => prev.map((it) => (selected.has(it.id) ? { ...it, status: "Closed" } : it)));
    clearSelection();
  };

  const statusCounts = useMemo(() => {
    const map = {};
    items.forEach((it) => (map[it.status] = (map[it.status] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Legal Case Manager</h1>
          <p className="text-sm text-neutral-500">Track cases, documents, statuses and perform bulk actions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input aria-label="Search cases" placeholder="Search by title, id, owner..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filter by status" className="rounded-xl border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Closed</option>
            <option>Escalated</option>
          </select>
          <Button variant="primary" onClick={exportCSV} aria-label="Export cases">Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Overview`} subtitle={`Total ${items.length} cases`} actions={<div className="text-sm text-neutral-500">Updated just now</div>}>
          <div style={{ height: 160 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} aria-label="Case status chart">
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Quick actions" actions={<div className="text-sm text-neutral-500">Bulk</div>}>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={bulkClose} aria-label="Close selected cases">Close selected</Button>
            <Button onClick={clearSelection} aria-label="Clear selection">Clear selection</Button>
            <Button onClick={() => alert('Download documents for selected (mock)')} className="ml-auto" aria-label="Download selected docs">Download Docs</Button>
          </div>
        </Card>

        <Card title="Filters" actions={null}>
          <div className="flex flex-col gap-2">
            <Tag tone="indigo">Compliance</Tag>
            <Tag tone="green">High priority</Tag>
            <div className="text-xs text-neutral-500">Tip: select rows to enable bulk actions</div>
          </div>
        </Card>
      </div>

      <section aria-labelledby="table-heading">
        <h2 id="table-heading" className="sr-only">Cases table</h2>
        <div className="overflow-x-auto bg-white/95 border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="text-left">
                <th className="p-3"><input aria-label="Select all" type="checkbox" onChange={(e) => {
                  if (e.target.checked) setSelected(new Set(items.map(i=>i.id)));
                  else clearSelection();
                }} /></th>
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Court</th>
                <th className="p-3">Status</th>
                <th className="p-3">Opened</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row) => (
                <tr key={row.id} className="border-t" role="row">
                  <td className="p-3"><input aria-label={`Select ${row.id}`} type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                  <td className="p-3 font-mono text-xs">{row.id}</td>
                  <td className="p-3">{row.title}</td>
                  <td className="p-3">{row.court}</td>
                  <td className="p-3"><Tag tone={row.status === 'Closed' ? 'green' : row.status === 'Escalated' ? 'rose' : 'slate'}>{row.status}</Tag></td>
                  <td className="p-3">{row.opened}</td>
                  <td className="p-3">{row.owner}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button onClick={() => setDrawer(row)} aria-label={`Open ${row.id} details`}>Details</Button>
                      <Button variant="ghost" onClick={() => alert('Download doc (mock)')} aria-label={`Download ${row.id} document`}>Docs</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-neutral-500">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">Prev</Button>
            <div className="px-3 py-1 rounded-xl border text-sm">{page} / {pages}</div>
            <Button onClick={() => setPage((p) => Math.min(pages, p + 1))} aria-label="Next page">Next</Button>
          </div>
        </div>
      </section>

      {drawer && (
        <aside role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end p-4">
          <div className="bg-white w-full sm:w-2/5 rounded-xl shadow-xl p-4" onClick={(e)=>e.stopPropagation()}>
            <header className="flex items-center justify-between">
              <h3 id="drawer-title" className="text-lg font-semibold">{drawer.id} — {drawer.title}</h3>
              <Button onClick={() => setDrawer(null)} aria-label="Close details">Close</Button>
            </header>
            <div className="mt-3 text-sm text-neutral-700">
              <p><strong>Status:</strong> {drawer.status}</p>
              <p><strong>Court:</strong> {drawer.court}</p>
              <p className="mt-2"><strong>Summary</strong></p>
              <p className="mt-1 text-neutral-600">{drawer.summary}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => { alert('Open document viewer (mock)'); }} aria-label="Open documents">Open documents</Button>
              <Button variant="ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(drawer)); alert('Copied'); }} aria-label="Copy details">Copy</Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
