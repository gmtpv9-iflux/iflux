# Design System — Templates (khung hiển thị của Widget)

## 1. Vai trò

Widget là giá trị cốt lõi số 1 của iFlux. `05_templates/` sở hữu **toàn bộ phần nhìn (UI) của Widget**, để mọi widget trên mọi nền tảng dùng chung một ngôn ngữ giao diện.

```text
design_system/05_templates/        → UI: khung, bố cục, trạng thái (không dữ liệu, không nghiệp vụ)
modules/<module>/widgets/<widget>/ → Widget: dữ liệu + nghiệp vụ, gắn vào một template
```

Template consume `01_tokens` → `04_components`. Widget consume template. Không phụ thuộc ngược.

## 2. Thuộc layer này

Chỉ tạo khi có widget thật cần tới (README gốc §3.2):

- khung widget: vỏ, header (tiêu đề, mô tả, hành động), toolbar, body, footer;
- bố cục nội dung dùng chung: chỉ số (KPI), danh sách, bảng, biểu đồ, lưới thẻ;
- trạng thái: đang tải, trống, lỗi;
- biến thể mật độ / kích thước và hành vi responsive chung của widget.

## 3. Không thuộc layer này

- Widget cụ thể (WGT-MKT-001, Market Overview, Money Flow, News Card…) → `modules/<module>/widgets/`.
- Gọi API, lấy dữ liệu, xử lý nghiệp vụ.
- Style chỉ phục vụ một nền tảng → `platform/web/` (`uw-*`) hoặc `platform/admin/` (`adm-*`).
- Style chỉ phục vụ một module → `modules/<module>/`, chỉ module đó nạp.

## 4. Quy tắc

- Class dùng tiền tố `ifx-` như các layer khác của Design System.
- Mỗi template là một file nhỏ riêng, để trang chỉ nạp template mình dùng.
- Không tạo template "cho đủ bộ"; template không còn widget nào dùng thì gỡ.
