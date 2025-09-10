# MUI-15 — HR-01 ESS_Profile (Mock‑Ready)

**Theo Catalog #15 (HR-01)**  
Màn **Employee Self‑Service Profile** cho nhân viên tự cập nhật thông tin cơ bản: **avatar**, liên hệ, **ngày sinh**, địa chỉ, và **người liên hệ khẩn cấp**. Lưu mock vào `localStorage`, hỗ trợ **Import/Export JSON**.

## Tính năng
- **Avatar**: upload (DataURL) & clear; preview tròn 120×120.
- **Thông tin cơ bản**: Họ tên, Email (read‑only), Mã nhân viên (read‑only), Điện thoại (validate VN), Ngày sinh (không cho tương lai), Giới tính.
- **Địa chỉ**: Địa chỉ, Quận/Huyện, Tỉnh/Thành, Quốc gia.
- **Emergency contact**: Họ tên, Điện thoại, Quan hệ.
- **Chế độ Edit/Read**; **Save/Cancel**; **Import/Export JSON** hồ sơ.
- `adapters` để nối API thật; UI giữ nguyên.

## API/Props
```ts
type ESSProfileProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getMyProfile: () => Promise<Profile>;
    saveMyProfile: (patch: Partial<Profile>) => Promise<Profile>;
    setAvatar: (file: File) => Promise<string>;
    clearAvatar: () => Promise<void>;
    exportJSON: () => Promise<string>;
    importJSON: (file: File) => Promise<Profile>;
  }>;
}
```
- Mặc định dùng mock `localStorage` (`src/mock/essProfile.ts`).

## Hợp đồng API thật (đề xuất)
- `GET /me/profile` → `Profile`
- `PUT /me/profile` body `Partial<Profile>` → `Profile`
- `POST /me/avatar` (multipart) → `{ url }`
- `DELETE /me/avatar`
- `GET /me/profile:export` / `POST /me/profile:import`

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/ess/profile` trong App Shell (#1).  
- Tiền đề cho các module HR khác: **Leave**, **Expense**, **Timesheet** sử dụng contact & DoB.  
- Kết hợp **SSO Settings (#14)** để khóa đổi email khi dùng IdP; đồng bộ tên hiển thị sau login SSO.
