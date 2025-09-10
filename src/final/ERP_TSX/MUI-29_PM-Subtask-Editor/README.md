# MUI-29 — PM-06 Subtask_Editor (Mock‑Ready)

**Theo Catalog #29 (PM‑06)**  
Trình **quản lý Subtask lồng N cấp**: thêm/sửa/xoá, **indent/outdent**, **reorder**, gán **assignee**, **due date**, **estimate hours**; thanh **tiến độ %** và tổng giờ ước tính; **Bulk add**, **Import/Export JSON**; **migrate** từ Subtasks phẳng (PM‑04).

## Tính năng
- **Cây Subtasks**: hiển thị dạng tree, **N cấp**.  
- **CRUD nhanh**: Add root/child; sửa **title** inline; **checkbox** done (cascade con/cha hợp lý); **delete** xoá cả nhánh.  
- **Sắp xếp**: **Up/Down**, **Indent** (thành con của mục trước), **Outdent** (lên cấp trên).  
- **Thuộc tính**: **Assignee**, **Due**, **Estimate (h)**, tổng giờ và % hoàn tất.  
- **Bulk add**: dán danh sách (dùng **tab** hoặc **2 spaces** để thụt cấp).  
- **Import/Export JSON**: cấu trúc `[ { title, done, estimate_hours, children:[...] }, ... ]`.  
- **Migrate từ PM‑04**: đọc `erp.pm.task.subtasks.v1` (flat) → tạo cây top-level (giữ thứ tự).

## Mock API & Storage (localStorage)
- **Keys**:  
  - `erp.pm.task.subtree.v1` — `Map<task_id, SubNode[]>` (mỗi `SubNode` có `parent_id`, `order`).  
  - `erp.pm.task.subtasks.v1` — dữ liệu flat từ PM‑04 (để migrate).  
  - `erp.dir.emps.v1` — danh bạ nhân sự (Assignee).  
- **APIs**:  
  - `listTree(task_id)` → `TreeNode[]`  
  - `upsertNode(task_id, payload)`  
  - `deleteNode(task_id, id)`  
  - `reorderUp/Down(task_id, id)` / `indentNode(task_id, id)` / `outdentNode(task_id, id)`  
  - `toggleDone(task_id, id, done)` (cascade hợp lý)  
  - `bulkAdd(task_id, text)` / `importJSON(task_id, json)` / `exportJSON(task_id)`  
  - `migrateFromFlat(task_id)`

## Hợp đồng API thật (đề xuất)
- `GET /tasks/{id}/subtasks?format=tree` → `[TreeNode]`  
- `POST /tasks/{id}/subtasks` (add)  
- `PATCH /tasks/{id}/subtasks/{sid}` (update fields)  
- `DELETE /tasks/{id}/subtasks/{sid}` (delete node + descendants)  
- `POST /tasks/{id}/subtasks/{sid}:move` body `{ parent_id, order }` (server re‑number siblings)  
- `POST /tasks/{id}/subtasks:bulk` body `{ text }` (optional)  
- `GET /directory/employees?active=true` để bind **Assignee**.

## Tích hợp
- Mở từ **PM‑04 Task Detail** tab **Subtasks** (thay list phẳng bằng Subtask_Editor).  
- Khi **Done** cả nhánh, UI có thể tự động check cha; khi **Uncheck** nhánh con, bỏ check cha.  
- Áp dụng **RBAC**: chỉ PM/Assignee mới được sửa. **Audit log** khi thay đổi.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
