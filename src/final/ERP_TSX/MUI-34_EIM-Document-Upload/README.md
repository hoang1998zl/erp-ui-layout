# MUI-34 — EIM-01 Document_Upload (Mock‑Ready)

**Theo Catalog #34 (EIM‑01)**  
UI **tải tài liệu** (Contract / Invoice / Receipt / Other) với **drag‑and‑drop**, **metadata** theo lô, **progress bar**, **preview** (ảnh & PDF nhỏ), **bộ lọc & thẻ**, **Export CSV**. Chuẩn bị adapter `POST /documents` (upload) — phần **virus scan** sẽ thực hiện asynchronous ở server (mock mô phỏng “pending_scan” → “clean”).

## Tính năng
- **Form metadata**: Doc Type, Title, Tags, Project, (Vendor/Amount/Currency cho Invoice/Receipt), Document Date.  
- **Dropzone**: kéo‑thả hoặc chọn tệp; validate **loại** và **kích thước ≤ 25MB**; hiển thị **hàng đợi** và **tiến độ**.  
- **Preview**: ảnh/PDF ≤ 3MB lưu **data URL** để xem nhanh; tệp khác hiển thị icon/mime.  
- **Danh sách**: lưới thẻ của tài liệu đã tải theo **Project**, filter **Type/Date/Search**; nhãn **Scanning/Clean/Blocked**.  
- **Export CSV** theo project để đối soát hoặc import kế toán.

## Mock API & Storage (localStorage)
- Key: `erp.eim.documents.v1` → `DocumentRow[]`.  
- API:  
  - `listProjects()` (đọc `erp.pm.projects.v1` nếu có)  
  - `listDocuments(filters)` / `deleteDocument(id)`  
  - `uploadOne(payload, onProgress)` → mô phỏng tiến độ + đổi trạng thái `pending_scan → clean`.  
  - `exportCSV({ project_id? })`.

## Hợp đồng API thật (đề xuất)
- `POST /documents` (multipart): fields **metadata** + tệp; trả `document_id`, trạng thái `pending_scan`.  
- `GET /documents?project_id=&type=&q=&date_from=&date_to=`  
- `GET /documents/{id}` (metadata); `GET /documents/{id}/content` (stream)  
- `DELETE /documents/{id}`  
- **Asynchronous scanning**: queue sang dịch vụ **AV/DLP**; webhook cập nhật `status=clean|blocked` + lý do.  
- **Storage**: object store (S3/MinIO/Azure Blob) với **KMS**; **immutable retention** cho hóa đơn theo quy định.  
- **Compliance VN**: hoá đơn điện tử (TT78/NĐ123), lưu **XML/ PDF**; gắn **số hoá đơn**, **mã CQT** (mở rộng sau).

## Tích hợp
- Mở từ **PM‑01/02** (đính kèm dự án), **FIN** (kế toán), **PROC** (mua sắm).  
- Đồng bộ **tags** với **DMS**; rule **naming** file (ProjectCode‑Type‑YYYYMMDD‑Vendor…).  
- RBAC (ADM‑03): mặc định **All** có thể upload; xóa chỉ **Owner/PM/Finance**.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
