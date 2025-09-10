# MUI-18 — HR-04 Timesheet_Entry (Mock‑Ready)

**Theo Catalog #18 (HR-04)**  
Màn **chấm công theo task** cho **nhân viên** với **daily/weekly views**. Weekly: grid 7 ngày × task, tổng theo ngày & theo task, **Copy tuần trước**, **Submit week** (mock lock). Daily: thêm/sửa/xóa dòng cho ngày hiện tại.

## Tính năng
- **Weekly view** (mặc định): 
  - Chọn ngày bất kỳ trong tuần → hiển thị tuần (Mon–Sun), cột theo ngày. 
  - Hàng theo **Task** (lấy từ PM‑03 mock). Nhập giờ theo ô (step `0.25`, min `0`, max `24`). 
  - **Tổng** theo ngày và tổng tuần; cảnh báo >10h/ngày, >60h/tuần (demo). 
  - **Copy tuần trước**; **Submit week** → khóa chỉnh sửa (mock `isWeekSubmitted()`).
  - Tìm task và **Add row** nhanh (search code/tên/dự án).
- **Daily view**: danh sách dòng của ngày; thêm nhanh task + hours, cập nhật **hours/note**, xóa dòng.
- **Adapters** để gắn API thật; mock dùng `localStorage` (seed ~5 task).

## API/Props
```ts
type TimesheetEntryProps = {
  locale?: 'vi'|'en';
  adapters?: Partial<{
    listMyTasks: (q?:{search?:string;include_inactive?:boolean}) => Promise<Task[]>;
    getEntries: (from:string, to:string) => Promise<TimeEntry[]>;
    upsertEntries: (rows: Array<Omit<TimeEntry,'id'|'created_at'|'updated_at'>>) => Promise<TimeEntry[]>;
    deleteEntry: (dateISO:string, task_id:string) => Promise<void>;
    copyFromPreviousWeek: (weekStartISO:string) => Promise<number>;
    getWeekView: (weekStartISO:string) => Promise<WeekViewData>;
    weekRange: (dateISO:string) => { start:string; days:string[] };
    weekStartISO: (dateISO:string) => string;
    submitWeek: (weekStartISO:string, by?:string) => Promise<SubmitStatus>;
    isWeekSubmitted: (weekStartISO:string) => Promise<SubmitStatus|null>;
  }>;
}
```
- Mặc định dùng mock `src/mock/timesheet.ts`.

## Hợp đồng API thật (đề xuất)
- `GET /pm/tasks?assignee=me&active=true&search=` → `Task[]`
- `GET /time/entries?from=YYYY-MM-DD&to=YYYY-MM-DD` → `TimeEntry[]`
- `PUT /time/entries:bulk` body `{ rows: Array<{ date, task_id, hours, note? }> }` → `TimeEntry[]`
- `POST /time/weeks/{weekStart}:submit` → `{ week_start, submitted_at, by, total_hours }`
- `GET /time/weeks/{weekStart}:status` → `SubmitStatus|null`

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp
- Mount `/ess/timesheet`.  
- Kéo **Task** từ module **PM‑03** (Projects/Tasks).  
- Sau Submit: gửi **Approval** cho line manager (nếu chính sách cần), ghi **audit** (#12).
