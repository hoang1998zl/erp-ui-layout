
# MUI-79 — UX‑06 Command_Palette (Mock‑Ready)

**Theo Catalog #79 (UX‑06)**  
**Command palette** mở bằng **Ctrl/Cmd + K**. Roles: **All**. Wave: **W1**. Phụ thuộc: **CORE‑02**. Ghi chú: **Role‑aware actions**.

## Tính năng
- **Global shortcut**: Ctrl/Cmd+K để mở/đóng; cũng có API `open/close/toggle` (hook).  
- **Fuzzy search** theo token (prefix/substring), có **ranking** và **tabs** theo `section`: **Go to / Create / Actions / Admin**.  
- **Role‑aware**: mỗi command có `allowedRoles`; lọc theo vai trò hiện tại.  
- **Pinned & Recents**: khi ô tìm kiếm **rỗng** hiển thị **pinned** trước, sau đó **recent** (từ `localStorage`).  
- **Keyboard**: **↑/↓** chọn, **Enter** chạy, **Esc** đóng.  
- **A11y**: `role="dialog"` cho palette, mỗi item `role="option"` + `aria-selected`.

## API
```ts
type Role = 'Admin'|'Finance'|'PM'|'HR'|'Employee';
type Command = {
  id: string; title: string; section?: 'Go to'|'Create'|'Actions'|'Admin';
  keywords?: string[]; shortcut?: string; icon?: React.ReactNode;
  run: () => void|Promise<void>; allowedRoles?: Role[]; pinned?: boolean;
};

// Hook
const cmd = useCommand();
cmd.open(); cmd.close(); cmd.toggle();
cmd.setCommands(Command[]);
cmd.setRole(role);
```

## Demo
- `CommandDemo` cho phép chọn **Role**, seed lệnh **Go to / Create / Actions / Admin** (ví dụ: mở Expense, tạo Vendor, approve selection, Admin Users…).  
- Có lệnh **Toggle dark background** để nhìn thấy tác dụng ngay.

## Tích hợp thật (gợi ý)
- **CORE‑02 Command Bus**: emit sự kiện `command:run` để các module bắt sự kiện.  
- **I18n**: `title`/`keywords` theo ngôn ngữ; gợi ý `shortcut` (vd. `G then E`).  
- **Telemetry**: log `{ id, title, role, at }` để theo dõi mức dùng.  
- **Security**: không render lệnh nếu người dùng không có quyền; với lệnh nguy hiểm → yêu cầu **confirm modal** (#76).

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
