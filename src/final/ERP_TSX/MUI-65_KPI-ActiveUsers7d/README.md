
# MUI-65 — KPI-05 KPI_ActiveUsers7d (Mock‑Ready)

**Theo Catalog #65 (KPI‑05)**  
Widget **Người dùng hoạt động 7 ngày (7‑Day Active Users)** cho **Admin/CEO**. Phụ thuộc **CORE‑05** (User/Activity).

## Tính năng
- **Bộ lọc**: Ngày neo (anchor), **Dept**, **Role**, **Platform (web/mobile)**.  
- **Chỉ số**: 
  - **Active 7d** (unique users trong 7 ngày đến ngày neo) và tỷ lệ so với **tổng người dùng**.  
  - **Latest WAU** (7‑day unique) & **Latest DAU** (daily unique) của ngày gần nhất trong chuỗi.  
- **Xu hướng 30 ngày**: đường **WAU (7d rolling)** & **DAU** (SVG line chart).  
- **Phân tích phân khúc**: theo **Dept / Role / Platform**, **Top active users (10)**.  
- **Export CSV** chuỗi (date, DAU, WAU).

## Mock data
- `src/mock/users.ts` → seed **Users** (dept: SALES/OPS/FIN/HR/IT/ADMIN; role: admin/manager/staff).  
- `src/mock/activity.ts` → seed **Activity events** 90 ngày gần nhất (login/view/edit/approve; web/mobile).  
- `src/mock/kpi_active_users.ts` → `activeUsers7d({anchor, dept?, role?, platform?})` trả:
```jsonc
{
  "anchor":"2025-09-09T00:00:00.000Z",
  "windowDays":7,
  "active_7d": 123,
  "dau_series":[{"date":"2025-08-11","dau":45,"wau":120}, ...],
  "by_dept":[{"key":"SALES","users":54}, ...],
  "by_role":[{"key":"staff","users":110}, ...],
  "by_platform":[{"key":"web","users":115},{"key":"mobile","users":20}],
  "top_users":[{"user":"u12","events":18}, ...]
}
```

## API thật (đề xuất)
- `GET /kpis/active-users-7d?anchor=2025-09-09&dept=&role=&platform=`  
- Backend nên **đọc log hoạt động** (audit/activity) và **tối ưu** bằng bảng tổng hợp theo ngày, lưu **DAU** & **WAU** sẵn để query nhanh.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
