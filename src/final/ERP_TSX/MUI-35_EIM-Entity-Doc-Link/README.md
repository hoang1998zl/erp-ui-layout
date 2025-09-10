# MUI-35 — EIM-02 Entity_Doc_Link (Mock‑Ready)

**Theo Catalog #35 (EIM‑02)**  
UI để **liên kết tài liệu** (EIM‑01) tới **thực thể** (project/vendor/task/client). Có **auto‑suggest theo ngữ cảnh**, chọn nhiều tài liệu và **Link selected**, quản lý danh sách **đã liên kết** (đổi **relation** hoặc **Unlink**).

## Tính năng
- **Chọn thực thể**: `EntityType` = project/vendor/task/client.  
  - Nếu là **project** → chọn từ danh sách dự án (PM‑01).  
  - Nếu là **vendor** → gõ tự động gợi ý theo vendor xuất hiện trong tài liệu.  
- **Thư viện tài liệu** (đọc `erp.eim.documents.v1` từ EIM‑01): tìm kiếm theo tiêu đề/tên tệp/vendor/tags; tick để chọn; **Select all / Clear**; xem nhanh ảnh.  
- **Gợi ý theo ngữ cảnh**: tự tick sẵn các tài liệu có **trùng mã/tên dự án**, **cùng project_id**, **trùng vendor**, **tags/file_name**.  
- **Panel đã liên kết**: hiển thị các tài liệu đã liên kết với thực thể, cho phép đổi **relation** (`primary/supporting/invoice/receipt/other`) hoặc **Unlink**.

## Mock API & Storage (localStorage)
- `erp.eim.documents.v1` — từ **EIM‑01**.  
- `erp.eim.doclinks.v1` — `DocLinkRow[]` gồm `{ entity_type, entity_id, doc_id, relation?, linked_at, linked_by }`.  
- API:  
  - `listProjects()` / `listVendors()` / `listDocuments()`  
  - `listLinks(entity_type, entity_id)` / `linkDocs(entity_type, entity_id, doc_ids[], relation?)` / `unlinkDoc(...)` / `updateRelation(...)`  
  - `suggestDocs(entity_type, entity_id)` → trả mảng `{ doc_id, reason, score }` (top 20).

## Hợp đồng API thật (đề xuất)
- `POST /entity/{type}/{id}/documents` body `{ doc_ids:[], relation?:string }`  
- `GET /entity/{type}/{id}/documents` → danh sách đã liên kết (join metadata tài liệu).  
- `DELETE /entity/{type}/{id}/documents/{doc_id}`  
- `PATCH /entity/{type}/{id}/documents/{doc_id}` body `{ relation }`  
- **Tự động gợi ý** (server): endpoint `/documents:suggest?entity_type=&entity_id=` sử dụng **vector search** trên `title/file_name/tags/vendor/project_code`.  
- **RBAC**: mọi người có thể xem; chỉ **Owner/PM/Finance** được **link/unlink** tuỳ entity.  
- **Audit log** (ADM‑06): ghi lại mọi thao tác link/unlink/đổi relation.

## Tích hợp
- Mở từ chi tiết **Project/Task/Vendor/Client** (context truyền vào `props.context`).  
- Hỗ trợ **drag‑drop** (v2): kéo thẻ tài liệu qua panel “Linked”.  
- Xuất danh sách giấy tờ để đính kèm **hồ sơ thanh toán**, **hợp đồng**, **biên bản nghiệm thu**.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
