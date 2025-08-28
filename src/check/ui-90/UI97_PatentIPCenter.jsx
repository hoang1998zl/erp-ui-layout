import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Tag } from '../../ui-helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function mockFetchPatents() {
  return new Promise((res) => {
    setTimeout(() => {
      const statuses = ['Filed', 'Pending', 'Granted', 'Rejected'];
      const tech = ['AI', 'Blockchain', 'Biotech', 'IoT', 'Materials'];
      const data = Array.from({ length: 46 }).map((_, i) => ({
        id: `PT-${2000 + i}`,
        title: `${tech[i % tech.length]} innovation ${i + 1}`,
        status: statuses[i % statuses.length],
        tech: tech[i % tech.length],
        priority: ['Low', 'Medium', 'High'][i % 3],
        filed: new Date(Date.now() - (i % 720) * 24 * 3600 * 1000).toISOString().slice(0, 10),
        owner: ['Legal', 'R&D', 'External'][i % 3],
        summary: `Patent abstract for item ${i + 1}`,
      }));
      res(data);
    }, 300);
  });
}

const COLORS = ['#0f172a', '#0ea5a4', '#f59e0b', '#ef4444'];

export default function UI97_PatentIPCenter() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [drawer, setDrawer] = useState(null);

  useEffect(() => {
    let mounted = true;
    mockFetchPatents().then((d) => mounted && setItems(d));
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    let out = items;
    if (query) {
      const q = query.toLowerCase();
      out = out.filter((it) => it.title.toLowerCase().includes(q) || it.id.toLowerCase().includes(q) || it.owner.toLowerCase().includes(q));
    }
    if (techFilter) out = out.filter((it) => it.tech === techFilter);
    return out;
  }, [items, query, techFilter]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > pages) setPage(1); }, [pages]);
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const exportCSV = () => {
    const rows = Array.from(selected).length ? items.filter((i) => selected.has(i.id)) : pageData;
    const csv = ['id,title,tech,status,filed,owner', ...rows.map((r) => `${r.id},"${r.title}",${r.tech},${r.status},${r.filed},${r.owner}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `patents_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const techCounts = useMemo(() => {
    const map = {};
    items.forEach((it) => (map[it.tech] = (map[it.tech] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patent & IP Center</h1>
          <p className="text-sm text-neutral-500">Manage filings, statuses and portfolios.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input aria-label="Search patents" placeholder="Search by title, id, owner..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filter by tech" className="rounded-xl border px-3 py-2 text-sm" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
            <option value="">All tech</option>
            <option>AI</option>
            <option>Blockchain</option>
            <option>Biotech</option>
            <option>IoT</option>
            <option>Materials</option>
          </select>
          <Button variant="primary" onClick={exportCSV} aria-label="Export patents">Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Portfolio`} subtitle={`Total ${items.length} patents`} actions={<div className="text-sm text-neutral-500">Live</div>}>
          <div style={{ height: 160 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={techCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                  {techCounts.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Quick actions">
          <div className="flex flex-col gap-2">
            <Button onClick={() => { if (!selected.size) return alert('No selection'); alert('Create docket (mock)'); }} aria-label="Create docket">Create docket</Button>
            <Button onClick={() => { setItems((p) => p.map((it) => selected.has(it.id) ? { ...it, status: 'Granted' } : it)); setSelected(new Set()); }} aria-label="Grant selected">Grant selected</Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())} aria-label="Clear selection">Clear selection</Button>
          </div>
        </Card>

        <Card title="Filters">
          <div className="flex flex-col gap-2">
            <Tag tone="indigo">IP</Tag>
            <Tag tone="amber">Portfolio</Tag>
            <div className="text-xs text-neutral-500">Tip: use export to download selected rows as CSV</div>
          </div>
        </Card>
      </div>

      <section aria-labelledby="patent-table">
        <h2 id="patent-table" className="sr-only">Patents table</h2>
        <div className="overflow-x-auto bg-white/95 border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3"><input aria-label="Select all patents" type="checkbox" onChange={(e)=>{ if (e.target.checked) setSelected(new Set(items.map(i=>i.id))); else setSelected(new Set()); }} /></th>
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Tech</th>
                <th className="p-3">Status</th>
                <th className="p-3">Filed</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3"><input aria-label={`Select ${row.id}`} type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                  <td className="p-3 font-mono text-xs">{row.id}</td>
                  <td className="p-3">{row.title}</td>
                  <td className="p-3">{row.tech}</td>
                  <td className="p-3"><Tag tone={row.status === 'Granted' ? 'green' : row.status === 'Rejected' ? 'rose' : 'slate'}>{row.status}</Tag></td>
                  <td className="p-3">{row.filed}</td>
                  <td className="p-3">{row.owner}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button onClick={() => setDrawer(row)} aria-label={`Open ${row.id}`}>Details</Button>
                      <Button variant="ghost" onClick={() => alert('Export docs (mock)')} aria-label={`Export ${row.id}`}>Docs</Button>
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
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <div className="px-3 py-1 rounded-xl border text-sm">{page} / {pages}</div>
            <Button onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
          </div>
        </div>
      </section>

      {drawer && (
        <aside role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end p-4">
          <div className="bg-white w-full sm:w-2/5 rounded-xl shadow-xl p-4" onClick={(e)=>e.stopPropagation()}>
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{drawer.id} — {drawer.title}</h3>
              <Button onClick={() => setDrawer(null)}>Close</Button>
            </header>
            <div className="mt-3 text-sm text-neutral-700">
              <p><strong>Status:</strong> {drawer.status}</p>
              <p><strong>Tech:</strong> {drawer.tech}</p>
              <p className="mt-2"><strong>Abstract</strong></p>
              <p className="mt-1 text-neutral-600">{drawer.summary}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(drawer)); alert('Copied'); }}>Copy</Button>
              <Button variant="ghost" onClick={() => alert('Open prosecution timeline (mock)')}>Timeline</Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
