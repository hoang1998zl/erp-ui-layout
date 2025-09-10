
# MUI-51 — FIN-07 Budget_Vs_Actual_Card (Mock‑Ready)

**Theo Catalog #51 (FIN‑07)**  
**Widget Budget vs Actual (BvA)** cho CEO/Finance/PM, hỗ trợ **YTD/MTD**, **grouping** (Overall / By Account / By Project / By Dept), **lọc Project/Dept**, thanh **% bar** theo ngưỡng **green/amber/red**, và **drill‑down** tới **actual items** (bút toán) với **Export CSV**.

## Tính năng
- Chọn **Scenario** (đọc từ FIN‑06 storage) + **Month** + **Period** (YTD/MTD).  
- **Group**: Overall / Account / Project / Dept; sort theo **|variance|** để nổi bật lệch lớn.  
- **Màu**:  
  - **Expense**: ≤90% **green**, 90–110% **amber**, >110% **red**.  
  - **Revenue**: ≥110% **green**, 90–110% **amber**, <90% **red**.  
- **Drill to items**: mở drawer xem danh sách bút toán thực tế (account/project/dept/amount/memo) và **Export CSV**.  
- **Filters**: Project, Dept (áp dụng cho cả Budget và Actual).

## Mock & dữ liệu
- **Budget**: tái sử dụng `localStorage["erp.fin.budget.scenarios.v1"]` (từ UI #50). Nếu chưa có, tự tạo **"FY Budget (Draft)"**.  
- **Actual**: `localStorage["erp.fin.gl.actuals.v1"]` (seed vài dòng mẫu, có `project_code`/`dept_code`).  
- **CoA**: đọc account type để tính dấu số thực tế: Expenses = **debit**, Revenue = **credit**.  
- **Dimensions**: PROJECT/DEPT từ FIN‑04/05 (seed tối thiểu để demo).

## API thật (đề xuất)
- `GET /fin/budget/scenarios` (+ lines) để đọc **Budget**.  
- `GET /fin/gl/actuals?year=&month_lte=&project=&dept=` để đọc **Actual** (đã tổng hợp ở FIN‑10).  
- **BvA** có thể có endpoint tổng hợp riêng: `GET /fin/analytics/bva?group=account|project|dept&period=YTD|MTD&month=...`.  
- **RBAC**: CEO/Finance/PM xem; **audit** tải CSV nếu cần.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
