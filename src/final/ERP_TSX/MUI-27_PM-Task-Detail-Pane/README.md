# MUI-27 — PM-04 Task_Detail_Pane (Mock‑Ready)

**Theo Catalog #27 (PM‑04)**  
**Slide‑over Task Detail Pane** với **inline edit** + **Subtasks** + **Comments** + **Attachments**. Dùng chung dữ liệu `Tasks` từ PM‑03 (`erp.pm.tasks.v1`).

## Tính năng
- **Overview (inline)**: sửa **Title**, **Description**, **Status**, **Priority**, **Assignee**, **Due date**, **Estimate/Logged hours**, **Labels** (comma). Tự lưu khi blur/thay đổi (**patch**).
- **Subtasks**: thêm/sửa/đánh dấu hoàn tất/xoá; **đổi thứ tự** (↑/↓). Lưu theo `task_id`.
- **Comments**: thêm/xoá; hiển thị theo thời gian. (Có thể mở rộng `@mention`/emoji sau.)
- **Attachments**: upload (demo tạo `blob:URL`), mở, xoá. Gợi ý dùng **EIM‑02** để lưu file thật, UI chỉ giữ metadata + link.
- **Header** hiển thị màu theo trạng thái; footer hiển thị **Updated at**.

## Mock API (localStorage)
- `getTask(id)` / `updateTask(id, patch)`
- `listEmployees({ active_only:true })` / `listProjects()`
- `listSubtasks(task_id)` / `upsertSubtask(task_id, payload)` / `reorderSubtasks(task_id, orderedIds)` / `deleteSubtask(task_id)`
- `listComments(task_id)` / `addComment(task_id, author, body)` / `deleteComment(task_id)`
- `listAttachments(task_id)` / `addAttachment(task_id, file)` / `deleteAttachment(task_id)`

Lưu vào các key:  
`erp.pm.task.subtasks.v1`, `erp.pm.task.comments.v1`, `erp.pm.task.attach.v1`.

## Hợp đồng API thật (đề xuất)
- `GET /tasks/{id}` → Task  
- `PATCH /tasks/{id}` body `{ title?, description?, status?, priority?, assignee_id?, due_date?, estimate_hours?, logged_hours?, labels? }`
- `GET /tasks/{id}/subtasks` / `POST /tasks/{id}/subtasks` / `PUT /tasks/{id}/subtasks/{sid}` / `DELETE /tasks/{id}/subtasks/{sid}` / `POST /tasks/{id}/subtasks:reorder`
- `GET /tasks/{id}/comments` / `POST /tasks/{id}/comments` / `DELETE /tasks/{id}/comments/{cid}`
- `GET /tasks/{id}/attachments` / `POST /tasks/{id}/attachments` (upload via **EIM-02**) / `DELETE /tasks/{id}/attachments/{aid}`
- **Webhook/Rule** (APP‑03): khi `status` chuyển **review → done** hoặc `assignee_id` đổi → phát sự kiện cho Engine phê duyệt/thông báo.

## Tích hợp
- Mở từ **PM‑03 Kanban** khi click thẻ.  
- Bấm **upload** gọi sang **EIM‑02** để tải tệp lên kho tài liệu (SharePoint/S3/MinIO), trả về URL + metadata.  
- **Audit log** (ADM‑06 #12) khi patch task.  
- **Notifications**: gửi @Assignee / @Watcher khi có comment mới hoặc đổi trạng thái.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
