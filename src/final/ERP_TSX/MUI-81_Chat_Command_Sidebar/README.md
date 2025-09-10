
# MUI-81 — UX‑08 Chat_Command_Sidebar (Mock‑Ready)

**Theo Catalog #81 (UX‑08)**  
**Chat theo vai trò** dạng **sidebar** có gợi ý *kịch bản* và *slash commands*. Roles: **All**. Wave: **W2**. Phụ thuộc: **CORE‑02, APP‑03**. Ghi chú: **Embeddable**.

## Thành phần
- `ChatSidebar` — panel gắn bên phải, bật bằng **nút nổi** “💬 Chat”. Có header **Role** selector, danh sách **kịch bản nhanh** theo vai trò, khung **chat** và **ô nhập** hỗ trợ **slash commands**.
- `chatEngine.ts` — mô phỏng engine: nhận biết **slash commands** (`/help`, `/expense policy`, `/expense new`, `/po new`, `/task status PRJ‑A`, `/approve EX‑xxxx`, `/kb <kw>`), và phản hồi gợi ý theo ngữ cảnh.
- `App.tsx` — trang demo bất kỳ để thấy khả năng **embed**.

## Trải nghiệm chính
- **Role-based prompts**: mỗi vai trò có bộ chips *kịch bản* (Admin/Finance/PM/HR/Employee).  
- **Slash commands**: gõ `/` để hiện dropdown lệnh; chọn sẽ chèn **mẫu lệnh**; Enter để gửi.  
- **Small-talk & intent** (mock): hiểu các từ khoá “expense/po/task” và hướng dẫn lệnh tiếp theo.  
- **Embeddable**: 1 dòng `<ChatSidebar />` chèn ở gốc ứng dụng; nổi nút bubble **bottom-right**.

## API Props
```ts
type ChatSidebarProps = {
  initialRole?: 'Admin'|'Finance'|'PM'|'HR'|'Employee';
  open?: boolean;                 // điều khiển từ ngoài (tuỳ chọn)
  onOpenChange?: (o:boolean)=>void;
  widthPx?: number;               // mặc định 380
};
```

## Gợi ý tích hợp thật
- **CORE‑02 Command Bus**: khi user gửi thông điệp `/<cmd>` → emit event `command:run` để module nhận thực thi (mở form, điều hướng…).  
- **APP‑03 Layout**: bật/tắt sidebar bằng hotkey (ví dụ **Ctrl+/**), lưu trạng thái vào `localStorage`.  
- **Security/RBAC**: ẩn lệnh người dùng không có quyền; gợi ý kịch bản dựa trên **permissions**.  
- **Search KB**: nối SharePoint/Confluence hoặc EIM để trả kết quả thật.  
- **Audit/Telemetry**: ghi `{ role, cmd?, text, at, page }` để tối ưu nội dung gợi ý.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
