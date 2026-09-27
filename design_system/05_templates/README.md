# Design System — Templates (khung hiển thị của Widget)

## 1. Vai trò

Widget là giá trị cốt lõi số 1 của iFlux. `05_templates/` sở hữu **toàn bộ phần nhìn (UI) của Widget**, để mọi widget trên mọi nền tảng dùng chung một ngôn ngữ giao diện.

Widget không sở hữu gì — nó chỉ chọn cấu hình, mỗi phần do một màn Admin quản lý:

```text
Template   → Mẫu giao diện (design_system/05_templates — UI, dựng một lần)
Dữ liệu    → Kiến trúc 4 tầng (nguồn, thuật toán, chọn Template)
Vị trí     → Cài đặt trang → Widget Placement (host, thứ tự, span)
Quyền xem  → Phân quyền sử dụng
```

User Web hiển thị, tại host/vị trí/span đã cấu hình, Template mà widget đã chọn cùng dữ liệu đã cấu hình — không dựng lại UI theo từng widget.

Template consume `01_tokens` → `04_components`. Không phụ thuộc ngược.

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

- **Template quy định toàn bộ UI của Widget, nhưng ghép từ tầng thấp hơn.** Khung = Card (`04_components/03_card`), tiêu đề/mô tả = Title (`.ifx-widget-title`), nhóm chọn = Tabs (`ifx-tabs-segmented`)… Đổi kiểu khung hay tiêu đề chỉ sửa ở tầng thấp, mọi Template đổi theo. CSS của Template chỉ chứa phần thật sự riêng của nó.
- **Khung do Template khai báo, không tự vẽ:** `frame` trả class bổ sung cho Card (vd `ifx-card-accent`), `aside` trả phần phải của header (vd badge cực tính). Phần thân dùng component (Chart, Score rank, Stock row, Treemap…).
- **Một hàm vẽ duy nhất / Template**, đăng ký qua `IfxTemplates.define` (`00_widget/widget.js`), kèm Đầu vào và dữ liệu mẫu của chính Template. Preview (Admin) và Widget (User Web) cùng gọi `IfxTemplates.mount`. Ô dữ liệu trống → dùng dữ liệu mẫu, nên Widget đã đặt vào host không bao giờ trống.
- **Đặt tên khi chuyển từ code cũ:** tên cũ hợp lý hơn cho khung thì tạo bản `-new` (vd `ifx-breadth-stat-new`), xóa code cũ xong đổi tên lại; tên cũ không hợp lý (BEM, tên lạ) thì dùng thẳng tên đúng quy ước DS.

- Class dùng tiền tố `ifx-` như các layer khác của Design System.
- Mỗi template là một file nhỏ riêng, để trang chỉ nạp template mình dùng.
- Không tạo template "cho đủ bộ"; template không còn widget nào dùng thì gỡ.
