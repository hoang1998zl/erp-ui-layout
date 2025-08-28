import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Select, Button, Tag } from "../../ui-helpers.jsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function UI70_GovernanceTracker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [query, setQuery] = useState("");
  const [filterBoard, setFilterBoard] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detail, setDetail] = useState(null);

  // mock fetch
  const mockFetch = () => new Promise((resolve) => setTimeout(() => resolve([
    { id: 'm-001', board: 'Audit', title: 'Q2 Financial Review', date: '2025-07-10', status: 'Concluded', actionsOpen: 2, votesFor: 5, votesAgainst: 1, minutes: 'Reviewed Q2 statements and approved adjustments.' },
    { id: 'm-002', board: 'Board', title: 'Strategy Offsite', date: '2025-08-01', status: 'Scheduled', actionsOpen: 6, votesFor: 0, votesAgainst: 0, minutes: 'Agenda set for strategic priorities.' },
    { id: 'm-003', board: 'Risk', title: 'Risk Appetite Review', date: '2025-06-21', status: 'Concluded', actionsOpen: 0, votesFor: 4, votesAgainst: 0, minutes: 'Appetite thresholds reaffirmed.' },
    { id: 'm-004', board: 'Nominations', title: 'Committee Appointments', date: '2025-05-15', status: 'Concluded', actionsOpen: 1, votesFor: 6, votesAgainst: 0, minutes: 'Approved new committee slate.' },
    { id: 'm-005', board: 'Board', title: 'Remuneration Policy', date: '2025-04-12', status: 'Concluded', actionsOpen: 3, votesFor: 4, votesAgainst: 2, minutes: 'Policy updates adopted with conditions.' },
    { id: 'm-006', board: 'Audit', title: 'Internal Controls', date: '2025-03-08', status: 'Concluded', actionsOpen: 0, votesFor: 5, votesAgainst: 0, minutes: 'Controls strengthened.' },
    { id: 'm-007', board: 'Board', title: 'Quarterly Results', date: '2025-02-28', status: 'Concluded', actionsOpen: 4, votesFor: 3, votesAgainst: 1, minutes: 'Results discussed; guidance updated.' },
  ]), 400));

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings.filter(m => (
      (!filterBoard || m.board === filterBoard) &&
      (!q || m.title.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
    ));
  }, [meetings, query, filterBoard]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paginated = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page, pageSize]);

  const toggleSelect = (id) => setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const selectAllPage = () => setSelectedIds(new Set(paginated.map(m => m.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const exportJSON = (payload, filename = 'governance_export.json') => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportSelected = () => {
    const selected = meetings.filter(m => selectedIds.has(m.id));
    exportJSON({ exportedAt: new Date().toISOString(), meetings: selected }, `meetings_selected_${new Date().toISOString()}.json`);
  };

  // KPI metrics
  const kpis = useMemo(() => {
    const upcoming = meetings.filter(m => new Date(m.date) > new Date()).length;
    const openActions = meetings.reduce((s,m) => s + (m.actionsOpen || 0), 0);
    const votes = meetings.reduce((acc, m) => ({ for: acc.for + (m.votesFor||0), against: acc.against + (m.votesAgainst||0) }), { for:0, against:0 });
    const passPct = votes.for + votes.against === 0 ? 0 : Math.round((votes.for / (votes.for + votes.against)) * 100);
    return { upcoming, openActions, passPct };
  }, [meetings]);

  const votesTrend = useMemo(() => {
    // aggregate by month from meetings
    const map = {};
    meetings.forEach(m => {
      const key = new Date(m.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      map[key] = map[key] || { month: key, for: 0, against: 0 };
      map[key].for += m.votesFor || 0;
      map[key].against += m.votesAgainst || 0;
    });
    return Object.values(map).slice(-8);
  }, [meetings]);

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI70 — Governance Tracker</h1>
          <p className="mt-2 text-gray-600 max-w-xl">Board governance dashboard: meetings, resolutions, actions and voting records. This is a mock demo with sample data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterBoard} onChange={(e) => setFilterBoard(e.target.value)} className="w-40">
            <option value="">All boards</option>
            {[...new Set(meetings.map(m => m.board))].map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Input placeholder="Search meetings" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
          <Button onClick={fetchData}>Refresh</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <Card title="KPIs" subtitle="Overview">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Upcoming meetings</div>
                <div className="text-lg font-bold">{kpis.upcoming}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Open actions</div>
                <div className="text-lg font-bold">{kpis.openActions}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Votes pass %</div>
                <div className="text-lg font-bold">{kpis.passPct}%</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Votes trend" subtitle="Recent months">
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={votesTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="for" fill="#10B981" />
                <Bar dataKey="against" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Actions" subtitle="Bulk operations">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={selectAllPage}>Select page</Button>
              <Button onClick={clearSelection}>Clear</Button>
              <Button onClick={exportSelected}>Export selected</Button>
            </div>
            <div className="text-xs text-gray-500">Selected: {selectedIds.size}</div>
          </div>
        </Card>
      </div>

      <Card title={`Meetings (${filtered.length})`} subtitle={`Page ${page} of ${pageCount}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-xs text-gray-500">Page size</div>
          <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="w-28">
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={25}>25</option>
          </Select>
          <div className="ml-auto text-xs text-gray-500">Showing {Math.min(filtered.length, (page-1)*pageSize + 1)}-{Math.min(filtered.length, page*pageSize)} of {filtered.length}</div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_,i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-2">
            {paginated.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 border rounded" aria-selected={selectedIds.has(m.id)}>
                <div className="flex items-start gap-3">
                  <input aria-label={`Select ${m.id}`} type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} />
                  <div>
                    <button onClick={() => setDetail(m)} className="text-left font-medium text-blue-600 underline">{m.title}</button>
                    <div className="text-xs text-gray-500">{m.board} • {m.date}</div>
                    <div className="text-xs mt-1">{m.minutes.slice(0, 120)}{m.minutes.length > 120 ? '…' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag tone={m.status === 'Scheduled' ? 'slate' : m.status === 'Concluded' ? 'green' : 'rose'}>{m.status}</Tag>
                  <div className="text-xs text-gray-500">Actions: {m.actionsOpen}</div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <div className="flex gap-2 mt-3">
                <Button onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
                <Button onClick={() => setPage(p => Math.min(pageCount, p+1))}>Next</Button>
              </div>

              <div className="text-xs text-gray-500">Page {page} / {pageCount}</div>
            </div>
          </div>
        )}
      </Card>

      {/* detail drawer/modal */}
      {detail && (
        <div className="fixed right-0 top-0 h-full w-[480px] bg-white border-l shadow-lg z-50" role="dialog" aria-modal="true" aria-label={`Meeting details ${detail.id}`}>
          <div className="p-4 border-b flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">{detail.title}</div>
              <div className="text-xs text-gray-500">{detail.board} • {detail.date}</div>
            </div>
            <div>
              <button onClick={() => setDetail(null)} className="px-2 py-1 bg-gray-100 rounded">Close</button>
            </div>
          </div>

          <div className="p-4 overflow-auto">
            <div className="text-sm space-y-2">
              <div><strong>ID:</strong> {detail.id}</div>
              <div><strong>Status:</strong> {detail.status}</div>
              <div><strong>Open actions:</strong> {detail.actionsOpen}</div>
              <div><strong>Votes for:</strong> {detail.votesFor}</div>
              <div><strong>Votes against:</strong> {detail.votesAgainst}</div>
              <div><strong>Minutes:</strong></div>
              <pre className="p-2 bg-gray-50 rounded text-xs">{detail.minutes}</pre>
            </div>

            <div className="flex gap-2 mt-3 justify-end">
              <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)); }}>Copy JSON</Button>
              <Button onClick={() => exportJSON(detail, `${detail.id}_meeting.json`)}>Export</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
