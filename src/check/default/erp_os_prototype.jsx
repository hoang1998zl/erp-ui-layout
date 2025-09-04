import React, { useMemo, useState, useRef, useEffect } from "react";

/**
 * ERP‑OS – App Chat Shell (single file, JSX)
 * - Global Chat FAB → Right Chat Panel (420px)
 * - Drawer‑first routing for business forms (Lead/Quote/Approval)
 * - Mini‑composer when a drawer is open
 * - Context Panel with tabs (Activity/Lineage/Access/Chat)
 * - Deterministic parse() with quick acceptance tests
 * TailwindCSS for styling (no imports needed in Canvas)
 */

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

function RightDock({ open, title, onClose, children, width = 420 }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="h-full p-4 overflow-y-auto bg-white shadow-2xl" style={{ width }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{title}</div>
          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Drawer({ open, title, onClose, children, width = 560 }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="h-full p-4 overflow-y-auto bg-white shadow-2xl" style={{ width }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{title}</div>
          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const MANIFEST = [
  {
    id: "lead_create_v1",
    display: "Tạo Lead",
    route: "/sales/leads",
    drawer: true,
    examples: ["/lead ACME 2.5 tỷ hạn 20/8"],
  },
  {
    id: "quote_create_v1",
    display: "Tạo Báo giá",
    route: "/sales/quotes",
    drawer: true,
    examples: ["Tạo báo giá cho VinGroup, giảm 5%"],
  },
  {
    id: "approval_request_v1",
    display: "Yêu cầu Phê duyệt",
    route: "/approvals/inbox",
    drawer: true,
    examples: ["Duyệt giảm giá 8% cho Opp #102"],
  },
];

function SuggestionBar({ input, onPick }) {
  const items = useMemo(() => {
    const base = MANIFEST.map((m) => ({ id: m.id, label: m.display }));
    if (!input) return base.slice(0, 5);
    const q = input.toLowerCase();
    return base
      .map((x) => ({ ...x, score: x.label.toLowerCase().includes(q) ? 1 : 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [input]);

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
          onClick={() => onPick(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function ExtractionPreview({ extract, onConfirm, onEdit, onCancel }) {
  if (!extract) return null;
  const { intent, confidence, payload, warnings = [], diffs = [] } = extract;
  const confidenceTone = confidence >= 0.9 ? "green" : confidence >= 0.7 ? "yellow" : "red";

  return (
    <div className="p-3 bg-white border rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Extraction Preview</div>
        <Badge tone={confidenceTone}>Confidence {Math.round(confidence * 100)}%</Badge>
      </div>
      <div className="mb-2 text-sm">Intent: <span className="font-mono">{intent}</span></div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(payload).map(([k, v]) => (
          <div key={k} className="p-2 border rounded bg-gray-50">
            <div className="text-[11px] text-gray-500">{k}</div>
            <div className="break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
          </div>
        ))}
      </div>

      {(warnings.length > 0 || diffs.length > 0) && (
        <div className="mt-2 space-y-1">
          {warnings.map((w, i) => (
            <div key={`w-${i}`} className="px-2 py-1 text-xs text-yellow-700 border border-yellow-200 rounded bg-yellow-50">
              Warning: {w}
            </div>
          ))}
          {diffs.map((d, i) => (
            <div key={`d-${i}`} className="px-2 py-1 text-xs text-blue-700 border border-blue-200 rounded bg-blue-50">
              Changed: {d.field} (old → new)
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 text-white bg-blue-600 rounded" onClick={onConfirm}>Confirm & Go</button>
        <button className="px-3 py-1 bg-gray-100 rounded" onClick={onEdit}>Edit fields</button>
        <button className="px-3 py-1 bg-gray-100 rounded" onClick={onCancel}>Discard</button>
      </div>
    </div>
  );
}

function LeadDrawer({ data, onSave }) {
  const [form, setForm] = useState({
    account: data.account || "",
    budget: data.budget || 0,
    currency: data.currency || "VND",
    due_date: data.due_date || "",
    contact_name: data.contact_name || "",
  });
  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Nguồn: chat • Applied from extraction</div>
      <label className="block text-sm font-medium">Account</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.account} onChange={onChange("account")} />

      <label className="block text-sm font-medium">Budget</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.budget} onChange={onChange("budget")} />

      <label className="block text-sm font-medium">Currency</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.currency} onChange={onChange("currency")} />

      <label className="block text-sm font-medium">Due Date</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.due_date} onChange={onChange("due_date")} />

      <label className="block text-sm font-medium">Contact Name</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.contact_name} onChange={onChange("contact_name")} />

      <button className="px-3 py-1 mt-2 text-white bg-blue-600 rounded" onClick={() => onSave(form)}>Save</button>
    </div>
  );
}

function QuoteDrawer({ data, onSave }) {
  const [form, setForm] = useState({
    account: data.account || "",
    currency: data.currency || "VND",
    due_date: data.due_date || "",
    discount: data.discount ?? 0,
    items: data.items || [ { name: "Thiết bị A", qty: 1, unit_price: 1000000 } ],
  });

  const setItem = (idx, key, val) =>
    setForm((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    }));

  const total = useMemo(() => {
    const sub = form.items.reduce((acc, it) => acc + Number(it.qty || 0) * Number(it.unit_price || 0), 0);
    const afterDiscount = sub * (1 - Number(form.discount || 0) / 100);
    return { sub, afterDiscount };
  }, [form.items, form.discount]);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Nguồn: chat + OCR/parse</div>

      <label className="block text-sm font-medium">Account</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.account} onChange={(e) => setForm((s) => ({ ...s, account: e.target.value }))} />

      <label className="block text-sm font-medium">Currency</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))} />

      <label className="block text-sm font-medium">Due Date</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.due_date} onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))} />

      <label className="block text-sm font-medium">Discount (%)</label>
      <input className="w-full px-2 py-1 mt-1 border rounded" value={form.discount} onChange={(e) => setForm((s) => ({ ...s, discount: e.target.value }))} />

      <div className="grid grid-cols-[1fr_90px_120px_120px] items-center gap-2 text-sm font-medium mt-2">
        <div>Name</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Unit Price</div>
        <div className="text-right">Line Total</div>
      </div>

      {form.items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_90px_120px_120px] items-center gap-2">
          <input className="w-full px-2 py-1 border rounded" value={it.name} onChange={(e) => setItem(idx, "name", e.target.value)} />
          <input className="w-24 px-2 py-1 text-right border rounded" value={it.qty} onChange={(e) => setItem(idx, "qty", e.target.value)} />
          <input className="w-32 px-2 py-1 text-right border rounded" value={it.unit_price} onChange={(e) => setItem(idx, "unit_price", e.target.value)} />
          <div className="text-right">{Number(it.qty || 0) * Number(it.unit_price || 0)}</div>
        </div>
      ))}

      <div className="pt-2 mt-2 space-y-1 text-sm border-t">
        <div className="flex justify-between"><span>Subtotal</span><span>{total.sub}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>{form.discount}%</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{total.afterDiscount}</span></div>
      </div>

      <button className="px-3 py-1 mt-2 text-white bg-blue-600 rounded" onClick={() => onSave(form)}>Save</button>
    </div>
  );
}

function ApprovalDrawer({ data }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Nguồn: chat</div>
      <div className="text-sm">
        <div className="font-medium">Policy: Two-eyes review (&gt; 5%)</div>
        <div>Yêu cầu phê duyệt cần người thứ hai xác nhận trước khi áp dụng.</div>
      </div>
      <div className="p-2 text-sm border rounded bg-gray-50">
        <div>Object: {data.object_type} #{data.object_id}</div>
        <div>Action: {data.action}</div>
        <div>Reason: {data.reason}</div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 text-white bg-green-600 rounded">Approve</button>
        <button className="px-3 py-1 text-white bg-red-600 rounded">Reject</button>
      </div>
    </div>
  );
}

function HomeMatrix({ onOpenProject }) {
  return (
    <section className="p-4 bg-white border shadow rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Home – Matrix</h2>
        <div className="flex items-center gap-2 text-xs">
          <Badge tone="yellow">Live</Badge>
          <Badge tone="red">Warnings</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-3">
        {["Sales","Finance","Workforce","Project","SCM","Compliance","Engineering","Analytics"].map((cap) => (
          <div key={cap} className="p-3 border rounded-xl bg-gray-50">
            <div className="font-medium">{cap}</div>
            <div className="text-xs text-gray-500">4 KPI</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <button
            key={i}
            onClick={onOpenProject}
            className="p-3 text-left bg-white border rounded-xl hover:shadow"
          >
            <div className="text-sm font-medium">KPI {i + 1}</div>
            <div className="text-xs text-gray-500">Live 72% • SLA: 15’ • Owner: PM</div>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-medium">Context Panel</div>
        <div className="p-3 border rounded-xl">
          <div className="text-xs text-gray-500">Chọn KPI để xem chi tiết</div>
        </div>
      </div>
    </section>
  );
}

function Tabs() {
  const [tab, setTab] = useState("activity");
  return (
    <div>
      <div className="flex gap-2 mb-2">
        {[
          { id: "activity", label: "Activity" },
          { id: "lineage", label: "Lineage" },
          { id: "access", label: "Access" },
          { id: "chat", label: "Chat" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2 py-1 rounded ${tab === t.id ? "bg-gray-200" : "bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <div className="text-sm">Published KPI Utilization v2 • DSO data refresh completed</div>
      )}
      {tab === "lineage" && (
        <div className="font-mono text-sm">KPI A ← Timesheet + PM Data → Gold.fact_project</div>
      )}
      {tab === "access" && <div className="text-sm">Visible: CEO, PM, HR</div>}
      {tab === "chat" && (
        <div className="p-2 text-sm border rounded bg-gray-50">Chat theo ngữ cảnh KPI/Project (Thread demo)</div>
      )}
    </div>
  );
}

export default function AppChatShell() {
  const [chatOpen, setChatOpen] = useState(false); // Global Chat Panel
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role, text}
  const [extract, setExtract] = useState(null); // extraction preview
  const [attached, setAttached] = useState(null); // {name, type}
  const [drawer, setDrawer] = useState({ open: false, title: "", route: "", data: {} });
  const chatInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // Alt + / to focus chat input
      if (e.altKey && e.key === "/") {
        e.preventDefault();
        setChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const parse = (text) => {
    const t = text.toLowerCase();
    if (t.includes("/lead") || t.includes("tạo lead") || t.includes("khách hàng")) {
      return {
        intent: "lead_create_v1",
        confidence: 0.85,
        payload: {
          account: /lead\s+(\w+)/i.exec(text)?.[1] || "ACME",
          budget: 2_500_000_000,
          currency: "VND",
          due_date: "2025-08-20",
          contact_name: "",
        },
        warnings: ["Kiểm tra định dạng ngày"],
      };
    }

    if (t.includes("báo giá") || t.startsWith("/quote")) {
      const items = attached?.name?.toLowerCase().includes("boq")
        ? [{ name: "Thiết bị A", qty: 3, unit_price: 12_000_000 }]
        : [{ name: "Thiết bị A", qty: 3, unit_price: 12_000_000 }];
      return {
        intent: "quote_create_v1",
        confidence: attached ? 0.92 : 0.8,
        payload: {
          account: text.match(/cho\s+([\p{L}\s]+)/u)?.[1]?.trim() || "VinGroup",
          currency: "VND",
          due_date: "2025-08-20",
          discount: text.includes("giảm 5%") ? 5 : 0,
          items,
        },
        warnings: attached ? [] : ["Chưa phát hiện file bảng. Bạn có muốn đính kèm?"],
      };
    }

    if (t.includes("duyệt") || t.startsWith("/approve")) {
      const m = text.match(/Opp\s*#?(\d+)/i);
      return {
        intent: "approval_request_v1",
        confidence: 0.9,
        payload: {
          object_type: "Opportunity",
          object_id: m ? m[1] : "102",
          action: "discount_approve_8pct",
          reason: "Pricing strategy",
        },
        warnings: [],
      };
    }

    return {
      intent: "unknown",
      confidence: 0.5,
      payload: { text },
      warnings: ["Không nhận diện được ý định. Chọn tình huống hoặc dùng /commands."],
    };
  };

  const handleSend = () => {
    if (!input && !attached) return;
    const userMsg = input || (attached ? `Attached ${attached.name}` : "");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    const ext = parse(userMsg);
    setExtract(ext);
    setInput("");
  };

  const confirmAndRoute = () => {
    if (!extract) return;
    const { intent, payload } = extract;
    if (intent === "lead_create_v1") {
      setDrawer({ open: true, title: "Lead (new)", route: "/sales/leads", data: payload });
    } else if (intent === "quote_create_v1") {
      setDrawer({ open: true, title: "Quote (new)", route: "/sales/quotes", data: payload });
    } else if (intent === "approval_request_v1") {
      setDrawer({ open: true, title: "Approval Inbox", route: "/approvals/inbox", data: payload });
    }
    setExtract(null);
    setAttached(null);
    setChatOpen(false); // drawer-first wins
  };

  const attachSampleBOQ = () => setAttached({ name: "BOQ.xlsx", type: "application/vnd.ms-excel" });
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setAttached({ name: f.name, type: f.type });
  };

  const drawerContent = useMemo(() => {
    if (!drawer.open) return null;
    if (drawer.route === "/sales/leads") return <LeadDrawer data={drawer.data} onSave={() => setDrawer((d) => ({ ...d, open: false }))} />;
    if (drawer.route === "/sales/quotes") return <QuoteDrawer data={drawer.data} onSave={() => setDrawer((d) => ({ ...d, open: false }))} />;
    if (drawer.route === "/approvals/inbox") return <ApprovalDrawer data={drawer.data} />;
    return <div className="text-sm">No renderer for {drawer.route}</div>;
  }, [drawer]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="grid text-white bg-blue-600 rounded h-7 w-7 place-items-center">A</div>
            <div className="font-semibold">ERP‑OS Prototype</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-gray-500 md:inline">auto ≥ 0.90</span>
            <Badge tone="yellow">confirm 0.70–0.89</Badge>
            <Badge tone="red">form &lt; 0.70</Badge>
          </div>
        </div>
      </header>

      {/* Body: 3 columns (nav, main, context) */}
      <div className="max-w-7xl mx-auto grid grid-cols-[220px_1fr_360px] gap-4 p-4">
        <nav className="p-3 bg-white border rounded-xl">
          <div className="mb-2 font-medium">Navigation</div>
          <ul className="space-y-1 text-sm">
            <li className="px-2 py-1 bg-gray-100 rounded">Home</li>
            <li className="px-2 py-1 rounded">Sales</li>
            <li className="px-2 py-1 rounded">Projects</li>
            <li className="px-2 py-1 rounded">SCM</li>
            <li className="px-2 py-1 rounded">Finance</li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">Press Alt+/ to focus Chat</div>
        </nav>

        <main className="space-y-4">
          <HomeMatrix onOpenProject={() => setDrawer({ open: true, title: "KPI Detail", route: "/kpi/detail", data: {} })} />

          {/* Acceptance tests row */}
          <section className="p-4 bg-white border shadow rounded-2xl">
            <h3 className="mb-2 font-semibold">Acceptance tests</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => {
                  setChatOpen(true);
                  setInput("/lead ACME 2.5 tỷ hạn 20/8");
                }}
              >
                Test Lead
              </button>
              <button
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => {
                  setChatOpen(true);
                  attachSampleBOQ();
                  setInput("Tạo báo giá cho VinGroup, giảm 5%");
                }}
              >
                Test Quote + BOQ
              </button>
              <button
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => {
                  setChatOpen(true);
                  setInput("Duyệt giảm giá 8% cho Opp #102");
                }}
              >
                Test Approval
              </button>
              <button
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => {
                  setMessages([]);
                  setExtract(null);
                  setAttached(null);
                }}
              >
                Reset
              </button>
            </div>
          </section>
        </main>

        <aside className="p-3 bg-white border rounded-xl">
          <h3 className="mb-2 font-medium">Context</h3>
          <Tabs />
        </aside>
      </div>

      {/* Mini-composer when drawer open */}
      {drawer.open && (
        <div className="fixed left-[240px] right-4 bottom-4 bg-white border rounded-xl shadow p-2 flex items-center gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Mini-composer… nhập lệnh nhanh theo ngữ cảnh"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            className="px-3 py-2 bg-gray-100 rounded"
            onClick={() => document.getElementById("fileMini")?.click()}
          >
            Attach
            <input id="fileMini" type="file" className="hidden" onChange={onFileChange} />
          </button>
          <button className="px-4 py-2 text-white bg-blue-600 rounded" onClick={handleSend}>
            Send
          </button>
        </div>
      )}

      {/* Global Chat FAB */}
      {!drawer.open && (
        <button
          aria-label="Open Chat"
          className="fixed text-2xl text-white bg-blue-600 rounded-full shadow-lg bottom-6 right-6 h-14 w-14"
          onClick={() => setChatOpen(true)}
        >
          💬
        </button>
      )}

      {/* Right Chat Panel (420px) */}
      <RightDock open={chatOpen} title="Chat" onClose={() => setChatOpen(false)} width={420}>
        <div className="flex flex-col h-[80vh]">
          <div className="flex-1 p-3 overflow-y-auto border rounded-xl bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">Chưa có hội thoại. Hãy thử chọn tình huống hoặc gõ lệnh.</div>
            ) : (
              <div className="space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] ${m.role === "user" ? "ml-auto bg-blue-50" : "mr-auto bg-gray-100"} p-2 rounded-lg text-sm border`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 space-y-2">
            <SuggestionBar
              input={input}
              onPick={(id) => {
                if (id === "lead_create_v1") setInput("/lead ACME 2.5 tỷ hạn 20/8");
                if (id === "quote_create_v1") setInput("Tạo báo giá cho VinGroup, giảm 5%");
                if (id === "approval_request_v1") setInput("Duyệt giảm giá 8% cho Opp #102");
              }}
            />
            <div className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder="Gõ lệnh tự nhiên…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <label className="px-3 py-2 bg-gray-100 border rounded-lg cursor-pointer">
                Attach
                <input type="file" className="hidden" onChange={onFileChange} />
              </label>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-lg" onClick={handleSend}>
                Send
              </button>
            </div>
            {attached && (
              <div className="text-xs text-gray-600">
                Attached: {attached.name}
                <button className="ml-2 text-blue-600" onClick={() => setAttached(null)}>
                  Remove
                </button>
              </div>
            )}
            <ExtractionPreview
              extract={extract}
              onConfirm={confirmAndRoute}
              onEdit={() => setMessages((m) => [...m, { role: "system", text: "Mở mini form để chỉnh field (demo)." }])}
              onCancel={() => setExtract(null)}
            />
          </div>
        </div>
      </RightDock>

      {/* Drawer (business) */}
      <Drawer open={drawer.open} title={drawer.title} onClose={() => setDrawer((d) => ({ ...d, open: false }))}>
        {drawerContent}
      </Drawer>
    </div>
  );
}
