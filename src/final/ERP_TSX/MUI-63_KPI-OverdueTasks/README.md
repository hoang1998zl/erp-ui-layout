
# MUI-63 — KPI-03 KPI_OverdueTasks (Mock‑Ready)

**Theo Catalog #63 (KPI‑03)**  
Widget **Công việc quá hạn** cho **CEO, PM** — phụ thuộc **PM‑03**.

## Tính năng
- **Bộ lọc**: Năm, Project, Assignee, Priority.  
- **Chỉ số**: Tổng quá hạn, **Avg/Median/Max** số ngày quá hạn.  
- **Phân bố buckets**: `0–7`, `8–14`, `15–30`, `31–60`, `>60` (biểu đồ cột).  
- **Breakdown**: theo **Project** và **Assignee** (top 6).  
- **Danh sách Top 50 quá hạn**: code, title, project, assignee, priority, due date, **days overdue**; **sort by** Days/Priority/Project/Assignee.  
- **Hành động (mock)**: **Snooze +7d**, **Mark done** (ghi vào localStorage).  
- **Export CSV** danh sách.

## Mock data
- `src/mock/tasks.ts` → seed tasks theo tháng/project/assignee với due_date rải đều; một phần trạng thái `done`.  
- `src/mock/kpi_overdue.ts` → `overdueKPI({year, project?, assignee?, priority?})` trả tổng quan + danh sách đã tính **days_overdue**.

## API thật (đề xuất)
- `GET /kpis/overdue-tasks?year=&project=&assignee=&priority=` → { scope, total_overdue, avg_days, median_days, max_days, buckets[], counts_by_project[], counts_by_assignee[], list[] }  
- Hỗ trợ **paging** cho danh sách và **CSV export** server-side.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
