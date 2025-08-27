import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import ErrorBoundary from "../../components/ErrorBoundary.jsx";

export default function UI28_VendorManagement360() {
  const vendors = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const id = `VND-${1000 + i}`;
      const otd = Math.round(70 + Math.random() * 25);
      const defect = Math.round(Math.random() * 10);
      const price = (100 + Math.round(Math.random() * 900)) / 10; // price index
      const sla = Math.round(85 + Math.random() * 15);
      const risk = ["Low", "Medium", "High"][Math.floor(Math.random() * 3)];
      const spendBreakdown = [
        { name: "Hardware", value: Math.round(Math.random() * 60 + 10) },
        { name: "Services", value: Math.round(Math.random() * 40 + 5) },
        { name: "Licenses", value: Math.round(Math.random() * 30 + 2) },
      ];
      return {
        id,
        name: `Vendor ${String.fromCharCode(65 + i)}`,
        otd,
        defect,
        price,
        sla,
        risk,
        spendBreakdown,
      };
    });
  }, []);

  const [selected, setSelected] = useState(null);

  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  const score = (v) => {
    if (!v) return "-";
    // simple weighted score (higher is better)
    const otdScore = v.otd;
    const defectScore = Math.max(0, 100 - v.defect * 8);
    const slaScore = v.sla;
    const pricePenalty = Math.max(0, 100 - (v.price - 10) * 2);
    const base = (otdScore * 0.35 + defectScore * 0.25 + slaScore * 0.3 + pricePenalty * 0.1) / 1;
    return Math.round(base);
  };

  const aggregatedSpend = useMemo(() => {
    const all = {};
    vendors.forEach((v) => v.spendBreakdown.forEach((s) => (all[s.name] = (all[s.name] || 0) + s.value)));
    return Object.keys(all).map((k) => ({ name: k, value: all[k] }));
  }, [vendors]);

  return (
    <ErrorBoundary>
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Vendor Management 360</h2>
            <p className="text-sm text-zinc-400">Overview of supplier performance and spend</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-sm rounded"
              onClick={() => setSelected(null)}
            >
              Clear Selection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="col-span-1 p-3 border rounded-2xl">
            <div className="text-sm text-zinc-400">Vendors</div>
            <ul className="mt-3 space-y-2">
              {vendors.map((v) => (
                <li key={v.id}>
                  <button
                    className="flex items-center w-full gap-3 p-2 text-left rounded hover:bg-gray-200"
                    onClick={() => setSelected(v)}
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="flex-1">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-zinc-500">{v.id} • OTD {v.otd}% • Defect {v.defect}%</div>
                    </div>
                    <div className="text-sm font-semibold">{score(v)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 p-3 border rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">Spend Breakdown (All Vendors)</div>
              <div className="text-xs text-zinc-400">Total categories: {aggregatedSpend.length}</div>
            </div>
            <div className="h-48 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={aggregatedSpend} dataKey="value" nameKey="name" outerRadius={110} innerRadius={50}>
                    {aggregatedSpend.map((_, idx) => (
                      <Cell key={idx} fill={colors[idx % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {vendors.slice(0, 3).map((v) => (
                <div key={v.id} className="p-2 border rounded-lg">
                  <div className="text-xs text-zinc-400">{v.name}</div>
                  <div className="text-lg font-semibold">{score(v)}</div>
                  <div className="text-xs text-zinc-500">OTD {v.otd}% • SLA {v.sla}%</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-zinc-400">Recent Activity</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 text-sm border rounded">POs issued: {Math.round(Math.random() * 90 + 10)}</div>
              <div className="p-2 text-sm border rounded">Avg Lead Time: {Math.round(Math.random() * 45 + 7)} days</div>
            </div>
          </div>
        </div>

        {/* Drawer */}
        {selected && (
          <div className="fixed top-[55px] inset-0 flex justify-end bg-black/60" onClick={() => setSelected(null)}>
            <div className="w-full h-full max-w-xl p-4 bg-white border-l" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-xl font-semibold">{selected.name}</div>
                  <div className="font-mono text-xs text-zinc-500">{selected.id}</div>
                </div>
                <button className="px-3 py-1 ml-auto rounded-lg" onClick={() => setSelected(null)}>Close</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 border rounded-2xl">
                  <div className="text-sm text-zinc-400">KPIs</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>OTD: <b>{selected.otd}%</b></li>
                    <li>Defect: <b>{selected.defect}%</b></li>
                    <li>Price Index: <b>{selected.price}</b></li>
                    <li>SLA: <b>{selected.sla}%</b></li>
                    <li>Risk Level: <b>{selected.risk}</b></li>
                    <li>Score: <b>{score(selected)}</b></li>
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Invite</button>
                    <button className="px-3 py-1 rounded-lg">Send RFQ</button>
                    <button className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300">Blocklist</button>
                  </div>
                </div>

                <div className="p-3 border rounded-2xl">
                  <div className="text-sm text-zinc-400">Spend Breakdown</div>
                  <div className="h-40 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={selected.spendBreakdown} dataKey="value" nameKey="name" outerRadius={80}>
                          {selected.spendBreakdown.map((_, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="p-3 mt-3 border rounded-2xl">
                <div className="text-sm text-zinc-400">Recent POs</div>
                <table className="min-w-full mt-2 text-sm">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="text-left">PO</th>
                      <th className="text-left">Date</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4].map(i => (
                      <tr key={i} className="border-t border-zinc-800">
                        <td>PO-{String(1000 + i)}</td>
                        <td>2025-08-{20+i}</td>
                        <td className="text-right">${(Math.random()*20000+5000).toFixed(0)}</td>
                        <td className="text-right">{["Issued","In Transit","Received"][i%3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}