
# MUI-53 — FIN-09 Expense_List (Mock‑Ready)

**Theo Catalog #53 (FIN‑09)**  
**Danh sách chi phí** với **filter theo user/project**, **date range**, **search**, **status chips**, **sort/pagination**, và **Export CSV**.

## Tính năng
- **Status chips**: All / Draft / Submitted (hiển thị **counts**).  
- **Filters**: Employee, Project, From/To dates, Search (Title/Dept/Employee).  
- **Bảng**: Date, Title, Employee, Project, Currency, Amount (gross), Status chip, Actions (View).  
- **Sort** theo Date/Title/Employee/Amount/Status, **Pagination** + chọn page size.  
- **Export CSV** (theo danh sách đang lọc/sắp xếp).  
- **Liên kết** mở **FIN‑08** (mock) để tạo/sửa (View trong mock hiển thị alert).

## Mock storage & seed
- **Expense drafts**: `localStorage["erp.fin.expense.drafts.v1"]` (tái sử dụng từ FIN‑08). Hàm `seedDemo()` tự tạo vài mẫu nếu trống.  
- **Users**: `src/mock/users.ts` (Employee list & currentUser).  
- **Dimensions**: `src/mock/dimensions.ts` (PROJECT values).

## API thật (đề xuất)
- `GET /expenses?q=&employee=&project=&from=&to=&status=` trả JSON danh sách; hỗ trợ sort/pagination server‑side.  
- **RBAC**: Employee xem **của mình**; Finance có thể xem **tất cả**.  
- **Notes**: Hiển thị **status chips** nhất quán với workflow FIN‑08 (draft→submitted).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
