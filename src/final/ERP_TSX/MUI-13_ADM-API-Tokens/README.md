# MUI-13 — ADM-07 API_Tokens (Mock‑Ready)

**Theo Catalog #13 (ADM-07)**  
Quản trị **API Tokens** & **Webhooks**: tạo, thu hồi, xóa, **rotate secret**, hiển thị **bí mật một lần**; webhook có **test delivery**, xem **deliveries gần đây**. Hỗ trợ **Export/Import JSON** (chỉ metadata, không xuất plaintext secret).

## Tính năng
- **API Tokens**: danh sách (search theo tên/scope), trạng thái, ngày tạo/hết hạn/last used; **Create** (chọn scope mặc định đọc), **Revoke**, **Rotate** (hiện secret mới một lần), **Delete**.
- **Webhooks**: danh sách endpoint (URL, events, secret prefix), trạng thái, lần gửi gần nhất; **Add**, **Send test**, **Rotate secret**, **Pause/Resume**, **Delete**; xem **Recent deliveries** (HTTP, thời gian, kết quả).
- **Secret Modal**: hiển thị **plaintext** chỉ một lần sau khi tạo/rotate, nút **Copy**.
- **Import/Export JSON**: phục vụ backup cấu hình (không chứa plaintext secret).

## API/Props
```ts
type ApiTokensAdminProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listScopes: () => Promise<Scope[]>;
    listTokens: () => Promise<ApiToken[]>;
    createToken: (input: CreateTokenInput) => Promise<CreateTokenResult>;
    revokeToken: (id: string) => Promise<void>;
    rotateToken: (id: string) => Promise<{ plaintext: string; prefix: string }>;
    deleteToken: (id: string) => Promise<void>;
    listWebhooks: () => Promise<WebhookEndpoint[]>;
    createWebhook: (input: CreateWebhookInput) => Promise<CreateWebhookResult>;
    rotateWebhookSecret: (id: string) => Promise<{ plaintext: string; prefix: string }>;
    toggleWebhook: (id: string, active: boolean) => Promise<void>;
    deleteWebhook: (id: string) => Promise<void>;
    sendTestDelivery: (id: string, event?: string) => Promise<void>;
    exportJSON: () => Promise<string>;
    importJSON: (file: File) => Promise<void>;
  }>;
}
```
- Mặc định dùng mock trong `src/mock/apiTokens.ts`. Khi nối API thật, override `adapters` (UI giữ nguyên).

## Hợp đồng API thật (đề xuất)
- **Tokens**
  - `GET /api/tokens` → `ApiToken[]` (metadata, không có plaintext)
  - `POST /api/tokens` body `{ name, scopes[], ip_whitelist?, expires_in_days? }` → `{ token: ApiToken, plaintext }`
  - `POST /api/tokens/{id}:revoke`
  - `POST /api/tokens/{id}:rotate` → `{ plaintext, prefix }`
  - `DELETE /api/tokens/{id}`
- **Webhooks**
  - `GET /api/webhooks` → `WebhookEndpoint[]`
  - `POST /api/webhooks` body `{ url, events[] }` → `{ endpoint, plaintext_secret }`
  - `POST /api/webhooks/{id}:rotate_secret` → `{ plaintext, prefix }`
  - `POST /api/webhooks/{id}:toggle` body `{ active: boolean }`
  - `DELETE /api/webhooks/{id}`
  - `POST /api/webhooks/{id}:test` body `{ event? }` → enqueue & store delivery result
- **Export/Import**
  - `GET /api/integrations:export` / `POST /api/integrations:import` (metadata only)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp & bảo mật
- Mount `/admin/integrations/tokens` trong App Shell (#1).  
- Áp dụng **RBAC**: chỉ role `Admin` có `adm.settings.manage` hoặc `adm.rbac.manage` mới truy cập.  
- Server phải: **hash** và **không lưu plaintext**; chỉ trả `plaintext` tại **create/rotate**; ghi **audit** mỗi thao tác (#12).  
- Hạn chế IP (CIDR), đặt **expires_at**, rate limit & **HMAC-SHA256** cho webhook signature (`X-ERP-Signature`).  
- Webhook worker nên retry với backoff, lưu **delivery logs** để đối soát.
