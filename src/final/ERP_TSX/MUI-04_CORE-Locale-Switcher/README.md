# MUI-04 — CORE-04 Localization_Switcher (Mock‑Ready)

**Theo Catalog #4**  
Chuyển **song ngữ VI–EN**, chọn **tiền tệ (VND/USD)**, **múi giờ**; hiển thị **xem trước định dạng** số, tiền, ngày/giờ. Lưu vào `localStorage` theo user.

## Thành phần
- `I18nProvider` — cung cấp `t()`, `formatNumber`, `formatCurrency`, `formatDate`, `formatTime` + state `locale/currency/timeZone`.
- `useI18n()` — hook lấy ngữ cảnh i18n.
- `LocaleSwitcher` — UI đổi ngôn ngữ/tiền tệ/múi giờ với preview + Apply/Reset.

## API
```ts
<I18nProvider
  defaultLocale="vi"
  defaultCurrency="VND"
  defaultTimeZone="Asia/Ho_Chi_Minh"
>
  {/* children */}
</I18nProvider>

// useI18n() returns:
{
  locale, currency, timeZone,
  t(key), formatNumber(n), formatCurrency(n),
  formatDate(date), formatTime(date),
  setLocale(loc), setCurrency(cur), setTimeZone(tz), reset()
}
```

## Cách chạy (Vite React + TS)
```bash
npm create vite@latest my-erp -- --template react-ts
cd my-erp && npm i
# copy thư mục src/ trong gói này vào ./src của dự án
npm run dev
```

## Gợi ý tích hợp với **MUI-01 AppShell_Nav**
- Mount `<LocaleSwitcher />` ở **top bar dropdown** hoặc **settings panel**.
- Toàn app sử dụng `I18nProvider`; các micro‑UI chỉ cần gọi `useI18n().t('key')` và formatter.
- Tương lai có thể bổ sung **bundle dịch riêng cho từng micro‑UI** (merge vào `dict`).

## Lưu ý
- Không dùng thư viện ngoài; dùng `Intl` chuẩn.
- Mặc định `Asia/Ho_Chi_Minh`, `VND`, `vi` cho Việt Nam; có thể mở rộng thêm danh mục múi giờ & tiền tệ.
```
