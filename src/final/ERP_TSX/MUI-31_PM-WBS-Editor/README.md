# MUI-31 — PM-08 WBS_Editor (Mock‑Ready)

**Theo Catalog #31 (PM‑08)**  
Trình **biên soạn WBS nhiều cấp** với **đánh số auto** (1, 1.1, 1.1.1...), **indent/outdent/reorder**, thuộc tính **Type/Owner/Start/Finish/Effort/Cost/%complete/Status/Predecessors**, **roll‑up** tổng Effort/Cost/% hoàn thành. Hỗ trợ **Import** từ **PM‑06 Subtask tree** và **Export CSV/JSON**.

## Tính năng
- **Cấu trúc nhiều cấp**: thêm **Root/Child/Sibling**, **Up/Down**, **Indent/Outdent**, xoá cả nhánh.  
- **WBS code** tự động theo thứ tự hiển thị.  
- **Thuộc tính** mỗi node: **Type** (*phase/deliverable/work_package/task/milestone*), **Owner** (đọc từ **project.team** của PM‑07), **Dates**, **Effort (h)**, **Cost**, **%complete**, **Status**, **Predecessors** (chọn nhiều).  
- **Roll‑up**: tổng Effort/Cost, **%complete** tính theo **trọng số Effort**; Start/Finish là min/max toàn nhánh.  
- **KPIs tổng quan**: % hoàn thành chung, tổng Effort/Cost toàn cây.  
- **Import từ PM‑06**: đọc `erp.pm.task.subtree.v1` (nếu WBS chưa tồn tại) → tạo WBS tương ứng.  
- **Export**: CSV/JSON.

## Mock API & Storage (localStorage)
- Key: `erp.pm.wbs.v1` → `Map<project_id, WbsNode[]>`.  
- API:  
  - `listWbs(project_id)` → `TreeNode[]` (tự tính `code`, `rollup`).  
  - `upsertNode(project_id, payload)` / `deleteNode(project_id, id)`.  
  - `reorderUp/Down` / `indentNode/outdentNode`.  
  - `importFromSubtask(project_id)` (từ PM‑06).  
  - `exportCSV(project_id)` / `exportJSON(project_id)`.  
  - `listProjects()` / `listTeam(project_id)` để bind Owner.

## Hợp đồng API thật (đề xuất)
- `GET /projects/{id}/wbs` → `[WbsNode]` (phẳng: `id,parent_id,order,...`)  
- `POST /projects/{id}/wbs` (add) / `PATCH /projects/{id}/wbs/{nid}` (update) / `DELETE /projects/{id}/wbs/{nid}` (delete subtree)  
- `POST /projects/{id}/wbs/{nid}:move` body `{ parent_id, order }`  
- `POST /projects/{id}/wbs:import_from_subtasks` (tuỳ chọn)  
- **Server compute**: số **WBS code**, **roll‑ups**, và validate **predecessors** (không tạo vòng).  
- **RBAC**: chỉ PM/Owner/Manager được sửa.

## Tích hợp
- Từ **PM‑01/02** mở WBS của project.  
- **PM‑03/04/06** có thể tham chiếu WBS để gán task vào **work package**.  
- **Reporting**: xuất WBS để import sang MS Project / Primavera (CSV/JSON mapping).

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
