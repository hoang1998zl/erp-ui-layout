
# MUI-58 — FIN-14 Tax_Config_UI (Mock‑Ready)

**Theo Catalog #58 (FIN‑14)**  
Màn hình **Cấu hình thuế suất (Tax settings)** và **Áp dụng cho Items**.

## Tính năng
- **Tab Tax**: quản lý **Tax codes** với trường: `code, name_vi/name_en, rate_pct, type (VAT_IN/VAT_OUT/NONE), method (exclusive/inclusive), vat_account (VD 1331/3331), effective_from/to, active`.
  - **Add/Edit/Duplicate/Delete**, **Search**, **Export CSV**.
  - Seed sẵn: `VAT0/8/10 (IN/OUT)`, `NONVAT`.
- **Tab Apply to Items**: bảng Items (SKU/Name/Category/Tax), thao tác:
  - Chọn **Category + Tax code** → **Apply** (có tuỳ chọn **Only items without tax**).
  - Đổi thuế **per-item** bằng dropdown.
- **LocalStorage**: 
  - Tax codes: `erp.fin.tax.codes.v1`
  - Items: `erp.inv.items.v1` (seed ví dụ: STATIONERY/EQUIPMENT/SERVICE)

## API thật (đề xuất)
- `GET/POST/PUT/DELETE /fin/taxes` (CRUD) với ràng buộc **unique code**, **0≤rate≤100**, **effective windows**.
- `GET /inv/items?category=&q=` và `POST /inv/items/{id}:set_tax` hoặc batch `POST /inv/items:apply_tax { category, tax_code, only_empty }`.
- **Validation**: khi **inactive** hoặc **hết hiệu lực**, không cho gán mới; kiểm tra **type** (IN/OUT) khớp ngữ cảnh **Mua/Bán**.

## Gợi ý cấu hình VN
- **VAT input**: TK **1331**; **VAT output**: TK **3331**.  
- **Phương pháp tính**: đa số **exclusive**; **inclusive** áp dụng với giá niêm yết đã gồm VAT.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
