
# MUI-67 — KPI-07 Dashboard_Manager (Mock‑Ready)

**Theo Catalog #67 (KPI‑07)**  
Dashboard dành cho **Trưởng bộ phận** với **role filters**, tổng hợp từ KPI‑01..05 theo **phòng ban (Dept)**.

## Tính năng
- Bộ lọc: **Dept**, **Year**, **Anchor date** (cho Active Users 7d), **Approver** (cho pending list).  
- Hàng **5 thẻ KPI**: Budget utilization %, Open tasks, Overdue tasks, Pending approvals (count & amount & avg age), Active users (7d + latest WAU/DAU).  
- **Biểu đồ**: 
  - **Budget vs Actual** (12 tháng, cột đôi).  
  - **Open tasks by status** (donut + legend).  
- **Bảng**: 
  - **Overdue tasks (Top 10)**.  
  - **Pending approvals (Top 10)** có lọc **Approver**.  
- **Export CSV** chuỗi Budget vs Actual.

## Mock data & Aggregator
- `src/mock/*.ts`: users, activity, budgets, approved actuals, pending approvals, tasks.  
- `src/mock/kpi_manager.ts` → `kpiManager({year, dept, anchorISO?, approver?})` trả:
```ts
{
  scope, 
  budget: { total_budget, total_actual, util_pct, series:[{month,budget,actual}] },
  tasks: { total_open, by_status:[{key,count}], overdue, overdue_top:[...] },
  pending: { count, amount, avg_age, top:[{code,title,amount,age_days,approver}] },
  active: { dau_series:[{date,dau,wau}], active_7d }
}
```

## API thật (đề xuất)
- `GET /kpis/manager-dashboard?dept=SALES&year=2025&anchor=2025-09-09&approver=`  
  - Các nguồn: **FIN** (Budget/Actual/Approvals), **PM** (Tasks), **CORE** (Users/Activity).  
  - Áp **RBAC**: Manager chỉ xem dept của mình; CEO xem tất cả.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
