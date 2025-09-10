# MUI-37 — EIM-04 Receipt_OCR_Uploader (Mock‑Ready)

**Theo Catalog #37 (EIM‑04)**  
UI cho **nhân viên** tải **biên nhận** (ảnh/PDF) và chạy **OCR stub** để trích xuất **vendor, ngày, tổng tiền, VAT, tiền tệ, danh mục, phương thức thanh toán, line items**. Có **bảng danh sách** biên nhận đã OCR, **panel kiểm tra & hiệu chỉnh** kèm hiển thị **độ tin cậy** theo màu.

## Tính năng
- **Uploader**: kéo‑thả/chọn tệp; preview ảnh ≤ 3MB; tiến độ tải; tự chạy **OCR (mock)** sau khi upload.  
- **Review**: chỉnh **Vendor/Date/Currency/Payment/Category/Subtotal/VAT/Total**; badge **confidence** (%).  
- **Receipts list**: lọc nhanh theo vendor/ngày/số tiền, trạng thái `draft/ready/ocr_done/submitted`.  
- **Export CSV** để gửi sang FIN‑06 (Expense Claim).

## Mock API & Storage
- Tài liệu: `erp.eim.documents.v1` (tương thích **EIM‑01**).  
- Biên nhận (kết quả OCR): `erp.fin.receipts.v1`.  
- API:  
  - `uploadOne(payload)` (tối giản bản EIM‑01)  
  - `runOCRMock(doc)` → tạo bản ghi `ExpenseReceipt` với độ tin cậy giả lập.  
  - `listReceipts(project_id?)` / `getByDocId(doc_id)` / `upsertReceipt(...)` / `exportCSV(project_id?)`.

## Hợp đồng API thật (đề xuất)
- `POST /receipts:upload` → trả `doc_id`, enqueue job **OCR** (Google Vision/Azure OCR/Tesseract + rule VN).  
- `GET /receipts?project_id=&status=&q=` → danh sách kết quả.  
- `PATCH /receipts/{id}` để chỉnh sửa trường đã OCR; **audit** thay đổi.  
- **VN specifics**: chuẩn hoá **định dạng số** (phân tách nghìn, dấu phẩy/chấm), nhận diện **VND** và **VAT 8/10%**; trích **MST/NCC** nếu có.  
- **RBAC**: nhân viên tạo & sửa của mình; Kế toán duyệt; gắn **Project/Cost center**.

## Tích hợp
- **EIM‑01**: có thể mở viewer để kiểm tra ảnh/PDF.  
- **FIN‑06 (Expense Claim)**: bấm “Mark ready” → có thể nạp sang form đề nghị thanh toán/hoàn ứng.  
- **ADM‑06 Audit**: ghi lại thao tác thay đổi giá trị sau OCR.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
