# MUI-07 — ADM-01 User_Management (Mock‑Ready)

**Theo Catalog #7 (ADM-01)**  
Quản lý người dùng: **danh sách, tìm kiếm, lọc trạng thái/phòng ban, phân trang, tạo mới, sửa, kích hoạt/vô hiệu hóa, xóa, nhập CSV (stub), reset password (mock)**.

## Tính năng
- Toolbar: **Search** name/email/department, filter **Status** (All/Active/Inactive/Invited), filter **Department**, **Clear**.
- Actions theo hàng: **Edit**, **Activate/Deactivate**, **Delete**, **Reset password (mock)**.
- Modal **Add/Edit** người dùng (email, họ tên, phòng ban, chức danh); validate email, bắt trùng email.
- **Import CSV** (stub): file `.csv` header `email,full_name,department,title` → tạo user trạng thái `invited`.
- **Pagination** client side; `pageSize` props.
- Song ngữ cơ bản (labels VI/EN qua prop `locale`).

## API/Props
```ts
type UserManagementProps = {
  locale?: 'vi'|'en';                 // default 'vi'
  pageSize?: number;                  // default 20
  adapters?: {                        // override để nối API thật
    listUsers?: typeof listUsers;
    getDepartments?: typeof getDepartments;
    createUser?: typeof createUser;
    updateUser?: typeof updateUser;
    setUserStatus?: typeof setUserStatus;
    deleteUser?: typeof deleteUser;
    importCSV?: typeof importCSV;
  };
}
```
- **Contracts đề xuất API thật**:  
  - `GET /users?q&status&department&page&page_size` → `{ rows, total }`  
  - `POST /users` body `{ email, full_name, department?, title? }`  
  - `PATCH /users/{id}` body partial  
  - `POST /users/{id}/status` body `{ status }`  
  - `DELETE /users/{id}`  
  - `POST /users:import_csv` (multipart) → `{ inserted, skipped }`

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gắn vào App Shell (MUI‑01)
- Mount tại route **/admin/users**.  
- Sau khi có **ADM-02 RBAC_Matrix_Admin** (#8), có thể hiển thị **Roles** read‑only ở cột, và mở modal gán quyền từ **ADM-03** (#9).
