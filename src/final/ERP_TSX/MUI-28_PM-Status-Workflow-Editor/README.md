# MUI-28 — PM-05 Status_Workflow_Editor (Mock‑Ready)

**Theo Catalog #28 (PM‑05)**  
Biên tập **trạng thái & workflow** theo **dự án** (hoặc **Default**), cho phép tạo **danh mục trạng thái tuỳ biến**, **WIP**, **màu**, **đặt mặc định**, **ma trận chuyển tiếp**, và **map** về 3 nhóm **todo / in_progress / done** (phục vụ báo cáo & SLA).

## Tính năng
- **Scope**: chọn **Project** hoặc **Default (fallback)**.  
- **Statuses**: thêm/sửa/xoá, **đổi thứ tự** (↑/↓), đặt **nhóm 3 trạng thái** (todo/in_progress/done), **màu**, **WIP limit**, **default for new task**.  
- **Transitions**: **ma trận** cho phép chuyển từ A→B (bật/tắt). Gợi ý bật **Any → Done**.  
- **Preview**: xem bố cục cột theo thứ tự & WIP; hiển thị nhóm 3 trạng thái.  
- **Advanced rules**: bắt buộc **comment khi chuyển sang Done**, **lock edit sau Done**; **Remap** task hiện có theo workflow mới (demo).  
- **Suggest from Tasks**: tự gợi ý danh sách status từ dữ liệu task hiện hữu (PM‑03), tự map sang nhóm 3 trạng thái & đề xuất màu/WIP.

## Mock API (localStorage)
- `getWorkflow(project_id?)` / `saveWorkflow(wf)` lưu tại `erp.pm.workflows.v1` (Map).  
- `suggestFromTasks(project_id?)` đọc từ `erp.pm.tasks.v1`.  
- `migrateTaskStatuses(project_id, mapping)` (tuỳ chọn, demo).  
- `listProjects()` đọc danh sách dự án từ `erp.pm.projects.v1` (PM‑01).

## Hợp đồng API thật (đề xuất)
- `GET /pm/workflows?project_id=` → trả workflow (fallback default).  
- `PUT /pm/workflows` body `Workflow`.  
- `POST /pm/workflows:derive_from_tasks` → gợi ý status từ task hiện có.  
- **Policy**: validate **Transitions** (không tạo “đảo chết”), đảm bảo có **exactly 1 default**.  
- Kanban (PM‑03) & Task detail (PM‑04) đọc workflow để render **cột** & **dropdown Status**; server enforce transition ở `POST /tasks/{id}:move`.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
