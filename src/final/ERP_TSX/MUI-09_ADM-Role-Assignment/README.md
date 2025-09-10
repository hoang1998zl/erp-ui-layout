# MUI-09 — ADM-03 Role_Assignment (Mock‑Ready)

**Theo Catalog #9 (ADM-03)**  
Màn gán **vai trò cho người dùng** và **vai trò theo phòng ban** (kế thừa). Xem **quyền hiệu lực** từ RBAC (#8). Hỗ trợ **import/export JSON** cấu hình gán.

## Tính năng
- Pane trái: danh sách Users (tìm kiếm, lọc phòng ban).
- Pane giữa: hai cột **Direct roles** (gán cho user) và **Department roles** (gán cho phòng ban của user).  
  → Quyền hiệu lực = hợp của 2 loại vai trò.
- Pane phải: **Effective permissions** — tổng số quyền, danh sách role hiệu lực, liệt kê chìa khóa quyền (từ RBAC assignments).
- Import/Export JSON cho toàn bộ gán (userRoles, deptRoles).

## API/Props
```ts
type RoleAssignmentAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listUsers?: () => Promise<User[]>;
    getDepartments?: () => Promise<string[]>;
    listRoles?: () => Promise<Role[]>;
    listPermissions?: () => Promise<Permission[]>;
    getAssignments?: () => Promise<Record<string,string[]>>;           // RBAC: roleId -> perm keys
    getUserRoles?: () => Promise<Record<string,string[]>>;             // userId -> roleIds
    setUserRole?: (userId:string, roleId:string, allowed:boolean) => Promise<void>;
    getDeptRoles?: () => Promise<Record<string,string[]>>;             // dept -> roleIds
    setDeptRole?: (dept:string, roleId:string, allowed:boolean) => Promise<void>;
    exportAssignments?: () => Promise<string>;
    importAssignments?: (file: File) => Promise<void>;
  };
}
```
- Các adapter mặc định dùng **mock** trong `src/mock/*` để chạy ngay. Khi nối API thật, chỉ cần override các hàm trên.

## Hợp đồng API thật (đề xuất)
- `GET /users` → `User[]` + `GET /departments` → `string[]`
- `GET /rbac/roles` → `Role[]`, `GET /rbac/assignments` → `{ [roleId]: string[] }`
- `GET /roles/assignments/users` → `{ [userId]: roleIds[] }`
- `POST /roles/assignments/users` body `{ user_id, role_id, allowed }`
- `GET /roles/assignments/departments` → `{ [dept]: roleIds[] }`
- `POST /roles/assignments/departments` body `{ department, role_id, allowed }`
- `GET /roles/assignments:export` → JSON; `POST /roles/assignments:import` (multipart)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gắn với các MUI liên quan
- **ADM-01 User_Management (#7):** thêm nút “Assign Roles” mở màn này theo `userId` đã chọn.
- **ADM-02 RBAC_Matrix_Admin (#8):** bảng quyền được lấy từ RBAC; thay đổi RBAC sẽ cập nhật ngay phần **Effective permissions**.
- **AppShell guard:** dùng `effectivePermKeys` để tính `can()`; lưu ý cache theo user + invalidate khi đổi gán/đổi RBAC.
