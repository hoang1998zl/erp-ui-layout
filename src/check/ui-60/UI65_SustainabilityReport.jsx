import React, {useEffect, useMemo, useState} from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {Card, Tag, Input, Select, Button} from "../../ui-helpers.jsx";

export default function UI65_SustainabilityReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState("2025");
  const [region, setRegion] = useState("global");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const [metricsSeries, setMetricsSeries] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // simulate fetching aggregated metrics + project list
    const t = setTimeout(() => {
      if (!mounted) return;
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const series = months.map((m, i) => ({
        month: m,
        emissions: Math.round(500 - i * 10 + Math.random() * 60),
        water: Math.round(200 + i * 5 + Math.random() * 40),
        wasteDiversion: Math.round(40 + i * 3 + Math.random() * 20),
      }));

      const sampleProjects = Array.from({length: 24}).map((_, idx) => ({
        id: idx + 1,
        name: `Community Solar ${idx + 1}`,
        type: ["Renewable", "Efficiency", "Waste", "Water"][idx % 4],
        region: ["APAC", "EMEA", "AMER"][idx % 3],
        status: ["Active", "Planned", "Completed"][idx % 3],
        impactScore: Math.round(60 + Math.random() * 40),
        hours: Math.round(120 + Math.random() * 400),
      }));

      setMetricsSeries(series);
      setProjects(sampleProjects);
      setLoading(false);
    }, 700);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [year, region]);

  const totals = useMemo(() => {
    if (!metricsSeries.length) return {emissions: 0, water: 0, diversion: 0, community: 0};
    const emissions = metricsSeries.reduce((s, r) => s + r.emissions, 0);
    const water = metricsSeries.reduce((s, r) => s + r.water, 0);
    const diversion = metricsSeries.reduce((s, r) => s + r.wasteDiversion, 0);
    const community = projects.reduce((s, p) => s + p.hours, 0);
    return {emissions, water, diversion, community};
  }, [metricsSeries, projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (region !== "global" && p.region !== region) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.status.toLowerCase().includes(q);
    });
  }, [projects, search, region]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  function handleExportCSV() {
    const rows = [
      ["id", "name", "type", "region", "status", "impactScore", "hours"],
      ...filtered.map((r) => [r.id, r.name, r.type, r.region, r.status, r.impactScore, r.hours]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sustainability-projects-${year}-${region}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold mb-3">Sustainability Report</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Loading" subtitle="Fetching latest metrics...">
            <div className="h-24 animate-pulse bg-neutral-100 rounded-md" />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold mb-3">Sustainability Report</div>
        <Card title="Error" subtitle="Unable to load data">
          <div className="text-sm text-rose-600">{String(error)}</div>
          <div className="mt-3">
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Sustainability Report</h2>
          <div className="text-sm text-neutral-500">Corporate Social Responsibility & environmental performance overview</div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
            <option>2023</option>
            <option>2024</option>
            <option>2025</option>
          </Select>
          <Select value={region} onChange={(e) => setRegion(e.target.value)} className="w-36">
            <option value="global">Global</option>
            <option value="APAC">APAC</option>
            <option value="EMEA">EMEA</option>
            <option value="AMER">AMER</option>
          </Select>
          <Input placeholder="Search projects..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-48" />
          <Button variant="primary" onClick={handleExportCSV}>Export</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card title={`CO2 Emissions`} subtitle={`${year} total (metric tons)`} actions={<Tag tone="rose">{totals.emissions}</Tag>}>
          <div className="text-sm text-neutral-500">Year-to-date emissions across operations.</div>
        </Card>

        <Card title={`Water Usage`} subtitle={`m3 (${year})`} actions={<Tag tone="indigo">{totals.water}</Tag>}>
          <div className="text-sm text-neutral-500">Total water consumed across facilities.</div>
        </Card>

        <Card title={`Waste Diversion`} subtitle={`% diverted`} actions={<Tag tone="green">{totals.diversion}%</Tag>}>
          <div className="text-sm text-neutral-500">Material diversion from landfill.</div>
        </Card>

        <Card title={`Community Hours`} subtitle={`Volunteer hours`} actions={<Tag tone="amber">{totals.community}</Tag>}>
          <div className="text-sm text-neutral-500">Employee & partner engagement time.</div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Emissions Trend" subtitle={`${year} — monthly`}>
          <div style={{height: 240}} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsSeries} margin={{top: 10, right: 20, left: 0, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="emissions" stroke="#ef4444" dot={false} />
                <Line type="monotone" dataKey="water" stroke="#3b82f6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Projects by Type" subtitle="Current portfolio">
          <div style={{height: 240}} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(projects.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {})).map(([k, v]) => ({type: k, count: v}))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <Card title={`Projects (${filtered.length})`} subtitle="Active / Planned / Completed">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-neutral-500">
                  <th className="py-2">Project</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Region</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Impact</th>
                  <th className="py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-3">{p.name}</td>
                    <td className="py-3"><Tag tone={p.type === 'Renewable' ? 'green' : p.type === 'Efficiency' ? 'indigo' : 'amber'}>{p.type}</Tag></td>
                    <td className="py-3">{p.region}</td>
                    <td className="py-3">{p.status}</td>
                    <td className="py-3">{p.impactScore}</td>
                    <td className="py-3">{p.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-neutral-500">Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setPage((s) => Math.max(1, s - 1)); }} className="px-2">Prev</Button>
              <div className="px-2 text-sm">{page} / {totalPages}</div>
              <Button onClick={() => { setPage((s) => Math.min(totalPages, s + 1)); }} className="px-2">Next</Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
