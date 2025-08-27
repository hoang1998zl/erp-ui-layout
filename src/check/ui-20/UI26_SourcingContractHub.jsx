import React, { useMemo, useState } from "react";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import Skeleton from "../../components/Skeleton";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

/**
 * UI26 – Sourcing & Contract Hub
 * Mục tiêu
 * - Điều phối RFQ/RFP theo dạng bảng Kanban (Draft → Bidding → Evaluation → Awarded)
 * - Quản trị Hợp đồng: bảng chi tiết + Drawer hiển thị KPI, timeline, điều khoản & rủi ro
 * - KPI tổng quan + biểu đồ Savings Trend (tháng)
 * - Tính năng Export CSV, tạo RFQ nhanh, chuyển RFQ (Awarded) → Contract
 *
 * Phụ thuộc: recharts (npm i recharts)
 */

const now = new Date();
const fmt = (d) => new Date(d).toISOString().slice(0, 10);
const daysTo = (d) => Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24));
const money = (n, c = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n);

const CATEGORIES = ["All", "Raw Materials", "Components", "Packaging", "Logistics", "Services"];
const STAGES = ["Draft", "Bidding", "Evaluation", "Awarded"];
const CONTRACT_STATUS = ["Active", "Suspended", "Expired"];

const mockRFQs = [
  { id: "RFQ-2301", title: "Steel Coils Q4", category: "Raw Materials", estValue: 280000, currency: "USD", suppliers: 5, stage: "Bidding", closeDate: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) },
  { id: "RFQ-2302", title: "Packaging Cartons", category: "Packaging", estValue: 65000, currency: "USD", suppliers: 8, stage: "Draft", closeDate: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15)) },
  { id: "RFQ-2303", title: "Injection Molding Parts", category: "Components", estValue: 120000, currency: "USD", suppliers: 4, stage: "Evaluation", closeDate: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3)) },
  { id: "RFQ-2304", title: "Road Freight 2026", category: "Logistics", estValue: 90000, currency: "USD", suppliers: 6, stage: "Awarded", closeDate: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)) },
];

const mockContracts = [
  { id: "CT-1101", title: "Aluminum Sheets FY25", vendor: "Delta Metals", owner: "Procurement", startDate: fmt("2025-02-01"), endDate: fmt("2025-12-31"), value: 450000, currency: "USD", status: "Active", savingsPct: 6.5, risk: "Low" },
  { id: "CT-1102", title: "3PL National Freight", vendor: "TransAsia Logistics", owner: "Supply Chain", startDate: fmt("2025-01-01"), endDate: fmt("2025-09-30"), value: 180000, currency: "USD", status: "Active", savingsPct: 4.2, risk: "Medium" },
  { id: "CT-1103", title: "Industrial Packaging 2025", vendor: "PackRight Co.", owner: "Procurement", startDate: fmt("2025-04-01"), endDate: fmt("2025-10-15"), value: 120000, currency: "USD", status: "Active", savingsPct: 3.1, risk: "Low" },
  { id: "CT-1104", title: "Molding Services", vendor: "Gamma Plastics", owner: "Operations", startDate: fmt("2024-09-01"), endDate: fmt("2025-08-31"), value: 220000, currency: "USD", status: "Active", savingsPct: 5.8, risk: "High" },
];

const savingsTrend = Array.from({ length: 12 }, (_, i) => {
  const dt = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
  const val = 40000 + Math.round(Math.random() * 40000);
  return { m: dt.toISOString().slice(0, 7), savings: val };
});

function KPI({ label, value, sub }) {
  return (
    <div className="p-4 border rounded-2xl">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

function StageBadge({ s }) {
  const map = {
    Draft: "bg-zinc-600/20 text-zinc-200 border-zinc-600/40",
    Bidding: "bg-amber-500/15 text-amber-300 border-amber-700/30",
    Evaluation: "bg-sky-500/15 text-sky-300 border-sky-700/30",
    Awarded: "bg-emerald-500/15 text-emerald-300 border-emerald-700/30",
  };
  return <span className={`px-2 py-0.5 rounded-full border text-xs ${map[s]}`}>{s}</span>;
}

function StatusBadge({ s }) {
  const map = {
    Active: "bg-emerald-500/15 text-emerald-300 border-emerald-700/30",
    Suspended: "bg-amber-500/15 text-amber-300 border-amber-700/30",
    Expired: "bg-rose-500/15 text-rose-300 border-rose-700/30",
  };
  return <span className={`px-2 py-0.5 rounded-full border text-xs ${map[s]}`}>{s}</span>;
}

export default function UI26_SourcingContractHub() {
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [rfqs, setRfqs] = useState(mockRFQs);
  const [contracts, setContracts] = useState(mockContracts);
  const [drawer, setDrawer] = useState(null); // contract
  const [modalRFQ, setModalRFQ] = useState(false);
  const [filterRisk, setFilterRisk] = useState({ Low: true, Medium: true, High: true });
  const [sortBy, setSortBy] = useState("endDate");

  const filteredRFQ = useMemo(() => rfqs.filter(r => {
    const okText = (r.id + r.title).toLowerCase().includes(q.toLowerCase());
    const okCat = cat === "All" || r.category === cat;
    return okText && okCat;
  }), [rfqs, q, cat]);

  const filteredContracts = useMemo(() => contracts
    .filter(c => (c.id + c.title + c.vendor).toLowerCase().includes(q.toLowerCase()))
    .filter(c => filterRisk[c.risk])
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "savings") return b.savingsPct - a.savingsPct;
      return new Date(a.endDate) - new Date(b.endDate);
    }), [contracts, q, filterRisk, sortBy]);

  const kpi = useMemo(() => {
    const totalRFQ = rfqs.length;
    const inBidding = rfqs.filter(r => r.stage === "Bidding").length;
    const activeContracts = contracts.filter(c => c.status === "Active").length;
    const expSoon = contracts.filter(c => daysTo(c.endDate) <= 30 && daysTo(c.endDate) >= 0).length;
    const savings = Math.round(contracts.reduce((a, c) => a + (c.value * (c.savingsPct / 100)), 0));
    return { totalRFQ, inBidding, activeContracts, expSoon, savings };
  }, [rfqs, contracts]);

  const move = (id, dir) => {
    setRfqs(prev => prev.map(r => {
      if (r.id !== id) return r;
      const idx = STAGES.indexOf(r.stage);
      const nextIdx = idx + (dir === "next" ? 1 : -1);
      if (nextIdx < 0 || nextIdx >= STAGES.length) return r;
      return { ...r, stage: STAGES[nextIdx] };
    }));
  };

  const awardToContract = (rfq) => {
    const newC = {
      id: `CT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: rfq.title,
      vendor: "<Winner Vendor>",
      owner: "Procurement",
      startDate: fmt(new Date()),
      endDate: fmt(new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())),
      value: Math.round(rfq.estValue * (0.95 + Math.random() * 0.05)),
      currency: rfq.currency,
      status: "Active",
      savingsPct: (3 + Math.random() * 4).toFixed(1) * 1,
      risk: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)]
    };
    setContracts(prev => [newC, ...prev]);
  };

  const exportContractsCSV = () => {
    const rows = [["ID","Title","Vendor","Owner","Start","End","Value","Currency","Status","Savings%","Risk"],
      ...filteredContracts.map(c => [c.id,c.title,c.vendor,c.owner,c.startDate,c.endDate,c.value,c.currency,c.status,c.savingsPct,c.risk])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contracts_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const createRFQ = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = {
      id: `RFQ-${Math.floor(2000 + Math.random()*8000)}`,
      title: f.get("title") || "New RFQ",
      category: f.get("category") || "Services",
      estValue: Number(f.get("value") || 50000),
      currency: f.get("currency") || "USD",
      suppliers: Number(f.get("suppliers") || 3),
      stage: "Draft",
      closeDate: f.get("closeDate") || fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)),
    };
    setRfqs(prev => [r, ...prev]);
    setModalRFQ(false);
  };

  return (
    <ErrorBoundary>
      <div className="flex">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Topbar title="UI26 · Sourcing & Contract Hub" />

          {/* Filters + KPI */}
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Tìm RFQ/Contract…" className="w-64 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              <select value={cat} onChange={(e)=>setCat(e.target.value)} className="px-3 py-2 border rounded-xl">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={()=>setModalRFQ(true)} className="px-3 py-2 ml-auto rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">New RFQ</button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="Total RFQs" value={kpi.totalRFQ} sub={`${kpi.inBidding} đang bidding`} />
              <KPI label="Active Contracts" value={kpi.activeContracts} sub={`${kpi.expSoon} sắp hết hạn (<30d)`} />
              <KPI label="Realized Savings" value={money(kpi.savings)} sub="YTD" />
              <KPI label="Avg. RFQ Stage" value={"Draft <→> Awarded"} sub="Theo pipeline" />
            </div>

            <div className="p-4 border rounded-2xl">
              <div className="mb-2 text-sm text-zinc-400">Savings Trend (12 tháng)</div>
              {loading ? <Skeleton className="h-44"/> : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsTrend}>
                      <defs>
                        <linearGradient id="gsv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="m" stroke="#a1a1aa"/>
                      <YAxis stroke="#a1a1aa"/>
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                      <Area type="monotone" dataKey="savings" stroke="#22c55e" fill="url(#gsv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* RFQ Kanban + Contracts Table */}
          <div className="grid grid-cols-1 gap-4 p-4">
            {/* Kanban */}
            <div className="">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {STAGES.map(stage => (
                  <div key={stage} className="border rounded-2xl">
                    <div className="flex items-center gap-2 px-3 py-2 border-b">
                      <div className="text-sm font-medium text-zinc-300">{stage}</div>
                      <div className="ml-auto text-xs text-zinc-500">{filteredRFQ.filter(r=>r.stage===stage).length}</div>
                    </div>
                    <div className="p-3 space-y-2 min-h-[180px]">
                      {filteredRFQ.filter(r => r.stage === stage).map(r => (
                        <div key={r.id} className="p-3 border rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-zinc-400">{r.id}</span>
                            <StageBadge s={r.stage} />
                            <span className="ml-auto text-[11px] text-zinc-500">Đóng trong {daysTo(r.closeDate)}d</span>
                          </div>
                          <div className="mt-1 text-sm font-medium">{r.title}</div>
                          <div className="text-xs text-zinc-500">Category: {r.category} • Suppliers: {r.suppliers}</div>
                          <div className="flex gap-2 mt-2">
                            <button onClick={()=>move(r.id, "prev")} className="px-2 py-1 rounded-lg">Back</button>
                            <button onClick={()=>move(r.id, "next")} className="px-2 py-1 rounded-lg">Advance</button>
                            {r.stage === "Awarded" && (
                              <button onClick={()=>awardToContract(r)} className="px-2 py-1 ml-auto rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Create Contract</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contracts */}
            <div className="">
              <div className="overflow-hidden border rounded-2xl">
                <div className="flex items-center gap-3 px-3 py-2 border-b">
                  <div className="text-sm font-medium text-zinc-300">Contracts</div>
                  <div className="flex items-center gap-2 ml-auto text-xs">
                    <label>Sort:</label>
                    <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="px-2 py-1 border rounded-lg">
                      <option value="endDate">End date</option>
                      <option value="value">Value</option>
                      <option value="savings">Savings%</option>
                    </select>
                    <span className="ml-3">Risk:</span>
                    {(["Low","Medium","High"]).map(r => (
                      <label key={r} className="inline-flex items-center gap-1">
                        <input type="checkbox" checked={filterRisk[r]} onChange={(e)=>setFilterRisk(prev=>({...prev, [r]: e.target.checked}))} />
                        <span>{r}</span>
                      </label>
                    ))}
                    <button onClick={exportContractsCSV} className="px-3 py-1 ml-3 rounded-lg">Export CSV</button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Contract</th>
                        <th className="px-4 py-2 text-left">Vendor</th>
                        <th className="px-4 py-2 text-right">Value</th>
                        <th className="px-4 py-2 text-right">Savings%</th>
                        <th className="px-4 py-2 text-left">End</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map(c => (
                        <tr key={c.id} className="border-t cursor-pointer hover:bg-gray-200" onClick={()=>setDrawer(c)}>
                          <td className="px-4 py-2">
                            <div className="font-medium">{c.title}</div>
                            <div className="font-mono text-xs text-zinc-500">{c.id}</div>
                          </td>
                          <td className="px-4 py-2">{c.vendor}</td>
                          <td className="px-4 py-2 text-right">{money(c.value, c.currency)}</td>
                          <td className="px-4 py-2 text-right">{c.savingsPct}%</td>
                          <td className="px-4 py-2">{c.endDate} <span className="text-xs text-zinc-500">({daysTo(c.endDate)}d)</span></td>
                          <td className="px-4 py-2"><StatusBadge s={c.status} /></td>
                          <td className="px-4 py-2 text-right">{c.risk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Contract Detail */}
          {drawer && (
            <div className="fixed top-[55px] inset-0 flex justify-end bg-black/60" onClick={()=>setDrawer(null)}>
              <div className="w-full h-full max-w-xl p-4 overflow-auto bg-white border-l" onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-xl font-semibold">{drawer.title}</div>
                    <div className="font-mono text-xs text-zinc-500">{drawer.id} • Vendor: {drawer.vendor}</div>
                  </div>
                  <button className="px-3 py-1 ml-auto rounded-lg" onClick={()=>setDrawer(null)}>Close</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 border rounded-2xl">
                    <div className="text-sm text-zinc-400">KPIs</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Value: <b>{money(drawer.value, drawer.currency)}</b></li>
                      <li>Savings: <b>{drawer.savingsPct}%</b></li>
                      <li>Status: <b>{drawer.status}</b></li>
                      <li>Risk: <b>{drawer.risk}</b></li>
                      <li>End date: <b>{drawer.endDate}</b> ({daysTo(drawer.endDate)}d)</li>
                    </ul>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Renew</button>
                      <button className="px-3 py-1 rounded-lg">Suspend</button>
                      <button className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300">Terminate</button>
                    </div>
                  </div>

                  <div className="p-3 border rounded-2xl">
                    <div className="text-sm text-zinc-400">Timeline</div>
                    <div className="h-40 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { t: drawer.startDate, v: 0 },
                          { t: fmt(new Date(new Date(drawer.startDate).getTime() + (new Date(drawer.endDate) - new Date(drawer.startDate)) * 0.5)), v: 50 },
                          { t: drawer.endDate, v: 100 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="t" stroke="#a1a1aa"/>
                          <YAxis stroke="#a1a1aa" domain={[0,100]}/>
                          <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                          <Line type="monotone" dataKey="v" stroke="#22c55e" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-3 mt-3 border rounded-2xl">
                  <div className="text-sm text-zinc-400">Key Clauses & Compliance</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {["Service Level Agreement","Price Adjustment Formula","Force Majeure","Data Protection & Privacy","Termination & Penalties"].map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={idx !== 1} />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 mt-3 border rounded-2xl">
                  <div className="text-sm text-zinc-400">Milestones</div>
                  <table className="min-w-full mt-2 text-sm">
                    <thead className="text-zinc-400">
                      <tr>
                        <th className="text-left">Milestone</th>
                        <th className="text-left">Date</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Kickoff","Q2 Review","Q3 Review","Closeout"].map((m, i) => (
                        <tr key={i} className="border-t">
                          <td>{m}</td>
                          <td>{fmt(new Date(new Date(drawer.startDate).getTime() + (i * (new Date(drawer.endDate) - new Date(drawer.startDate)) / 3)))}</td>
                          <td className="text-right">{["Done","On Track","At Risk","Pending"][i]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modal New RFQ */}
          {modalRFQ && (
            <div className="fixed inset-0 flex items-end justify-center p-4 bg-black/60 md:items-center" onClick={()=>setModalRFQ(false)}>
              <form className="w-full max-w-xl p-4 border bg-zinc-950 rounded-2xl" onSubmit={createRFQ} onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-center">
                  <div className="text-lg font-semibold">Create RFQ</div>
                  <button type="button" className="px-3 py-1 ml-auto rounded-lg" onClick={()=>setModalRFQ(false)}>Close</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs text-zinc-400">Title</label>
                    <input name="title" required className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Category</label>
                    <select name="category" className="w-full px-3 py-2 mt-1 border rounded-xl">
                      {CATEGORIES.filter(c=>c!=="All").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Estimated Value</label>
                    <input name="value" type="number" min="0" defaultValue="50000" className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Currency</label>
                    <input name="currency" defaultValue="USD" className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Suppliers</label>
                    <input name="suppliers" type="number" min="1" defaultValue="3" className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Close Date</label>
                    <input name="closeDate" type="date" defaultValue={fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate()+14))} className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={()=>setModalRFQ(false)} className="px-3 py-2 rounded-lg">Cancel</button>
                  <button type="submit" className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300">Create</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}