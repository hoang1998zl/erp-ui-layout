
# MUI-46 — FIN-02 Account_Detail_Form (Mock‑Ready)

**Theo Catalog #46 (FIN‑02)**  
Form **chi tiết tài khoản**: tạo/sửa tài khoản trong **Sơ đồ tài khoản (CoA)**, **khoá "Type & Normal side"** khi tài khoản **đã có bút toán**. Cho phép **parent/child** linh hoạt (nếu parent là postable thì chỉ cảnh báo).

## Tính năng
- **Create/Edit**: `code, name_vi, name_en, type, normal_side, parent_code, is_postable, currency, active`.  
- **Lock rule**: nếu `hasPostings(code)===true` ⇒ khoá **Type** & **Normal side** (theo yêu cầu catalog: “lock type sau khi có bút toán”).  
- **Parent/child allowed**: chọn **Parent** từ dropdown; nếu parent đang postable → **warning** (vẫn lưu).  
- **Validation**: bắt buộc `code/name_vi`, kiểm tra **trùng mã**, **loại/side**, **prefix không khớp với parent** (cảnh báo).  
- **Danh sách bên trái**: chọn nhanh tài khoản để chỉnh; tạo mới khi không chọn mã.  
- **Xoá**: nếu đã có bút toán liên quan ⇒ **không cho xoá**.

## Mock API & Storage
- Dùng chung **draft CoA** từ FIN‑01: `localStorage["erp.fin.coa.v1"]` chứa `{ accounts[], mappings }`.  
- API mock: `listAccounts/getAccount/upsertAccount/deleteAccount/validateAccount` trong `src/mock/coa.ts`.  
- GL mock: `src/mock/gl.ts` với `listLines/hasPostings/seedGLIfEmpty` (tạo một vài bút toán mẫu, như vào 1111, 632).

## Hợp đồng API thật (đề xuất)
- `GET /fin/coa/accounts/:code`, `PUT /fin/coa/accounts/:code`, `POST /fin/coa/accounts`, `DELETE /fin/coa/accounts/:code`.  
- `GET /fin/gl/hasPostings?account=...` (hoặc trả cờ `has_postings` trong `GET account`).  
- **Rule**: nếu `has_postings` ⇒ cấm thay đổi `type` và `normal_side`; có thể đổi **name/parent/postable/status**.  
- **RBAC**: **Finance** được sửa, **Admin** có thể override (nếu chính sách cho phép).  
- **Audit**: mọi thay đổi ghi log (ADM‑06).

## Tích hợp
- **FIN‑01 CoA_Setup_Wizard**: form này là chi tiết “drill‑down” cho từng account.  
- **FIN‑03 Journal/Posting**: hiển thị link đến Account Detail; chặn xoá nếu đang dùng.  
- **Migration**: khi import CoA, có thể mở form để sửa nhanh từng mục.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
