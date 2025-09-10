
# MUI-66 — KPI-06 Dashboard_CEO_Matrix (Mock‑Ready)

**Theo Catalog #66 (KPI‑06)**  
**Bảng điều khiển CEO** dạng **3‑cột**: **Quadrant (trái)** • **Matrix (giữa)** • **Context (phải)**.  
*Matrix rows = Dept, cols = Process.* Phụ thuộc: **KPI‑01..05, PM‑02, FIN‑07, CORE‑06** (trong demo lấy từ **mock aggregator**).

## Tính năng
- **Quadrant** (Spend Util % vs Task Health %): **bubble per Dept**; click bubble để xem **context** theo phòng ban.  
- **Matrix** Dept × Process: mỗi ô có **Score (0–100)** và màu **R/A/G**; click ô để xem **KPIs** của ô ở panel phải.  
- **Context panel**: hiển thị **Composite score & KPIs** của cell được chọn hoặc **tổng quan Dept** hoặc **Highlights** (top xấu nhất / tốt nhất).  
- **Export CSV** ma trận. **Bộ lọc period**: Monthly/Quarterly/Yearly (ảnh hưởng seed).

## Mock data
- `src/mock/ceo_dashboard.ts` → `buildDashboard(anchor, period)` trả:
```ts
type Dashboard = {
  asOf: string;
  period: 'M'|'Q'|'Y'; year: number; month?: number; quarter?: number;
  processes: ('Revenue'|'Projects'|'Expenses'|'Hiring'|'Support')[];
  depts: ('SALES'|'OPS'|'FIN'|'HR'|'IT'|'ADMIN')[];
  matrix: { dept; process; score; rag; kpis:[{key,label,value,unit?}] }[];
  quadrant: { dept; spend_util_pct; task_health_pct; size }[];
  highlights: { title; detail; severity }[];
}
```
- Score & KPI sinh từ **seeded random** để ổn định theo tháng/năm.

## API thật (đề xuất)
- `GET /kpis/ceo-matrix?period=M&anchor=2025-09-01` → trả cấu trúc như trên.  
- Cell KPI liên kết tới nguồn: **KPI‑01 (Budget vs Actual)**, **KPI‑02/03 (Tasks)**, **KPI‑04 (Pending)**, **KPI‑05 (Active Users)**…  
- Hỗ trợ **RBAC** (CEO xem toàn công ty; Head chỉ xem Dept mình).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
