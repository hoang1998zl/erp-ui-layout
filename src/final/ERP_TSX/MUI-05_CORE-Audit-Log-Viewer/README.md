# MUI-05 — CORE-05 Audit_Log_Viewer (Mock‑Ready)

**Theo Catalog #5**  
Xem nhật ký hệ thống/audit theo **entity/action/actor**, hỗ trợ **tìm kiếm**, **lọc ngày**, **mở JSON chi tiết**, **phân trang**, **export CSV/JSON**.

## Tính năng
- Bộ lọc: Từ khóa, Entity type, Action, Actor, Khoảng ngày (từ ‑ đến).
- Bảng: sắp xếp mặc định **mới → cũ**, hàng mở rộng xem **snapshot JSON**.
- Export: **CSV** & **JSON** của kết quả đã lọc.
- Hiệu năng: phân trang client‑side (pageSize mặc định 20).
- Ngôn ngữ: VI/EN qua prop `locale`.

## API/Props
```ts
type AuditLogViewerProps = {
  loader?: () => Promise<AuditItem[]>;  // default: fetchAudit() (mock)
  locale?: 'vi'|'en';                   // default: 'vi'
  pageSize?: number;                    // default: 20
}
```
- `loader` có thể nối vào API thật (OpenAPI: `GET /audit`), trả về `{ id, entity_type, entity_id, action, actor_email, created_at, data }`.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp với App Shell
- Mount vào route **/admin/audit** trong **AppShell_Nav (MUI‑01)**.
- Kết hợp **Notification Center (MUI‑03)** → click thông báo quan trọng mở sẵn bộ lọc tương ứng.
