
# MUI-56 — FIN-12 Corporate_Card_Upload (Mock‑Ready)

**Theo Catalog #56 (FIN‑12)**  
Upload sao kê **corporate card** dạng **CSV**, map cột, import vào hệ thống rồi **gợi ý khớp** với **Expenses** (FIN‑08/09/10).

## Tính năng
- **Stepper 3 bước**: Upload CSV → Map cột → Review & Match.
- **CSV parser** (trong trình duyệt), **auto-map** cột dựa trên tên (date/amount/currency/merchant/last4/description/ext_id).
- **Dedupe** theo `hash` (date|amount|merchant|currency|last4) hoặc `ext_id` nếu có.
- **Auto‑suggest match** tới **Expense** (`status=submitted/approved`) theo **điểm số**:
  - Gần số tiền (±1–2% hoặc ngưỡng 5–10k), gần ngày (≤7–10 ngày), trùng từ khoá merchant trong Title/Description.
  - Đề xuất theo **Expense tổng** hoặc **theo từng dòng**.
- **Drawer match**: xem chi tiết giao dịch + danh sách gợi ý (score + reason), chọn **Accept**; hoặc **chọn thủ công** từ danh sách Expense.
- **Bảng** 2 cột: **New transactions** và **Matched** (theo dõi trạng thái).
- **LocalStorage**: `erp.fin.corp_card.txns.v1`.
- **Sample file**: có sẵn để demo nhanh.

## API thật (đề xuất)
- `POST /fin/corp-cards/import` (multipart CSV) → trả `batch_id` + số dòng hợp lệ/bỏ qua/duplicate.
- `GET /fin/corp-cards/txns?status=new|matched&...` và `POST /fin/corp-cards/{id}:match` `{ expense_id, line_id }`.
- **Reconciliation report**: `GET /fin/corp-cards/recon?from=&to=` (matched/unmatched/duplicates).
- **Security/PII**: mask card number (`****1234`), lưu tối thiểu cần thiết; audit cho import/match.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
