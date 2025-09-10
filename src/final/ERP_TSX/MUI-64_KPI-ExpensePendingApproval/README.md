
# MUI-64 — KPI-04 KPI_ExpensePendingApproval (Mock‑Ready)

**Theo Catalog #64 (KPI‑04)**  
Widget **Chi phí chờ duyệt** cho **Finance** — phụ thuộc **FIN‑10** (Expense Approval) và **APP‑03** (Approvals Inbox).

## Tính năng
- **Bộ lọc**: Năm, **Approver**, **Cost Center**, **Min amount (VND)**.  
- **Chỉ số**: 
  - **Total pending** (# hồ sơ), **Amount pending** (VND), **Avg age / Max age (days)**.  
  - **Distribution by pending age**: `0–3`, `4–7`, `8–14`, `15–30`, `>30` (biểu đồ cột).  
  - **Breakdown**: theo **Cost Center** và **Requester** (top).  
- **Danh sách Top 50** pending (sắp theo **Amount desc**): code, title, requester, approver, CC, project, **total_amount**, **age_days**, submitted_at.  
- **Hành động (mock)**: **Approve / Reject** → cập nhật localStorage (clear approver).  
- **Export CSV** danh sách.

## Mock data
- `src/mock/expense_pending.ts` → seed **expenses** với dòng chi tiết (category/amount/tax), trạng thái `pending|approved|rejected`, các trường `created_at/submitted_at/approved_at/rejected_at`, `approver`, `requester`, `cost_center`, `project`.  
- `src/mock/kpi_expense_pending.ts` → `expensePendingKPI({year, approver?, cost_center?, min_amount?})` trả thống kê + danh sách.

## API thật (đề xuất)
- `GET /kpis/expense-pending-approval?year=&approver=&cost_center=&min_amount=` →
```jsonc
{
  "scope":"Approver finance01",
  "total_pending": 42,
  "amount_pending": 123456789,
  "avg_age_days": 5.3,
  "median_age_days": 4,
  "max_age_days": 19,
  "buckets_by_age":[{"label":"0–3","count":10,"amount":12345}, ...],
  "by_cost_center":[{"key":"OPS","count":12,"amount":...}], 
  "by_requester":[{"key":"lan","count":5,"amount":...}],
  "list":[{"code":"EXP-00001","title":"...", "requester":"lan","approver":"finance01","cost_center":"OPS","project":"PRJ-A","total_amount":123456,"age_days":7,"submitted_at":"2025-05-12"}]
}
```
- Hành động: `POST /fin/expenses/{code}:approve`, `POST /fin/expenses/{code}:reject` (ghi **audit log**, cập nhật **APP‑03**).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
