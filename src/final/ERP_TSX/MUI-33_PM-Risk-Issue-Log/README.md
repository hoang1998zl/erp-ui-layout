# MUI-33 — PM-10 Risk_Issue_Log (Mock‑Ready)

**Theo Catalog #33 (PM‑10)**  
Sổ **Rủi ro & Vấn đề** cho dự án: tạo/sửa/xoá, **owner**, **status**, **likelihood/impact (1‑5)**, tính **score** & **severity band** (low/medium/high/critical), **risk matrix 5×5**, **bộ lọc**, **export CSV/JSON**.

## Tính năng
- **Project scope**: chọn dự án (đọc `erp.pm.projects.v1`).  
- **CRUD nhanh**: Add Risk/Issue, sửa inline **Title/Type/Status/Owner/Likelihood/Impact/Due/Category/Labels/Identified/Description**.  
- **Tính điểm**: `score = likelihood × impact`, phân bậc `low/medium/high/critical`.  
- **Risk Matrix 5×5**: heatmap theo **Likelihood × Impact**, click để áp dụng filter nhanh (chỉ đếm **Risk**).  
- **Filters**: Type (all/risk/issue), **Status**, **Owner**, **Severity**, **Search**, **Overdue only**.  
- **Export**: CSV/JSON.
  
## Mock API (localStorage)
- Key: `erp.pm.risk_issue.v1` → `Map<project_id, RiskIssue[]>`.  
- API: `listItems(project_id)` / `upsertItem(project_id, payload)` / `deleteItem(project_id, id)` / `exportCSV` / `exportJSON` / `heatmap(project_id)`  
- `listProjects()` / `listEmployees()` để bind Project & Owner.

## Hợp đồng API thật (đề xuất)
- `GET /projects/{id}/risk-issues` / `POST` / `PATCH/{rid}` / `DELETE/{rid}`  
- Server compute **score + severity band**; validate **fields**; log **audit**.  
- **RBAC**: PM/Owner chỉnh sửa; member chỉ comment (mở rộng: discussion thread).  
- **Integration**: link **WBS/Task** khi có id; đẩy **notifications** khi severity ≥ high.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
