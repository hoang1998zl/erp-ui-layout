
# MUI-61 — KPI-01 KPI_BudgetVsActual_Widget (Mock‑Ready)

**Theo Catalog #61 (KPI‑01)**  
Widget **Ngân sách vs Thực chi** cho **CEO / Finance / PM**. Nguồn dữ liệu từ `kpis.json` (mock tổng hợp từ **Budgets** + **Expenses approved**).

## Tính năng
- **Filter**: năm, **scope** (*Overall / By Cost Center / By Project*).  
- **Vòng tròn %** (Budget utilization), **cards** Budget/Actual/Variance.  
- **Biểu đồ cột** 12 tháng (Budget vs Actual).  
- **Top vượt ngân sách** theo **Cost Center** (variance & %).  
- **Export CSV** (12 hàng theo tháng).

## Mock data
- `src/mock/budget.ts` → seed **monthly budgets** theo Cost Center & Category.  
- `src/mock/expense.ts` → seed **approved expenses** theo tháng/CC/Project.  
- `src/mock/kpis.ts` → hàm `budgetVsActual({year, dim, key})` tạo **kpis.json** tương đương.

## API thật (đề xuất)
- `GET /kpis/budget-vs-actual?year=&dim=&key=` → trả về cấu trúc:
```jsonc
{
  "year": 2025,
  "scope": "Cost Center SALES",
  "series": [{"month":1,"budget":123,"actual":100}, ...],
  "total_budget": 123456789,
  "total_actual": 100234567,
  "variance": -2322222,
  "variance_pct": -1.9,
  "by_dim": [{"key":"SALES","budget":..., "actual":..., "variance":..., "variance_pct":...}]
}
```
- Hỗ trợ **cache** theo tháng/năm; cập nhật khi **FIN‑06** (Budget) hoặc **FIN‑10** (Expense Approved) thay đổi.

## Chạy demo (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```
