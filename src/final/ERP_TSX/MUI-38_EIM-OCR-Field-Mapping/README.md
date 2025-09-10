# MUI-38 — EIM-05 OCR_Field_Mapping (Mock‑Ready)

**Theo Catalog #38 (EIM‑05)**  
UI để **map trường OCR → ERP** cho biên nhận (receipt). Hỗ trợ **transform** (toDate, toNumber, regex, vendorNormalize), **threshold** theo độ tin cậy OCR, **giá trị mặc định**, **profile** theo **Global/Vendor/Project**, **vendor alias table**, và **kiểm thử trực tiếp** với dữ liệu OCR từ **EIM‑04**.

## Tính năng
- **Profiles**: tạo/đổi tên/xoá, **scope** Global/Vendor/Project; Export/Import JSON.  
- **Mapping Rules**: mỗi dòng gồm **ERP field** → **OCR source path** + **Transform** + **Threshold** + **Default**.  
  - Transform có sẵn: `raw`, `trim`, `upper`, `lower`, `toDate`, `toNumber`, `regex(pattern, group)`, `vendorNormalize` (dùng bảng alias).  
- **Vendor Aliases**: bảng alias ⇢ canonical để chuẩn hoá tên NCC (ACME LTD → ACME Co).  
- **Test Mapping**: chọn một **receipt** đã OCR (từ `erp.fin.receipts.v1`) → xem **OCR source** và **Mapped result** + **Warnings** (thiếu trường, dưới ngưỡng, dùng default).

## Mock Storage & API
- `erp.eim.ocr.mapping.v1` — `MappingProfile[]`.  
- `erp.eim.ocr.vendor_alias.v1` — `{ alias, canonical }[]`.  
- `erp.fin.receipts.v1` — từ **EIM‑04** (để test).  
- API mock: `listProfiles/saveProfile/deleteProfile/exportProfile/importProfile/applyMapping/listReceipts/listVendorAliases/saveVendorAliases`.

## Hợp đồng API thật (đề xuất)
- `GET/POST/PATCH/DELETE /ocr/mappings` (quản lý profiles).  
- `POST /ocr/mappings/{id}:apply` body `{ receipt }` → kết quả mapping + cảnh báo.  
- **Alias service**: `GET/POST /vendors/aliases`.  
- **Training** (v2): `/ocr/train` từ các **receipt đã duyệt** để tự sinh alias/rules (synonym detection, regex mining).

## Tích hợp
- **EIM‑04**: mở từ màn hình OCR để chỉnh mapping khi kết quả sai.  
- **FIN‑06**: form **Expense Claim** nạp dữ liệu đã map (`vendor/date/total/VAT/…`).  
- **ADM‑06**: log audit khi thay đổi profile.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
