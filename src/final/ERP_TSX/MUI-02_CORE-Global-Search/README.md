# MUI-02 — CORE-02 Global_Search (Mock-Ready, Ctrl/⌘+K)

**Theo Catalog #2**  
Tìm kiếm nhanh thực thể (project/task/document/user). Song ngữ VI–EN, hotkey mở nhanh, nhóm kết quả, chọn bằng ↑/↓, Enter để điều hướng.

## Tính năng
- **Ctrl/⌘+K** mở nhanh; **Esc** đóng.
- Gõ để lọc; chọn nhóm (All/Projects/Tasks/Documents/Users).
- Hiển thị **nhóm & số lượng** (sidebar) + danh sách kết quả (sortable theo fuzzy score).
- **Highlight** phần khớp; Enter/Click → gọi `onNavigate(route)`.
- Mock fetchers async: `fetchProjects/Tasks/Documents/Users` (in-memory).

## API/Props
```ts
type GlobalSearchProps = {
  open?: boolean;
  onClose?: () => void;
  onNavigate?: (route: string) => void;
  hotkey?: boolean;    // default true
  locale?: 'vi'|'en';  // default 'vi'
  defaultType?: 'all'|'project'|'task'|'document'|'user';
  fetchers?: {
    projects?: ()=>Promise<Project[]>;
    tasks?: ()=>Promise<Task[]>;
    documents?: ()=>Promise<Document[]>;
    users?: ()=>Promise<User[]>;
  }
}
```
- Route mặc định: `/projects/:id`, `/tasks/:id`, `/docs/:id`, `/users/:id` (override bằng custom fetcher nếu cần).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy toàn bộ thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
- Demo `App.tsx` đã gắn sẵn nút “Open Global Search” + hotkey.

## Gợi ý tích hợp với **MUI-01 AppShell_Nav**
- Mount `<GlobalSearch hotkey onNavigate={router.push} />` ở **tầng App Shell**.  
- Ẩn ô “Cmd palette” tự chế nếu đã dùng Global_Search làm command center của Shell.
