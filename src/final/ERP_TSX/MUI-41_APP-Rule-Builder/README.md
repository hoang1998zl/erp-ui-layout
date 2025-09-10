# MUI-41 — APP-02 Rule_Builder (Mock‑Ready)

**Theo Catalog #41 (APP‑02)**  
UI **trình tạo rule điều kiện (IF/THEN)** với **nhóm AND/OR/NOT** lồng nhau và **predicate** (field + operator + value). Xuất/nhập **JSON rules**, có **evaluator** để test với payload thực tế. Dùng chung cho các module (đặc biệt **APP‑01 Workflow** làm `entryCondition` phức tạp).

## Tính năng
- **Tree editor**: nhóm (**ALL/ANY/NONE**) + điều kiện; thêm/xoá/sắp xếp; đổi **valueType** (string/number/boolean/date); operators:  
  `eq, neq, gt, lt, gte, lte, in, contains, startsWith, endsWith, between, exists, notexists`.
- **JSON preview** + **Import/Export**.
- **Evaluate**: nhập JSON payload ⇒ kết quả **TRUE/FALSE** + **logs** cho từng node.

## Data model (localStorage)
- Key: `erp.app.rules.v1` lưu **RuleNode** gốc (`Group` hoặc `Predicate`).  
```ts
type Predicate = { kind:'predicate', id, field, op, value?, value2?, valueType? }
type Group = { kind:'group', id, logic:'all'|'any'|'none', children: RuleNode[] }
```
- Hàm mock: `getRuleTree/saveRuleTree/seedIfEmpty/evaluate/newPredicate/newGroup`.

## Hợp đồng API thật (đề xuất)
- `GET/PUT /rules/{key}` lưu/đọc cây rule theo `key` (vd: `expense_claim.entry_condition`).  
- `POST /rules:eval` body `{ rule, payload }` ⇒ `{ ok, logs }`.  
- **Versioning**: `ruleset/version`, audit (ADM‑06).  
- **Security**: chỉ **Admin** được sửa; modules khác chỉ **đọc** (read-only).

## Tích hợp
- **APP‑01 Workflow**: dùng JSON rule này cho `stage.entryCondition` với **adapter** nhỏ (hoặc cho phép stage nhận trực tiếp RuleNode).  
- **PROC/FIN/CRM**: dùng làm điều kiện hiển thị field, route SLA, hay bật cảnh báo.

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
