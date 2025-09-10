
# MUI-76 — UX‑03 Modal_Templates (Mock‑Ready)

**Theo Catalog #76 (UX‑03)**  
Bộ **modal chuẩn** dùng chung: **Confirm**, **Form**, **Wizard**. Roles: **All**. Wave: **P0**.

## Thành phần & API
### 1) `ModalBase`
- A11y: `role="dialog"`, `aria-modal="true"`, `aria-labelledby/aria-describedby`.  
- **Focus trap** (Tab/Shift+Tab), **Esc** để đóng (nếu `dismissible`).  
- Portal vào `#modal-root`, overlay click để đóng (tuỳ chọn).  
- Props: `{ open, onClose, title, description, width, dismissible, initialFocusRef, footer }`.

### 2) `ModalProvider` + `useModal()`
- Cung cấp API **imperative** (promise-based) để mở modal từ bất kỳ nơi nào:
```ts
const modal = useModal();
await modal.confirm({ title, description, warning?, okText?, cancelText? });
const data = await modal.form({ title, render({draft,set}){...}, validate?, onSubmit? });
const result = await modal.wizard({ title, steps:[{title, render, validate?}, ...], onFinish? });
```
- Tự quản lý **stack** (chồng modal), **footer** chuẩn.

## Demo nhanh
- `ModalDemo` hiển thị 3 nút: **Open Confirm**, **Open Form**, **Open Wizard**.  
- Confirm: cảnh báo xóa PO; Form: tạo Vendor (validate email…); Wizard: 3 bước onboard nhân sự với progress bar.

## Tích hợp gợi ý
- Dùng cho **Confirm** nguy hiểm (xóa, duyệt), **Form** ngắn (tạo nhanh), **Wizard** nhiều bước (onboarding, tạo PO nhiều tab).  
- Backend: xử lý submit async; hiển thị trạng thái **Saving…/Processing…**; bắt lỗi và hiện inline.  
- Nhật ký/audit: khi hành động nguy hiểm → ghi `{ action, entity, id, userId, at }`.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
