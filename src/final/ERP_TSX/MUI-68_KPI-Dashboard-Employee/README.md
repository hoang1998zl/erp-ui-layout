
# MUI-68 — KPI-08 Dashboard_Employee (Mock‑Ready)

**Theo Catalog #68 (KPI‑08)**  
Trang **tổng quan cá nhân** cho **nhân viên**. Phụ thuộc: **KPI‑02, KPI‑03, FIN‑09**.  
Tập trung 2 luồng chính: **My Tasks** và **My Expenses**.

## Tính năng
- Bộ lọc: **User (Me)**, **Year**, **Project**.  
- Thẻ KPI: **Open**, **Overdue**, **Due next 7d**, **Done last 7d**, **My pending expenses**.  
- Biểu đồ: **Task status (donut)**.  
- Tổng quan **My Expenses**: **Pending / Approved / Paid** (số lượng & giá trị).  
- Danh sách: **Upcoming due (Top 10)** và **My pending expenses (Top 10)** với **amount** & **age**.  
- **Export CSV** danh sách “Upcoming due”.

## Mock data & Aggregator
- `src/mock/tasks.ts` — seed **tasks** theo người phụ trách (assignee).  
- `src/mock/expenses.ts` — seed **expenses** theo người đề nghị (requester) với trạng thái `draft/submitted/pending/approved/rejected/paid`.  
- `src/mock/kpi_employee.ts` → `employeeDashboard({ user, year, project? })` trả:
```ts
{
  scope,
  tasks: { open, by_status:[{key,count}], overdue, due_next7, done_last7, upcoming:[...], overdue_top:[...] },
  expenses: { count, by_status:[{key,count,amount}], pending_amount, approved_amount, paid_amount, pending_top:[...], last10:[...] }
}
```

## API thật (đề xuất)
- `GET /kpis/employee-dashboard?user=lan&year=2025&project=`  
- Nên có các API liên quan: 
  - **PM**: `/pm/my-tasks` (lọc & phân trang).  
  - **FIN**: `/fin/expenses?requester=me` (trạng thái, số tiền, chứng từ).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
