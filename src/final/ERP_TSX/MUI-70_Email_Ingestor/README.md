
# MUI-70 — INT-02 Email_Ingestor (Mock‑Ready)

**Theo Catalog #70 (INT‑02)**  
**Email Ingestor** dành cho **Admin**: nạp email thành **Doc** hoặc **Ticket** theo **rules**. Phụ thuộc: **EIM‑01**. Wave: **W2**.  
Ghi chú catalog: **Parse headers** — component hiển thị và dùng các header chính: `Message-ID`, `In-Reply-To`, `References`, `DKIM/SPF/DMARC` (nếu có).

## Tính năng
- **Kết nối (mock)**: chọn **Provider** (Mock/Gmail/M365/IMAP), cấu hình **Mailbox**.  
- **Duyệt hộp thư**: danh sách email (Subject/From/Date/Att/Status), tìm kiếm nhanh; panel chi tiết với **Headers**, **snippet**, **Parse result** (tags, project, attachments, suggested type).  
- **Rules Engine** (UI phải): tạo/sửa/xóa rules:
  - Điều kiện: `from includes`, `to includes`, `subject includes`, `hasAttachment`, `body regex`.  
  - Hành động: `type (ticket|doc)`, `defaultProject`, `tagsFromSubject`.  
- **Ingest to ERP (mock)**: áp rules → quyết định Doc/Ticket → tạo ERP ref (ví dụ `TCK-1234`) → **mark ingested**.

## Cấu trúc mã
- `src/integrations/email/types.ts` — types (Provider/Config/Email/Rule).  
- `src/integrations/email/mockMailbox.ts` — **Mock mailbox**: folders + emails có headers; `listFolders`, `listEmails`, `markIngested`.  
- `src/integrations/email/parser.ts` — **Parser & Rule engine**: trích `tags (#tag)`, `project (PRJ-XXX)`, quyết định default type.  
- `src/components/integrations/EmailIngestor.tsx` — UI 3 cột: **Settings** • **Emails** • **Rules**.  
- `src/App.tsx` — runner.

## Tích hợp thật (gợi ý)
- **Gmail API**: `users.messages.list`, `users.messages.get` (format=metadata/full), `watch` (push), `history.list` (delta).  
- **Microsoft 365 (Graph)**: `/me/messages` hoặc `/users/{id}/mailFolders/{id}/messages`, `delta`, `subscriptions` (webhooks).  
- **IMAP (OAuth2)**: Idle + UID sync.  
- **Idempotency**: lưu `Message-ID` để tránh nạp trùng; map **Thread** bằng `In-Reply-To`/`References`.  
- **Bảo mật/Pháp lý**: token lưu server-side, audit nạp; tuân thủ **Nghị định 13/2023/NĐ‑CP** (dữ liệu cá nhân).  
- **Routing**: dùng địa chỉ **alias** (`support@`, `docs@`, `ap@`) hoặc **plus addressing** (`ticket+prj-a@`).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
