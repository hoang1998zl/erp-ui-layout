
# MUI-77 — UX‑04 Toasts_Alerts (Mock‑Ready)

**Theo Catalog #77 (UX‑04)**  
**Toasts & Alerts** dùng chung. Roles: **All**. Wave: **P0**. Ghi chú: Success/Error/Info.

## Thành phần
### 1) `ToastProvider` + `useToast()`
- API:
```ts
const toast = useToast();
toast.success('Saved successfully', { title:'Success', actionText:'View', onAction:()=>{} });
toast.error('Something went wrong', { title:'Error', durationMs:6000 });
toast.info('Background sync completed');
toast.warning('Credit nearing limit', { durationMs:0 }); // sticky
toast.show({ type:'success'|'error'|'info'|'warning', title, message, actionText, onAction, durationMs, canClose });
toast.close(id); toast.clear();
```
- Tính năng: **merge duplicates** (1.5s), **queue** khi > `max=5`, **pause‑on‑hover**, **progress bar**, **sticky** (duration=0), **action button**.
- A11y: **`aria-live` polite** (info/success) & **assertive** (error), `role="status"/"alert"`, không cướp focus.

### 2) `AlertBanner`
- Cảnh báo **page‑level**: `variant: success|error|info|warning`, `title`, nội dung, nút **Close**. A11y `role="status"/"alert"`.

### 3) Demo
- `ToastDemo` hiển thị các nút tạo toast (Success/Error/Info/Warning), **merge dup**, **clear all**. Phần **Alert banner** với các biến thể.

## Tích hợp gợi ý
- Dùng **toast** cho sự kiện nền (lưu thành công, sync xong, lỗi nhanh).  
- Dùng **AlertBanner** cho thông báo thủ tục/chính sách (bắt buộc xem), lỗi nhập liệu trang.  
- Chuẩn hoá thông điệp: có **title** + **message**; action (vd. **View**) đưa người dùng tới entity liên quan.  
- Log (tuỳ chọn): gửi telemetry `{ type, title, code?, at, userId }` để theo dõi lỗi UX.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
