# Canonical iFlux Design System

## 1. Định nghĩa

`design_system/` là **Single Source of Truth duy nhất cho UI contract của iFlux**.

Pattern, Template, Page và Widget thực tế là **consumer** của Design System.

Design System không sở hữu business runtime, domain/API logic hoặc implementation đặc thù không thuộc UI contract.

Dependency bắt buộc:

```text
Pattern / Template / Page / Widget
                  ↓
            Design System
````

Design System không phụ thuộc ngược consumer. Không circular dependency.

---

## 2. Phạm vi và phân cấp

```text
design_system/
├── 01_tokens/
├── 02_foundation/
├── 03_primitives/
├── 04_components/
└── 05_widgets/
```

Dependency chuẩn:

```text
05_widgets
    ↓
04_components
    ↓
03_primitives
    ↓
02_foundation
    ↓
01_tokens
```

Layer trên được consume layer dưới. Không dependency ngược.

### `01_tokens/`

Giá trị chuẩn dùng chung: color, typography value, spacing, size, radius, shadow, motion, breakpoint, semantic/theme.

Được phép bổ sung token khi cần, nhưng phải:

* reuse token hiện có trước;
* thêm đúng family;
* đúng file owner;
* đúng naming convention;
* không tạo namespace song song.

### `02_foundation/`

Reset, fonts, typography, layout/grid, icons, accessibility và responsive infrastructure.

Foundation không chứa responsibility của Component, Widget, Pattern hoặc Page cụ thể.

### `03_primitives/`

UI nguyên tử như Button, Chip, Badge, Avatar, Progress, Alert.

### `04_components/`

Khối UI có cấu trúc hoặc behavior tái sử dụng như Card, Tabs, Table, Form, Search, Pagination, Drawer, Modal, Toast, Chat, Page Header, Data List.

### `05_widgets/`

Chỉ dành cho **generic reusable Widget UI contract**. Không chứa specific Widget/Page implementation.

---

## 3. Luật ownership và reuse

Trước khi thêm code phải xác định:

> **Responsibility này thuộc owner nào?**

```text
Giá trị chuẩn
→ 01_tokens

Luật nền toàn hệ thống
→ 02_foundation

UI object nhỏ độc lập
→ 03_primitives

Reusable UI capability
→ 04_components

Reusable functional block
→ 05_widgets
```

Sau đó xử lý theo thứ tự:

### A. Owner đã có đúng contract

→ **REUSE EXISTING**

### B. Owner đúng nhưng contract chưa đủ

→ **EXTEND EXISTING**

### C. Responsibility mới chưa có contract

→ **CREATE tại đúng Owner**

### D. Business/runtime

→ **OUTSIDE DESIGN SYSTEM**

Không được chọn layer chỉ dựa vào property.

Không phải:

* hardcode → Token;
* layout → Foundation;
* block lớn → Widget.

**Ownership trước. Tokenization sau.**

---

## 4. Mapping từ Pattern / Legacy

Legacy Pattern là baseline visual/behavior dùng để hoàn thiện Design System.

Mapping bắt buộc:

```text
Legacy responsibility
        ↓
Xác định Owner 01–05
        ↓
Rà existing contract
        ↓
REUSE / EXTEND / CREATE đúng Owner
        ↓
Verify
        ↓
Migrate consumer
        ↓
Remove Legacy
```

Không được giữ CSS/JS ở Pattern chỉ vì Design System hiện chưa có contract.

Mục tiêu:

```text
DESIGN_SYSTEM_COVERAGE >= 99%
PATTERN_VISUAL_AUTHORITY = 0
```

---

## 5. CSS ownership

Class canonical của Design System dùng prefix `.ifx-*`.

Không:

* redefine `.ifx-*` trong consumer;
* dùng `!important` để vá ownership sai;
* tạo specificity chain;
* tạo namespace UI song song;
* giữ Legacy class/token sau migration.

Nếu contract thiếu → sửa đúng owner trong Design System.

---

## 6. JS ownership

Design System JS chỉ chứa generic UI behavior thuộc đúng Primitive/Component/Widget, ví dụ Tabs, Drawer, Modal, Pagination, Toast hoặc generic Chat interaction.

Business API, auth session, entitlement, redirect business, domain validation, persistence và data processing không thuộc Design System.

Pattern không được giữ generic Component JS chỉ vì Design System hiện chưa đủ.

---

## 7. Design System và Pattern

```text
DESIGN SYSTEM
= UI authority

PATTERN
= template/reference consumer
```

Pattern consume Design System. Design System không import Pattern.

Pattern chỉ nên giữ:

* HTML/template composition;
* demo/sample data;
* fixture/content;
* configuration;
* canonical init.

Không có Global Pattern layer trong Design System.

`page-header` và `data-list` là Component vì là reusable composed UI contract.

---

## 8. `reference-layers.css`

`reference-layers.css` là:

```text
LEGACY COMPATIBILITY DEBT
NO NEW RULE
```

Từ architecture lock trở đi file chỉ được giảm, không được tăng.

Rule cũ phải migrate theo đúng owner `01→05`.

Khi consumer cuối cùng = 0 → xóa file.

---

## 9. Khi nào contract / migration hoàn tất

Một contract chỉ hoàn tất khi:

1. Source canonical tồn tại.
2. Ownership đúng.
3. Không duplicate owner.
4. Consumer dùng trực tiếp được.
5. Acceptance/demo tồn tại khi cần.
6. Không regression ngoài phạm vi duyệt.

Migration chỉ hoàn tất khi:

```text
CANONICAL_LIVE_IMPLEMENTATION = 1
PARALLEL_IMPLEMENTATION = 0

LEGACY_LIVE_CONSUMER = 0
LEGACY_RUNTIME_PATH = 0
LEGACY_CLASS = 0
LEGACY_TOKEN = 0
LEGACY_JS_CONTRACT = 0
UNMAPPED_LEGACY_HARDCODE = 0

PATTERN_VISUAL_AUTHORITY = 0
MATERIAL_VISUAL_DELTA = 0
BEHAVIOR_REGRESSION = 0
```

Nếu chưa đạt → **MIGRATION = NOT COMPLETE**.

---

## 10. Điều cấm

Không:

* tạo `design_system/patterns/`;
* tạo Design System thứ hai;
* đặt Pattern/Page/Widget cụ thể trong Design System;
* dùng Pattern làm nơi chứa phần DS chưa hoàn thiện;
* thêm token trùng responsibility đã có;
* tạo folder/API chỉ để đủ kiến trúc;
* chuyển business runtime vào Design System;
* dùng Sandbox/Workbench làm production UI owner.

---

## 11. Manifests

```text
MANIFESTS = OPTIONAL / NOT ESTABLISHED
```

Chỉ tạo khi có requirement machine-readable registry thực tế.

```