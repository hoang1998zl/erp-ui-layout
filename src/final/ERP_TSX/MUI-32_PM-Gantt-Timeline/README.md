# MUI-32 — PM-09 Gantt_Timeline (Read-only v1)

**Theo Catalog #32 (PM‑09)**  
Gantt timeline **đọc-only**: hiển thị tiến độ dự án dựa trên **WBS (PM‑08)**. Hỗ trợ **Zoom (Week/Month/Quarter)**, **Expand/Collapse** theo cấp WBS, **Today marker**, **Center on Today**, và thanh **% hoàn thành** trên từng bar. (Critical path sẽ bổ sung ở phiên bản sau.)

## Tính năng
- **Nguồn dữ liệu**: đọc từ `erp.pm.wbs.v1` (PM‑08). Nếu một node không có ngày **Start/Finish**, UI dùng **roll‑up** từ cấp dưới (nếu có).  
- **Hiển thị**:  
  - Cột trái: **WBS code** + **Tên mục** + **Type** (phase/deliverable/work_package/task/milestone).  
  - Cột phải: **Bar timeline** (milestone vẽ dạng **diamond**), overlay **% complete**.  
  - **Today line** và nút **Center on Today**.  
  - **Expand/Collapse** từng node + **Expand all / Collapse all**.  
  - **Zoom**: Week / Month / Quarter.
- **Bộ lọc**: tìm theo mã/tiêu đề.

## Mock API (localStorage)
- `listProjects()` → dự án để chọn.  
- `listWbs(project_id)` → Tree + tính **roll‑up** (start/finish/effort/%).  
- `flattenForGantt(tree)` → mảng hiển thị.  
- `pickColor(type)` → màu bar theo loại.

## Hợp đồng API thật (đề xuất)
- `GET /projects/{id}/wbs:timeline` → trả `TreeNode` gồm `start_date/finish_date/%complete/effort` đã tính sẵn.  
- **Server** tính roll‑up & chuẩn hoá múi giờ (Asia/Ho_Chi_Minh).  
- **Critical path** (phiên bản sau): server trả `is_critical=true` cho các work_package/task quan trọng để tô màu.

## Tích hợp
- Mở từ **PM‑02 Project List → View Timeline** hoặc từ **WBS Editor**.  
- Liên kết với **PM‑03/04/06** để khi click một bar sẽ mở **Task/WBS detail** (v2).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
