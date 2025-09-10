
# MUI-43 — APP-04 Approval_Request_Detail (Mock‑Ready)

**Theo Catalog #43 (APP‑04)**  
UI **chi tiết yêu cầu phê duyệt**: hiển thị **Summary** (requester, stage, amount, SLA, assigned), **dữ liệu yêu cầu (payload)**, **bình luận**, và **Timeline** hành động (submitted/routed/approved/rejected/delegated/comment…). Có **nút hành động**: Approve, Reject (lý do), Delegate, gửi Comment. Nhận `taskId` qua **query param** hoặc chọn trong combobox.

## Tính năng
- **Header**: Status pill, **SLA** (màu: xanh ≥8h, vàng <8h, đỏ quá hạn), EntityID/Title, Requester, Stage(rule), Amount, Created, Assigned.  
- **Tabs**:  
  - **Summary**: JSON payload + Comments (thêm comment).  
  - **Timeline**: log sự kiện với màu theo loại.  
  - **Attachments** *(stub)*: sẽ nối EIM‑01/EIM‑03.  
  - **Audit** *(stub)*: sẽ nối ADM‑06.  
- **Actions**: Approve / Reject / Delegate / Comment → cập nhật **task** và ghi **timeline event** tương ứng.  
- **Sidebar**: SLA & Status, Participants, Links (open record / view timeline).

## Mock API & Storage
- `erp.app.approvals.v1` — `ApprovalTask[]` (dùng chung với APP‑03).  
- `erp.app.approvals.timeline.v1` — `{ [taskId]: TimelineItem[] }`.  
- API mock: `getTask/saveTask/approve/reject/delegateTo/addComment/timeLeftText`, `listTimeline/saveTimeline/addEvent` (logApproved/logRejected/logDelegated/logComment), `seedIfEmpty/seedTimelineIfEmpty`.

## Hợp đồng API thật (đề xuất)
- `GET /approvals/{id}` (summary + payload), `GET /approvals/{id}/timeline`, `POST /approvals/{id}:approve|reject|delegate|comment`.  
- **Timeline**: chuẩn hóa `type/by/at/message/meta`; hỗ trợ **paging** & **server time** (Asia/Ho_Chi_Minh).  
- **Security/Audit**: mọi action log vào audit (ADM‑06), idempotent, RBAC.

## Tích hợp
- Mở từ **APP‑03 Approval_Inbox** (deep‑link `?taskId=`).  
- **Modules**: Expense/PR/Contract… mở bản ghi gốc (link).  
- **Notification**: click từ email/chat → deep‑link tới UI này.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
