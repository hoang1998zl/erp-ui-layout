# MUI-23 — HR-09 Delegation_Rules_Editor (Mock‑Ready)

**Theo Catalog #23 (HR-09)**  
UI thiết lập **uỷ quyền phê duyệt theo thời gian**: chọn **Owner (người uỷ quyền)** → **Delegate (người nhận)**, phạm vi **module** (Leave/Timesheet/Expense/Purchase hoặc **All**), **khoảng ngày**, **tuỳ chọn cuối tuần / loại trừ ngày lễ / chỉ khi OOO**, và **ghi chú**. Có **danh sách quy tắc** với lọc/sắp xếp, **Export CSV**, **trình soạn thảo** và **What‑if tester**.

## Tính năng
- **List + Filters**: Owner/Delegate (text search), Status (Active/Upcoming/Expired), Module, Sort; phân trang.
- **Editor**: chọn Owner/Delegate (demo bằng hộp thoại tìm nhanh từ **Directory/HR‑07**), Date range, Scope modules (chọn nhiều hoặc **All**), Options (include weekends / exclude company holidays / only when OOO), Comment. **Validation** tránh **trùng phạm vi & trùng ngày** cho **cùng Owner**.
- **Holiday rules**: bảng tham chiếu **Company holidays** (mẫu VN) — khi bật *Exclude company holidays* dùng cho policy ở backend (mock hiển thị).
- **What‑if tester**: nhập `owner_id` + ngày + module → xem sẽ delegate cho ai (dựa trên quy tắc).
- `adapters` để nối API thật; mock đọc **Users** từ `erp.dir.emps.v1` (UI #21) & **Holidays** từ `erp.company.holidays.vn.v1`, lưu **Delegations** ở `erp.approvals.delegations.v1`.

## API/Props
```ts
type DelegationRulesEditorProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listUsers: (q?: { search?: string; active_only?: boolean; limit?: number }) => Promise<User[]>;
    listRules: (q: Query) => Promise<Paged<DelegationRule>>;
    getRule: (id: string) => Promise<DelegationRule | null>;
    upsertRule: (payload: Omit<DelegationRule, 'id'|'created_at'|'updated_at'|'created_by'|'updated_by'> & { id?: string }) => Promise<DelegationRule>;
    deleteRule: (id: string) => Promise<void>;
    exportCSV: (q: Query) => Promise<Blob>;
    getHolidays: () => Promise<Array<{ date: string; name: string }>>;
    resolveDelegate: (owner_id: string, onDateISO: string, module?: ModuleKey) => Promise<{ to: string|null; reason: string }>;
    ruleStatus: (r: DelegationRule) => 'active'|'upcoming'|'expired';
  }>;
}
```

## Hợp đồng API thật (đề xuất)
- `GET /approvals/delegations?owner=&delegate=&status=&module=&limit=&offset=&sort=` → `{ rows, total, ... }`
- `POST /approvals/delegations` → create
- `PUT /approvals/delegations/{id}` → update (validate overlap same owner & scope)
- `DELETE /approvals/delegations/{id}`
- `GET /approvals/delegations:export` (CSV)
- `GET /directory/users?active=true&search=` → `User[]`
- `GET /calendar/holidays?country=VN` → danh sách ngày lễ
- `POST /approvals/delegations:resolve` body `{ owner_id, date, module }` → `{ to, reason }` (phục vụ What‑if tester)

## Gợi ý tích hợp
- Mount `/admin/approvals/delegations`.  
- Liên kết với **APP‑03 Approvals** để áp dụng tại runtime: engine cần xét **ngày làm việc** (weekend/holiday) theo tuỳ chọn, và chỉ áp dụng khi **OOO** nếu bật.  
- Khi thay đổi quy tắc: ghi **Audit log** (ADM‑06 #12); làm **cache bust** cho engine.  
- Có thể bổ sung phạm vi theo **đơn vị** (departments) và **time-of-day** nếu cần.  
- Đảm bảo **RBAC**: chỉ Admin hoặc Owner tự tạo uỷ quyền cho chính mình.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
