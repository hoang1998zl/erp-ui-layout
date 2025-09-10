
# MUI-75 — UX‑02 DragDrop_List (Mock‑Ready)

**Theo Catalog #75 (UX‑02)**  
Thành phần **kéo‑thả danh sách** (drag & drop) dùng chung. Roles: **All**. Wave: **P0**. Ghi chú: *Used by PM‑03, HR‑07*.

## Tính năng
- **HTML5 Drag & Drop**: kéo‑thả để **đổi thứ tự** trong danh sách. Hỗ trợ **item disabled/locked** (không kéo).  
- **Bàn phím a11y**: **Space** để bắt/nhả, **↑/↓** để di chuyển item đang “grab”, **Esc** để hủy. `role="listbox"`/`role="option"`, `aria-grabbed`.  
- **Tìm kiếm nhanh** (filter theo tiêu đề/phụ đề).  
- **Hiển thị**: avatar (emoji/url), subtitle, meta (phải), icon tay nắm (handle).  
- **API props**: `items`, `onReorder(next)`, `renderItem(item)`, `getKey(item)`, `searchable`.  
- **Board mode (tuỳ chọn)**: component `DragDropBoard` cho **nhiều danh sách** như Kanban, hỗ trợ kéo item **giữa các cột** (demo).

## Cấu trúc
- `src/components/ux/DragDropList.tsx` — list cơ bản (single list).  
- `src/components/ux/DragDropBoard.tsx` — board nhiều cột (optional) sử dụng `DragDropList`.  
- `src/components/ux/DragDropDemo.tsx` — màn demo bật/tắt board mode.  
- `src/App.tsx` — runner.

## Tích hợp gợi ý
- **PM‑03** (Task ordering): dùng `onReorder` để gửi thứ tự mới lên backend (ví dụ `PATCH /pm/tasks/sort` với mảng `[{id, order}]`).  
- **HR‑07** (Candidate ranking): khoá các mục **locked** (đã offer) — không cho kéo.  
- **Audit**: log `{ beforeOrder, afterOrder, userId, at }`.  
- **Idempotency**: backend lưu `order` là số float (vd. 100, 200 → chèn giữa = 150) để giảm xung đột.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
