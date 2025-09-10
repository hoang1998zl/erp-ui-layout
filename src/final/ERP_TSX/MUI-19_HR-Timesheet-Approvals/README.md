# MUI-19 — HR-05 Timesheet_Approvals (Mock‑Ready)

**Theo Catalog #19 (HR-05)**  
**Hộp thư duyệt timesheet** cho **Manager/PM**: lọc theo **tuần (Mon–Sun) / nhân viên / trạng thái**, sắp xếp theo **ngày nộp/giờ**, phân trang; hai‑pane **danh sách + chi tiết**; **Approve/Reject** từng dòng hoặc **Bulk**; **Export CSV**. Ghi chú: **Lock after approve** (theo catalog) — minh hoạ bằng trạng thái.

## Tính năng
- Bộ lọc: Week from/to (Thứ 2), Employee (name/email), Status (Pending/Approved/Rejected), Sort (Newest/Oldest/Hours ↑↓).
- Bảng: checkbox (chỉ chọn **Pending**), cột Employee, Week, Total hours (cảnh báo >60h/tuần), Submitted, Status, Actions.
- **Bulk actions**: Approve (note tuỳ chọn), Reject (bắt buộc lý do).
- Pane phải: chi tiết **per-day totals** và bảng **By task** (task × 7 ngày + Total).
- **Export CSV** với bộ lọc hiện tại.
- `adapters` để nối API thật; mock seed nhiều tuần, nhiều nhân viên.

## API/Props
```ts
type TimesheetApprovalsInboxProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listTsApprovals: (q: Query) => Promise<Paged<TimesheetApproval>>;
    getTsApproval: (id: string) => Promise<TimesheetApproval | null>;
    approveTs: (ids: string[], comment?: string) => Promise<void>;
    rejectTs: (ids: string[], reason: string) => Promise<void>;
    exportCSV: (q: Query) => Promise<Blob>;
    weekRange: (weekStartISO: string) => string[];
  }>;
}
```
- Mặc định dùng mock `src/mock/tsApprovals.ts` (tự seed dữ liệu).

## Hợp đồng API thật (đề xuất)
- `GET /time/approvals?week_from=&week_to=&employee=&status=&sort=&limit=&offset=` → `{ rows, total, limit, offset }`
- `GET /time/approvals/{id}` → `TimesheetApproval`
- `POST /time/approvals:bulk` body `{ action:'approve'|'reject', ids:string[], comment?:string, reason?:string }`
- `GET /time/approvals:export` (CSV)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/manager/approvals/timesheets`.  
- Nối với **HR‑04 Timesheet_Entry** (nhân viên nộp tuần) và **APP‑03 Approvals** (routing, SLA).  
- Khi **Approved**, API phía server cần **lock** timesheet (chặn sửa) và ghi **audit** (#12).
