# MUI-17 — HR-03 Leave_Approvals_Inbox (Mock‑Ready)

**Theo Catalog #17 (HR-03)**  
**Hộp thư duyệt nghỉ** cho **Manager**: lọc theo **khoảng thời gian / nhân viên / loại / trạng thái**, sắp xếp, phân trang; hai‑pane **danh sách + chi tiết**; hành động **Duyệt/Từ chối** từng đơn và **Bulk actions**; **Export CSV**.

## Tính năng
- Bộ lọc: From/To, Employee (name/email), Type (AL/SL/UP/WFH), Status (Pending/Approved/Rejected), Sort (Newest/Oldest).
- Bảng: checkbox chọn nhiều (chỉ với **Pending**), cột ID, Employee, Type, Period, Days, Submitted, Status, Actions.
- **Bulk**: Approve (note tuỳ chọn), Reject (lý do bắt buộc).
- Pane phải: **Chi tiết** (thông tin đơn, comment, last action). Nút nhanh **Approve/Reject**.
- **Export CSV** theo bộ lọc hiện tại.
- `adapters` để nối API thật; mock dùng `localStorage` (seed ~28 bản ghi).

## API/Props
```ts
type LeaveApprovalsInboxProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listApprovals: (q: Query) => Promise<Paged<LeaveApproval>>;
    approve: (ids: string[], comment?: string) => Promise<void>;
    reject: (ids: string[], reason: string) => Promise<void>;
    exportCSV: (q: Query) => Promise<Blob>;
  }>;
}
```
- Mặc định dùng mock trong `src/mock/approvals.ts`.

## Hợp đồng API thật (đề xuất)
- `GET /approval-requests` query `from,to,employee,type,status,sort,limit,offset` → `{ rows, total, limit, offset }`
- `POST /approval-requests:bulk` body `{ action:'approve'|'reject', ids:string[], comment?:string, reason?:string }`
- (Tuỳ chọn) `GET /approval-requests:export` (CSV)

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/manager/approvals/leave` trong App Shell (#1).  
- Kết hợp **HR-02 ESS_Leave_Request** (nguồn đơn) và **Org Settings Approvals (#11)** để định tuyến phê duyệt.  
- Ghi **audit logs** cho hoạt động duyệt/từ chối (xuất qua **ADM-06 Audit_Export #12**).
