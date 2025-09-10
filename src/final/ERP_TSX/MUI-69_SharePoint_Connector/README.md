
# MUI-69 — INT-01 SharePoint_Connector (Mock‑Ready)

**Theo Catalog #69 (INT‑01)**  
**Kết nối SharePoint** cho tài liệu (vai trò **Admin**). Phụ thuộc: **EIM‑01**. Wave: **W2**.

## Tính năng
- **Kết nối (mock)**: nhập **Auth mode / Tenant ID / Client ID / Site Hostname / Site Path** → **Test connection** → lấy **Site + Drives**.
- **Duyệt tài liệu**: chọn **Drive**, điều hướng **breadcrumb**, xem **file/folder** (Tên/Loại/Modified/Size/Owner).  
  Hành động: **New folder**, **Upload**, **Delete** (mock).
- **Mapping ERP → SharePoint**: cấu hình quy tắc (Module → Drive/Path hiện chọn); lưu **localStorage**.
- **Hướng dẫn tích hợp thật**: Azure App, quyền Microsoft Graph, API chính, bảo mật/tuân thủ.

## Cấu trúc mã
- `src/integrations/sharepoint/types.ts` — type definitions.
- `src/integrations/sharepoint/mockGraph.ts` — **Mock Graph client**: `testConnection`, `getSite`, `listDrives`, `listChildren`, `createFolder`, `uploadFile`, `deleteItem`.
- `src/components/integrations/SharePointConnector.tsx` — UI 3 cột: **Settings** • **Browser** • **Mapping/Guide**.
- `src/App.tsx` — runner.

## Tích hợp Microsoft Graph (thật)
1. **App Registration (Entra ID)**: lấy **Tenant ID**, **Client ID**.  
2. Cấp quyền **Microsoft Graph**:  
   - Delegated: `Files.ReadWrite.All`, `Sites.Read.All`, `offline_access`.  
   - App-only: Application permissions **Files.ReadWrite.All**, **Sites.Read.All** (yêu cầu admin consent).  
3. **Auth flow**: 
   - Delegated: dùng **MSAL (PKCE)** trên frontend; access token gửi đến backend làm **proxy** gọi Graph.  
   - App-only: backend dùng **client_credentials** để lấy token.  
4. **API mẫu**:
   - `GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{sitePath}?$select=id,webUrl`
   - `GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives`
   - `GET https://graph.microsoft.com/v1.0/drives/{driveId}/root/children`
   - `PUT https://graph.microsoft.com/v1.0/drives/{driveId}/root:/{path}/{filename}:/content` (upload)
5. **Bảo mật & pháp lý**: lưu token an toàn (server), **RBAC**; **audit** truy cập; tuân thủ **Nghị định 13/2023/NĐ‑CP** về dữ liệu cá nhân.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
