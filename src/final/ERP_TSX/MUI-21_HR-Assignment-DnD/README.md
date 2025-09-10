# MUI-21 — HR-07 HR_Assignment_DnD (Mock‑Ready)

**Theo Catalog #21 (HR-07)**  
UI **kéo‑thả** để **gán nhân sự vào phòng ban**. Bố cục 2‑pane: trái **danh sách nhân sự** (search, multi‑select, kéo‑thả/assign, unassign), phải **cây phòng ban** (drop vào node để gán) kèm **Lịch sử (history trail)** phía dưới. 

## Tính năng
- **Drag & Drop**: kéo 1 hoặc nhiều nhân sự (giữ **Shift** để kéo theo danh sách đã chọn) và **thả vào** node phòng ban → gán. 
- **Bulk actions**: Unassign, Assign to… (nhập ID phòng ban đích — demo). 
- **Search & Filter**: tìm theo tên/email/chức danh; lọc **Chưa gán**. Phân trang.
- **Cây phòng ban**: expand/collapse; hiển thị **số nhân sự** thuộc mỗi node (tính trên danh sách đang hiển thị). Tooltip ID khi hover tên.
- **History trail**: bảng lịch sử thay đổi (ts, actor, employee, from→to), **Export CSV**.
- `adapters` để nối API thật; mock dùng `localStorage` cho **Employees**, **Departments**, **History** (seed ~80 nhân sự, nhiều phòng ban).

## API/Props
```ts
type HRAssignmentDnDProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getDepartments: () => Promise<DeptNode>;
    listEmployees: (q?: { search?: string; active_only?: boolean; dept_id?: string; unassigned_only?: boolean; limit?: number; offset?: number; }) => Promise<Paged<Employee>>;
    assignEmployees: (employeeIds: string[], toDeptId: string, actor?: string) => Promise<void>;
    unassignEmployees: (employeeIds: string[], actor?: string) => Promise<void>;
    getHistory: (limit?: number, offset?: number) => Promise<Paged<AssignEvent>>;
    exportHistoryCSV: () => Promise<Blob>;
  }>;
}
```

## Hợp đồng API thật (đề xuất)
- `GET /directory/employees?search=&unassigned_only=&limit=&offset=` → `{ rows, total, ... }`
- `GET /org/departments/tree` → `DeptNode (root)`
- `POST /org/assignments:bulk` body `{ employee_ids: string[], to_dept_id: string }`
- `POST /org/unassignments:bulk` body `{ employee_ids: string[] }`
- `GET /org/assignments/history?limit=&offset=` → `{ rows, total, ... }`
- `GET /org/assignments/history:export` (CSV)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/admin/hr/assignments` trong App Shell (#1).  
- Đồng bộ **Department Tree (ADM‑04/#10)** và **User Directory (ADM‑01)**; ghi **Audit** khi gán/bỏ gán (ADM‑06/#12).  
- Khi lên hệ thống thật: thêm **RBAC** để giới hạn ai được gán ở phạm vi nào; chặn gán vào **đơn vị không tồn tại**; batch xử lý lớn bằng hàng đợi.
