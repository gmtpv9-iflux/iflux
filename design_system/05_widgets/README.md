# Design System — Generic Widget Contracts

## 1. Phạm vi

`design_system/widgets/` chỉ dành cho **generic reusable Widget UI contracts**.

Không chứa specific Widget template hoặc business widget implementation.

## 2. Có thể thuộc layer này

Ví dụ hợp lệ:
- widget root/shell
- widget header
- widget title
- widget description
- widget actions
- widget toolbar
- widget body
- widget footer
- loading state
- empty state
- error state
- generic responsive behavior
- generic widget density/layout variant

Chỉ thêm khi có requirement thật và evidence reuse.

## 3. Không thuộc layer này

Không đặt tại đây:
- WGT-MKT-001 cụ thể
- Market Overview cụ thể
- Money Flow cụ thể
- News Card cụ thể
- một Widget riêng của một Page
- business/data fetch
- API/runtime/domain logic
- Pattern HTML cụ thể

Specific Widget implementation là consumer của Design System.

## 4. Decision rule

Khi cần code cho một Widget:

### Design System đã có generic contract đúng
→ reuse.

### Đúng use case nhưng thiếu reusable variant
→ extend existing Widget contract.

### Generic capability mới
→ đề xuất contract mới tại đây.

### Chỉ phục vụ một Widget cụ thể
→ để local tại consumer/template.

## 5. Không invent API

Hiện layer này chỉ được thiết lập scope.

Không tự tạo `.ifx-widget`, `.ifx-widget-header`, `.ifx-widget-body` hoặc CSS/JS generic chỉ để lấp đầy folder.

Chỉ tạo contract khi có requirement thực tế và Owner duyệt.

## 6. Pattern Widget

Pattern Widget là hệ khác:

```text
patterns/widgets/<specific-template>/
```

Pattern Widget có thể consume generic contract từ:

```text
design_system/widgets/
```

Hai khu vực không có quan hệ cha-con.

## 7. Manifests

```text
MANIFESTS = OPTIONAL / NOT ESTABLISHED
```

Không tạo registry/manifests cho Widget cho tới khi có requirement riêng.
