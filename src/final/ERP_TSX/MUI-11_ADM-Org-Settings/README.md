# MUI-11 — ADM-05 Org_Settings (Mock‑Ready)

**Theo Catalog #11 (ADM-05)**  
Màn **Cài đặt tổ chức** đa mục: **Company profile, Branding, Localization, Finance, Approvals, Security/SSO, Integrations, Data & Retention**. Lưu vào `localStorage`; hỗ trợ **Import/Export JSON**.
Liên hệ trực tiếp với các MUI trước: **Locale Switcher (#4)**, **Audit Log (#5)**, **RBAC (#8/#9)**.

## Tính năng
- Sidebar điều hướng 8 mục; nút **Save all**, **Defaults**, **Import/Export JSON**.
- **Branding**: upload ảnh logo (DataURL) + xem trước; Clear logo.
- **Localization**: đổi ngôn ngữ, múi giờ, tiền tệ + **format preview** (date/time/currency). 
- **Finance**: tiền tệ gốc, danh sách **VAT (%)** có thể thêm/xóa; **fiscal year start**; **rounding**; **VAT preview**.
- **Approvals**: bật/tắt workflow Expense & Procurement; số **levels**, **thresholds** theo cấp; **auto escalation**.
- **Security/SSO**: mật khẩu, session timeout, MFA; bật SSO + chọn provider + Tenant ID.
- **Integrations**: Webhook URL, SharePoint site; (cổng kết nối kế toán/e-invoice/HRM sẽ ở màn chuyên biệt).
- **Data & Retention**: giữ **audit log** & **document temp** theo ngày; khung **backup window**.

## API/Props
```ts
type OrgSettingsProps = {
  locale?: 'vi'|'en';
  adapters?: {
    getSettings?: () => Promise<OrgSettings>;
    saveSettings?: (payload: OrgSettings) => Promise<void>;
    resetSettings?: () => Promise<OrgSettings>;
    exportJSON?: () => Promise<string>;
    importJSON?: (file: File) => Promise<void>;
  };
}
```
- Mặc định dùng mock (`localStorage`). Khi nối API thật, chỉ cần override `adapters` (UI giữ nguyên).

## Hợp đồng API thật (đề xuất)
- `GET /org/settings` → `OrgSettings`
- `PUT /org/settings` body `OrgSettings`
- `GET /org/settings:export` / `POST /org/settings:import`

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/admin/settings` trên App Shell (#1).  
- Đồng bộ với **Locale Switcher (#4)** bằng cách đọc `localization` để set provider mặc định.  
- Liên kết **Approval Inbox** và **Expense/Purchase** workflow để đọc **Approvals** thresholds & levels.
