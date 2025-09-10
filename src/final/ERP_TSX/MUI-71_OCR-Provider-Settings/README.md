
# MUI-71 — INT-03 OCR_Provider_Settings (Mock‑Ready)

**Theo Catalog #71 (INT‑03)**  
Chọn & cấu hình **OCR Provider** (Google Vision / AWS Textract / Azure Cognitive / Tesseract / FPT.AI / Mock), có **test harness** và **field mapping → ERP**.  
Vai trò: **Admin**. Wave: **W1**. Phụ thuộc: **EIM‑04**. Ghi chú: **Provider keys**.

## Tính năng
- **Cấu hình Provider**: nhập khóa/endpoint/region theo từng loại; **mask/unmask** khóa; **Test connection (mock)**; lưu **localStorage** (demo).  
- **Kiểm thử OCR (mock)**: upload file (ảnh/pdf/txt) → nhận dạng → hiển thị **Recognized fields** (key/label/value/confidence) & **Plain text**; export **JSON**.  
- **Field Mapping → ERP**: ánh xạ các khóa OCR (`invoice_number`, `invoice_date`, `total_amount`, `currency`, `vendor_name`, `vat_rate`...) vào schema ERP (vd. `fin.expense.invoice_no`). Lưu **localStorage** (demo).

## Mã nguồn
- `src/integrations/ocr/types.ts` — types (Provider, OCRConfig, OCRResult).  
- `src/integrations/ocr/mockProviders.ts` — **MockOCR**: `testConnection`, `recognize(cfg, file, opt)`; regex đơn giản cho **invoice-like**.  
- `src/components/integrations/OCRProviderSettings.tsx` — UI 3 cột: **Settings** • **OCR Test** • **Field Mapping**.  
- `src/App.tsx` — runner.

## API thật (đề xuất)
- `POST /int/ocr/recognize` — multipart file + `{ provider, language, docType }` → trả `OCRResult`.  
- **Provider hooks**:
  - **Google Vision**: `images:annotate` (Text/DocumentTextDetection).  
  - **AWS Textract**: `AnalyzeDocument` (`FORMS`,`TABLES`) hoặc `StartDocumentAnalysis` (async).  
  - **Azure**: `formrecognizer/documentModels/{modelId}:analyze`.  
  - **FPT.AI**: endpoint OCR tiếng Việt.  
  - **Tesseract** (on‑prem): dịch vụ nội bộ gói **tesseract** và **vi**/`eng` traineddata.
- **Bảo mật & tuân thủ**: khóa lưu **server-side**, mã hóa; **PII masking**; audit truy cập; tuân thủ **Nghị định 13/2023/NĐ‑CP**.  
- **Vận hành**: xử lý async + **queue**, lưu **file hash** để **idempotent**, cấu hình **timeout/retry**.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
