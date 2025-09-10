# MUI-30 — PM-07 Team_Assignment_DnD (Mock‑Ready)

**Theo Catalog #30 (PM‑07)**  
UI **kéo‑thả** để **gán/đổi vai trò thành viên dự án**: **Owner (1)**, **Manager(s)**, **Member(s)** (có **allocation %**). Đọc/ghi trực tiếp `project.team` trong `erp.pm.projects.v1` (PM‑01).

## Tính năng
- **Pool** nhân sự bên trái (filter **Search/Department**, chỉ hiển thị người **chưa** trong team).  
- **Roles** bên phải:  
  - **Owner** (tối đa 1, UI tự enforce).  
  - **Manager(s)** (nhiều; tuỳ policy RBAC).  
  - **Members** (nhiều) với **allocation %**.  
- **Drag&Drop** từ **Pool → Role** để gán; kéo **Role → Pool** để gỡ.  
- **Save** cập nhật vào `project.team`; **Export CSV** danh sách team.
- **Seed dữ liệu** (demo): nếu chưa có **Employees/Projects** thì tự tạo mẫu để chạy ngay.

## Mock API (localStorage)
- `listEmployees({ search?, active_only?, department? })` → danh sách pool.  
- `listProjects()` → chọn Project.  
- `getTeam(project_id)` / `saveTeam(project_id, team)` → bind `project.team`.  
- `normalizeTeam(team)` → đảm bảo **duy nhất 1 Owner**.  
- `exportCSV(project_id)`.

## Hợp đồng API thật (đề xuất)
- `GET /projects` → chọn project.  
- `GET /directory/employees?active=true&search=&department=`  
- `GET /projects/{id}/team` → `[ { employee_id, role, allocation_pct } ]`  
- `PUT /projects/{id}/team` → cập nhật team (server enforce **1 Owner**, validate RBAC).  
- **Audit log** (ADM‑06): ghi lại thay đổi team; **notifications** (APP‑02): ping người được thêm.  
- **Policy**: chặn PM tự rời team nếu là **Owner** mà chưa chuyển giao.

## Tích hợp
- Được mở từ **PM‑01 Project Creation** (bước Team) hoặc **PM‑02 Project List → Edit**.  
- **PM‑03/04/06** có thể đọc team để hiển thị **Assignee** mặc định, danh sách watcher, v.v.  
- Đồng bộ với **HR** để ẩn nhân sự **inactive**.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
