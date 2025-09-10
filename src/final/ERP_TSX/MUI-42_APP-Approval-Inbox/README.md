# MUI-42 — APP-03 Approval_Inbox (Mock‑Ready)

**Theo Catalog #42 (APP‑03)**  
UI **Hộp thư phê duyệt hợp nhất** cho Manager/Finance… gom tất cả yêu cầu cần duyệt (Expense, PR, Contract, Invoice…). **Sắp xếp theo SLA** mặc định, hỗ trợ **bulk approve/reject**, **delegate**, **comment**, **detail drawer** xem dữ liệu yêu cầu.

## Tính năng
- **Bộ lọc**: Search (ID/Title/Requester/Stage), Entity type, Status, Role (assigned_to).  
- **Sắp xếp**: **SLA** (thời gian còn lại/overdue), Created, Amount (↑/↓).  
- **Danh sách**: thẻ từng yêu cầu hiển thị: EntityID, Title, EntityType, Stage, Amount, Requester, Created, **SLA pill** (màu: **đỏ** quá hạn, **vàng** <8h, **xanh** ≥8h), AssignedTo, Status.  
- **Hành động**: Approve, Reject (có lý do), Delegate (người nhận + note), Comment; **Bulk approve/reject** cho các mục đang chọn.  
- **Chi tiết**: **Drawer** bên phải: Summary (Requester/Stage/Rule/Amount/Created/SLA/Assigned), **Request data** (JSON), **Comments**.

## Mock API & Storage
- Key: `erp.app.approvals.v1` chứa `ApprovalTask[]`.  
- API: `listTasks({q,status,entity_type,role,sort,asc})`, `approve(id,comment?)`, `reject(id,reason)`, `delegate(id,to,note?)`, `comment(id,text)`, `bulkApprove(ids,comment?)`, `bulkReject(ids,reason)`, `timeLeftText(due_at)`.
- `seedIfEmpty()` tạo mẫu đa entity.

## Hợp đồng API thật (đề xuất)
- `GET /approvals?filters` (paging & sort), `POST /approvals/{id}:approve`, `POST /approvals/{id}:reject`, `POST /approvals/{id}:delegate`, `POST /approvals/{id}:comment`.  
- **SLA**: backend trả `due_at`/`remaining_ms` chuẩn hoá timezone (Asia/Ho_Chi_Minh).  
- **Security**: chỉ gửi về những item user được quyền duyệt; **idempotent** action; **auditable** (ADM‑06).  
- **Realtime**: WebSocket/Server‑Sent Events để **push** item mới/đổi trạng thái.  
- **Bulk**: `/approvals:bulk` với transaction & partial failure report.

## Tích hợp
- **APP‑01 Workflow_Designer**: nguồn tạo ra **stage** + SLA/escalation; inbox chỉ là UI thực thi.  
- **Notification**: khi có item mới/hết SLA → push thông báo, kèm deep‑link đến drawer.  
- **Entities**: Expense/PR/Contract/Invoice… gắn link “Open record” để xem bản ghi chi tiết trong module gốc.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
