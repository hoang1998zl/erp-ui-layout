# MUI-12 — ADM-06 Audit_Export (Mock‑Ready)

**Theo Catalog #12 (ADM-06)**  
Xuất **audit logs** theo **date range** và các tiêu chí: **Actor, Action, Entity Type/ID, Contains**. Xem trước kết quả (paging), xuất **CSV/JSON**.

## Tính năng
- Bộ lọc trái: From/To (quick 7d/30d/90d), Actor, Action, Entity Type, Entity ID, Contains (tìm trong JSON/meta), Preview limit.
- Pane phải: bảng preview (paginate), tổng số kết quả.
- Nút **Export CSV / Export JSON** xuất toàn bộ tập kết quả (mock giới hạn 50k bản ghi).

## API/Props
```ts
type AuditExportAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listActions?: () => Promise<string[]>;
    listEntityTypes?: () => Promise<string[]>;
    listActors?: () => Promise<string[]>;
    queryAudit?: (q: Query) => Promise<Paged<AuditEvent>>;
    exportAudit?: (q: Query, format:'csv'|'json') => Promise<Blob>;
  };
}
```
- Mặc định dùng **mock** (`src/mock/audit.ts`). Khi nối API thật, chỉ cần override các hàm trên (UI giữ nguyên).

## Hợp đồng API thật (đề xuất)
- `GET /audit/actions` → `string[]`
- `GET /audit/entity_types` → `string[]`
- `GET /audit/actors` → `string[]`
- `GET /audit` (query: `from`, `to`, `actor`, `action`, `entity_type`, `entity_id`, `contains`, `limit`, `offset`) → `{ rows, total, limit, offset }`
- `GET /audit:export` (same query + `format=csv|json`) → stream/download

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount đường dẫn **/admin/audit/export**.  
- Kết nối với **CORE-05 Audit_Log_Viewer** để mở nhanh **export** dựa trên bộ lọc hiện tại.  
- Bổ sung server‑side streaming để xuất tập dữ liệu lớn (pagination cursor/batch).
