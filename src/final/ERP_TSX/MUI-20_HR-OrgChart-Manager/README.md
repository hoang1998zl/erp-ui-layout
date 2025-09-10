# MUI-20 — HR-06 OrgChart_Manager (Mock‑Ready)

**Theo Catalog #20 (HR-06)**  
**Sơ đồ tổ chức tương tác (Org Chart Manager)** dành cho **Admin/HR/CEO**: trái là **cây tổ chức** (mở/đóng, tìm kiếm, thao tác), phải là **Chi tiết đơn vị** và **biểu đồ theo tầng** (drill‑down theo node đang chọn). Hỗ trợ **Add/Move/Rename/Delete**, **Export/Import JSON**.

## Tính năng
- **Tree panel**: Expand/Collapse, **Search** theo tên/mã/quản lý (tự mở nhánh chứa kết quả), highlight hit, **Show codes** on/off.
- **CRUD**:
  - **Add child** vào đơn vị bất kỳ.
  - **Rename** (prompt), **Change parent (Move)** (nhập ID cha mới – demo, chặn move vào chính con cháu).
  - **Delete** (trừ root).
- **Details**: cập nhật **Name, Code, Manager, Headcount** (blur‑save).
- **Chart (subtree)**: hiển thị **mỗi tầng một hàng** (BFS) — click card để focus (drill‑down).
- **Export/Import JSON** để sao lưu/khởi tạo (không kiểm soát xung đột ID ở demo).
- `adapters` để gắn API thật; mock lưu **localStorage** (seed cấu trúc mẫu).

## API/Props
```ts
type OrgChartManagerProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getOrg: () => Promise<OrgNode>;
    addChild: (parentId: string, payload: { name: string; code?: string; manager?: string; headcount?: number; }) => Promise<OrgNode>;
    updateNode: (id: string, patch: Partial<Pick<OrgNode,'name'|'code'|'manager'|'headcount'>>) => Promise<OrgNode>;
    moveNode: (id: string, newParentId: string) => Promise<void>;
    deleteNode: (id: string) => Promise<void>;
    searchNodes: (q: string) => Promise<string[]>;
    exportJSON: () => Promise<string>;
    importJSON: (file: File) => Promise<OrgNode>;
  }>;
}
```

## Hợp đồng API thật (đề xuất)
- `GET /org/tree` → `OrgNode` (root với children đệ quy).
- `POST /org/units/{parentId}` → tạo child.
- `PATCH /org/units/{id}` → cập nhật `name/code/manager/headcount`.
- `POST /org/units/{id}:move` body `{ new_parent_id }` → move (validate **không** move vào descendant).
- `DELETE /org/units/{id}`.
- `GET /org/tree:search?q=` → `string[]` (ID trúng).
- `GET /org/tree:export` / `POST /org/tree:import` (JSON).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/admin/org-chart` trong App Shell (#1).
- Kế thừa **Department/Org Units** từ **ADM‑04 / #10 Department Tree** để đồng bộ danh mục và **RBAC mapping** (#8/#9).
- Dùng cấu trúc này để: route **Approvals**, **Timesheet approvals** (#17/#19), **Reporting** theo phòng ban; ghi **audit** khi thay đổi (**ADM‑06 #12**).
```
