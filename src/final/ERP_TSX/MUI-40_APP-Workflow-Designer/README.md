# MUI-40 — APP-01 Workflow_Designer (Mock‑Ready)

**Theo Catalog #40 (APP‑01)**  
UI **thiết kế workflow phê duyệt** dùng chung cho nhiều entity (Expense Claim, Purchase Request, Contract…). Cho phép tạo **các bước** (stage) theo thứ tự, gán **người duyệt** (role/user/dynamic), cấu hình **điều kiện áp dụng** per‑stage, **quy tắc ANY/ALL**, **SLA & Escalation**, hành vi **On Reject**, danh sách **Notify**, và **mô phỏng lộ trình** với payload thực tế. Hỗ trợ **Export/Import JSON**.

## Tính năng
- **Quản lý workflow**: tạo/xoá/lưu; đặt `entity_type`, bật/tắt `is_active`, **version**.  
- **Stage designer**: đặt tên, **điều kiện** (`left, op, right`), **approvers** (role/user/dynamic path như `requester.manager`), rule **ANY/ALL**, `SLA (hours)`, `Escalate to`, `On Reject`, `Notify`. **Sắp xếp** ↑/↓.  
- **Simulation**: nhập **payload JSON** (ví dụ `{ total, requester: { manager } }`) và chạy; hiển thị **bước bỏ qua/áp dụng**, **approvers đã resolve**, và **warnings**.  
- **Seed mặc định**: có sẵn mẫu cho `expense_claim` với 3 bước (Line Manager, Finance, Director).

## Data model (localStorage)
- Key `erp.app.workflows.v1` chứa `Workflow[]`:
```ts
type Workflow = {
  id, name, entity_type, version, is_active?,
  stages: Stage[], created_at, updated_at
}
type Stage = {
  id, name, entryCondition?, approvers: Approver[], approvalRule: 'any'|'all',
  slaHours?, escalateTo?, onReject: 'previous'|'terminate', notify?: string[]
}
```
- Hàm: `listWorkflows/getWorkflow/saveWorkflow/deleteWorkflow/exportWorkflow/importWorkflow/simulate`.

## Hợp đồng API thật (đề xuất)
- `GET/POST/PATCH/DELETE /workflows` (+ filter theo `entity_type`, `is_active`).  
- `POST /workflows/{id}:simulate` body `{ entity_type, payload }` trả route (áp dụng/skip, approvers resolved, warnings).  
- `POST /workflows/{id}:publish` tăng `version`, đánh dấu `is_active`.  
- **RBAC**: chỉ `Admin` mới sửa/publish; mọi module gọi `GET /workflows?entity_type=` để tra workflow active.  
- **Audit** (ADM‑06): log mọi thay đổi stage/rule/approver.

## Tích hợp
- **PROC‑** (Mua sắm), **FIN‑** (Expense/Payment), **CRM/PM** (Contracts/Change Requests) gọi `simulate` để xác định người duyệt & route.  
- **Notification**: bắn event `stage.enter/approve/reject/escalate` sang bus (Kafka/SNS) → email/chatbot.  
- **SLA**: tích hợp scheduler để theo dõi quá hạn và gọi `escalateTo`.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
