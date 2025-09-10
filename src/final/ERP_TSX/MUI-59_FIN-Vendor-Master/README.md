
# MUI-59 — FIN-15 Vendor_Master (Mock‑Ready)

**Theo Catalog #59 (FIN‑15)**  
Danh mục **Nhà cung cấp (Vendor Master)** — **list + CRUD + import/export** với kiểm tra cơ bản cho MST (VN), email, phone.

## Tính năng
- **Bảng Vendor**: Code, Tên (VI/EN), MST (TIN), Contact, Email, Phone, Currency, Payment Terms (days), Trạng thái.  
- **Lọc/Tìm**: theo trạng thái (**Active/Inactive**), **Currency**, **Loại** (domestic/foreign), ô **Search** (code/name/TIN/email).  
- **Thao tác**: Add/Edit/Delete (drawer form).  
- **Import CSV / Export CSV** (các cột chuẩn: xem bên dưới).  
- **Validation**: 
  - **Code** unique, **Name(VI)** bắt buộc.  
  - **Email** & **Phone** định dạng cơ bản.  
  - **MST (VN)** chấp nhận **10 hoặc 13 chữ số** (đơn giản hoá, demo).

## Mock storage
- Vendors: `localStorage["erp.fin.vendors.master.v1"]` (seed 3 NCC mẫu).

## Định dạng CSV
Header mẫu:
```
code,name_vi,name_en,tax_code,country,province,address,contact_name,email,phone,bank_name,bank_account,bank_branch,currency,payment_terms_days,supplier_type,wht_rate_pct,active
```
- `supplier_type`: `domestic|foreign`  
- `active`: `true|false`

## API thật (đề xuất)
- `GET /fin/vendors?q=&status=&currency=&type=&page=&page_size=`  
- `POST /fin/vendors` (create), `PUT /fin/vendors/{code}` (update), `DELETE /fin/vendors/{code}`  
- `POST /fin/vendors:import` (CSV) → `{inserted, skipped, duplicates[]}`  
- Validation nâng cao: **kiểm tra MST** với cổng **TCT** (Tổng cục Thuế) hoặc provider; kiểm tra **tài khoản ngân hàng** (NAPAS/OpenBanking) nếu khả thi.

## RBAC & Audit
- Chỉ **Finance** có quyền **CRUD**; các bộ phận khác **read‑only**.  
- Mọi thao tác **Import/Delete/Update** ghi vào **Audit log** (ADM‑06).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
