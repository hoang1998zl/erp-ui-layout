# MUI-25 — PM-02 Project_List (Mock‑Ready)

**Theo Catalog #25 (PM‑02)**  
UI **danh sách dự án** với **bộ lọc**, **sắp xếp**, **phân trang**, **Saved views** và **Export CSV**. Đọc dữ liệu dự án từ `localStorage` do **PM‑01 (UI #24)** tạo/submit.

## Tính năng
- **Filters**: Tìm tên/mã, Trạng thái (Draft/Submitted), Khách hàng, Loại dự án, Tiền tệ, Khoảng ngày (overlap Start‑End), **PM**, Sort (Updated/Start/Name/Budget).
- **Table**: Tên & Type, Code, Client, PM, Status badge, Timeline, Currency, **Total Budget**, **Est. hours**, Updated time.
- **Saved Views**: lưu/bật **Default**, **Pin** hiển thị trên thanh nhanh; chọn, xoá, đặt mặc định. Lưu cấu hình `Query` + `Sort`.
- **Export CSV** toàn kết quả theo bộ lọc hiện tại.
- **Adapters**: có thể thay `listProjects/exportCSV/getViews/...` bằng API thật.

## Hợp đồng API (đề xuất)
- `GET /projects?search=&status=&client_id=&project_type=&currency=&date_from=&date_to=&pm_id=&sort=&limit=&offset=` → `{ rows:[{ ... , totals:{ budget, hours }, pm_id }], total }`
- `GET /projects:export` (CSV)
- `GET /crm/clients` → danh sách khách hàng
- `GET /directory/employees?active=true` → danh sách nhân sự (để hiển thị PM)
- `GET/POST /projects/views` → saved views (tuỳ thiết kế, có thể lưu server‑side theo user)

## Tích hợp
- Mount `/pm/projects`. Nút **New project** mở **PM‑01**.  
- Saved views có thể lưu theo **user** và **org**; cho phép chia sẻ.  
- Đồng bộ phân quyền: xem dự án theo **RBAC** (PM, team member, finance, exec).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
