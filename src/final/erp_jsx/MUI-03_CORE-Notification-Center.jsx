import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MUI-03 — CORE Notification Center (single JSX file)
 * - Gộp toàn bộ: mock data + components + App runner
 * - Giữ nguyên giao diện & hành vi từ mã gốc (TS/TSX → JSX)
 */

/* =====================
   Mock & Types (JS)
===================== */
const rid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Notification types
const NT = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
};

// Sample channels
const CHANNELS = [
  { id: "all", name: "All" },
  { id: "system", name: "System" },
  { id: "approvals", name: "Approvals" },
  { id: "projects", name: "Projects" },
  { id: "hr", name: "HR" },
];

// Seed notifications
const seed = () => [
  {
    id: rid(),
    ts: Date.now() - 1000 * 60 * 5,
    type: NT.INFO,
    channel: "system",
    title: "System maintenance window",
    desc: "Planned maintenance at 01:00 AM UTC.",
    read: false,
    route: "/status",
  },
  {
    id: rid(),
    ts: Date.now() - 1000 * 60 * 50,
    type: NT.SUCCESS,
    channel: "approvals",
    title: "Leave request approved",
    desc: "Your 3‑day leave was approved.",
    read: false,
    route: "/approvals/req-912",
  },
  {
    id: rid(),
    ts: Date.now() - 1000 * 60 * 120,
    type: NT.WARNING,
    channel: "projects",
    title: "Budget approaching limit",
    desc: "PRJ‑004 Payroll Pipeline is at 90% budget.",
    read: true,
    route: "/projects/PRJ-004",
  },
  {
    id: rid(),
    ts: Date.now() - 1000 * 60 * 240,
    type: NT.ERROR,
    channel: "hr",
    title: "Timesheet missing",
    desc: "You have missing timesheet entries.",
    read: true,
    route: "/hr/timesheet",
  },
];

/* =====================
   Helpers
===================== */
const fmtTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString();
};

const typeIcon = (t) =>
  ({ info: "ℹ️", success: "✅", warning: "⚠️", error: "⛔" }[t] || "•");
const typeColor = (t) =>
  ({
    info: "#2563eb",
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#dc2626",
  }[t] || "#6b7280");

/* =====================
   Notification Center (main component)
===================== */
export function NotificationCenter({
  open = true,
  onClose,
  onNavigate,
  locale = "vi",
  hotkey = true,
}) {
  const [items, setItems] = useState(() => seed());
  const [channel, setChannel] = useState("all");
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(open);
  const [selectIds, setSelectIds] = useState(new Set());

  const t = (vi, en) => (locale === "vi" ? vi : en);

  // Hotkey: Ctrl/Cmd+Shift+N to open
  useEffect(() => {
    if (!hotkey) return;
    const handler = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "n") {
        e.preventDefault();
        setPanelOpen((v) => !v);
      }
      if (panelOpen && k === "escape") {
        onClose?.();
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey, panelOpen, onClose]);

  useEffect(() => {
    setPanelOpen(open);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (it) =>
          (channel === "all" || it.channel === channel) &&
          (!q || (it.title + it.desc).toLowerCase().includes(q))
      )
      .sort((a, b) => b.ts - a.ts);
  }, [items, channel, search]);

  const unreadCount = items.reduce((acc, it) => acc + (it.read ? 0 : 1), 0);

  const toggleSelect = (id) => {
    setSelectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markRead = (ids) =>
    setItems((arr) =>
      arr.map((it) => (ids.has(it.id) ? { ...it, read: true } : it))
    );
  const markUnread = (ids) =>
    setItems((arr) =>
      arr.map((it) => (ids.has(it.id) ? { ...it, read: false } : it))
    );
  const removeSel = (ids) =>
    setItems((arr) => arr.filter((it) => !ids.has(it.id)));

  const doBulk = (action) => {
    if (selectIds.size === 0) return;
    if (action === "read") markRead(selectIds);
    if (action === "unread") markUnread(selectIds);
    if (action === "delete") removeSel(selectIds);
    setSelectIds(new Set());
  };

  if (!panelOpen) return null;

  const colors = {
    border: "#e5e7eb",
    sub: "#6b7280",
    bg: "#ffffff",
    bgAlt: "#f9fafb",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        paddingTop: 64,
      }}
      onClick={() => {
        setPanelOpen(false);
        onClose?.();
      }}
    >
      <div
        style={{
          width: 520,
          background: colors.bg,
          borderLeft: `1px solid ${colors.border}`,
          height: "calc(100vh - 64px)",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontWeight: 800 }}>
            🔔 {t("Thông báo", "Notifications")}{" "}
            <span style={{ color: colors.sub }}>
              ({unreadCount} {t("chưa đọc", "unread")})
            </span>
          </div>
          <button
            onClick={() => {
              setPanelOpen(false);
              onClose?.();
            }}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 10px",
              background: colors.bgAlt,
            }}
          >
            Esc
          </button>
        </div>

        {/* Tools */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px",
            gap: 8,
            padding: 12,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Tìm thông báo...", "Search notifications...")}
            style={{
              height: 36,
              padding: "0 10px",
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
            }}
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            style={{
              height: 36,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
            }}
          >
            {CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 12,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={() => doBulk("read")}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            {t("Đánh dấu đã đọc", "Mark read")}
          </button>
          <button
            onClick={() => doBulk("unread")}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            {t("Đánh dấu chưa đọc", "Mark unread")}
          </button>
          <button
            onClick={() => doBulk("delete")}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 10px",
              color: "#dc2626",
            }}
          >
            {t("Xóa", "Delete")}
          </button>
        </div>

        {/* List */}
        <div style={{ overflow: "auto", height: "calc(100% - 164px)" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: colors.sub }}>
              {t("Không có thông báo", "No notifications")}
            </div>
          )}
          {filtered.map((n) => (
            <div
              key={n.id}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 8,
                padding: 12,
                borderBottom: `1px solid ${colors.border}`,
                background: n.read ? "#fff" : "#f8fafc",
              }}
            >
              <input
                type="checkbox"
                checked={selectIds.has(n.id)}
                onChange={() => toggleSelect(n.id)}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: typeColor(n.type) }}>
                    {typeIcon(n.type)}
                  </span>
                  <div style={{ fontWeight: 700 }}>{n.title}</div>
                  {!n.read && (
                    <span
                      style={{ marginLeft: 8, fontSize: 12, color: "#2563eb" }}
                    >
                      {t("MỚI", "NEW")}
                    </span>
                  )}
                </div>
                <div style={{ color: colors.sub, marginTop: 4 }}>{n.desc}</div>
                <div style={{ fontSize: 12, color: colors.sub, marginTop: 6 }}>
                  {fmtTime(n.ts)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => {
                    n.read
                      ? markUnread(new Set([n.id]))
                      : markRead(new Set([n.id]));
                  }}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: "6px 8px",
                  }}
                >
                  {n.read ? t("Chưa đọc", "Unread") : t("Đã đọc", "Read")}
                </button>
                <button
                  onClick={() => onNavigate?.(n.route)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: "6px 8px",
                  }}
                >
                  {t("Mở", "Open")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================
   Runner (demo mount)
===================== */
export default function App() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ height: "100vh" }}>
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            border: "1px solid #e5e7eb",
            padding: "8px 12px",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          Open Notification Center
        </button>
        <span style={{ color: "#6b7280" }}>Hotkey: Ctrl/Cmd+Shift+N</span>
      </div>
      <NotificationCenter
        open={open}
        onClose={() => setOpen(false)}
        onNavigate={(route) => alert("Navigate to: " + route)}
      />
    </div>
  );
}
