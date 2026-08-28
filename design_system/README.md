# Canonical iFlux Design System

## 1. Định nghĩa

`design_system/` là **Single Source of Truth cho các UI contract dùng chung của iFlux**.

Design System chỉ sở hữu những gì có tính **generic, reusable và độc lập với một Pattern/Page/Widget cụ thể**.

Design System **không** sở hữu implementation riêng của Pattern cụ thể, Page cụ thể, Widget cụ thể, business runtime hoặc domain/API logic.

Dependency bắt buộc:

```text
Pattern ───────► Design System
Page ──────────► Design System
Widget thực tế ─► Design System

Design System ─X─► Pattern/Page/Widget cụ thể
```

Không circular dependency.

## 2. Phạm vi

```text
design_system/
├── tokens/
├── foundation/
├── primitives/
├── components/
├── widgets/
├── adapters/
├── sandbox/
├── workbench/
└── scripts/
```

### `tokens/`
Nguồn token dùng chung toàn hệ thống. Không thêm token chỉ để giải quyết một Pattern/Page/Widget cụ thể.

### `foundation/`
Reset, fonts, typography, layout/grid, icons. Foundation không chứa CSS của AppShell, Page hay Widget cụ thể.

### `primitives/`
UI nguyên tử như Button, Chip, Badge, Avatar, Progress, Alert.

### `components/`
Khối UI có cấu trúc hoặc behavior tái sử dụng như Card, Tabs, Table, Form, Search, Pagination, Drawer, Modal, Toast, Chat generic component, Page Header, Data List.

### `widgets/`
Chỉ dành cho **generic Widget UI contract**. Không chứa specific widget implementation.

### `adapters/`
Adapter UI generic khi thật sự cần. Không chứa business logic.

### `sandbox/`
Catalog / acceptance surface của Design System. Primary scope: Tokens, Foundation, Primitives, Components, Widgets. Viewport playground ở Foundation. Theme toggle ở Workbench toolbar.

Sandbox không phải Pattern library và không phải nơi chứa CSS giả lập Page/Module/Widget cụ thể.

### `workbench/`
Shared viewer/AppShell có thể hiển thị Design System và Patterns. Việc cùng hiển thị không có nghĩa Pattern thuộc Design System.

### `scripts/`
Build / verify / governance scripts.

## 3. Luật ownership

Khi một Pattern/Page/Widget cần UI:

### A. Design System đã có đúng contract
→ **REUSE EXISTING**

### B. Có đúng use case nhưng thiếu reusable variant hợp lệ
→ **EXTEND EXISTING**

### C. Use case mới nhưng generic và reusable
→ **CREATE NEW DESIGN SYSTEM CONTRACT**

### D. Chỉ phục vụ một Pattern/Page/Widget cụ thể
→ **LOCAL CONSUMER CODE**

### E. Business/runtime
→ **OUTSIDE DESIGN SYSTEM**

## 4. CSS ownership

Class canonical của Design System dùng prefix `.ifx-*`.

Không redefine `.ifx-*` trong consumer, không dùng `!important` để vá ownership sai, không tạo specificity chain, không đưa CSS Pattern/Page vào Foundation, không thêm Global contract chỉ vì một màn hình cần.

Consumer được phép có CSS local nếu responsibility không thuộc Design System.

## 5. JS ownership

Design System JS chỉ chứa generic UI behavior như Tabs, Drawer, Modal, Pagination, Toast, password reveal, generic OTP field behavior hoặc generic Chat interaction khi thật sự reusable.

Business API, auth session, entitlement, redirect business, domain validation, data processing không thuộc Design System.

## 6. Design System và Pattern

Hai hệ ngang hàng:

```text
DESIGN SYSTEM
= reusable UI contracts

PATTERN
= canonical template/reference implementation
```

Pattern consume Design System. Design System không import Pattern.

Không có Global Pattern layer.

`page-header` và `data-list` được phân loại là Component vì là reusable composed UI contract.

## 7. `reference-layers.css`

`design_system/sandbox/assets/reference-layers.css` là:

```text
LEGACY COMPATIBILITY DEBT
NO NEW RULE
```

Từ architecture lock trở đi file chỉ được giảm, không được tăng.

Các block cũ phải migrate dần về Pattern-local CSS hoặc Design System nếu chứng minh được là generic reusable contract.

Khi consumer cuối cùng = 0 → xóa file.

## 8. Khi nào contract được coi là hoàn tất

Một contract chỉ hoàn tất khi:
1. Source canonical tồn tại.
2. Ownership đúng.
3. Không duplicate owner.
4. Consumer dùng trực tiếp được.
5. Sandbox có acceptance/demo khi cần visual acceptance.
6. Không tạo regression ngoài phạm vi đã duyệt.

## 9. Điều cấm

Không:
- tạo `design_system/patterns/` như Global layer mới
- đặt Pattern/Page/Widget cụ thể trong Design System
- thêm token cho một consumer đơn lẻ
- tạo folder/API chỉ để đủ kiến trúc
- chuyển business runtime vào Design System
- dùng Sandbox làm lower-layer production CSS host

## 10. Manifests

```text
MANIFESTS = OPTIONAL / NOT ESTABLISHED
```

Chưa tạo `design_system/manifests/`. Chỉ tạo khi có requirement machine-readable registry thật.
