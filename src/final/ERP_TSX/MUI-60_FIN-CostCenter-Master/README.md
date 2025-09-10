
# MUI-60 — FIN-16 CostCenter_Master (Mock‑Ready)

**Theo Catalog #60 (FIN‑16)**  
Danh mục **Trung tâm chi phí (Cost Center)** — **cây + bảng**, **CRUD**, **import/export CSV**, với kiểm tra **chu trình cha‑con** và **khoảng hiệu lực**.

## Tính năng
- **Chế độ xem**: **Tree** (có nút expand/collapse, Add child/Edit/Delete) và **Table** (đường dẫn `path`, `level`).
- **Bộ lọc**: Search code/tên/path, tuỳ chọn **Only Active**.
- **Thao tác**: **New/Edit/Delete** (drawer form) với trường:
  - `code*`, `name_vi*`, `name_en`, `parent_code`, `owner_dept`, `manager`, `effective_from/to`, `active`, `notes`.
- **Validations**: unique code (mặc định theo lưu trữ), **không cho parent=self/cycle**, kiểm tra **effective_from ≤ effective_to**, parent phải **tồn tại**.
- **CSV**: Export & Import (upsert) với thống kê `inserted/updated/errors`.
- **Seed**: ví dụ `ADMIN/FIN/HR`, `OPS/(SG|HN)`, `SALES/(B2B|ONLINE)`.

## Mock storage
- `localStorage["erp.fin.costcenters.v1"]`

## CSV header mẫu
```
code,name_vi,name_en,parent_code,owner_dept,manager,effective_from,effective_to,active,notes
```

## API thật (đề xuất)
- `GET /fin/cost-centers?status=&q=&parent=&page=&page_size=`  
- `POST /fin/cost-centers` (create), `PUT /fin/cost-centers/{code}` (update), `DELETE /fin/cost-centers/{code}`  
- `POST /fin/cost-centers:import` (CSV) → `{inserted, updated, errors[]}`  
- **Constraint**: khoá **cycle** ở DB (trigger/closure table) hoặc lưu cột `path` & `level` update tự động.

## Tích hợp
- **FIN‑04** (tham chiếu Cost Center vào bút toán/COA mapping).  
- **Budgeting** (kế hoạch chi phí theo CC), **Reporting** (P&L by CC).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
