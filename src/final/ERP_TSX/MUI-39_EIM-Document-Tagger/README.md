# MUI-39 — EIM-06 Document_Tagger (Mock‑Ready)

**Theo Catalog #39 (EIM‑06)**  
UI để **gắn tag/từ khoá** cho tài liệu nhằm **cải thiện tìm kiếm** và phân loại. Hỗ trợ **chỉnh tag theo từng tài liệu** và **bulk add/remove** nhiều tài liệu cùng lúc; có **gợi ý tag** dựa trên `doc_type/vendor/năm` và **token** trong `title/file_name`; hiển thị **Top tags** trong phạm vi lọc hiện tại.

## Tính năng
- **Danh sách tài liệu** (lọc theo Type/Search): mỗi thẻ hiển thị **tags**, **input thêm tag** (phân cách bằng dấu phẩy), **gợi ý** (click để add), click vào tag để **gỡ**.  
- **Bulk Tagging**: chọn nhiều tài liệu → nhập danh sách tag → **Add to selected** hoặc **Remove from selected**.  
- **Top Tags**: thống kê tần suất tag (theo phạm vi lọc/Project nếu có) để gợi ý nhanh.  
- **Chuẩn hoá tag**: `lowercase-kebab`, loại bỏ ký tự đặc biệt, **unique**; lưu vào `erp.eim.documents.v1` (field `tags: string[]`).

## Mock API & Storage
- Sử dụng kho `erp.eim.documents.v1` (từ EIM‑01).  
- API:  
  - `listDocuments(query)` / `setTags(doc_id, tags[])` / `addTags(doc_id, tags[])` / `removeTags(doc_id, tags[])`  
  - `bulkAdd(doc_ids[], tags[])` / `bulkRemove(doc_ids[], tags[])`  
  - `suggestTags(doc)` (heuristics) / `tagStats(project_id?)` (tần suất).

## Hợp đồng API thật (đề xuất)
- `GET /documents?filters...` (kèm `tags`), `PATCH /documents/{id}/tags` body `{ add?:[], remove?:[], set?:[] }`  
- `POST /documents:bulkTags` body `{ ids:[], add?:[], remove?:[] }`  
- `GET /tags:stats?project_id=&type=&q=` trả `{ tag, count }[]` để hiển thị **Top tags**.  
- **Search**: index full‑text + tag filter; đảm bảo **case‑insensitive** và **unique**; **audit log** (ADM‑06) khi thay đổi tags.

## Tích hợp
- Mở từ **EIM‑01** sau upload; từ **EIM‑03 Viewer** (panel tags ở footer); từ **EIM‑02 Link** khi chuẩn hoá hồ sơ.  
- Đồng bộ **tag dictionary** cho các module khác (PM/FIN/PROC) để tăng khả năng tìm kiếm & gợi ý.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
