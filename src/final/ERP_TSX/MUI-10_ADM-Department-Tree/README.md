# MUI-10 — ADM-04 Department_Tree (Mock‑Ready)

**Theo Catalog #10 (ADM-04)**  
Sơ đồ phòng ban dạng **tree** với **CRUD**, **kéo‑thả** để **di chuyển** node, **reorder** thứ tự anh em, **tìm kiếm**, và **import/export JSON**.

## Tính năng
- Tree 2-pane: trái là danh sách phòng ban (mở/thu toàn bộ, tìm kiếm theo tên/mã, thêm cấp 1), phải là **Details** (Name/Code/Head) với nút **Save**.
- Node actions: **Add child**, **Rename**, **Delete** (chặn xóa nếu còn con), **↑/↓** để đổi thứ tự.
- **Drag & drop**: kéo node rồi thả **lên node khác** để di chuyển thành **con** của node đó. (Reorder cùng cấp có thể dùng ↑/↓ hoặc mở rộng để thả vào node cha).
- **Import/Export JSON** toàn bộ cấu trúc (giữ `id`, `parent_id`, `order`, `code`, `head`).

## API/Props
```ts
type DepartmentTreeAdminProps = {
  locale?: 'vi'|'en';
  adapters?: {
    listTree?: () => Promise<Dept[]>;
    getById?: (id:string) => Promise<Dept|undefined>;
    createDept?: (input:{ name:string; code?:string; head?:string; parent_id:string|null }) => Promise<Dept>;
    updateDept?: (id:string, patch: Partial<Dept> & { parent_id?: string|null }) => Promise<Dept>;
    deleteDept?: (id:string) => Promise<void>;
    moveDept?: (id:string, targetParent:string|null, index?:number) => Promise<void>;
    reorderSibling?: (id:string, direction:'up'|'down') => Promise<void>;
    exportJSON?: () => Promise<string>;
    importJSON?: (file: File) => Promise<void>;
  };
}
```
- Mặc định dùng mock trong `src/mock/departments.ts`. Khi có API thật, chỉ cần override `adapters` (UI giữ nguyên).

## Hợp đồng API thật (đề xuất)
- `GET /departments:tree` → `Dept[]` (nested)
- `GET /departments/{id}` → `Dept`
- `POST /departments` body `{ name, code?, head?, parent_id? }`
- `PATCH /departments/{id}` body `{ name?, code?, head?, parent_id? }`
- `DELETE /departments/{id}` (chặn khi có con)
- `POST /departments/{id}:move` body `{ parent_id, index? }`
- `GET /departments:export` / `POST /departments:import` (multipart)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount vào route **/admin/departments** trên App Shell (#1).
- Kết nối **Role_Assignment (#9)**: dùng danh mục phòng ban ở cột “Department roles” (gán role theo dept).
- **OrgChart_Manager (HR‑06)** sau này có thể dùng cùng nguồn dữ liệu để hiển thị sơ đồ tổ chức trực quan.
