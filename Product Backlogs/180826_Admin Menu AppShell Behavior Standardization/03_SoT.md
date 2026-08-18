# SoT — Admin AppShell & Menu Runtime Architecture

**Scope:** Admin
**Authority:** Owner Locked
**Status:** SoT
**Effective:** 18/08/2026
**Supersedes:** Các quy định runtime trước đây trái với SoT này
**Related:** Product Routing Identity & Localized URL Architecture

---

# 1. Mục đích

Thiết lập kiến trúc runtime chuẩn cho Admin AppShell, trong đó:

```text
Admin AppShell
├── Header
├── Menu / Sidebar
└── Page Host
```

Header và Menu là **persistent application chrome**.

Khi Admin chuyển Page:

```text
AppShell
├── Header       → giữ nguyên
├── Menu         → giữ nguyên
└── Page Host    → thay đổi
```

Không được unload/recreate toàn bộ AppShell chỉ vì navigation.

---

# 2. AppShell là Runtime Boundary

Admin AppShell là boundary sống xuyên suốt navigation lifecycle.

Một Admin application lifecycle chỉ có:

```text
1 AppShell
1 Header
1 Menu
1 Page Host
```

Navigation không được tạo AppShell instance mới.

---

# 3. Header là Persistent

Header thuộc AppShell.

Khi chuyển Page:

* Header không reload.
* Header không recreate.
* Header không được mount lại như một phần của Page mới.

---

# 4. Menu là Persistent

Menu/Sidebar thuộc AppShell.

Khi chuyển Page:

* Menu không reload.
* Menu không recreate.
* Menu state không bị reset do navigation.

Menu không thuộc ownership của từng Page.

---

# 5. Page Host là vùng thay đổi

Page Content được quản lý bởi Page Host.

Navigation canonical:

```text
Menu interaction
    ↓
Route Resolution
    ↓
Page Identity
    ↓
Page Host
    ↓
Page Content
```

Navigation không được làm thay đổi AppShell instance.

---

# 6. Menu Expand / Collapse

Parent Sub-menu có hai trạng thái:

```text
Expanded
Collapsed
```

**Default:**

```text
Collapsed
```

Admin là người quyết định trạng thái.

Page active **không được tự động quyết định** trạng thái Expand/Collapse.

---

# 7. Active Page không Auto-expand Parent

Nguyên tắc:

```text
Active Page ≠ Auto Expand Parent
```

Một Page có thể active trong khi Parent của nó vẫn Collapsed.

Admin muốn xem các child menu thì tự Expand Parent.

---

# 8. Accordion

Parent Sub-menu sử dụng accordion trong phạm vi cùng Module.

Trong cùng một Module:

```text
Parent A → Expanded
Parent B → Collapsed
Parent C → Collapsed
```

Không cho phép nhiều Parent sibling cùng Expanded.

Quy tắc này chỉ áp dụng cho **Parent Sub-menu**, không áp dụng cho Sidebar Rail.

---

# 9. Sidebar Rail là cơ chế độc lập

Hai khái niệm phải được phân biệt:

```text
Sidebar Rail collapse
```

và:

```text
Parent Sub-menu Expand / Collapse
```

SoT này chỉ chuẩn hóa **Parent Sub-menu**.

Không được suy diễn rằng `Collapsed` của Parent Sub-menu đồng nghĩa với việc Sidebar Rail bị thu gọn thành icon-only.

---

# 10. Menu State không phụ thuộc Page

Navigation giữa:

```text
Page A
→ Page B
→ Page C
```

không được tự động:

* Expand Parent.
* Collapse Parent.
* Reset Menu state.

Trạng thái Menu thuộc AppShell lifecycle và do Admin quyết định.

---

# 11. Active Navigation

Active state phải được xác định từ:

```text
Page Identity / Route Identity
```

không dùng trạng thái Expand/Collapse làm identity.

Khi Page thay đổi:

* Active Menu cập nhật đúng.
* Route cập nhật đúng.
* Breadcrumb cập nhật đúng.
* Menu Expand/Collapse state không bị active Page override.

---

# 12. Canonical Route/Menu Registry

Admin tiếp tục sử dụng **một Canonical Route/Menu Registry**.

Không tạo Registry riêng cho:

* AppShell.
* Header.
* Menu.
* Page.
* Permission.
* Navigation.

Menu phải tham chiếu canonical identity và route resolution hiện hữu.

SoT này **không thay đổi** Product Routing Identity & Localized URL Architecture.

---

# 13. Technical Identity không thay đổi

AppShell/navigation behavior không được làm thay đổi:

```text
Page ID
Feature ID
Route Identity
Permission Identity
Database Identity
Business Identity
```

Đổi Page/Route/IA không phải là lý do tạo Page Identity mới.

---

# 14. Không Duplicate

Không được tồn tại:

```text
Old AppShell + New AppShell
Old Menu + New Menu
Old Header + New Header
```

cho cùng một Admin runtime.

Không tạo Menu implementation riêng cho từng Page hoặc từng Module.

Không tạo Page mới chỉ để phục vụ AppShell navigation.

---

# 15. Navigation Architecture

Kiến trúc runtime chuẩn:

```text
                Admin AppShell
                       │
          ┌────────────┴────────────┐
          │                         │
       Header                     Menu
          │                         │
          └────────────┬────────────┘
                       │
                  Page Host
                       │
                 Current Page
```

Navigation:

```text
Menu
 ↓
Canonical Route Registry
 ↓
Page Identity
 ↓
Page Host
```

Không:

```text
Menu
 ↓
location.assign()
 ↓
Unload document
 ↓
Boot AppShell mới
```

---

# 16. Quan hệ với Product Routing SoT

SoT này **không override** Product Routing Identity & Localized URL Architecture.

Routing vẫn phải đảm bảo:

```text
URL
 ↓
Route Registry
 ↓
Page ID
 ↓
Page implementation
```

AppShell persistence chỉ thay đổi **runtime lifecycle**, không thay đổi routing identity architecture.

---

# 17. Governance Boundary

SoT này quản lý:

* Admin AppShell lifecycle.
* Header persistence.
* Menu persistence.
* Page Host boundary.
* Menu Expand/Collapse.
* Accordion behavior.
* Navigation runtime behavior.

SoT này **không quản lý**:

* Admin IA structure.
* URL naming policy.
* Page Identity architecture.
* Permission architecture.
* Business logic.
* User Web AppShell.

Các vấn đề đó tiếp tục thuộc SoT/Governance tương ứng.

---

# 18. Mandatory Invariants

Implementation Admin phải luôn giữ các invariant sau:

### INV-01

**Một Admin runtime → một AppShell.**

### INV-02

**Một AppShell → một Header.**

### INV-03

**Một AppShell → một Menu.**

### INV-04

**Navigation → Page Host thay đổi, AppShell không thay đổi.**

### INV-05

**Parent Sub-menu default = Collapsed.**

### INV-06

**Admin quyết định Expand/Collapse.**

### INV-07

**Active Page không auto-expand Parent.**

### INV-08

**Cùng một Module chỉ một Parent Expanded.**

### INV-09

**Menu state không được reset bởi Page navigation.**

### INV-10

**Không duplicate AppShell/Menu/Header/Page implementation để phục vụ navigation.**

### INV-11

**Routing tiếp tục sử dụng Canonical Route/Menu Registry.**

### INV-12

**Page Identity và Permission Identity không phụ thuộc AppShell/URL state.**

---

# 19. Acceptance

Một implementation chỉ đạt SoT khi chứng minh được:

```text
A. AppShell Persistence
Header + Menu sống xuyên navigation.

B. Page Host Isolation
Chỉ Page Host thay đổi khi chuyển Page.

C. Menu Control
Default Collapsed + Admin tự Expand/Collapse.

D. Accordion
Một Parent Expanded trong cùng Module.

E. Active Independence
Active Page không ép Parent Expand.

F. Identity Stability
Page/Feature/Permission identity không đổi.

G. Single Runtime
Không duplicate AppShell/Header/Menu.

H. Routing Integrity
Canonical Route/Menu Registry vẫn là nguồn duy nhất.

I. Navigation Integrity
Route / Page / Breadcrumb / Active state vẫn đúng.
```

**SoT này là cơ sở để bước tiếp theo thiết kế Solution/Implementation Plan.**
