
# MUI-62 — KPI-02 KPI_OpenTasksByStatus (Mock‑Ready)

**Theo Catalog #62 (KPI‑02)**  
Widget **Công việc đang mở theo trạng thái** cho **CEO/PM** — phụ thuộc **PM‑03, PM‑05**.

## Tính năng
- **Bộ lọc**: Năm, Project, Assignee.  
- **Biểu đồ Doughnut** chia theo **status**: `todo / in_progress / review / on_hold / blocked` (bỏ `done`).  
- **Thẻ tổng hợp**: **Total Open**; **By Priority** (critical/high/medium/low).  
- **Legend** theo từng trạng thái kèm số lượng.  
- **Top Overdue** (tối đa 10) với mã, tên, project, assignee, priority, due date.  
- **Export CSV** (by_status) và **Export list** (overdue).

## Mock data
- `src/mock/tasks.ts` → seed **tasks** theo tháng/project/assignee (một phần status là `done`, phần còn lại mở).  
- `src/mock/kpi_tasks.ts` → `openTasksByStatus({year, project?, assignee?})` trả: tổng open, by_status, by_priority, danh sách quá hạn.

## API thật (đề xuất)
- `GET /kpis/open-tasks-by-status?year=&project=&assignee=` →
```jsonc
{
  "scope": "Project PRJ-A",
  "total_open": 123,
  "by_status": [{"key":"todo","count":45}, ...],
  "by_priority": [{"key":"high","count":30}, ...],
  "overdue_top": [{"code":"T-0001","title":"...", "project":"PRJ-A", "assignee":"lan", "status":"in_progress", "priority":"high", "due_date":"2025-05-12"}]
}
```
- Dữ liệu lấy từ **PM-03 Task Board** và **PM-05 My Tasks**; nên **cache** theo ngày.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
