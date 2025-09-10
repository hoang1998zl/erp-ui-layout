
# MUI-54 — FIN-10 Expense_Approval (Mock‑Ready)

**Theo Catalog #54 (FIN‑10)**  
Bảng điều khiển **duyệt chi phí** cho **Finance Manager**. Luồng: **Pending (submitted) → Approved / Rejected**. *Post to GL* sẽ thực hiện ở bước sau.

## Tính năng
- **Tab**: Pending / Approved / Rejected / All (hiển thị **counts**).  
- **Filters**: Employee, Project, Date range, Search (Title/Dept/Emp).  
- **Chọn nhiều** + **Bulk Approve/Reject** với **Decision comment** (tuỳ chọn).  
- **Bảng**: checkbox, Date, Title, Employee, Project, Currency, Amount, Status chip, Actions (Approve/Reject/View).  
- **Drawer chi tiết**: header info + bảng **Lines** (category, desc, project, amount, tax%, receipt preview) + **Total** + **Decision comment** + **Approve/Reject**.  
- **Export CSV** theo bộ lọc hiện tại.

## Mock storage & helpers
- Tái dùng `localStorage["erp.fin.expense.drafts.v1"]` từ **FIN‑08/09**.  
- Bổ sung helpers trong `src/mock/expense.ts`:  
  - `approvalStatusOf`, `setApproval`, `approveExpense`, `rejectExpense`, `bulkApprove`, `bulkReject`, `listForApproval`, `amountGross`.
- **Status**: `'submitted'` (pending), `'approved'`, `'rejected'`. (Giữ tương thích với FIN‑08/09.)

## API thật (đề xuất)
- `GET /fin/expenses?status=submitted|approved|rejected&...`  
- `POST /fin/expenses/{id}:approve` `{ decided_by, comment }`  
- `POST /fin/expenses/{id}:reject` `{ decided_by, comment }`  
- **Audit** (ADM‑06) cho approve/reject; **Posting**: sau khi `approved`, trigger `POST /gl/postings:from_expense?id=...` (batch).

## Bảo mật & quyền
- **RBAC** (ADM‑02): chỉ **Finance Manager** mới thấy tab Pending/Approve/Reject; nhân viên thấy **của mình** (read-only).  
- **PII**: ảnh hoá đơn cần che thông tin nhạy cảm khi export/chia sẻ ngoài hệ thống.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
