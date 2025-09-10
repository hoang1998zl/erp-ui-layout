
# MUI-73 — INT-05 Webhook_Subscriptions (Mock‑Ready)

**Theo Catalog #73 (INT‑05)**  
Màn hình **quản lý đăng ký Webhook** cho **Admin**. Wave: **W2**. Phụ thuộc: **ADM‑07**. Ghi chú: **Entity events**.

## Tính năng
- **Danh sách & CRUD Subscription**: tạo/sửa/xóa, bật/tắt, đặt **Target URL**, **Secret (HMAC‑SHA256)**, **Headers tuỳ chỉnh**.
- **Chọn phạm vi**: **Entity** (Expense/PO/Invoice/Task/Project/…) và **Event types** (`entity.created/updated/deleted`, `status.changed`, `approval.*`, `webhook.ping`).  
- **Retry policy**: cấu hình `maxAttempts`, `backoffSeconds`.  
- **Ping & Logs**: **Send ping (mock)** và **Recent deliveries** (thời gian, mã trạng thái, thời lượng, số lần thử, payload). **Replay (mock)**, **View payload**, **Copy cURL**.  
- **Ký chữ ký**: header **`X‑ERP‑Signature‑256`** dạng `t=<unix>,v1=<hex>` (HMAC‑SHA256(payload, secret)) — hiển thị trước khi gửi để dễ tích hợp đối tác.
- **Giới hạn demo**: không gửi HTTP thật; dùng **cURL** để test endpoint của đối tác.

## Cấu trúc mã
- `src/integrations/webhooks/types.ts` — định nghĩa `WebhookSubscription`, `Delivery`, `EventType`, `Entity`.  
- `src/integrations/webhooks/mockStore.ts` — store `localStorage` + HMAC bằng WebCrypto, sinh **payload mẫu** và **simulate deliver** (200/429/500 ngẫu nhiên).  
- `src/components/integrations/WebhookSubscriptions.tsx` — UI 3 cột: **List** • **Editor** • **Deliveries**.  
- `src/App.tsx` — runner.

## Thiết kế API thật (khuyến nghị)
### 1) Đăng ký & quản lý
- `POST /int/webhooks/subscriptions` → tạo; body: `{ name, targetUrl, secret, headers[], entity, events[], retry{maxAttempts,backoffSeconds} }`
- `GET /int/webhooks/subscriptions` / `GET /.../{id}` / `PUT /.../{id}` / `DELETE /.../{id}`  
- RBAC: **Admin** (ADM‑07). Audit thay đổi.

### 2) Gửi sự kiện
- Sự kiện chuẩn hóa:  
```jsonc
{
  "id": "evt_xxx",
  "type": "entity.updated",
  "entity": "Expense",
  "occurred_at": "2025-09-09T06:00:00Z",
  "data": { /* snapshot/patch */ }
}
```
- Header chữ ký: `X-ERP-Signature-256: t=<unix>,v1=<hmac-hex>` (HMAC-SHA256 trên **body**).  
- HTTP 2xx = thành công; 3xx/4xx/5xx = thất bại → xếp hàng **retry** với **exponential backoff** (ví dụ: 30s, 60s, 120s, …) cho đến `maxAttempts`.  
- **Idempotency**: gửi `Idempotency-Key` = `event.id`.

### 3) Bảo mật & tuân thủ
- **Secret** lưu **server-side**; không hiển thị lại (chỉ reset).  
- **IP allowlist** (nếu đối tác cho phép); **HTTPS bắt buộc**; timeout 5–10s.  
- **PII**: mask dữ liệu cá nhân theo **Nghị định 13/2023/NĐ‑CP**; log chỉ lưu metadata, payload tối thiểu.  
- **Quan sát**: metrics tỷ lệ thành công, p95 latency; dead-letter queue cho thất bại vĩnh viễn.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
