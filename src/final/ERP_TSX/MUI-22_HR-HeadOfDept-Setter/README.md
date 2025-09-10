# MUI-22 — HR-08 HeadOfDept_Setter (Mock‑Ready)

**Theo Catalog #22 (HR-08)**  
UI để **đánh dấu Trưởng phòng** cho từng **Phòng ban**. Trái là **cây phòng ban**; phải là **thẻ thông tin Trưởng phòng hiện tại** + **danh sách ứng viên** (nhân sự **ACTIVE** thuộc phòng ban đó). Hỗ trợ **thiết lập tạm quyền (Acting)** theo khoảng ngày, **xóa thiết lập**, và **Export CSV**.

## Tính năng
- **Department Tree**: chọn đơn vị; hiển thị dấu ★ ở node đã có Trưởng phòng.
- **Current Head Card**: xem/clear, thiết lập **Acting from → to** (tùy chọn).
- **Candidates**: tìm theo tên/email/chức danh; nút **“Đặt làm Trưởng phòng”** cho từng nhân sự (chỉ hiển thị nhân sự **ACTIVE** đã gán vào đơn vị — dependency **HR‑07**).
- **Export CSV** danh sách thiết lập.
- `adapters` để nối API thật; mock đọc **Departments** & **Employees** từ HR‑07 (`localStorage`) và lưu mapping ở `erp.dir.dept.heads.v1`.

## API/Props
```ts
type HeadOfDeptSetterProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getDepartments: () => Promise<DeptNode>;
    listEmployeesByDept: (deptId: string) => Promise<Employee[]>;
    getHeads: () => Promise<HeadsMap>;
    setHead: (deptId: string, employeeId: string, acting_from?: string, acting_to?: string, who?: string) => Promise<void>;
    clearHead: (deptId: string, who?: string) => Promise<void>;
    exportHeadsCSV: () => Promise<Blob>;
  }>;
}
```

## Hợp đồng API thật (đề xuất)
- `GET /org/departments/tree` → `DeptNode`  
- `GET /directory/employees?dept_id={id}&active=true` → `Employee[]`  
- `GET /org/departments/heads` → `Record<dept_id, { employee_id, acting_from?, acting_to?, updated_by, updated_at }>`  
- `PUT /org/departments/{dept_id}/head` body `{ employee_id, acting_from?, acting_to? }`  
- `DELETE /org/departments/{dept_id}/head`  
- (Tuỳ chọn) `GET /org/departments/heads:export` (CSV)

## Gợi ý tích hợp (ảnh hưởng phê duyệt)
- **Approvals routing** (Leave/Timesheet/Expense, v.v.): nếu node có **Head**, route bước đầu cho Head; nếu không, **fallback** lên cha gần nhất có Head hoặc dùng **line manager** cá nhân.  
- Khi cập nhật Head: ghi **Audit log** (ADM‑06 #12), kích hoạt **cache invalidation** cho engine phê duyệt.  
- Đồng bộ với **OrgChart** (#20) và **Assignment DnD** (#21) để đảm bảo ứng viên thuộc đúng đơn vị.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
