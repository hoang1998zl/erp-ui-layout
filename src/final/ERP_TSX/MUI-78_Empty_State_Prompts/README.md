
# MUI-78 — UX‑05 Empty_State_Prompts (Mock‑Ready)

**Theo Catalog #78 (UX‑05)**  
**Empty state prompts** — gợi ý thao tác khi rỗng. Roles: **All**. Wave: **P0**. Ghi chú: *Guide first actions*.

## Thành phần
### `EmptyState` (core) + wrappers `PageEmpty`/`InlineEmpty`
Props:
```ts
type EmptyKind = 'first-use'|'no-data'|'no-results'|'error'|'permission'|'offline';
type Action = { label: string; onClick: () => void; variant?: 'primary'|'secondary'|'link' };
type Suggestion = { label: string; onClick: () => void };
type EmptyStateProps = {
  kind?: EmptyKind;
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  actions?: Action[];
  tips?: string[];
  suggestions?: Suggestion[];
  helpLink?: { label: string; href: string };
  dense?: boolean;        // inline vs full
  align?: 'center'|'left';
  tone?: 'neutral'|'brand'|'warning'|'danger';
};
```
- **Kinds**: `first-use`, `no-data`, `no-results`, `error`, `permission`, `offline`.  
- **CTA**: `actions` (nút), `suggestions` (chips), `helpLink`, `tips` (bullet).  
- **Tone**: `neutral/brand/warning/danger` (đổi màu nhấn).  
- **Wrappers**: `PageEmpty` căn giữa toàn trang; `InlineEmpty` chèn trong thẻ (compact).

## Ví dụ tích hợp (trong demo)
1) **First-use** (Expense): CTA **Tạo Expense**, **Nhập mẫu**, **Xem hướng dẫn**; tips giới thiệu OCR, Project, phê duyệt.  
2) **No-results (filters)**: gợi ý **Xoá tất cả filter** hoặc tìm theo Vendor.  
3) **Permission / Offline / Error**: các biến thể phổ biến với tone & actions phù hợp.

## Hướng dẫn viết nội dung (UX copy)
- **Tiêu đề** rõ ràng, mô tả bối cảnh (ví dụ: “Chưa có Expense nào”).  
- **Mô tả** ngắn 1–2 câu, nêu **bước tiếp theo**.  
- **CTA đầu tiên** là hành động quan trọng nhất; không quá 2 nút.  
- Gợi ý **chips** là hành động nhẹ, không phá vỡ flow (ví dụ: *Xem hướng dẫn*).  
- Tránh đổ lỗi người dùng; với lỗi hệ thống, kèm mã lỗi/đường dẫn hỗ trợ.

## Gợi ý tích hợp thực tế
- Hiển thị EmptyState khi **fetch xong** và mảng dữ liệu rỗng; **không** hiển thị lúc đang loading (dùng skeleton).  
- Kết hợp với **RBAC** để hiện biến thể `permission`.  
- Theo dõi telemetry: `{ page, kind, acted: yes/no }` để tối ưu funnel onboarding.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
