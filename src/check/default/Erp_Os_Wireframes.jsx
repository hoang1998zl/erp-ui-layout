import { useState, useMemo } from "react";

// Chat‑first demo with Suggestions + File Upload (OCR simulate) + Drawer routing
// Deterministic, no randomness. Includes acceptance test buttons at bottom.

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tones[tone]}`}>{children}</span>
  );
}

function Drawer({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[420px] bg-white shadow-2xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={onClose}>Close</button>
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
    required: ["account", "budget", "due_date"],
    examples: ["/lead ACME 2.5 tỷ hạn 20/8"],
  },
  {
    id: "opp_create_v1",
    display: "Tạo Cơ hội",
    route: "/sales/opportunities",
    drawer: true,
    required: ["account", "name", "amount", "close_date"],
    examples: ["/opp ACME retrofit 120M close 30 ngày"],
  },
  {
    id: "quote_create_v1",
    display: "Tạo Báo giá",
    route: "/sales/quotes",
    drawer: true,
    required: ["account", "currency", "due_date"],
    examples: ["Tạo báo giá cho VinGroup, giảm 5%"],
  },
  {
    id: "approval_request_v1",
    display: "Yêu cầu Phê duyệt",
    route: "/approvals/inbox",
    drawer: true,
    required: ["object_type", "object_id", "action", "reason"],
    examples: ["Duyệt giảm giá 8% cho Opp #102"],
  },
];

function SuggestionBar({ input, onPick }) {
  const items = useMemo(() => {
    const base = MANIFEST.map((m) => ({ id: m.id, label: m.display }));
    if (!input) return base.slice(0, 6);
    const q = input.toLowerCase();
    return base
      .map((x) => ({ ...x, score: x.label.toLowerCase().includes(q) ? 1 : 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
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
    <div className="p-3 bg-white border shadow-sm rounded-xl">
      <div className="flex items-center justify-between">
        <div className="font-medium">Extraction Preview</div>
        <Badge tone={confidenceTone}>Confidence {Math.round(confidence * 100)}%</Badge>
      </div>
      <div className="mt-2 text-xs text-gray-500">Intent: {intent}</div>
      <div className="mt-2 text-sm">
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(payload).map(([k, v]) => (
              <tr key={k} className="border-t">
                <td className="w-40 py-1 text-gray-500">{k}</td>
                <td className="py-1">{typeof v === "object" ? JSON.stringify(v) : String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(warnings.length > 0 || diffs.length > 0) && (
        <div className="mt-2 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="px-2 py-1 text-xs text-yellow-700 border border-yellow-200 rounded bg-yellow-50">Warning: {w}</div>
          ))}
          {diffs.map((d, i) => (
            <div key={i} className="px-2 py-1 text-xs text-blue-700 border border-blue-200 rounded bg-blue-50">Changed: {d.field} (old → new)</div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 text-white bg-blue-600 rounded" onClick={onConfirm}>Confirm & Go</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onEdit}>Edit fields</button>
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
    <div className="space-y-3">
      <div className="text-xs text-gray-500">Nguồn: chat • Applied from extraction</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Account<input className="w-full px-2 py-1 mt-1 border rounded" value={form.account} onChange={onChange("account")} /></label>
        <label className="text-sm">Budget<input className="w-full px-2 py-1 mt-1 border rounded" value={form.budget} onChange={onChange("budget")} /></label>
        <label className="text-sm">Currency<input className="w-full px-2 py-1 mt-1 border rounded" value={form.currency} onChange={onChange("currency")} /></label>
        <label className="text-sm">Due Date<input className="w-full px-2 py-1 mt-1 border rounded" value={form.due_date} onChange={onChange("due_date")} /></label>
        <label className="col-span-2 text-sm">Contact Name<input className="w-full px-2 py-1 mt-1 border rounded" value={form.contact_name} onChange={onChange("contact_name")} /></label>
      </div>
      <div className="flex justify-end">
        <button className="px-3 py-1 text-white bg-blue-600 rounded" onClick={() => onSave(form)}>Save</button>
      </div>
    </div>
  );
}

function QuoteDrawer({ data, onSave }) {
  const [form, setForm] = useState({
    account: data.account || "",
    currency: data.currency || "VND",
    due_date: data.due_date || "",
    discount: data.discount ?? 0,
    items: data.items || [],
  });
  const setItem = (idx, key, val) => {
    setForm((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    }));
  };
  const total = useMemo(() => {
    const sub = form.items.reduce((acc, it) => acc + Number(it.qty || 0) * Number(it.unit_price || 0), 0);
    const afterDiscount = sub * (1 - Number(form.discount || 0) / 100);
    return { sub, afterDiscount };
  }, [form.items, form.discount]);
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">Nguồn: chat + OCR/parse</div>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-1 text-sm">Account<input className="w-full px-2 py-1 mt-1 border rounded" value={form.account} onChange={(e)=>setForm((s)=>({...s, account:e.target.value}))} /></label>
        <label className="col-span-1 text-sm">Currency<input className="w-full px-2 py-1 mt-1 border rounded" value={form.currency} onChange={(e)=>setForm((s)=>({...s, currency:e.target.value}))} /></label>
        <label className="col-span-1 text-sm">Due Date<input className="w-full px-2 py-1 mt-1 border rounded" value={form.due_date} onChange={(e)=>setForm((s)=>({...s, due_date:e.target.value}))} /></label>
        <label className="col-span-3 text-sm">Discount (%)<input className="w-full px-2 py-1 mt-1 border rounded" value={form.discount} onChange={(e)=>setForm((s)=>({...s, discount:e.target.value}))} /></label>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Name</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Unit Price</th><th className="p-2 text-right">Line Total</th></tr>
          </thead>
          <tbody>
            {form.items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2"><input className="w-full px-2 py-1 border rounded" value={it.name} onChange={(e)=>setItem(idx, "name", e.target.value)} /></td>
                <td className="p-2 text-right"><input className="w-24 px-2 py-1 text-right border rounded" value={it.qty} onChange={(e)=>setItem(idx, "qty", e.target.value)} /></td>
                <td className="p-2 text-right"><input className="w-32 px-2 py-1 text-right border rounded" value={it.unit_price} onChange={(e)=>setItem(idx, "unit_price", e.target.value)} /></td>
                <td className="p-2 text-right">{Number(it.qty || 0) * Number(it.unit_price || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <div className="w-64 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{total.sub}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>{form.discount}%</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{total.afterDiscount}</span></div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-3 py-1 text-white bg-blue-600 rounded" onClick={() => onSave(form)}>Save</button>
      </div>
    </div>
  );
}

function ApprovalDrawer({ data }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">Nguồn: chat</div>
      <div className="p-3 text-sm border rounded bg-yellow-50">
        <div className="mb-1 font-medium">Policy: Two-eyes review</div>
        <div>Yêu cầu phê duyệt cần người thứ hai xác nhận trước khi áp dụng.</div>
      </div>
      <div className="space-y-1 text-sm">
        <div><span className="text-gray-500">Object</span>: {data.object_type} #{data.object_id}</div>
        <div><span className="text-gray-500">Action</span>: {data.action}</div>
        <div><span className="text-gray-500">Reason</span>: {data.reason}</div>
        <div><span className="text-gray-500">Requested by</span>: {data.requester || "user"}</div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 text-white bg-blue-600 rounded">Approve</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Reject</button>
      </div>
    </div>
  );
}

export default function ChatFirstDemo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role:"user"|"system", text}
  const [extract, setExtract] = useState(null); // {intent, confidence, payload, warnings, diffs}
  const [drawer, setDrawer] = useState({ open: false, title: "", route: "", data: {} });
  const [attached, setAttached] = useState(null); // {name, type}

  // Simple intent parser for demo
  const parse = (text) => {
    const t = text.toLowerCase();
    // lead
    if (t.includes("/lead") || t.includes("tạo lead") || t.includes("khách hàng")) {
      return {
        intent: "lead_create_v1",
        confidence: 0.85,
        payload: {
          account: /lead\s+(\w+)/.exec(text)?.[1] || "ACME",
          budget: 2500000000,
          currency: "VND",
          due_date: "2025-08-20",
          contact_name: "",
        },
        warnings: ["Kiểm tra định dạng ngày"],
      };
    }
    // quote
    if (t.includes("báo giá") || t.startsWith("/quote")) {
      const items = attached?.name?.toLowerCase().includes("boq")
        ? [
            { name: "Thiết bị A", qty: 3, unit_price: 12000000 },
            { name: "Vật tư B", qty: 5, unit_price: 5000000 },
            { name: "Công lắp đặt", qty: 1, unit_price: 8000000 },
          ]
        : [{ name: "Thiết bị A", qty: 3, unit_price: 12000000 }];
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
        warnings: attached ? [] : ["Chưa phát hiện file bảng. Bạn có muốn đính kèm?"]
      };
    }
    // approval
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
    // fallback
    return {
      intent: "unknown",
      confidence: 0.5,
      payload: { text },
      warnings: ["Không nhận diện được ý định. Chọn tình huống hoặc dùng /commands."],
    };
  };

  const handleSend = () => {
    if (!input && !attached) return;
    const userMsg = input || (attached ? `Uploaded ${attached.name}` : "");
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
  };

  const handlePickSuggestion = (id) => {
    if (id === "lead_create_v1") setInput("/lead ACME 2.5 tỷ hạn 20/8");
    if (id === "quote_create_v1") setInput("Tạo báo giá cho VinGroup, giảm 5%");
    if (id === "approval_request_v1") setInput("Duyệt giảm giá 8% cho Opp #102");
    if (id === "opp_create_v1") setInput("/opp ACME retrofit 120M close 30 ngày");
  };

  const attachSampleBOQ = () => {
    // Simulate an attached file in state
    setAttached({ name: "BOQ.xlsx", type: "application/vnd.ms-excel" });
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setAttached({ name: f.name, type: f.type });
  };

  // Drawer content chooser
  const drawerContent = useMemo(() => {
    if (!drawer.open) return null;
    if (drawer.route === "/sales/leads") return <LeadDrawer data={drawer.data} onSave={() => setDrawer((d)=>({ ...d, open:false }))} />;
    if (drawer.route === "/sales/quotes") return <QuoteDrawer data={drawer.data} onSave={() => setDrawer((d)=>({ ...d, open:false }))} />;
    if (drawer.route === "/approvals/inbox") return <ApprovalDrawer data={drawer.data} />;
    return <div className="text-sm">No renderer for {drawer.route}</div>;
  }, [drawer]);

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <section className="p-4 bg-white border shadow rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Chat‑first Intake</h1>
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="green">auto ≥ 0.90</Badge>
            <Badge tone="yellow">confirm 0.70–0.89</Badge>
            <Badge tone="red">form &lt; 0.70</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Messages + Input */}
          <div className="flex flex-col h-[520px]">
            <div className="flex-1 p-3 overflow-y-auto border rounded-xl bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-500">Chưa có hội thoại. Hãy thử những ví dụ dưới hoặc chọn tình huống.</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto bg-blue-50" : "mr-auto bg-gray-100"} p-2 rounded-lg text-sm border`}>{m.text}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <SuggestionBar input={input} onPick={handlePickSuggestion} />
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Gõ lệnh tự nhiên… ví dụ: Tạo báo giá cho VinGroup, giảm 5%"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <label className="px-3 py-2 bg-gray-100 border rounded-lg cursor-pointer">
                  Attach
                  <input type="file" className="hidden" onChange={onFileChange} />
                </label>
                <button className="px-4 py-2 text-white bg-blue-600 rounded-lg" onClick={handleSend}>Send</button>
              </div>
              {attached && (
                <div className="text-xs text-gray-600">Attached: {attached.name} <button className="ml-2 text-blue-600" onClick={()=>setAttached(null)}>Remove</button></div>
              )}
            </div>
          </div>
          {/* Right: Extraction Preview */}
          <div>
            <ExtractionPreview
              extract={extract}
              onConfirm={confirmAndRoute}
              onEdit={() => setMessages((m)=>[...m, { role: "system", text: "Mở mini form để chỉnh field (demo)." }])}
              onCancel={() => setExtract(null)}
            />
            {!extract && (
              <div className="p-3 text-sm text-gray-500 bg-white border rounded-xl">Không có bản trích xuất nào đang chờ. Gửi lệnh hoặc đính kèm file để bắt đầu.</div>
            )}
          </div>
        </div>
      </section>

      {/* Acceptance Tests */}
      <section className="p-4 bg-white border shadow rounded-2xl">
        <h2 className="mb-2 text-xl font-bold">Acceptance tests (quick)</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setInput("/lead ACME 2.5 tỷ hạn 20/8")}>Test 1: Lead</button>
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => { attachSampleBOQ(); setInput("Tạo báo giá cho VinGroup, giảm 5%"); }}>Test 2: Quote + BOQ.xlsx</button>
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setInput("Duyệt giảm giá 8% cho Opp #102")}>Test 3: Approval</button>
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setMessages([])}>Reset chat</button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          • Test 1: gửi lệnh, xem popover xác nhận ngày/tiền tệ, rồi mở drawer Lead.<br />
          • Test 2: đính kèm BOQ, gửi lệnh báo giá, xem items được prefill và mở drawer Quote.<br />
          • Test 3: lệnh phê duyệt mở drawer Approvals, hiển thị banner two-eyes.
        </div>
      </section>

      <Drawer open={drawer.open} title={drawer.title} onClose={() => setDrawer((d)=>({ ...d, open:false }))}>
        {drawerContent}
      </Drawer>
    </div>
  );
}
