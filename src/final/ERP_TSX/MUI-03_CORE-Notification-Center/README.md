# MUI-03 — CORE-03 Notification_Center (Mock-Ready)

**Theo Catalog #3**  
Thông báo hợp nhất cho *Approvals / Comments / Task status / Documents*. Hỗ trợ live updates (mock stream), lọc theo nhóm, đánh dấu đã đọc, và điều hướng.

## Tính năng
- Nút **🔔** hiển thị badge số lượng **unread**.
- Bảng điều khiển thả xuống: **lọc nhóm**, **tìm nhanh**, **mark all read**.
- Click item → gọi `onNavigate(route)` và đánh dấu đã đọc.
- **Live mock**: `mockSubscribe(intervalMs)` đẩy thông báo ngẫu nhiên (SSE/WebSocket adapter về sau).
- Song ngữ **VI–EN**.

## API/Props
```ts
type NotificationCenterProps = {
  subscribe?: SubscribeFn;              // default: mockSubscribe(3000)
  initial?: NotificationItem[];         // default: seedInitial(6)
  onNavigate?: (route: string) => void;
  locale?: 'vi'|'en';                   // default: 'vi'
}
```
- Export thêm `NotificationBell` (alias tiện dụng).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `NotificationBell` ở top bar của **AppShell_Nav (MUI-01)**.
- Về sau đổi `subscribe` sang adapter SSE/WebSocket thật; không cần đổi logic UI.
- Nguồn Approval/Task/Document thực tế sẽ đồng bộ từ các MUI: `APP-03 Approval_Inbox`, `PM-03 Task_Kanban`, `FIN-08 Expense_Form`, `EIM-01/02`.
