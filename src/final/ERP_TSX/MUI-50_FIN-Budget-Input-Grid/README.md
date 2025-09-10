
# MUI-50 — FIN-06 Budget_Input_Grid (Mock‑Ready)

**Theo Catalog #50 (FIN‑06)**  
Bảng **nhập ngân sách** theo 12 tháng (Jan..Dec) với cột **TK**, **Dự án (PROJECT)**, **Phòng ban (DEPT)** và **Ghi chú**. Hỗ trợ **Spread helper** (phân bổ đều), **khóa theo tháng**, **CSV import/export**, và **Validate**.

## Tính năng
- **Scenario header**: `fiscal_year, currency, scenario name, status (draft/locked/submitted)`.
- **Grid**: trái là `Account / Project / Dept / Note`, phải là 12 tháng **M01..M12** + **Year Total** (tự tính).  
- **Spread helper**:  
  - Per‑row **Spread** (nhập tổng năm, hoặc dùng tổng hiện tại → chia đều 12 tháng).  
  - **Spread tất cả** dựa vào tổng từng dòng.
- **Lock tháng**: toggle từng tháng → khóa input (và đổi nền xám).  
- **CSV**: header `account_code,project_code,dept_code,note,M01..M12`; **Export/Import** tại panel bên phải.
- **Validate**: kiểm tra thiếu `account_code`, dữ liệu không phải số.
- **Danh mục**: đọc **Accounts** từ CoA (chỉ `expense/revenue`, `postable=true`), **PROJECT/DEPT** từ FIN‑04/05.

## Mock storage
- **Budget scenarios**: `localStorage["erp.fin.budget.scenarios.v1"]` + `erp.fin.budget.current.v1`.  
- API mock: `newScenario/getCurrent/setCurrent/upsertScenario/addLine/deleteLine/spreadEven/sumLine/sumByMonth/exportCSV/importCSV/validateScenario`.

## Hợp đồng API thật (đề xuất)
- `GET/POST/PATCH /fin/budget/scenarios` (status chuyển `draft→locked→submitted`).  
- `POST /fin/budget/{id}:import_csv`, `GET /fin/budget/{id}:export_csv`.  
- **RBAC**: Finance/PM; **Audit** (ADM‑06); **Cut‑off**: lock tháng theo kỳ kế toán.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
