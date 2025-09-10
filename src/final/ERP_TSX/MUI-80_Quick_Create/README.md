
# MUI-80 — UX‑07 Quick_Create (Mock‑Ready)

**Theo Catalog #80 (UX‑07)**  
**Quick create menu** từ **Header** để tạo nhanh **Task / Expense / Document**. Roles: **All**. Wave: **W1**. Phụ thuộc: **PM‑03, FIN‑08, EIM‑01**. Ghi chú: *From header*.

## Thành phần
- `QuickCreateLauncher` — nút **＋ Create** ở **Header**, mở **popover** với 3 lựa chọn: **Task** (PM‑03), **Expense** (FIN‑08), **Document** (EIM‑01). **Phím tắt Alt+N**.
- `QuickCreateForms` — các **form modal** tối giản cho từng loại, có validate cơ bản, nút **Create/Cancel**.  
  - **Task**: Title*, Project, Assignee, Due date, Priority.  
  - **Expense**: Date*, Category, Amount*, Vendor, Receipt (file name).  
  - **Document**: Title*, Folder, Tags (comma).  
- `mockApi.ts` — lưu giả lập vào `localStorage`, tạo mã **T‑xxxx / EX‑xxxx / DOC‑xxxx**; trang demo hiển thị **Recent**.

## Hành vi UX
- Mở menu: click **＋ Create** hoặc **Alt+N**. Chọn item sẽ mở **modal** tương ứng.  
- Submit → lưu mock + hiển thị **toast** thành công/ lỗi.  
- Đóng modal bằng **✕** hoặc **Esc** (modal base bắt phím).

## Tích hợp thật (gợi ý)
- Gọi API:
  - `POST /pm/tasks` (PM‑03), `POST /fin/expenses` (FIN‑08), `POST /eim/docs` (EIM‑01).  
  - Trả về `{ id, ... }` → điều hướng sang chi tiết/ danh sách liên quan.
- Bảo mật: kiểm tra **RBAC** trước khi hiển thị item (ví dụ chỉ Finance mới thấy Expense).  
- Telemetry: log `{ kind, success, duration, at, userId }`.  
- Lưu file **receipt**: dùng **S3/Supabase/SharePoint** tuỳ hạ tầng; với VN, đảm bảo tuân thủ **ND 13/2023/NĐ‑CP** (bảo vệ dữ liệu cá nhân).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
