# MUI-24 — PM-01 Project_Creation_Wizard (Mock‑Ready)

**Theo Catalog #24 (PM‑01)**  
Wizard **4 bước**: **General → WBS → Team → Budget** để khởi tạo dự án. Hỗ trợ **Save draft** và **Submit** (chuyển trạng thái `submitted` – chờ phê duyệt ở PM‑05).

## Tính năng
- **Step 1 – General**: Tên, Mã, Khách hàng (tìm nhanh), Loại dự án, Ngày bắt đầu/kết thúc, **Tiền tệ**, mô tả.
- **Step 2 – WBS**: Cấu trúc phân rã công việc (**tree**), thêm Phase/Task, sửa tên, **ước tính giờ** theo task, xoá; tính **tổng giờ**.
- **Step 3 – Team**: Tìm nhân sự (đọc danh bạ từ HR‑07), thêm vào đội ngũ, gán **vai trò** (bao gồm **Project Manager**), nhập **allocation %**, gỡ thành viên. **Yêu cầu**: phải có PM.
- **Step 4 – Budget**: Dòng ngân sách theo **category** (Labor/Expense/Software/…), mô tả, **số tiền**; tính **tổng ngân sách** theo **tiền tệ** đã chọn ở bước General; panel **Summary & checks**.

- **Header** gợi ý nhanh: PM, Tổng ngân sách, Tổng giờ ước tính.  
- **Validation** tối thiểu:  
  - General: tên dự án, tiền tệ; `start_date ≤ end_date` nếu nhập cả hai.  
  - WBS: có ít nhất 1 task.  
  - Team: có ít nhất 1 **Project Manager**.  
  - Budget: tổng > 0.  
- **Save Draft** lưu vào `localStorage`; **Submit** đổi trạng thái `submitted` (mock).

## API/Props & Hợp đồng API thật (đề xuất)
- `POST /projects` body:
```json
{
  "general": { "name": "...", "code": "...", "client_id": "...", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "project_type": "External|Internal|Non-billable", "currency": "VND|USD|..." },
  "wbs": [{ "id":"...", "name":"...", "estimate_hours": 0, "children":[...] }],
  "team": [{ "employee_id":"...", "role":"Project Manager|...", "allocation_pct": 100 }],
  "budget": [{ "category":"Labor|Expense|...", "description":"...", "amount": 0 }]
}
```
- `GET /crm/clients?search=` → danh sách khách hàng.  
- `GET /directory/employees?active=true&search=` → danh sách nhân sự (HR‑07).  
- `GET /finance/currencies` → danh mục tiền tệ.  
- (Tuỳ chọn) `POST /projects/{id}/submit` nếu muốn tách tạo & submit hai bước.
- **Tích hợp**:  
  - **PM‑05**: luồng phê duyệt khởi tạo dự án (dựa trên PM, cấp duyệt, hạn mức ngân sách).  
  - **FIN‑04/FIN‑05**: ánh xạ **category** vào **CoA/Cost Center**, quy đổi ngoại tệ, baseline budget.  
  - **ADM‑03**: chuẩn hoá mã **Project code** (quy tắc đặt tên).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
