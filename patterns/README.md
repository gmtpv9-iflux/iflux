# Canonical iFlux Pattern Library

## 1. Định nghĩa

`patterns/` là **Canonical Template Library** của iFlux.

Pattern là hệ độc lập, ngang hàng với Design System.

```text
Pattern ───────► Design System
```

Pattern sử dụng Design System để xây template. Pattern **không phải một layer của Design System**.

## 2. Công năng

Pattern có 5 vai trò:

1. **Preview** — xem trực tiếp template hoàn chỉnh.
2. **Reference** — mẫu visual/template chuẩn để đối chiếu.
3. **Acceptance surface** — kiểm chứng Design System có thể compose thành UI thực tế như thế nào.
4. **Template library** — lưu template có thể tái sử dụng.
5. **Future template source** — có thể tiến tới trở thành nguồn template để Admin lựa chọn và áp dụng.

## 3. Cấu trúc

```text
patterns/
├── auth/
├── charts/
├── chat/
├── form-add/
├── order-detail/
├── order-list/
├── referrals/
├── table-list/
├── user-profile/
├── wizard/
└── widgets/   # chỉ tạo khi có pattern widget thực tế
```

Không tạo folder rỗng chỉ để đủ tree.

## 4. Pattern được phép sở hữu gì

Một Pattern được phép có:

```text
index.html
*.html
*.css
*.js
local assets nếu thật sự cần
```

Pattern-local CSS/JS là hợp lệ khi responsibility chỉ thuộc template đó.

## 5. Luật sử dụng Design System

Khi build hoặc normalize Pattern:

### A. Design System đã có đúng contract
→ dùng Design System.

### B. Có cùng use case nhưng thiếu reusable variant hợp lệ
→ đề xuất extend Design System.

### C. Có generic capability mới thật sự
→ đề xuất contract mới trong Design System.

### D. Chỉ thuộc Pattern hiện tại
→ để local trong Pattern.

Không cố ép mọi CSS/JS dư vào Design System.

## 6. Pattern không phải gì

Pattern không phải:
- Design System layer
- Global Component mặc định
- production business runtime
- nơi chứa API/domain logic
- nơi copy toàn bộ AppShell nếu AppShell không thuộc template

Pattern có thể mô phỏng interaction cần cho preview, nhưng không kéo business runtime vào chỉ để demo.

## 7. Visual/template parity

Khi Pattern có Legacy SoT:

> Legacy quyết định visual/template target.  
> Canonical Design System quyết định implementation và ownership.

Canonicalization không được tự ý thay đổi visual grammar, dimensions, hierarchy, copy demo khi copy thuộc parity, screen/state composition hoặc behavior cần giữ.

Quy trình rebuild chuẩn:

```text
1. Exact clone
2. Template isolation
3. Mapping audit — 0 edit
4. Apply existing Design System khi cùng responsibility + contract
5. Xử lý phần còn lại:
   - missing generic DS contract, hoặc
   - Pattern-local
6. Regression
```

Không abstract trước khi chứng minh parity.

## 8. AppShell và Workbench

Workbench là viewer chung và có thể render Pattern trong main host/iframe.

Shared Workbench AppShell không thuộc Pattern.

Pattern canvas không tự nhúng thêm Workbench/Admin sidebar nếu sidebar đó không thuộc bản thân template.

## 9. CSS/JS local

Pattern-local code không dùng prefix `.ifx-*`.

`.ifx-*` dành cho Canonical Design System contract.

Không dùng `!important`, specificity escalation hoặc redefine `.ifx-*` nếu vấn đề thực chất là thiếu Design System contract.

## 10. `reference-layers.css`

Pattern cũ có thể còn phụ thuộc:

```text
design_system/sandbox/assets/reference-layers.css
```

Đây là debt tạm thời.

Rule mới:

```text
NO NEW RULE
```

Khi từng Pattern được rebuild/normalize:
- generic reusable capability → Design System
- Pattern-specific presentation → Pattern-local CSS

Mục tiêu cuối:

```text
reference-layers.css consumer = 0
→ delete
```

## 11. Runtime

Pattern có thể có JS demo cho tab, UI open/close, append demo item, toast demo, local interaction.

Không đưa business runtime thật vào Pattern chỉ để preview.

## 12. Catalog hiện tại

- Auth
- Charts
- Chat
- Form Add
- Order Detail
- Order List
- Referrals
- Table List
- User Profile
- Wizard

Forensic snapshot/archive không phải catalog item.

Chat hiện tại có thể là artifact chưa canonical; rebuild theo task riêng.
