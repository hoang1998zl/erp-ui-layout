import React, { useEffect, useMemo, useState } from "react";

/**
 * MUI-01 — CORE-01 AppShell_Nav (Canvas single file)
 * Giữ API như bản gốc: <AppShellNav navItems? workspaces? breadcrumbs? onNavigate onLocaleChange rightPane>{children}</AppShellNav>
 * Bao gồm: Sidebar (menu lồng nhau), Topbar (breadcrumbs, workspace, locale), Command Palette (Ctrl/⌘+K), Right Context Pane.
 */

// ==== Mock data (từ src/mock/*.ts) ====
const defaultNav = [
  { key: "dashboard", label: "Dashboard", icon: "📊", route: "/dashboard" },
  { key: "projects", label: "Projects", icon: "📁", route: "/projects" },
  {
    key: "finance", label: "Finance", icon: "💳", children: [
      { key: "expenses", label: "Expenses", route: "/finance/expenses" },
      { key: "budget", label: "Budget", route: "/finance/budget" },
    ]
  },
  {
    key: "hr", label: "HR", icon: "👥", children: [
      { key: "profile", label: "Profile", route: "/hr/profile" },
      { key: "timesheet", label: "Timesheet", route: "/hr/timesheet" },
    ]
  },
  { key: "docs", label: "Documents", icon: "📄", route: "/docs" },
  { key: "approvals", label: "Approvals", icon: "✅", route: "/approvals" },
  {
    key: "admin", label: "Admin", icon: "🛠", children: [
      { key: "audit", label: "Audit Trail", route: "/admin/audit" },
      { key: "rbac", label: "RBAC Matrix", route: "/admin/rbac" },
      { key: "settings", label: "Org Settings", route: "/admin/settings" },
    ]
  },
];

const defaultWorkspaces = [
  { id: "rnd", name: "R&D Lab" },
  { id: "demo", name: "Demo Tenant" },
];

// ==== AppShellNav component (chuyển từ TSX sang JSX) ====
export function AppShellNav({
  navItems = defaultNav,
  workspaces = defaultWorkspaces,
  locale: initialLocale = "vi",
  onLocaleChange,
  onNavigate,
  children,
  rightPane,
  breadcrumbs = ["Home"],
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState("dashboard");
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [workspace, setWorkspace] = useState(workspaces[0]?.id || "main");
  const [locale, setLocale] = useState(initialLocale);

  // hotkey: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    onLocaleChange && onLocaleChange(locale);
  }, [locale]);

  const flatCommands = useMemo(() => {
    const out = [];
    const walk = (items, parent = "") => {
      items.forEach((it) => {
        const label = parent ? `${parent} / ${it.label}` : it.label;
        if (it.children?.length) walk(it.children, label);
        else out.push({ key: it.key, label, route: it.route });
      });
    };
    walk(navItems);
    return out;
  }, [navItems]);

  const filteredCmd = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flatCommands;
    return flatCommands.filter((c) => c.label.toLowerCase().includes(q) || c.route?.toLowerCase().includes(q));
  }, [flatCommands, search]);

  const t = (vi, en) => (locale === "vi" ? vi : en);

  const onClickRoute = (route, key) => {
    setActiveKey(key || activeKey);
    if (onNavigate && route) onNavigate(route);
  };

  // styles
  const colors = {
    border: "#e5e7eb",
    text: "#111827",
    subtext: "#6b7280",
    bg: "#ffffff",
    bgAlt: "#f9fafb",
    brand: "#2563eb",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: collapsed ? "64px 1fr 360px" : "280px 1fr 360px", gridTemplateRows: "56px 1fr", height: "100vh", background: colors.bg }}>
      {/* Topbar */}
      <div style={{ gridColumn: "1 / -1", gridRow: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setCollapsed((v) => !v)} title={t("Thu gọn / Mở rộng", "Collapse / Expand")} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgAlt }}>☰</button>
          <div style={{ fontWeight: 700 }}>AmA • AppShell</div>
          <div style={{ color: colors.subtext }}>
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span style={{ margin: "0 6px", color: colors.border }}>/</span>}
                <span>{b}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select value={workspace} onChange={(e) => setWorkspace(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
          <button onClick={() => setCmdOpen(true)} title="Command Palette (Ctrl/⌘+K)" style={{ height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${colors.border}` }}>
            ⌘K
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ gridColumn: 1, gridRow: 2, borderRight: `1px solid ${colors.border}`, overflow: "auto", background: colors.bg }}>
        {!collapsed && (
          <div style={{ padding: 12 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Tìm kiếm menu…", "Search menu…")} style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 10 }} />
            <NavList items={navItems} openKeys={openKeys} setOpenKeys={setOpenKeys} activeKey={activeKey} onRoute={onClickRoute} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ gridColumn: 2, gridRow: 2, overflow: "auto", background: colors.bgAlt }}>
        {children ?? <EmptyState t={t} />}
      </div>

      {/* Right context panel */}
      <div style={{ gridColumn: 3, gridRow: 2, borderLeft: `1px solid ${colors.border}`, background: colors.bg }}>
        {rightPane ?? (
          <div style={{ padding: 16, color: colors.subtext }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("Ngữ cảnh", "Context")}</div>
            <p>{t("Ghim tài liệu, hoạt động gần đây, quick links…", "Pinned docs, recent activity, quick links…")}</p>
          </div>
        )}
      </div>

      {/* Command Palette */}
      {cmdOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 }} onClick={() => setCmdOpen(false)}>
          <div style={{ width: 720, background: colors.bg, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", border: `1px solid ${colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 12, borderBottom: `1px solid ${colors.border}` }}>
              <input autoFocus placeholder={t("Gõ để tìm lệnh hoặc route…", "Type to search commands or routes…")} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: `1px solid ${colors.border}` }} />
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {filteredCmd.map((c) => (
                <div key={c.key} onClick={() => { setActiveKey(c.key); setCmdOpen(false); onClickRoute(c.route, c.key); }} style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, cursor: "pointer" }}>
                  <div style={{ fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: colors.subtext }}>{c.route}</div>
                </div>
              ))}
              {filteredCmd.length === 0 && (
                <div style={{ padding: 16, color: colors.subtext }}>{t("Không có lệnh.", "No commands.")}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavList({ items, openKeys, setOpenKeys, activeKey, onRoute }) {
  const toggle = (key) => {
    const next = new Set(openKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    setOpenKeys(next);
  };

  return (
    <div>
      {items.map((it) => (
        <div key={it.key}>
          <div
            onClick={() => (it.children?.length ? toggle(it.key) : onRoute(it.route, it.key))}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
              background: activeKey === it.key ? "#eff6ff" : "transparent", cursor: "pointer",
            }}
            title={it.route || it.label}
          >
            <span style={{ width: 20, textAlign: "center" }}>{it.icon || "•"}</span>
            <span style={{ fontWeight: 600 }}>{it.label}</span>
            {it.children?.length ? (
              <span style={{ marginLeft: "auto", color: "#6b7280" }}>{openKeys.has(it.key) ? "▾" : "▸"}</span>
            ) : (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{it.route}</span>
            )}
          </div>
          {it.children?.length && openKeys.has(it.key) && (
            <div style={{ marginLeft: 20, borderLeft: "2px solid #eef2ff", paddingLeft: 8 }}>
              <NavList items={it.children} openKeys={openKeys} setOpenKeys={setOpenKeys} activeKey={activeKey} onRoute={onRoute} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
      <div style={{ textAlign: "center" }}>
        {t("Chọn menu ở thanh bên trái hoặc mở Command Palette (Ctrl/⌘+K).", "Select a menu on the left or open Command Palette (Ctrl/⌘+K).")}
      </div>
    </div>
  );
}

// ==== Runner (tương đương src/App.tsx) ====
export default function App() {
  return (
    <AppShellNav
      breadcrumbs={["Home", "Dashboard"]}
      onNavigate={(route) => alert("Navigate to: " + route)}
      onLocaleChange={(loc) => console.log("locale:", loc)}
      rightPane={(
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Context / Ngữ cảnh</div>
          <ul style={{ lineHeight: 1.8 }}>
            <li>Recent activity</li>
            <li>Pinned docs</li>
            <li>Quick links</li>
            <li>Shortcuts</li>
          </ul>
          <p style={{ marginTop: 16, color: "#6b7280" }}>
            Demo giữ nguyên API & hành vi cơ bản của AppShellNav.
          </p>
        </div>
      )}
    >
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Welcome!</h1>
        <p>Đây là bản Canvas single-file của <strong>MUI-01 • CORE-01 AppShell_Nav</strong>.</p>
        <p>Hãy thử mở <strong>Command Palette</strong> bằng <code>Ctrl/⌘+K</code>, hoặc click một menu ở bên trái.</p>
      </div>
    </AppShellNav>
  );
}
