# MUI-06 — CORE-06 Context_RightPane (Mock‑Ready)

**Theo Catalog #6**  
Ngăn phải hiển thị ngữ cảnh **chi tiết / tài liệu liên kết / hoạt động / hành động nhanh** cho mọi thực thể (Project/Task/Expense). Có thể embed vào App Shell.

## Tính năng
- **Tabs**: Details, Documents (upload & link), Activity (timeline), Actions (quick actions registry).
- **Details**: hiển thị metadata + raw JSON (debug nhanh).
- **Documents**: liệt kê, xem thời gian tải, **upload & link** (in‑memory; URL.createObjectURL preview).
- **Activity**: timeline mới → cũ (người thực hiện, hành động, thông điệp).
- **Actions**: truyền mảng hành động tuỳ biến theo bối cảnh (ví dụ Copy ID, điều hướng).
- Song ngữ: `locale="vi" | "en"` (label cơ bản).

## API/Props
```ts
type ContextRightPaneProps = {
  entity?: { type: 'project'|'task'|'expense'; id: string };
  onClose?: () => void;
  locale?: 'vi'|'en';
  loaders?: {
    fetchEntity?: (type, id) => Promise<any>;
    listDocuments?: (entity) => Promise<any[]>;
    linkDocument?: (entity, file: File, doc_type, title?) => Promise<any>;
    listActivity?: (entity) => Promise<any[]>;
  };
  actions?: Array<{ key: string; label: string; onClick: (entity) => void|Promise<void> }>;
  width?: number; // default 420
}
```

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy toàn bộ thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
- Màn hình demo hiển thị danh sách Project/Task/Expense; click để mở **ContextRightPane** sát cạnh phải.

## Gợi ý tích hợp với App Shell (MUI‑01) & các MUI khác
- Gắn component vào slot **rightPane** của App Shell; truyền `entity` khi người dùng chọn Task/Expense/Project.
- Khi **Approval Inbox** (MUI‑03) hoặc **Document Upload** (EIM‑01/02) bắn sự kiện, gọi lại `listActivity/listDocuments` để cập nhật pane.
- Về sau có thể thêm **resize** hoặc **dock mode** (pin) tuỳ nhu cầu.
