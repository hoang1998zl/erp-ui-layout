
# MUI-45 — FIN-01 CoA_Setup_Wizard (Mock‑Ready)

**Theo Catalog #45 (FIN‑01)**  
Wizard **thiết lập Sơ đồ tài khoản (Chart of Accounts)**: chọn **template** (VAS mẫu / IFRS‑lite), chỉnh **cấu trúc**, **nhập CSV**, thiết lập **mapping** sang hệ thống khác, **validate**, và **Commit & Activate** tạo **phiên bản** đang hoạt động.

## Bước & Tính năng
1) **Template** — chọn mẫu ban đầu (có seed một phần VAS & IFRS‑lite).  
2) **Structure** — bảng chỉnh sửa: `code, name_vi, type, normal_side, parent_code, is_postable` (thêm/xoá dòng).  
3) **Import CSV** — dán CSV với header:  
   `code,name_vi,name_en,type,normal_side,parent_code,is_postable,currency,active`.  
4) **Mapping** — gán **external code** cho từng tài khoản (khuyến nghị đủ với tài khoản **postable**).  
5) **Validate** — kiểm tra **trùng mã**, **loại/số dư**, **parent missing**, **prefix lệch**, **mapping thiếu** (warning). Tóm tắt tổng số & phân bổ loại.  
6) **Commit & Activate** — lưu **version** (localStorage) và đặt **active**; các version cũ chuyển **archived**.

## Mock API & Storage
- `erp.fin.coa.v1` — **draft** hiện tại.  
- `erp.fin.coa.versions.v1` — danh sách **versions** đã commit.  
- APIs: `seedTemplates/newDraftFrom/getDraft/saveDraft/commitDraft/listVersions/validate/toCSV/fromCSV/upsertAccount/buildTree`.

## Hợp đồng API thật (đề xuất)
- `GET/PUT /fin/coa/draft`, `POST /fin/coa/draft:commit`, `GET /fin/coa/versions` (+ activate/archive).  
- **Import/Export**: `POST /fin/coa:importCSV`, `GET /fin/coa:export` (CSV/JSON).  
- **Validation** server‑side; **idempotent commit**; **RBAC**: chỉ **Finance/Admin** có quyền chỉnh/commit; **Audit** (ADM‑06).  
- **Mapping**: bảng `fin.coa_mapping (code, external_code, source)` để đồng bộ với phần mềm kế toán hiện tại.

## Tích hợp
- **FIN‑02** (GL Posting), **FIN‑03** (Journal) sẽ đọc CoA **active**.  
- **Migration**: import từ hệ kế toán cũ → mapping → commit.  
- **Localization**: hỗ trợ **song ngữ** `name_vi/name_en`.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
