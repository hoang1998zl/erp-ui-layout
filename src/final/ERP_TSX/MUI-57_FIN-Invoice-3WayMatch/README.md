
# MUI-57 — FIN-13 Invoice_3WayMatch (Mock‑Ready)

**Theo Catalog #57 (FIN‑13)**  
**Đối soát 3 chiều** giữa **Contract ↔ PO ↔ Invoice** với **auto‑approve rules**.

## Tính năng
- **Danh sách hoá đơn** theo tab: **New / Suggested / Approved / Exception / All**.
- **Đề xuất khớp**: tìm PO line theo `vendor + sku/desc + price near + còn qty`, tính **variance** theo **Qty/Price/Tax** và đánh dấu **OK/CHECK** theo **tolerances**.
- **Auto‑Evaluate**: nếu **mọi dòng OK** và **tổng tiền ≤ cap** thì **auto‑approve** và cập nhật `qty_invoiced` cho PO line; ngược lại chuyển trạng thái **Suggested**.
- **Rules Drawer**: cấu hình **Qty tolerance %**, **Unit price tolerance %**, **Tax rate tolerance %**, **Auto‑approve enabled**, **Auto‑approve cap** (localStorage).
- **Detail view**: bảng dòng Invoice hiển thị PO match + variance; thao tác **Approve** hoặc **Mark Exception** (ghi chú).

## Mock stores
- Vendors: `erp.fin.vendors.v1`
- Contracts: `erp.fin.contracts.v1`
- POs: `erp.fin.pos.v1`
- Invoices: `erp.fin.invoices.v1` (seed 2 hoá đơn mẫu)
- Rules: `erp.fin.match.rules.v1`

## API thật (đề xuất)
- `POST /fin/invoices/{id}:evaluate` → trả match + quyết định auto‑approve.  
- `POST /fin/invoices/{id}:approve` / `:exception` (lý do).  
- `GET /fin/invoices?status=&vendor=&from=&to=&...` + `GET /procure/pos` để lấy **PO còn lại**.  
- **Idempotency**: tăng `qty_invoiced` theo line khi approved; khoá khi vượt `qty_remaining`.

## Kiểm soát/Compliance (VN)
- Đối chiếu **hợp đồng khung/đơn hàng**, **biên bản nghiệm thu/GRN** (nếu có) trước khi duyệt thanh toán.  
- Thiết lập **ngưỡng tự duyệt** nhỏ (ví dụ ≤ 20 triệu VND) và **audit log** theo **APP‑01**.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
