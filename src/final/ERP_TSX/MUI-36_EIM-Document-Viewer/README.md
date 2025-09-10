# MUI-36 — EIM-03 Document_Viewer (Mock‑Ready)

**Theo Catalog #36 (EIM‑03)**  
UI **xem trước tài liệu**: hỗ trợ **image/PDF preview**, thanh **zoom/rotate** (cho ảnh), **fit width/fit height/100%**, hiển thị **metadata** (type/file/mime/size/vendor/amount/currency) và **tags**. Có **thư viện** bên trái để chọn tài liệu, **tìm kiếm** nhanh, và **phím tắt** ← → để chuyển tài liệu.

## Tính năng
- **Library** (trái): danh sách tài liệu từ `erp.eim.documents.v1` (EIM‑01), filter theo `title/file/vendor/tags`.  
- **Preview** (phải):  
  - **Image**: zoom (10–400%), rotate 90°, fit width/height/actual.  
  - **PDF**: nhúng `iframe` tận dụng viewer của trình duyệt (zoom/print trong khung).  
  - **Loại khác**: hiện thông tin & link **Open in new tab** (nếu có `preview_data_url`).  
- **Metadata**: loại, tên tệp, MIME, kích thước, vendor, amount, currency, tags, người tạo & thời gian.  
- **Shortcut**: ←/→ chuyển tài liệu; Ctrl/Cmd + `+/-/0` zoom image.

## Mock API & Seed
- Đọc `erp.eim.documents.v1`. Nếu trống, **seed 2 mẫu** (PNG & SVG).  
- API:  
  - `listDocuments()` / `getDocument(id)` / `seedIfEmpty()`.

## Hợp đồng API thật (đề xuất)
- `GET /documents?project_id=&q=` → danh sách metadata.  
- `GET /documents/{id}/content` → stream nội dung (PDF/images); header `Content-Type` chuẩn.  
- **Preview service** (tùy chọn): render preview cho DOCX/XLSX/PPTX → PDF/thumbnail.  
- **Security**: RBAC (ADM‑03), signed URLs (S3/MinIO), **Content‑Disposition** để bật “view inline”/download.

## Tích hợp
- Mở từ **EIM‑01** sau khi upload (“View”), từ **Entity_Doc_Link** (EIM‑02), hoặc từ chi tiết **Project/Vendor**.  
- Truyền `initialId` để mở đúng tài liệu.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
