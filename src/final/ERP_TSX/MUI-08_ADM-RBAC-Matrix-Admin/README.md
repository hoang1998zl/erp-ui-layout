# MUI-08 — ADM-02 RBAC_Matrix_Admin (Mock‑Ready)

**Theo Catalog #8 (ADM-02)**  
Quản trị **vai trò × quyền (RBAC)** dạng ma trận: tạo/sửa/xóa vai trò, bật/tắt quyền theo **ô** hoặc **theo nhóm**, thống kê số quyền mỗi vai trò, **export/import JSON**.

## Tính năng chính
- **Matrix** hàng = quyền (nhóm theo module), cột = vai trò; cell là checkbox.
- Hàng **nhóm** có checkbox **Select all / Indeterminate** để bật/tắt toàn bộ quyền trong nhóm cho từng vai trò.
- **Role panel** (trái): danh sách vai trò, **Add / Rename / Enable/Disable / Delete** (khóa xóa với vai trò built-in).
- **Tìm kiếm** theo nhãn/khóa quyền; **lọc theo nhóm**.
- **Export/Import JSON** toàn bộ cấu hình RBAC (roles, permissions, assignments).
- Song ngữ nhãn VI/EN (prop `locale`).

## API/Props
```ts
type RBACMatrixAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listPermissions?: () => Promise<Permission[]>;
    listRoles?: () => Promise<Role[]>;
    listGroups?: () => Promise<string[]>;
    getAssignments?: () => Promise<Record<string,string[]>>;
    setAssignment?: (roleId: string, permKey: string, allowed: boolean) => Promise<void>;
    setGroupForRole?: (roleId: string, group: string, allowed: boolean) => Promise<void>;
    createRole?: (input:{name:string,description?:string}) => Promise<Role>;
    updateRole?: (id:string, patch:Partial<Role>) => Promise<Role>;
    deleteRole?: (id:string) => Promise<void>;
    exportJSON?: () => Promise<string>;
    importJSON?: (file: File) => Promise<void>;
  }
}
```
- Mặc định dùng **mock adapter** (`src/mock/rbac.ts`). Khi có API thật, truyền `adapters` để override (không đổi UI).

## Hợp đồng API thật (đề xuất)
- `GET /rbac/permissions` → `Permission[]`
- `GET /rbac/roles` → `Role[]`
- `GET /rbac/assignments` → `{ [roleId]: string[] }`
- `POST /rbac/roles` / `PATCH /rbac/roles/{id}` / `DELETE /rbac/roles/{id}`
- `POST /rbac/assignments` body `{ role_id, perm_key, allowed }`
- `POST /rbac/assignments:group` body `{ role_id, group, allowed }`
- `GET /rbac:export` → JSON; `POST /rbac:import` (multipart)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gắn với **ADM-01 User_Management (MUI‑07)**
- Trang Users hiển thị cột **Roles** (read‑only) và nút “Assign Roles” (MUI‑09). 
- Toàn bộ kiểm tra quyền trong App Shell/Router dựa trên RBAC này (guard theo `can(action, resource)`).
