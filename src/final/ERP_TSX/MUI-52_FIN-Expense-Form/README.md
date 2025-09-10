
# MUI-52 — FIN-08 Expense_Form (Mock‑Ready, mobile‑first)

**Theo Catalog #52 (FIN‑08)**  
**Phiếu chi phí (Expense form)** ưu tiên **mobile‑first**, dành cho **Employee**. Quy trình: **Draft → Submit**.

## Tính năng
- **Header**: Title, Date, Currency, Dept, Project (header).  
- **Lines**: Category (MEAL/TAXI/HOTEL/AIR/OFFICE), Amount (gross), Tax rate %, Description, Project (override), **Receipt image** upload & preview.  
- **Totals**: Gross, VAT (tính từ gross & tax%), Net.  
- **Actions**: Save Draft, Submit (validate: ≥1 dòng, số tiền > 0, tiêu đề ≥ 3 ký tự).  
- **Tabs**: Form / My Drafts / Help. Danh sách nháp có **Open** & **Delete**.

## Mock storage & seeds
- Drafts: `localStorage["erp.fin.expense.drafts.v1"]`.  
- Users (EIM‑04 placeholder): `src/mock/users.ts` (seed 2 nhân viên, dùng **currentUser()**).  
- Dimensions: dùng PROJECT/DEPT (seed) từ `src/mock/dimensions.ts` để chọn ở header/line.  
- Ảnh biên lai lưu **dataURL** (demo).

## API thật (đề xuất)
- `POST /fin/expense`, `GET /fin/expense/{id}`, `POST /fin/expense/{id}:submit`, `POST /fin/expense/{id}:upload` (multipart).  
- **Storage**: lưu ảnh S3/SharePoint, trả URL; DB lưu metadata.  
- **RBAC/Audit**: Employee tạo; Manager/Finance duyệt & thanh toán ở các UI tiếp theo.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
