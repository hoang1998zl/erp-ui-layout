# MUI-26 — PM-03 Task_Kanban_Board (Mock‑Ready)

**Theo Catalog #26 (PM‑03)**  
Bảng **Kanban** quản lý công việc theo trạng thái với **kéo‑thả**, **Swimlanes**, **WIP limits**, **bộ lọc**, **quick add**, **edit/delete**, và **Export CSV**.

## Tính năng chính
- **Cột trạng thái**: Backlog / To do / In progress / Review / Done. Đếm số thẻ và hiển thị **WIP** (ví dụ: In progress=5, Review=3 mặc định). Màu cảnh báo khi vượt.
- **Kéo‑thả (DnD)** thẻ giữa các cột. Tuỳ chọn **Hard WIP** để **chặn** kéo nếu vượt limit.
- **Swimlanes**: None / **By Assignee** / **By Priority** / **By Project** (lưới 2D hàng‑cột).
- **Bộ lọc**: Search, Assignee, Project, Priority, Due date (from/to).
- **Thẻ**: Title, Assignee, Project, Due (đỏ nếu quá hạn), Estimate h / Logged h, Priority tag; nút **Edit/Delete**.
- **Quick add**: thêm thẻ vào cột (prompt demo). **Edit** mở prompt demo; có `upsertTask` để gắn form thật sau này.
- **Board config**: lưu **Swimlane** + **WIP limits** + **Hard WIP** vào `localStorage` (persist sau reload).
- **Export CSV** theo bộ lọc hiện tại.
- **Adapters** (qua mock API) sẵn sàng thay bằng backend thật.

## Mock API
- `listTasks(q)` / `moveTask(taskId, toStatus, newOrder?)`  
- `upsertTask(payload)` / `deleteTask(id)`  
- `listEmployees({ active_only:true })` / `listProjects()`  
- `getBoardConfig()` / `saveBoardConfig(cfg)`  
- `exportCSV(q)`

Dữ liệu seed ~40 task (đọc danh bạ **HR‑07**; dự án **PM‑01** nếu có).

## Hợp đồng API thật (đề xuất)
- `GET /tasks?search=&status=&assignee_id=&project_id=&priority=&due_from=&due_to=&limit=&offset=` → `{ rows:[Task], total }`
- `POST /tasks` / `PUT /tasks/{id}` / `DELETE /tasks/{id}`
- `POST /tasks/{id}:move` body `{ to_status }` (ghi **audit**, validate **WIP** server‑side)
- `GET /tasks:export` (CSV)
- `GET /directory/employees?active=true` / `GET /projects`  
- `GET/PUT /settings/kanban` để lưu **BoardConfig** theo người dùng.
- **WIP policy**: server nên kiểm tra và trả lỗi nếu vượt; client bật **Hard WIP** để chặn UI sớm.

## Tích hợp
- **PM‑05/06/07**: phê duyệt task/PRD/CR? (tuỳ định nghĩa). Khi move sang **Review** → tạo **approval request**.  
- **Timesheet**: bấm vào thẻ có thể mở log thời gian (tích hợp sau).  
- **Notifications**: @Assignee khi thẻ được giao / quá hạn.  
- **Reporting**: đo **lead time / cycle time** mỗi cột; cảnh báo **WIP**.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
