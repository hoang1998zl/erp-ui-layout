import React, { useMemo, useState } from "react";
import ErrorBoundary from "../../components/ErrorBoundary.jsx";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function UI29_InventoryOptimization() {
  const items = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const sku = `SKU-${1000 + i}`;
      const name = `Part ${String.fromCharCode(65 + (i % 26))}`;
      const demandDaily = Math.round(5 + Math.random() * 95);
      const L = Math.round(3 + Math.random() * 12); // lead time days
      const sigma = Math.round(Math.random() * 20);
      const z = 1.65; // 95% service level approx
      const safety = Math.round(z * sigma * Math.sqrt(L));
      const rop = Math.round(demandDaily * L + safety);
      const eoq = Math.round(Math.sqrt((2 * demandDaily * 365 * (50 + Math.random() * 150)) / (0.2 * (10 + Math.random() * 40) + 1)) / 1); // heuristic EOQ
      const onHand = Math.round(Math.random() * 500);
      const need = Math.max(0, rop - onHand);
      const recommendPO = need > 0 ? Math.max(eoq, need) : 0;
      const value = (demandDaily * 365) * (10 + Math.random() * 90); // rough annual value
      return {
        sku,
        name,
        demandDaily,
        L,
        sigma,
        safety,
        rop,
        eoq,
        onHand,
        need,
        recommendPO,
        value,
      };
    });
  }, []);

  // sel is an array of draft POs
  const [sel, setSel] = useState([]);

  const addToDraft = (row) => {
    setSel((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (next.find((p) => p.sku === row.sku)) return next; // avoid duplicates
      next.push({ sku: row.sku, name: row.name, qty: row.recommendPO || 0, vendor: "Default Vendor", eta: `${7 + Math.floor(Math.random() * 7)}d` });
      return next;
    });
  };

  const viewDrafts = () => {
    setSel((prev) => {
      if (Array.isArray(prev) && prev.length > 0) return prev;
      const first = items[0];
      return [{ sku: first.sku, name: first.name, qty: first.recommendPO || 0, vendor: "Default Vendor", eta: "7d" }];
    });
  };

  const clearDrafts = () => setSel([]);

  const abcData = useMemo(() => {
    // sort by value desc and compute cumulative %
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, r) => s + r.value, 0) || 1;
    let cum = 0;
    return sorted.map((r) => {
      cum += r.value;
      return { sku: r.sku, pct: Math.round((cum / total) * 100) };
    });
  }, [items]);

  return (
    <ErrorBoundary>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Inventory Optimization</h2>
            <p className="text-sm text-zinc-400">EOQ, ROP, safety stock and ABC classification</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm border border-dashed"
              onClick={viewDrafts}
            >
              View Drafts
            </button>
            <button
              className="px-3 py-1 text-sm border border-dashed"
              onClick={clearDrafts}
            >
              Clear Drafts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 2xl:col-span-8">
            <div className="p-4 border rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">Inventory Replenishment Table</div>
                <div className="text-xs text-zinc-400">Items: {items.length}</div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">SKU</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-right">Demand/Day</th>
                      <th className="px-4 py-2 text-right">L (days)</th>
                      <th className="px-4 py-2 text-right">σ</th>
                      <th className="px-4 py-2 text-right">Safety</th>
                      <th className="px-4 py-2 text-right">ROP</th>
                      <th className="px-4 py-2 text-right">EOQ</th>
                      <th className="px-4 py-2 text-right">On Hand</th>
                      <th className="px-4 py-2 text-right">Need</th>
                      <th className="px-4 py-2 text-right">Recommend PO</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.sku} className="border-t border-zinc-800 hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono">{r.sku}</td>
                        <td className="px-4 py-2">{r.name}</td>
                        <td className="px-4 py-2 text-right">{r.demandDaily}</td>
                        <td className="px-4 py-2 text-right">{r.L}</td>
                        <td className="px-4 py-2 text-right">{r.sigma}</td>
                        <td className="px-4 py-2 text-right">{r.safety}</td>
                        <td className="px-4 py-2 text-right">{r.rop}</td>
                        <td className="px-4 py-2 text-right">{r.eoq}</td>
                        <td className="px-4 py-2 text-right">{r.onHand}</td>
                        <td className="px-4 py-2 text-right">{r.need}</td>
                        <td className="px-4 py-2 font-semibold text-right">{r.recommendPO}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            className="px-2 py-1 text-xs rounded bg-emerald-600/10 hover:bg-emerald-600/20"
                            onClick={() => addToDraft(r)}
                          >
                            Add to Draft
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          <div className="col-span-12 2xl:col-span-4">
            <div className="p-4 border rounded-2xl">
              <div className="mb-2 text-sm text-zinc-400">ABC Classification (cumulative % by value)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={abcData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="sku" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                    <Bar dataKey="pct" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-zinc-500">A: ~80% | B: ~15% | C: ~5% (theo giá trị tích lũy)</div>
            </div>
          </div>
        </div>

        {/* Draft POs Modal */}
        {Array.isArray(sel) && sel.length > 0 && (
          <div className="fixed inset-0 flex items-end justify-center p-4 bg-black/60 md:items-center" onClick={() => setSel([])}>
            <div className="w-full max-w-3xl p-4 bg-white border border-zinc-800 rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center">
                <div className="text-lg font-semibold">Draft Purchase Orders</div>
                <button className="px-3 py-1 ml-auto border rounded-lg hover:bg-gray-200" onClick={() => setSel([])}>Close</button>
              </div>
              <table className="min-w-full mt-3 text-sm">
                <thead className="text-zinc-400">
                  <tr>
                    <th className="text-left">SKU</th>
                    <th className="text-left">Name</th>
                    <th className="text-right">Qty</th>
                    <th className="text-left">Vendor</th>
                    <th className="text-right">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {sel.map((p, idx) => (
                    <tr key={idx} className="border-t border-zinc-800">
                      <td>{p.sku}</td>
                      <td>{p.name}</td>
                      <td className="text-right">{p.qty}</td>
                      <td>{p.vendor}</td>
                      <td className="text-right">{p.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-2 mt-3">
                <button className="px-3 py-2 border rounded-lg hover:bg-gray-200" onClick={() => {
                  // export CSV quick
                  const csv = ["SKU,Name,Qty,Vendor,ETA", ...sel.map(s => `${s.sku},${s.name},${s.qty},${s.vendor},${s.eta}`)].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "draft_pos.csv"; a.click(); URL.revokeObjectURL(url);
                }}>Export CSV</button>
                <button className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Create POs</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}