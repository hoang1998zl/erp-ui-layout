
# MUI-49 — FIN-05 Dimension_Value_Table (Mock‑Ready)

**Theo Catalog #49 (FIN‑05)**  
Bảng **Dimension Values** theo từng **Dimension Type** (phụ thuộc FIN‑04), cho phép **lọc theo trạng thái** và **lọc theo hiệu lực tại một ngày** (Validity dates). Có **Search**, **Sort**, **Pagination**, và **Export CSV**.

## Tính năng
- Chọn **Dimension** (drop‑down từ `listTypes()`), hiển thị bảng **values**.  
- **Filter**: trạng thái (All/Active/Inactive), **Valid on date** (kiểm tra `valid_from ≤ date ≤ valid_to`, mở khoảng nếu trống).  
- **Search** theo code/name/parent/external; **Sort** theo Code/Name/Status/From/To; **Pagination** có chọn **page size**.  
- **Export CSV** cho dimension đang chọn.  
- Link mở **FIN‑04** (mock) để quản lý (tạo/sửa/xoá).

## Mock API & Storage
- Dùng chung store với FIN‑04:  
  - Types: `localStorage["erp.fin.dim.types.v1"]`  
  - Values: `localStorage["erp.fin.dim.values.v1"]`  
- Hàm dùng: `listTypes/listValues/exportCSV` (đã seed PROJECT/DEPT + vài giá trị).

## Hợp đồng API thật (đề xuất)
- `GET /fin/dimensions` (types), `GET /fin/dimensions/{code}/values` (filterable với `status`, `valid_on`, `q`, `sort`, `page`).  
- **Export**: `GET /fin/dimensions/{code}/values:export?format=csv`.  
- **RBAC**: Finance có quyền xem; chỉnh sửa thực hiện ở **FIN‑04**; **Audit** (ADM‑06) nếu cần.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
