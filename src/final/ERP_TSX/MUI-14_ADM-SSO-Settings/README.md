# MUI-14 — ADM-08 SSO_Settings (Mock‑Ready)

**Theo Catalog #14 (ADM-08)**  
Màn cấu hình **SSO/OIDC** đa nhà cung cấp: **Microsoft Entra ID, Google, Okta, Custom OIDC**. Hỗ trợ **enforce SSO**, **JIT provisioning**, **group→role mapping**, **domain allowlist**, **client secret hiển thị 1 lần**, **Export/Import JSON** (không chứa secret).

## Tính năng
- Danh sách provider (bật/tắt, đặt **default**, thêm/xóa).
- **Chi tiết provider**: Issuer, Client ID, **Client Secret (Set/Change — hiển thị plaintext 1 lần)**, Scopes, **Redirect URIs** (thêm/xóa), **Claims mapping** (email/name/groups), **Domain allowlist**.
- **Global**: Enforce SSO (trừ super admin), cho phép admin dùng password, **JIT provisioning** + **default role**, **Group→Role mapping**.
- **Import/Export JSON** cấu hình (không xuất plaintext secret).
- Adapter‑ready để nối API thật.

## API/Props
```ts
type SSOSettingsAdminProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    getSettings: () => Promise<SSOSettings>;
    saveSettings: (payload: SSOSettings) => Promise<void>;
    exportJSON: () => Promise<string>;
    importJSON: (file: File) => Promise<void>;
    addProvider: (t: ProviderType) => Promise<OIDCProvider>;
    updateProvider: (id:string, patch: Partial<OIDCProvider>) => Promise<OIDCProvider>;
    deleteProvider: (id:string) => Promise<void>;
    setClientSecret: (id:string, plaintext:string) => Promise<void>;
    toggleProvider: (id:string, active:boolean) => Promise<void>;
    setDefaultProvider: (id:string|null) => Promise<void>;
  }>;
}
```
- Mặc định dùng mock `localStorage`. Khi nối **API thật**, chỉ cần override các `adapters` (UI giữ nguyên).

## Hợp đồng API thật (đề xuất)
- `GET /sso/settings` → `SSOSettings` (metadata, không có plaintext secrets)
- `PUT /sso/settings` body `SSOSettings`  
- `POST /sso/providers` body `{ type, name, ... }` → `OIDCProvider`
- `PATCH /sso/providers/{id}` body `Partial<OIDCProvider>` → `OIDCProvider`
- `DELETE /sso/providers/{id}`
- `POST /sso/providers/{id}:secret` body `{ plaintext }` (hash & store securely; không trả plaintext)
- `POST /sso/providers/{id}:toggle` body `{ active }`
- `POST /sso/providers/{id}:default`
- `GET /sso/settings:export` / `POST /sso/settings:import`

## Bảo mật & tuân thủ
- **Không lưu plaintext secrets**; chỉ nhận tại `:secret` rồi hash/khóa HSM/KMS.  
- **Audit logs** mỗi thay đổi (#12).  
- Xác thực redirect URIs (đúng scheme HTTPS, không wildcard nguy hiểm).  
- Cân nhắc **PKCE** và **Refresh Token Rotation**; giới hạn phạm vi (scopes).  
- Với doanh nghiệp VN, mapping bộ phận → vai trò khớp **Department Tree (#10)** và **RBAC (#8/#9)**.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/admin/security/sso`.  
- Trang **Đăng nhập** đọc `default_provider` để hiển thị nút **"Sign in with …"**.  
- Khi bật **enforce SSO**, chặn password login trừ super admin hoặc admin theo chính sách.
