import React, { useEffect, useMemo, useState } from "react";
import { Card, Tag, Input, Select, Button } from "../../ui-helpers.jsx";

export default function UI66_ComplianceSustainability() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  // UI state
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      if (!mounted) return;
      const domains = ["Environmental", "Labor", "SupplyChain", "DataPrivacy"];
      const statuses = ["Open", "In Progress", "Closed"];
      const mock = Array.from({ length: 36 }).map((_, i) => ({
        id: i + 1,
        ref: `CPL-${1000 + i}`,
        name: `Compliance item ${i + 1}`,
        domain: domains[i % domains.length],
        status: statuses[i % statuses.length],
        due: new Date(Date.now() + (i % 12) * 86400000).toISOString().slice(0, 10),
        score: Math.round(60 + Math.random() * 40),
        owner: ["Alice", "Bob", "Carlos", "Diana"][i % 4],
      }));
      setItems(mock);
      setLoading(false);
    }, 600);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (domain !== "all" && it.domain !== domain) return false;
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (!q) return true;
      return it.name.toLowerCase().includes(q) || it.ref.toLowerCase().includes(q) || it.owner.toLowerCase().includes(q);
    });
  }, [items, search, domain, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSelect(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleStatus(id) {
    setItems((list) => list.map((it) => it.id === id ? { ...it, status: it.status === 'Closed' ? 'Open' : 'Closed' } : it));
    setToast('Status updated');
    setTimeout(() => setToast(''), 1800);
  }

  function bulkClose() {
    if (!selected.size) return setToast('No items selected');
    setItems((list) => list.map((it) => selected.has(it.id) ? { ...it, status: 'Closed' } : it));
    setSelected(new Set());
    setToast(`Closed ${selected.size} items`);
    setTimeout(() => setToast(''), 1800);
  }

  function handleExport() {
    const rows = [["id","ref","name","domain","status","due","score","owner"],
      ...filtered.map((r) => [r.id, r.ref, r.name, r.domain, r.status, r.due, r.score, r.owner])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'compliance-items.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3">Compliance & Sustainability</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} title="Loading" subtitle="...">
              <div className="h-12 animate-pulse bg-neutral-100 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card title="Error" subtitle="Failed to load compliance items">
          <div className="text-sm text-rose-600">{String(error)}</div>
          <div className="mt-3"><Button onClick={() => window.location.reload()}>Retry</Button></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Compliance & Sustainability</h2>
          <div className="text-sm text-neutral-500">Integrate ESG checks into regulatory workflows and triage items.</div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-44">
            <option value="all">All domains</option>
            <option value="Environmental">Environmental</option>
            <option value="Labor">Labor</option>
            <option value="SupplyChain">SupplyChain</option>
            <option value="DataPrivacy">DataPrivacy</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="all">Any status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </Select>
          <Input placeholder="Search ref, name, owner" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-56" />
          <Button onClick={handleExport} variant="ghost">Export</Button>
        </div>
      </header>

      <Card title={`Items (${filtered.length})`} subtitle="Triage and act">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-2"><input type="checkbox" checked={selected.size === pageItems.length && pageItems.length>0} onChange={(e) => {
                  if (e.target.checked) setSelected(new Set(pageItems.map(p=>p.id))); else setSelected(new Set());
                }} /></th>
                <th className="py-2">Ref</th>
                <th className="py-2">Name</th>
                <th className="py-2">Domain</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Due</th>
                <th className="py-2">Score</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2"><input type="checkbox" checked={selected.has(it.id)} onChange={() => toggleSelect(it.id)} /></td>
                  <td className="py-2 text-xs">{it.ref}</td>
                  <td className="py-2">{it.name}</td>
                  <td className="py-2"><Tag tone={it.domain==='Environmental'?'green':it.domain==='Labor'?'indigo':'amber'}>{it.domain}</Tag></td>
                  <td className="py-2">{it.owner}</td>
                  <td className="py-2 text-xs">{it.due}</td>
                  <td className="py-2">{it.score}</td>
                  <td className="py-2"><Tag tone={it.status==='Closed'?'slate':it.status==='In Progress'?'indigo':'amber'}>{it.status}</Tag></td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button onClick={() => setDetail(it)}>Details</Button>
                      <Button onClick={() => toggleStatus(it.id)} variant="ghost">Toggle</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-neutral-500">Showing {(page-1)*perPage+1} - {Math.min(page*perPage, filtered.length)} of {filtered.length}</div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage((s)=>Math.max(1,s-1))}>Prev</Button>
            <div className="px-2 text-sm">{page} / {totalPages}</div>
            <Button onClick={() => setPage((s)=>Math.min(totalPages,s+1))}>Next</Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button onClick={bulkClose} variant="primary">Bulk Close</Button>
          <Button onClick={() => { setSelected(new Set()); setToast('Selection cleared'); setTimeout(()=>setToast(''),1500); }}>Clear Selection</Button>
          {toast && <div className="ml-auto text-sm text-emerald-700">{toast}</div>}
        </div>
      </Card>

      {detail && (
        <div className="fixed right-4 top-20 w-80 z-50">
          <Card title={`Detail: ${detail.ref}`} subtitle={detail.name}>
            <div className="text-sm text-neutral-500">Domain: {detail.domain}</div>
            <div className="text-sm">Owner: {detail.owner}</div>
            <div className="text-sm">Due: {detail.due}</div>
            <div className="text-sm">Score: {detail.score}</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => { toggleStatus(detail.id); setDetail(null); }}>Close item</Button>
              <Button onClick={() => setDetail(null)} variant="ghost">Dismiss</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
