
# MUI-47 — FIN-03 CoA_TreeView (Mock‑Ready)

**Theo Catalog #47 (FIN‑03)**  
Cây **Sơ đồ tài khoản** (CoA) có **kéo‑thả (drag‑drop)** để đổi **parent**, kèm **usage counts** (số lần dùng trong bút toán) hiển thị theo **tổng của cả nhánh**.

## Tính năng
- **Tree drag‑drop**: kéo một TK thả lên TK khác để đổi `parent_code`; thả vào vùng **root** để đưa ra gốc. Chặn thả vào **nhánh con của chính nó**.  
- **Confirm khi có phát sinh**: nếu node (hoặc nhánh) có **usage > 0**, hỏi xác nhận trước khi di chuyển.  
- **Badges** mỗi dòng: `postable/header`, `type`, `Used: N` (tính **gộp cả nhánh**).  
- **Expand/Collapse all**, **Search** theo mã/tên, **highlight selection**.  
- **Link chi tiết**: mở **FIN‑02 Account_Detail_Form** (mock alert).

## Mock API & Storage
- CoA draft: `localStorage["erp.fin.coa.v1"]` (dùng chung FIN‑01/02).  
- GL lines: `localStorage["erp.fin.gl.lines.v1"]` (để tính **usage**).  
- Hàm chính: `ensureSeed/listAccounts/buildTree/setParent` (CoA), `seedGLIfEmpty/usageCountMap` (GL).

## Hợp đồng API thật (đề xuất)
- `GET /fin/coa/tree`, `POST /fin/coa/accounts/{code}:reparent` body `{ parent_code: null|"..." }`.  
- Server thực hiện kiểm tra: **RBAC (Finance)**, **audit** (ADM‑06), **constraints** (tuỳ chính sách: có thể cấm reparent nếu đã có phát sinh; hoặc cho phép với audit).  
- **Usage count**: `GET /fin/gl/usage?account=...&aggregate=subtree` để hiển thị nhanh số liệu khi duyệt cây.

## Lưu ý
- Mock **không đổi mã tài khoản**, chỉ đổi `parent_code`. Nếu doanh nghiệp yêu cầu **prefix mã = cha**, cần chạy **script rename** riêng (ngoài phạm vi màn này).  
- UI có cảnh báo khi di chuyển **nhánh đã dùng**, phù hợp ghi chú "Show usage counts" trong catalog.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
