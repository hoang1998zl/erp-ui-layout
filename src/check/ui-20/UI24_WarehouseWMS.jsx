import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import Skeleton from "../../components/Skeleton";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

/**
 * UI24 – Warehouse WMS
 * Mục tiêu
 * - Tổng quan tồn kho theo khu vực (Zone → Aisle → Bin) + occupancy, throughput
 * - Hàng đến (Receiving/ASN) → Putaway Tasks
 * - Picking Tasks (Wave) + mô phỏng quét mã (scan)
 * - Movements (Transfer), Cycle Count, và Inventory Snapshot
 * - Drawer chi tiết SKU/Bin, Modal tạo nhiệm vụ, Export CSV
 *
 * Phụ thuộc: recharts (npm i recharts)
 */

const money = (n, c = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n);

const ZONES = [
  { zone: "A", aisles: 8 },
  { zone: "B", aisles: 10 },
  { zone: "C", aisles: 6 },
];

// Mock SKUs / bins
const SKUS = [
  { sku: "SKU-001", name: "Bolt M6", uom: "pcs", price: 0.08 },
  { sku: "SKU-002", name: "Nut M6", uom: "pcs", price: 0.06 },
  { sku: "SKU-003", name: "Washer 6mm", uom: "pcs", price: 0.02 },
  { sku: "SKU-004", name: "Housing A", uom: "pcs", price: 4.20 },
  { sku: "SKU-005", name: "Grease 200g", uom: "tube", price: 1.90 },
];

const rand = (a,b)=> Math.floor(a + Math.random()*(b-a+1));

const initialBins = Array.from({length: 80}, (_,i)=>{
  const zone = ZONES[rand(0,ZONES.length-1)].zone;
  const aisle = rand(1,10);
  const level = rand(1,4);
  const pos = rand(1,20);
  const sku = SKUS[rand(0,SKUS.length-1)];
  const qty = rand(0,1200);
  const cap = 1500;
  return {
    bin: `${zone}-${String(aisle).padStart(2,'0')}-${level}-${String(pos).padStart(2,'0')}`,
    zone, aisle, level, pos,
    sku: sku.sku, name: sku.name, uom: sku.uom, price: sku.price,
    qty, cap
  };
});

const initialASN = [
  { asn: "ASN-7001", vendor: "Alpha Components", eta: "2025-08-27 13:00", lines: 5, status: "Arrived" },
  { asn: "ASN-7002", vendor: "Gamma Plastics", eta: "2025-08-27 16:30", lines: 3, status: "In Transit" },
];

const initialWaves = [
  { wave: "WAVE-3101", orders: 12, lines: 48, priority: "High", status: "Picking" },
  { wave: "WAVE-3102", orders: 6, lines: 22, priority: "Normal", status: "Queued" },
];

const COLORS = ["#22c55e", "#06b6d4", "#a78bfa", "#f59e0b", "#ef4444"]; // chỉ dùng cho Pie mặc định

function KPI({ label, value, sub }) {
  return (
    <div className="p-4 border rounded-2xl">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

export default function UI24_WarehouseWMS(){
  const [loading, setLoading] = useState(true);
  const [bins, setBins] = useState(initialBins);
  const [asn, setAsn] = useState(initialASN);
  const [waves, setWaves] = useState(initialWaves);
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("All");
  const [drawer, setDrawer] = useState(null); // bin/sku detail
  const [scan, setScan] = useState("");
  const [taskModal, setTaskModal] = useState(false);
  const [taskType, setTaskType] = useState("Putaway");

  useEffect(()=>{
    const t = setTimeout(()=> setLoading(false), 500);
    return ()=> clearTimeout(t);
  },[]);

  // Derived
  const filteredBins = useMemo(()=> bins.filter(b=>{
    const okText = (b.bin + b.sku + b.name).toLowerCase().includes(q.toLowerCase());
    const okZone = zone === "All" || b.zone === zone;
    return okText && okZone;
  }), [bins, q, zone]);

  const invSummary = useMemo(()=>{
    const byZone = {};
    for(const b of filteredBins){
      byZone[b.zone] = byZone[b.zone] || { zone: b.zone, qty:0, value:0 };
      byZone[b.zone].qty += b.qty;
      byZone[b.zone].value += b.qty * b.price;
    }
    return Object.values(byZone).sort((a,b)=> a.zone.localeCompare(b.zone));
  }, [filteredBins]);

  const occupancy = useMemo(()=> filteredBins.map(b=>({ bin: b.bin, occ: Math.round((b.qty/b.cap)*100) })), [filteredBins]);

  const skuMix = useMemo(()=>{
    const m = {};
    filteredBins.forEach(b=>{ m[b.sku] = (m[b.sku]||0) + b.qty; });
    const arr = Object.entries(m).map(([k,v])=>({ name: k, value: v }));
    return arr.length ? arr : [{name: "N/A", value: 1}];
  }, [filteredBins]);

  const totals = useMemo(()=>{
    const tQty = filteredBins.reduce((a,b)=> a+b.qty, 0);
    const tVal = filteredBins.reduce((a,b)=> a + b.qty*b.price, 0);
    const cap = filteredBins.reduce((a,b)=> a+b.cap, 0);
    const occ = cap ? Math.round((tQty / cap)*100) : 0;
    return { tQty, tVal, cap, occ };
  }, [filteredBins]);

  // Actions
  const handleScan = () => {
    /** Format mã giả lập:
     * PICK:SKU-001:20  => trừ 20 khỏi tổng (ưu tiên bin có qty cao)
     * PUT:SKU-003:50:A-03-2-05 => nhập 50 vào bin chỉ định; nếu không chỉ định sẽ nhập vào bin trống hơn cùng zone
     */
    const s = scan.trim();
    if(!s) return;
    try {
      const [cmd, sku, qtyStr, forcedBin] = s.split(":");
      const qty = Number(qtyStr||0);
      if(cmd === "PICK"){
        setBins(prev=>{
          let left = qty;
          const bySku = [...prev].sort((a,b)=> b.qty - a.qty);
          for(const b of bySku){
            if(b.sku !== sku || left<=0) continue;
            const take = Math.min(b.qty, left);
            b.qty -= take; left -= take;
          }
          return [...prev];
        });
      } else if(cmd === "PUT"){
        setBins(prev=>{
          const idx = forcedBin ? prev.findIndex(b=> b.bin === forcedBin) : prev.findIndex(b=> b.sku===sku && (b.cap-b.qty) > 0);
          if(idx>=0){
            const free = prev[idx].cap - prev[idx].qty;
            prev[idx].qty += Math.min(free, qty);
          } else {
            // tạo bin mới
            const newBin = `A-${String(rand(1,10)).padStart(2,'0')}-${rand(1,4)}-${String(rand(1,20)).padStart(2,'0')}`;
            const meta = SKUS.find(x=>x.sku===sku) || SKUS[0];
            prev.unshift({ bin:newBin, zone:"A", aisle:1, level:1, pos:1, sku:meta.sku, name:meta.name, uom:meta.uom, price:meta.price, qty:Math.min(100,qty), cap:1500 });
          }
          return [...prev];
        });
      }
      setScan("");
    } catch(e){
      console.warn(e);
    }
  };

  const createTask = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const type = f.get("type") || "Putaway";
    const sku = f.get("sku") || "SKU-001";
    const qty = Number(f.get("qty")||0);
    const bin = f.get("bin") || "";
    // đơn giản: chuyển thành lệnh scan
    setScan(`${type === 'Picking' ? 'PICK' : 'PUT'}:${sku}:${qty}${bin?`:${bin}`:""}`);
    setTaskModal(false);
  };

  const exportCSV = () => {
    const rows = [["Bin","SKU","Name","Qty","UoM","Cap","Zone","Aisle","Level","Pos","Value"],
      ...filteredBins.map(b => [b.bin,b.sku,b.name,b.qty,b.uom,b.cap,b.zone,b.aisle,b.level,b.pos,(b.qty*b.price).toFixed(2)])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `warehouse_bins_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <div className="flex">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Topbar title="UI24 · Warehouse WMS" />

          {/* Filters + KPIs */}
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Tìm SKU/Bin…" className="w-64 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              <select value={zone} onChange={(e)=>setZone(e.target.value)} className="px-3 py-2 border rounded-xl">
                {["All", ...ZONES.map(z=>z.zone)].map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <button onClick={()=>setTaskModal(true)} className="px-3 py-2 ml-auto rounded-lg ">New Task</button>
              <button onClick={exportCSV} className="px-3 py-2 rounded-lg ">Export CSV</button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <KPI label="Total Qty" value={totals.tQty.toLocaleString()} sub={`${totals.occ}% occupancy`} />
              <KPI label="Inventory Value" value={money(totals.tVal)} />
              <KPI label="ASNs Today" value={asn.length} sub={`${asn.filter(a=>a.status==='Arrived').length} arrived`} />
              <KPI label="Waves" value={waves.length} sub={`${waves.filter(w=>w.status==='Picking').length} picking`} />
              <KPI label="Bins" value={filteredBins.length} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 p-4 border xl:col-span-7 rounded-2xl">
                <div className="mb-2 text-sm text-zinc-400">Occupancy by Bin (%)</div>
                {loading ? <Skeleton className="h-44" /> : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancy.slice(0,40)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6e7eb" />
                        <XAxis dataKey="bin" hide />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }} />
                        <Bar dataKey="occ" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="col-span-12 p-4 border xl:col-span-5 rounded-2xl">
                <div className="mb-2 text-sm text-zinc-400">SKU Mix (Qty)</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={skuMix} dataKey="value" nameKey="name" outerRadius={100} label>
                        {skuMix.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Receiving + Waves */}
          <div className="grid grid-cols-12 gap-4 p-4">
            <div className="col-span-12 overflow-hidden border xl:col-span-6 2xl:col-span-7 rounded-2xl">
              <div className="px-4 py-3 text-sm border-b">Receiving / ASN</div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">ASN</th>
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-left">ETA</th>
                    <th className="px-4 py-2 text-left">Lines</th>
                    <th className="px-4 py-2 text-right">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {asn.map(a => (
                    <tr key={a.asn} className="border-t border-zinc-800 hover:bg-gray-200">
                      <td className="px-4 py-2 font-mono">{a.asn}</td>
                      <td className="px-4 py-2">{a.vendor}</td>
                      <td className="px-4 py-2">{a.eta}</td>
                      <td className="px-4 py-2">{a.lines}</td>
                      <td className="px-4 py-2 text-right">{a.status}</td>
                      <td className="px-4 py-2 text-right">
                        <button className="px-3 py-1 mr-2 rounded-lg " onClick={()=>setTaskModal(true)}>Create Putaway</button>
                        <button className="px-3 py-1 rounded-lg ">GRN</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="col-span-12 overflow-hidden border xl:col-span-6 2xl:col-span-5 rounded-2xl">
              <div className="px-4 py-3 text-sm border-b">Waves (Picking)</div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Wave</th>
                    <th className="px-4 py-2 text-left">Orders</th>
                    <th className="px-4 py-2 text-left">Lines</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waves.map(w => (
                    <tr key={w.wave} className="border-t border-zinc-800 hover:bg-gray-200">
                      <td className="px-4 py-2 font-mono">{w.wave}</td>
                      <td className="px-4 py-2">{w.orders}</td>
                      <td className="px-4 py-2">{w.lines}</td>
                      <td className="px-4 py-2">{w.priority}</td>
                      <td className="px-4 py-2">{w.status}</td>
                      <td className="px-4 py-2 text-right">
                        <button className="px-3 py-1 mr-2 rounded-lg " onClick={()=> setScan("PICK:SKU-001:25")}>Sim PICK</button>
                        <button className="px-3 py-1 rounded-lg ">Dispatch</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory table */}
          <div className="p-4">
            <div className="overflow-auto border rounded-2xl">
              <div className="flex items-center gap-2 px-4 py-3 text-sm border-b">
                Inventory by Bin
                <span className="ml-auto text-xs text-zinc-500">Click một hàng để mở chi tiết</span>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Bin</th>
                    <th className="px-4 py-2 text-left">SKU</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">UoM</th>
                    <th className="px-4 py-2 text-right">Capacity</th>
                    <th className="px-4 py-2 text-right">Occupancy</th>
                    <th className="px-4 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBins.map(b => (
                    <tr key={b.bin+"-"+b.sku} className="border-t cursor-pointer border-zinc-800 hover:bg-gray-200" onClick={()=> setDrawer(b)}>
                      <td className="px-4 py-2 font-mono">{b.bin}</td>
                      <td className="px-4 py-2 font-mono">{b.sku}</td>
                      <td className="px-4 py-2">{b.name}</td>
                      <td className="px-4 py-2 text-right">{b.qty}</td>
                      <td className="px-4 py-2 text-right">{b.uom}</td>
                      <td className="px-4 py-2 text-right">{b.cap}</td>
                      <td className="px-4 py-2 text-right">{Math.round((b.qty/b.cap)*100)}%</td>
                      <td className="px-4 py-2 text-right">{money(b.qty*b.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drawer Bin/SKU detail */}
          {drawer && (
            <div className="fixed inset-0 flex justify-end bg-black/60" onClick={()=> setDrawer(null)}>
              <div className="w-full h-full max-w-xl p-4 overflow-auto border-l bg-zinc-950 border-zinc-800" onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-xl font-semibold">{drawer.sku} • {drawer.name}</div>
                    <div className="font-mono text-xs text-zinc-500">Bin: {drawer.bin} • Zone {drawer.zone} / Aisle {drawer.aisle} / L{drawer.level} / Pos {drawer.pos}</div>
                  </div>
                  <button className="px-3 py-1 ml-auto rounded-lg " onClick={()=> setDrawer(null)}>Close</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 border rounded-2xl">
                    <div className="text-sm text-zinc-400">Snapshot</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Qty: <b>{drawer.qty} {drawer.uom}</b></li>
                      <li>Capacity: <b>{drawer.cap}</b> ({Math.round((drawer.qty/drawer.cap)*100)}%)</li>
                      <li>Value: <b>{money(drawer.qty*drawer.price)}</b></li>
                    </ul>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300" onClick={()=>{ setTaskType('Picking'); setTaskModal(true);} }>Pick</button>
                      <button className="px-3 py-1 rounded-lg " onClick={()=>{ setTaskType('Putaway'); setTaskModal(true);} }>Putaway</button>
                      <button className="px-3 py-1 rounded-lg ">Cycle Count</button>
                    </div>
                  </div>

                  <div className="p-3 border rounded-2xl">
                    <div className="text-sm text-zinc-400">7-day Throughput (mock)</div>
                    <div className="h-40 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={Array.from({length:7},(_,i)=>({ d:`D${i+1}`, in: rand(10,120), out: rand(10,120) }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="d" stroke="#a1a1aa"/>
                          <YAxis stroke="#a1a1aa"/>
                          <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                          <Line type="monotone" dataKey="in" stroke="#22c55e" />
                          <Line type="monotone" dataKey="out" stroke="#06b6d4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-3 mt-3 border rounded-2xl">
                  <div className="text-sm text-zinc-400">Recent Movements</div>
                  <table className="min-w-full mt-2 text-sm">
                    <thead className="text-zinc-400">
                      <tr>
                        <th className="text-left">Txn</th>
                        <th className="text-left">Type</th>
                        <th className="text-left">Qty</th>
                        <th className="text-left">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4].map(i => (
                        <tr key={i} className="border-t border-zinc-800">
                          <td>MV-{String(9000+i)}</td>
                          <td>{["Putaway","Pick","Transfer","Cycle Count"][i%4]}</td>
                          <td>{rand(5,60)} {drawer.uom}</td>
                          <td>2025-08-2{rand(0,7)} 0{rand(8,9)}:{rand(10,59)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Scan Bar */}
          <div className="p-4">
            <div className="flex items-center gap-2 p-3 border rounded-2xl">
              <div className="text-sm text-zinc-400">Scan command</div>
              <input value={scan} onChange={(e)=>setScan(e.target.value)} placeholder="Ví dụ: PICK:SKU-001:20 hoặc PUT:SKU-003:50:A-03-2-05" className="flex-1 px-3 py-2 border rounded-xl"/>
              <button className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300" onClick={handleScan}>Apply</button>
            </div>
          </div>

          {/* Modal Create Task */}
          {taskModal && (
            <div className="fixed inset-0 flex items-end justify-center p-4 bg-black/60 md:items-center" onClick={()=> setTaskModal(false)}>
              <form className="w-full max-w-xl p-4 border bg-zinc-950 border-zinc-800 rounded-2xl" onSubmit={createTask} onClick={(e)=> e.stopPropagation()}>
                <div className="flex items-center">
                  <div className="text-lg font-semibold">Create Task</div>
                  <button type="button" className="px-3 py-1 ml-auto rounded-lg " onClick={()=> setTaskModal(false)}>Close</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs text-zinc-400">Type</label>
                    <select name="type" defaultValue={taskType} className="w-full px-3 py-2 mt-1 border rounded-xl">
                      {['Putaway','Picking','Transfer'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">SKU</label>
                    <select name="sku" className="w-full px-3 py-2 mt-1 border rounded-xl">
                      {SKUS.map(s => <option key={s.sku} value={s.sku}>{s.sku} — {s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Qty</label>
                    <input name="qty" type="number" min="1" defaultValue="10" className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Target Bin (optional)</label>
                    <input name="bin" placeholder="A-03-2-05" className="w-full px-3 py-2 mt-1 border rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={()=> setTaskModal(false)} className="px-3 py-2 rounded-lg ">Cancel</button>
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