
# MUI-74 — UX‑01 Inline_Edit_Cell (Mock‑Ready)

**Theo Catalog #74 (UX‑01)**  
**Inline cell edit** dùng chung cho toàn hệ thống (Roles: **All**). Wave: **P0**. Ghi chú: *Used by FIN‑06, PM‑02*.

## Tính năng chính
- **Kiểu dữ liệu**: `text`, `number`, `currency` (định dạng `vi-VN`), `date`, `select` (options).
- **Cách dùng**: Double‑click hoặc **F2** để vào chế độ sửa; **Enter** để lưu; **Esc** để hủy; **Tab** lưu và chuyển tiếp (mặc định trình duyệt). Commit khi **blur**.
- **Validator**: nhận hàm `validate(value) => string|null`, hiển thị lỗi inline (a11y `aria-invalid`). Ví dụ: required, > 0.
- **Formatter/Parser**: truyền `format`/`parse` tùy biến. Mặc định có `fmtCurrency`/`parseCurrency`.
- **Optimistic commit**: gọi `onCommit(value)` (Promise). UI hiển thị `Saving…`, lỗi thì **giữ chế độ edit** + thông báo lỗi, không mất dữ liệu.
- **A11y**: `role="gridcell"`, hỗ trợ bàn phím (**F2/Enter/Esc/Tab**), tooltip hướng dẫn, focus quản lý an toàn.
- **Trạng thái**: `disabled`/`readOnly`.

## Mã nguồn
- `src/components/ux/InlineEditCell.tsx` — component cell có đầy đủ logic bàn phím, validator, formatter, commit/cancel.
- `src/components/ux/InlineEditableTable.tsx` — **demo** bảng (Expense‑like) sử dụng nhiều kiểu cell, có **mock API** lỗi ngẫu nhiên để kiểm thử path rollback.
- `src/integrations/ux/mockApi.ts` — `saveCell(rowId, field, value)` với random lỗi để minh hoạ.
- `src/App.tsx` — runner.

## API/Props tóm tắt
```ts
type InlineEditCellProps<T=any> = {
  value: T;
  type?: 'text'|'number'|'currency'|'date'|'select';
  options?: { value: string|number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  align?: 'left'|'right'|'center';
  format?: (v: T) => string;
  parse?: (s: string) => T;
  validate?: (v: T) => string|null;
  onCommit?: (v: T) => Promise<void>|void;
  onCancel?: () => void;
  ariaLabel?: string;
}
```

## Hướng dẫn tích hợp
- Dùng cho các grid **FIN‑06** (Expense lines) & **PM‑02** (Task board list).  
- Nếu cần **di chuyển con trỏ ô** theo Tab/Shift+Tab tùy biến, bọc component và điều khiển focus ở parent (grid) bằng refs.  
- Đảm bảo **idempotency** khi lưu (ví dụ kèm `row.version`/ETag).  
- Log audit: lưu `{ rowId, field, oldValue, newValue, userId, at }` ở backend.  
- Tuân thủ chuẩn i18n (định dạng số/tiền tệ theo locale).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
