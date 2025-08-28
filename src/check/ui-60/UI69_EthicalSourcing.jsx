import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Button, Tag } from '../../ui-helpers.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function nowISO() {
  return new Date().toISOString();
}

function genSupplier(id) {
  const regions = ['APAC', 'EMEA', 'NA', 'LATAM'];
  const statuses = ['Compliant', 'Non-compliant', 'Under review'];
  const name = `Supplier ${id}`;
  const score = Math.round(Math.max(30, Math.min(100, 50 + (Math.sin(id) * 30) + (Math.random() * 20))));
  const status = score >= 75 ? 'Compliant' : score >= 50 ? 'Under review' : 'Non-compliant';
  return {
    id,
    name,
    region: regions[id % regions.length],
    score,
    status,
    lastAudit: new Date(Date.now() - (id % 30) * 86400000).toISOString().split('T')[0],
    certifications: [ ...(Math.random() > 0.6 ? ['ISO14001'] : []), ...(Math.random() > 0.8 ? ['SA8000'] : []) ],
    notes: `Mock notes for ${name}`,
    documents: [
      { name: 'AuditReport.pdf', id: `doc-${id}-1` },
    ],
  };
}

function mockFetchSuppliers({ delay = 500, count = 120 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = Array.from({ length: count }).map((_, i) => genSupplier(i + 1));
      resolve({ data });
    }, delay + Math.random() * 300);
  });
}

function exportCSV(rows) {
  const keys = ['id', 'name', 'region', 'status', 'score', 'lastAudit'];
  const header = keys.join(',') + '\n';
  const body = rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')).join('\n');
  const csv = header + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suppliers_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const COLORS = ['#60A5FA', '#34D399', '#F59E0B', '#F87272'];

export default function UI69_EthicalSourcing() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [minScore, setMinScore] = useState('');
  const [search, setSearch] = useState('');

  // Table state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Drawer
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    mockFetchSuppliers({ count: 120 })
      .then((res) => {
        if (!mounted) return;
        setSuppliers(res.data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (region && s.region !== region) return false;
      if (status && s.status !== status) return false;
      if (minScore && s.score < Number(minScore)) return false;
      if (q && !(s.name.toLowerCase().includes(q) || (s.notes || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [suppliers, region, status, minScore, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // KPI values
  const kpis = useMemo(() => {
    const total = suppliers.length;
    const compliant = suppliers.filter((s) => s.status === 'Compliant').length;
    const avg = total ? Math.round(suppliers.reduce((a, b) => a + b.score, 0) / total) : 0;
    const atRisk = suppliers.filter((s) => s.status === 'Non-compliant').length;
    return { total, compliantPct: total ? Math.round((compliant / total) * 100) : 0, avg, atRisk };
  }, [suppliers]);

  // Chart data
  const scoreBuckets = useMemo(() => {
    const buckets = [0, 50, 65, 75, 100];
    const labels = ['<50', '50-64', '65-74', '75+'];
    const counts = [0, 0, 0, 0];
    suppliers.forEach((s) => {
      if (s.score < 50) counts[0]++;
      else if (s.score < 65) counts[1]++;
      else if (s.score < 75) counts[2]++;
      else counts[3]++;
    });
    return labels.map((label, i) => ({ name: label, count: counts[i] }));
  }, [suppliers]);

  const statusPie = useMemo(() => {
    const groups = {};
    suppliers.forEach((s) => { groups[s.status] = (groups[s.status] || 0) + 1; });
    return Object.keys(groups).map((k, i) => ({ name: k, value: groups[k], color: COLORS[i % COLORS.length] }));
  }, [suppliers]);

  // Actions
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkMarkReviewed = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setSuppliers((s) => s.map((row) => (ids.includes(row.id) ? { ...row, status: 'Under review' } : row)));
    clearSelection();
  };

  const bulkExport = () => {
    const rows = suppliers.filter((s) => selectedIds.has(s.id));
    if (rows.length === 0) {
      exportCSV(filtered.slice(0, pageSize));
    } else {
      exportCSV(rows);
    }
  };

  const openDetail = (row) => setDetail(row);
  const closeDetail = () => setDetail(null);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI69_EthicalSourcing</h1>
          <div className="max-w-xl mt-2 text-sm text-gray-600">Assess and manage ethical sourcing risk across suppliers. Mock data and exports included.</div>
        </div>

        <div className="flex items-center gap-2">
          <Input placeholder="Search supplier or notes" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Select value={region} onChange={(e) => setRegion(e.target.value)} className="w-40">
            <option value="">All regions</option>
            <option>APAC</option>
            <option>EMEA</option>
            <option>NA</option>
            <option>LATAM</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            <option value="">Any status</option>
            <option>Compliant</option>
            <option>Under review</option>
            <option>Non-compliant</option>
          </Select>
          <Input placeholder="Min score" value={minScore} onChange={(e) => setMinScore(e.target.value)} className="w-28" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="KPIs" subtitle="Snapshot">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="p-3 rounded border bg-white/95">
              <div className="text-xs text-neutral-500">Total suppliers</div>
              <div className="text-2xl font-bold">{kpis.total}</div>
            </div>
            <div className="p-3 rounded border bg-white/95">
              <div className="text-xs text-neutral-500">Compliant</div>
              <div className="text-2xl font-bold">{kpis.compliantPct}%</div>
            </div>
            <div className="p-3 rounded border bg-white/95">
              <div className="text-xs text-neutral-500">Avg score</div>
              <div className="text-2xl font-bold">{kpis.avg}</div>
            </div>
            <div className="p-3 rounded border bg-white/95">
              <div className="text-xs text-neutral-500">At risk</div>
              <div className="text-2xl font-bold">{kpis.atRisk}</div>
            </div>
          </div>
        </Card>

        <Card title="Score distribution" subtitle="Histogram">
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Status breakdown" subtitle="By supplier status">
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={60} paddingAngle={3} label>
                  {statusPie.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={`Suppliers (${filtered.length})`} subtitle="Select rows for bulk actions">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="text-xs text-neutral-500">Page {page} / {pageCount}</div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={selectAllOnPage}>Select page</Button>
            <Button onClick={clearSelection}>Clear selection</Button>
            <Button onClick={bulkMarkReviewed}>Mark reviewed</Button>
            <Button onClick={bulkExport} variant="primary">Export CSV</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-sm text-rose-700">Error loading suppliers: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-neutral-500">No suppliers match the filters.</div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="space-y-2 sm:hidden">
              {pageRows.map((r) => (
                <div key={r.id} className="p-3 border rounded bg-white/95">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs truncate text-neutral-500">{r.region} • {r.lastAudit}</div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Tag tone={r.status === 'Compliant' ? 'green' : r.status === 'Under review' ? 'amber' : 'rose'}>{r.status}</Tag>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-neutral-500">Score: {r.score}</div>
                    <div className="flex gap-2">
                      <Button onClick={() => toggleSelect(r.id)}>{selectedIds.has(r.id) ? 'Deselect' : 'Select'}</Button>
                      <Button onClick={() => openDetail(r)}>Detail</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-left text-neutral-500">
                  <tr>
                    <th className="py-2">#</th>
                    <th className="py-2">Supplier</th>
                    <th className="py-2">Region</th>
                    <th className="py-2">Last audit</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 text-xs">{r.id}</td>
                      <td className="py-2">{r.name}</td>
                      <td className="py-2">{r.region}</td>
                      <td className="py-2 text-xs">{r.lastAudit}</td>
                      <td className="py-2"><Tag tone={r.status === 'Compliant' ? 'green' : r.status === 'Under review' ? 'amber' : 'rose'}>{r.status}</Tag></td>
                      <td className="py-2 font-semibold">{r.score}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button onClick={() => toggleSelect(r.id)}>{selectedIds.has(r.id) ? 'Deselect' : 'Select'}</Button>
                          <Button onClick={() => openDetail(r)}>Detail</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-neutral-500">Showing {Math.min(filtered.length, page * pageSize)} of {filtered.length}</div>
              <div className="flex gap-2">
                <Button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <div className="px-3 py-1 text-xs text-neutral-700">{page}</div>
                <Button onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail drawer */}
      {detail && (
        <div aria-hidden={false} className="fixed inset-0 z-50 flex">
          <div className="w-full sm:w-1/3 ml-auto h-full bg-white border-l p-4 overflow-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">{detail.name}</h2>
                <div className="text-xs text-neutral-500">{detail.region} • Last audit {detail.lastAudit}</div>
              </div>
              <div>
                <Button onClick={closeDetail}>Close</Button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="text-sm">Status: <Tag tone={detail.status === 'Compliant' ? 'green' : detail.status === 'Under review' ? 'amber' : 'rose'}>{detail.status}</Tag></div>
              <div className="text-sm">Score: <span className="font-semibold">{detail.score}</span></div>
              <div className="text-sm">Certifications: {detail.certifications.length ? detail.certifications.join(', ') : '—'}</div>
              <div className="text-sm">Notes:</div>
              <pre className="p-2 text-xs bg-gray-50 rounded">{detail.notes}</pre>

              <div>
                <div className="text-sm font-medium">Documents</div>
                <div className="mt-2 space-y-1">
                  {detail.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 p-2 border rounded">
                      <div className="text-sm">{d.name}</div>
                      <div className="flex gap-2">
                        <Button onClick={() => alert('Download mock: ' + d.name)}>Download</Button>
                        <Button onClick={() => alert('View mock: ' + d.name)}>View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => { setSuppliers((s) => s.map((x) => x.id === detail.id ? { ...x, status: 'Under review' } : x)); closeDetail(); }}>Mark under review</Button>
              <Button onClick={() => { setSuppliers((s) => s.map((x) => x.id === detail.id ? { ...x, status: 'Compliant' } : x)); closeDetail(); }} variant="primary">Mark compliant</Button>
            </div>
          </div>
          <div onClick={closeDetail} className="flex-1 bg-black/30" />
        </div>
      )}
    </div>
  );
}
