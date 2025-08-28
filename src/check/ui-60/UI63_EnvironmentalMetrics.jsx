import React, { useEffect, useMemo, useState } from "react";
import { Card, Tag, Input, Select, Button } from "../../ui-helpers.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function formatDateISO(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString();
}

function generateMockSeries(days = 30, facility = "Plant A") {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const series = [];
  let baseCO2 = facility === "Plant A" ? 1200 : facility === "Plant B" ? 900 : 600;
  let baseEnergy = baseCO2 * 2.3;
  let baseWater = baseCO2 * 0.8;
  for (let i = days - 1; i >= 0; i--) {
    const ts = now - i * oneDay;
    const jitter = (v) => v + (Math.random() - 0.5) * v * 0.12;
    const co2 = Math.round(jitter(baseCO2 + Math.sin(i / 4) * 80));
    const energy = Math.round(jitter(baseEnergy + Math.cos(i / 7) * 200));
    const water = Math.round(jitter(baseWater + Math.sin(i / 3) * 60));
    const wasteRecycled = Math.max(
      0,
      Math.round(jitter((co2 / 10) * (0.35 + Math.random() * 0.25)))
    );
    series.push({
      ts,
      date: new Date(ts).toISOString(),
      co2,
      energy,
      water,
      wasteRecycled,
    });
  }
  return series;
}

export default function UI63_EnvironmentalMetrics() {
  const facilities = ["All", "Plant A", "Plant B", "Headquarters"];
  const timeframes = [
    { value: 7, label: "7d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
  ];

  const [facility, setFacility] = useState("All");
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    // simulate async fetch
    setTimeout(() => {
      try {
        const series = generateMockSeries(days, facility === "All" ? "Plant A" : facility);
        setData(series);
        setLoading(false);
      } catch (err) {
        setError("Failed to load metrics");
        setLoading(false);
      }
    }, 600);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility, days]);

  const latest = data.length ? data[data.length - 1] : null;

  const kpis = useMemo(() => {
    if (!latest) return [];
    return [
      {
        key: "co2",
        title: "CO2 Emissions",
        value: `${latest.co2.toLocaleString()} kg`,
        tone: latest.co2 > 1000 ? "rose" : "green",
        description: "Latest daily CO2 emissions",
      },
      {
        key: "energy",
        title: "Energy Consumption",
        value: `${latest.energy.toLocaleString()} kWh`,
        tone: latest.energy > 2500 ? "amber" : "green",
        description: "Daily energy usage",
      },
      {
        key: "water",
        title: "Water Usage",
        value: `${latest.water.toLocaleString()} L`,
        tone: latest.water > 1000 ? "amber" : "green",
        description: "Daily water usage",
      },
      {
        key: "waste",
        title: "Waste Recycled",
        value: `${latest.wasteRecycled.toLocaleString()} kg`,
        tone: "indigo",
        description: "Material recycled",
      },
    ];
  }, [latest]);

  const filteredTable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .slice()
      .reverse()
      .filter((r) => (q ? formatDateISO(r.date).toLowerCase().includes(q) : true));
  }, [data, query]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI63_EnvironmentalMetrics</h1>
          <div className="max-w-xl mt-2 text-sm text-gray-600">
            Dashboard for tracking environmental KPIs (CO2, energy, water,
            recycled waste). Use filters to scope by facility and timeframe.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            className="w-44"
          >
            {facilities.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>

          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-28"
          >
            {timeframes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <Input
            placeholder="Search by date (e.g. 8/28/2025)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-52"
          />

          <Button onClick={fetchData} variant="primary">
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div className="text-sm text-rose-700">Error: {error}</div>
      )}

      {loading ? (
        <div className="p-4">Loading environmental metrics…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.key} title={k.title} subtitle={k.description} actions={<Tag tone={k.tone}>{k.value}</Tag>}>
                <div className="text-xs text-neutral-500">Updated: {latest ? formatDateISO(latest.date) : "-"}</div>
              </Card>
            ))}
          </div>

          <Card title="CO2 Emissions (trend)" subtitle={`Facility: ${facility} • Last ${days} days`}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map((d) => ({ ...d, label: formatDateISO(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip labelFormatter={(lab) => lab} />
                  <Legend />
                  <Line type="monotone" dataKey="co2" stroke="#ef4444" dot={false} name="CO2 (kg)" />
                  <Line type="monotone" dataKey="energy" stroke="#111827" dot={false} name="Energy (kWh)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Recent daily readings" subtitle="Reverse-chronological">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-left text-neutral-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">CO2 (kg)</th>
                    <th className="py-2">Energy (kWh)</th>
                    <th className="py-2">Water (L)</th>
                    <th className="py-2">Recycled (kg)</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTable.slice(0, 14).map((r) => (
                    <tr key={r.date} className="border-t">
                      <td className="py-2">{formatDateISO(r.date)}</td>
                      <td className="py-2">{r.co2.toLocaleString()}</td>
                      <td className="py-2">{r.energy.toLocaleString()}</td>
                      <td className="py-2">{r.water.toLocaleString()}</td>
                      <td className="py-2">{r.wasteRecycled.toLocaleString()}</td>
                      <td className="py-2">
                        {r.co2 > 1100 ? <Tag tone="rose">High</Tag> : <Tag tone="green">OK</Tag>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
