
# MUI-48 — FIN-04 Dimension_Management_UI (Mock‑Ready)

**Theo Catalog #48 (FIN‑04)**  
UI **Quản lý chiều phân tích** (ví dụ: **PROJECT, DEPT**): khai báo **Dimension Types** (phân cấp/không, trạng thái, áp dụng theo **module** và **required**), và quản lý **Dimension Values** (có **cây phân cấp**, trạng thái, **hiệu lực từ/đến**, **external mapping**, **attributes**).

## Tính năng chính
- **Types**: tạo/sửa/xoá; bật/tắt; chọn **hierarchical**; đặt **applicability** theo module (**GL/AP/AR/EXP/PR/INV/CRM/HR**) với cờ **enabled/required**.  
- **Values**: bảng & **tree preview**; `code/name_vi/name_en/parent_code/active/valid_from/valid_to/external_code/attributes`.  
- **CSV Import/Export** cho Values (header: `dim_code,code,name_vi,name_en,parent_code,active,valid_from,valid_to,external_code`).  
- **Validation**: trùng mã, parent tồn tại, `valid_from ≤ valid_to`, cờ **required ⇒ enabled**.  
- **Seed**: 2 chiều mẫu (**PROJECT**, **DEPT**) + vài giá trị minh hoạ (DEPT có phân cấp).

## Mock API & Storage
- Types: `localStorage["erp.fin.dim.types.v1"]` (mảng `DimensionType`).  
- Values: `localStorage["erp.fin.dim.values.v1"]` (mảng `DimensionValue`).  
- Hàm: `listTypes/listValues/upsertType/deleteType/upsertValue/deleteValue/validateType/validateValue/buildValueTree/exportCSV/importCSV`.

## Hợp đồng API thật (đề xuất)
- `GET/POST/PATCH/DELETE /fin/dimensions` và `/fin/dimensions/{code}/values`.  
- **Enforce** tại server: nếu module có `required=true`, khi tạo chứng từ ở module đó phải có giá trị hợp lệ trong khoảng **valid_from/valid_to**.  
- **RBAC**: Finance/Admin; **Audit** (ADM‑06) cho mọi thao tác; **Idempotent**.

## Tích hợp
- **GL/Journal, Expense, PR**: ô nhập chiều hiển thị theo **applicability** & **required**.  
- **BI/Reporting**: dùng `external_code` để map sang hệ khác.  
- **User default**: có thể mở rộng set **default value** theo user/role (không nằm trong UI này).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
