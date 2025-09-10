# MUI-01 — CORE-01 AppShell_Nav (Mock-Ready)

**Mục tiêu / Purpose**
- Khung ứng dụng + điều hướng trái/đỉnh; hỗ trợ đa **workspace**, **breadcrumbs**, **Command Palette (Ctrl/⌘+K)**, **responsive sidebar**.
- Đúng theo Catalog (Item #1): *AppShell_Nav* — Wave P0, deps ADM-01, ADM-02 (để gắn RBAC sau).

## Cách chạy nhanh với Vite (React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy toàn bộ thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Kiến trúc & Slot
- `<AppShellNav>` nhận props:
  - `navItems?` (override), `workspaces?` (override), `breadcrumbs?`, `onNavigate`, `onLocaleChange`.
  - `children` (content chính), `rightPane` (context panel).
- Mock có sẵn:
  - `mock/nav.ts` (menu), `mock/workspaces.ts` (workspace list).

## Tính năng chính
- Sidebar thu gọn/mở rộng, menu lồng nhau, icon.
- Top bar: ô mở nhanh Command Palette, chuyển ngôn ngữ VI/EN, nút thông báo, avatar.
- Breadcrumbs + vùng content + context (right pane).
- Command Palette lọc theo label, `onNavigate(route)` được gọi khi chọn.

## Nối tiếp
- MUI-02: FIN-08 Expense_Form (mobile-first) — sẽ mount bên trong AppShellNav làm content.
- MUI-03: Approval_Inbox — mount cùng shell, dùng chung Command Palette & breadcrumbs.
