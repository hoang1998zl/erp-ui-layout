
# MUI-55 — FIN-11 GL_Posting_Simulator (Mock‑Ready)

**Theo Catalog #55 (FIN‑11)**  
**Giả lập hạch toán GL** từ các **Expense** đã **Approved**. Hỗ trợ **Preview** bút toán (Debit/Credit) và **Commit Post** để tạo **GL Journal** và gắn `posting_id` cho Expense.

## Tính năng
- **Nguồn**: đọc **Expense** `status=approved` & `chưa post`.  
- **Thiết lập**: Posting date, Credit account (334/111/112/331), Mode (1 journal/expense hoặc **Consolidated**).  
- **Preview**: sinh bút toán theo **mapping** (Category → Expense account), tự tách **VAT** (debit `1331`), credit **payable** theo TK chọn. Kiểm tra **cân bằng** (debit = credit), báo lỗi nếu thiếu mapping.  
- **Rules editor**: bảng **Category → Account** và trường **VAT account / Default credit**, lưu vào localStorage.  
- **Commit Post**: tạo **GL Journal** (store `erp.fin.gl.journals.v1`), gán `posting_id/posted_at` vào Expense, làm mới danh sách.  
- **Export CSV** preview.

## Mock storage
- Expense (reused): `localStorage["erp.fin.expense.drafts.v1"]` — đã có trạng thái `approved` từ **FIN‑10**.  
- Journals: `localStorage["erp.fin.gl.journals.v1"]` với `GLJournal{ id, date, currency, source:'expense', expense_ids, lines[] }`.  
- Rules: `localStorage["erp.fin.posting.rules.v1"]`.

## API thật (đề xuất)
- `POST /gl/postings:from_expense` `{ expense_ids[], date, credit_account, consolidate, rules }` → `{ journal_ids[] }`  
- `GET /gl/journals?source=expense&from=&to=&...` để rà soát.  
- **Idempotency**: với `expense_ids` đã post → server trả lại `journal_id` cũ.  
- **Validation**: mapping đầy đủ; debit=credit; chữ ký số (nếu cần).

## Tài khoản mẫu (VN)
- **642x**: Chi phí quản lý/bán hàng (tuỳ nhóm).  
- **1331**: Thuế GTGT được khấu trừ.  
- **334**: Phải trả người lao động (hoàn ứng/hoàn chi).  
- **111/112**: Tiền mặt/Ngân hàng (nếu chi trực tiếp).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
