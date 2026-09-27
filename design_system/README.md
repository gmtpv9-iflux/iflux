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
└── 05_templates/
```

Dependency chuẩn:

```text
05_templates   (UI của Widget)
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

Chỉ bổ sung token khi có nhu cầu dùng thật (xem §3), và phải:

* reuse token hiện có trước;
* thêm đúng family;
* đúng file owner;
* đúng naming convention;
* không tạo namespace song song;
* token màu/theme có đủ giá trị light và dark.

### `02_foundation/`

Reset, fonts, typography, layout/grid, icons, accessibility và responsive infrastructure.

Foundation không chứa responsibility của Component, Widget, Pattern hoặc Page cụ thể.

### `03_primitives/`

UI nguyên tử như Button, Chip, Badge, Avatar, Progress, Alert.

### `04_components/`

Khối UI có cấu trúc hoặc behavior tái sử dụng như Card, Tabs, Table, Form, Search, Pagination, Drawer, Modal, Toast, Chat, Page Header, Data List.

### `05_templates/`

Khung hiển thị dùng chung của Widget: vỏ, header, body, footer, bố cục KPI / danh sách / bảng / biểu đồ, trạng thái đang tải / trống / lỗi. Template chịu trách nhiệm toàn bộ phần nhìn của Widget; Widget cụ thể (dữ liệu + nghiệp vụ) nằm ở `modules/<module>/widgets/` và gắn vào template. Xem `05_templates/README.md`.

### Ngoài Design System: nền tảng và module

Design System chứa CSS/JS dùng chung toàn hệ thống, mục tiêu giải quyết khoảng 90% UI. Phần còn lại là cục bộ và **không đặt trong `design_system/`**:

```text
platform/web/     → class riêng User Web, tiền tố uw-
platform/admin/   → class riêng Admin, tiền tố adm-
modules/<module>/ → CSS/JS và widget của một module; chỉ module đó nạp
```

Tiền tố `ifx-` chỉ dành cho Design System.

### Tiêu chí thành công

1. **Nạp gì dùng nấy.** File một trang nạp phải được dùng gần hết. Mỗi họ UI là một file nhỏ riêng; nền tảng chỉ gom những họ nó thật sự dùng. Không nạp một file lớn mà trang gần như không dùng.
2. **Phân tầng rõ ràng:** tokens → foundation → primitives → components → templates → widget (ngoài DS).
3. **Mở rộng đa nền tảng.** Token nguồn là JSON, sinh ra CSS/JS cho web; nền tảng mới (app iOS/Android…) thêm đầu ra từ cùng nguồn. Các tầng đặt theo vai trò, không gắn với HTML.

---

## 3. Chiến lược xây khung — nghiệp vụ dẫn dắt

Bài học từ hai lần làm trước:

* **Để từng app tự thêm giá trị** → code chồng chéo, không theo quy tắc. Ví dụ Admin có H1 30px, User Web có H1 29px và H2 26px → lập tức có 3 phiên bản, trong khi chỉ cần 2 (30px và 29px quá gần nhau).
* **Dựng sẵn khung đầy đủ** → khung quá rộng so với nhu cầu (cả trăm màu, hàng chục cỡ chữ) mà phần lớn không ai dùng.

Vì vậy Design System được xây theo nguyên tắc sau.

### 3.1 Khung = vai trò nghiệp vụ, không phải bảng giá trị

Khung là danh mục **vai trò (role)** mà UI iFlux thực sự cần, ví dụ: tiêu đề trang, tiêu đề section, tiêu đề nhóm, nội dung, chú thích; chữ chính / phụ / nhạt; tăng / giảm / tham chiếu của thị trường.

Mỗi role có **đúng một** token hoặc class. Admin và User Web không tự đặt giá trị riêng cho một role đã có.

### 3.2 Chỉ tạo khi cần

Token / class chỉ được tạo khi có consumer thật: foundation, component, widget, hoặc màn hình Admin / User Web cần đến.

Không tạo trước "cho đủ bộ". Token / class không còn consumer phải được gỡ.

### 3.3 Gộp giá trị gần nhau vào thang

Mỗi loại giá trị (cỡ chữ, khoảng cách, bo góc, đổ bóng, …) có **một thang cố định, ít mốc**. Khi gặp giá trị mới:

1. Dùng mốc gần nhất đang có trong thang.
2. Không tạo mốc mới chỉ vì lệch nhỏ (ví dụ 29px và 30px → một mốc).
3. Chỉ thêm mốc khi khác biệt thị giác rõ ràng và có nhiều nơi dùng — phải được Owner duyệt.

Mỗi giá trị chỉ có một tên. Không tạo nhiều tên alias cho cùng một giá trị.

### 3.4 Light và dark

Hệ thống có hai chế độ light và dark.

* Mọi token màu ở tầng semantic / theme phải có **đủ giá trị cho cả light và dark**.
* Component, widget và app chỉ dùng token semantic — không dùng màu primitive hoặc hex trực tiếp — để đổi theme không phải sửa component.
* Bảng màu primitive chỉ chứa những màu mà token semantic đang tham chiếu.

### 3.5 Nguồn bổ sung

`patterns/` là chuẩn UI ưu tiên nhưng không đầy đủ. Phần `patterns/` chưa có (widget, card tin tức, grid, breakpoint, …) được lấy từ User Web và Admin, chuẩn hóa theo §3.1–§3.4 rồi mới đưa vào Design System.

Sau đó Admin và User Web consume Design System, không định nghĩa lại.

---

## 4. Luật ownership và reuse

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

UI dùng chung của Widget
→ 05_templates
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

## 5. Mapping từ Pattern / Legacy

Legacy Pattern là baseline visual/behavior ưu tiên để hoàn thiện Design System. Phần Pattern chưa có lấy từ User Web / Admin theo §3.5.

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

## 6. CSS ownership

Class canonical của Design System dùng prefix `.ifx-*`.

Không:

* redefine `.ifx-*` trong consumer;
* dùng `!important` để vá ownership sai;
* tạo specificity chain;
* tạo namespace UI song song;
* giữ Legacy class/token sau migration.

Nếu contract thiếu → sửa đúng owner trong Design System.

---

## 7. JS ownership

Design System JS chỉ chứa generic UI behavior thuộc đúng Primitive/Component/Widget, ví dụ Tabs, Drawer, Modal, Pagination, Toast hoặc generic Chat interaction.

Business API, auth session, entitlement, redirect business, domain validation, persistence và data processing không thuộc Design System.

Pattern không được giữ generic Component JS chỉ vì Design System hiện chưa đủ.

---

## 8. Design System và Pattern

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

## 9. `reference-layers.css`

`reference-layers.css` là:

```text
LEGACY COMPATIBILITY DEBT
NO NEW RULE
```

Từ architecture lock trở đi file chỉ được giảm, không được tăng.

Rule cũ phải migrate theo đúng owner `01→05`.

Khi consumer cuối cùng = 0 → xóa file.

---

## 10. Khi nào contract / migration hoàn tất

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

## 11. Điều cấm

Không:

* tạo `design_system/patterns/`;
* tạo Design System thứ hai;
* đặt Pattern/Page/Widget cụ thể trong Design System;
* dùng Pattern làm nơi chứa phần DS chưa hoàn thiện;
* thêm token trùng responsibility đã có;
* tạo sẵn token / class chưa có consumer;
* tạo mốc giá trị mới sát mốc đã có trong thang;
* tạo token màu chỉ có light hoặc chỉ có dark;
* tạo folder/API chỉ để đủ kiến trúc;
* chuyển business runtime vào Design System;
* dùng Workbench làm production UI owner.

---

## 12. Manifests

```text
MANIFESTS = OPTIONAL / NOT ESTABLISHED
```

Chỉ tạo khi có requirement machine-readable registry thực tế.

```