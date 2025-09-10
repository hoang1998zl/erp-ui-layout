
# MUI-72 — INT-04 Accounting_Export (Mock‑Ready)

**Theo Catalog #72 (INT‑04)**  
**Accounting export** cho **Finance**: xuất dữ liệu kế toán ra **CSV/JSON/API** để nhập vào hệ thống bên thứ ba.  
Wave: **W2**. Phụ thuộc: **FIN‑10, FIN‑11**. Ghi chú: **CSV/API to 3rd‑party**.

## Tính năng
- **Filters**: khoảng ngày, **Branch**, **Currency**, **Module** (AP/AR/EXP/JV).  
- **Export profiles**: nhiều profile (MISA/FAST/SAP B1/Custom), định nghĩa:
  - **Format**: CSV / JSON / API
  - **Delimiter**, **Include headers**, **Date format**
  - **Field mapping**: chọn nguồn từ dữ liệu phẳng (`date`,`branch`,`currency`,`rate`,`ref`,`module`,`project`,`vendor`,`customer`,`line.account`,`line.debit`,`line.credit`,`line.desc`) → cột đích (alias)
  - Nếu **API**: khai báo endpoint + method (gợi ý: call qua backend)
- **Preview**: xem bảng trước khi xuất (giới hạn hiển thị 500 dòng), hiển thị **Total Debit/Credit**.  
- **Export now**: tải file **CSV** theo profile; lưu **Export history** (thời điểm, profile, số dòng, file).

## Mã nguồn
- `src/integrations/accounting/mockData.ts` — seed **journals** (AP/AR/EXP/JV) 12 tháng, có **lines** bút toán kép.  
- `src/integrations/accounting/exporter.ts` — `flatten(journal)` → hàng theo dòng bút toán; `applyFilter`, `toCSV(rows, profile)`.  
- `src/components/integrations/AccountingExport.tsx` — UI 3 cột: **Filters & Profiles** • **Preview** • **Profile editor & Logs**.  
- `src/App.tsx` — runner.

## API thật (đề xuất)
- `POST /int/export/accounting/run` body: `{ profileId, from, to, branch?, currency?, module? }` → tạo job, trả link tải.  
- `GET /int/export/accounting/profiles` / `POST /.../profiles` để CRUD profiles (lưu DB).  
- **Adapters 3rd‑party**: tạo adapter theo hệ thống đích (MISA/FAST/SAP B1), map field & validate.  
- **Bảo mật & tuân thủ**: RBAC (Finance), **audit logs**; che/mask dữ liệu nhạy cảm; tuân thủ quy định kế toán VN.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
