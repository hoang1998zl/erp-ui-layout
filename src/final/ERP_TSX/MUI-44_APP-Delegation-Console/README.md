
# MUI-44 — APP-05 Delegation_Console (Mock‑Ready)

**Theo Catalog #44 (APP‑05)**  
Bảng điều khiển **uỷ quyền phê duyệt**: quản lý rule ủy quyền theo **user/role**, **thời gian**, và **phạm vi** (entity/stage/project). Hỗ trợ **tạo/sửa/xoá**, **bật/tắt**, **kiểm tra xung đột**, và **mô phỏng** để xem rule nào áp dụng. Khi khớp, rule **override routing** để giao nhiệm vụ cho `delegate_to` thay vì `principal`.

## Tính năng
- **Danh sách rule**: hiển thị Principal → Delegate, Scope, Time window, Priority, Status (**ACTIVE/UPCOMING/EXPIRED**). Tìm kiếm theo principal/delegate/scope.  
- **Trình soạn**: chọn **principal (user/role)**, **delegate_to (user/role)**, nhập **time window**, **scope** (entity_types, stages, projects), **priority, reason, notify**.  
- **Kiểm tra xung đột**: phát hiện rule trùng principal + trùng khoảng thời gian + scope chồng lấn.  
- **Mô phỏng (Simulate)**: nhập `userId/roles`, `entity_type/stage_name`, thời điểm → trả **delegate** (nếu có), rule match và các **candidates**.  
- **Nguyên tắc ưu tiên**: **user** > **role**; **scope hẹp** > rộng; **priority** cao thắng.

## Mock API & Storage
- Key: `erp.app.delegations.v1` chứa `DelegationRule[]`.  
- API: `listRules/saveRule/deleteRule/newRule/resolveDelegate/checkConflicts/hrIsOOO`.  
- Seed: có 2 rule mẫu (user→user và role→user).

## Hợp đồng API thật (đề xuất)
- `GET/POST/PATCH/DELETE /delegations` (paging, search).  
- `POST /delegations:resolve` body `{ principal:{userId,roles[]}, task:{entity_type,stage_name,project_id,at} }` ⇒ `{ to, rule, candidates }`.  
- **Precedence** Backend: giống logic mock; trả kèm **explain/log** để debug.  
- **Integration**:  
  - **APP‑03 Inbox**: thêm filter “delegated to me”; backend đã resolve từ trước.  
  - **APP‑01 Workflow**: khi route approver, gọi `resolve` để thay thế principal.  
  - **HR‑09**: đồng bộ lịch OOO/Leave → có thể **auto tạo** rule tạm với `start_at/end_at`.  
  - **ADM‑06**: audit create/update/delete và **hit‑log** mỗi lần rule áp dụng.

## Bảo mật
- Chỉ **Admin** được tạo/sửa/xoá rule.  
- Ghi **audit log** và yêu cầu **mô tả lý do** cho mỗi thay đổi.  
- Hạn chế `delegate_to` không được trỏ ngược về chính mình để tránh vòng lặp.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
