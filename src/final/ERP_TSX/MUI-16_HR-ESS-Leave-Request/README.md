# MUI-16 — HR-02 ESS_Leave_Request (Mock‑Ready)

**Theo Catalog #16 (HR-02)**  
Form **Đăng ký nghỉ phép** cho nhân viên: chọn **loại nghỉ**, **khoảng ngày** có **nửa ngày (AM/PM)**, tự tính **số ngày làm việc** trừ **cuối tuần & ngày lễ VN (demo)**, **đính kèm** tài liệu, xem **quỹ nghỉ** và **đơn gần đây**. Gửi **Submit** → lưu mock & cập nhật quỹ.

## Tính năng
- **Loại nghỉ**: Annual (AL), Sick (SL), Unpaid (UP), Work-from-home (WFH) — demo.
- **Khoảng ngày**: Từ/Đến + phần ngày **Full/AM/PM**, auto tính `days` bằng `businessDays()`.
- **Trừ cuối tuần/Ngày lễ**: Sử dụng danh sách ngày lễ VN mẫu (2025) — có thể thay bằng API lịch.
- **Đính kèm**: chọn nhiều file (tối đa 5), hiển thị tên/kích thước, xóa từng file.
- **Quỹ nghỉ**: hiển thị Entitled/Carried/Used/Remaining theo loại; cảnh báo khi **không đủ quỹ** (không chặn submit — policy check sẽ làm sau).
- **Đơn gần đây**: bảng đơn đã gửi (mock).
- `adapters` để nối API thật; UI giữ nguyên.

## API/Props
```ts
type ESSLeaveRequestProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listLeaveTypes: () => Promise<LeaveType[]>;
    listVN_Holidays: (year:number) => Promise<Holiday[]>;
    getBalances: (year:number) => Promise<LeaveBalance[]>;
    createLeaveRequest: (payload: any) => Promise<LeaveRequest>;
    listMyRequests: (limit?:number, offset?:number) => Promise<{ rows: LeaveRequest[]; total: number; }>;
    businessDays: (start:string, end:string, sp:'full'|'am'|'pm', ep:'full'|'am'|'pm', holidays:Holiday[]) => number;
  }>;
}
```
- Mặc định dùng mock `localStorage` (`src/mock/leave.ts`).

## Hợp đồng API thật (đề xuất)
- `GET /hr/leave/types` → `LeaveType[]`
- `GET /hr/leave/balances?year=2025` → `LeaveBalance[]`
- `GET /hr/holidays?year=2025&country=VN` → `Holiday[]`
- `POST /hr/leave/requests` body `{ type, start, start_portion, end, end_portion, days, reason?, contact?, backup_person?, attachments[] }` → `LeaveRequest`
- (Tương lai) `POST /approval-requests` tích hợp workflow phê duyệt (Org Settings #11 Approvals).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/ess/leave/request` trong App Shell (#1).  
- Nối **Approvals**: route request -> người duyệt theo **Department Tree (#10)** và chính sách **Org Settings (#11)**.  
- Bổ sung kiểm tra chồng chéo & policy (sau): tối đa ngày/loại, yêu cầu đính kèm khi nghỉ ốm > X ngày, v.v.
