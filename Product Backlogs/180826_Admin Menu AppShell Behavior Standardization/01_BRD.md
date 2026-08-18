# BRD — ADMIN MENU APPSHELL BEHAVIOR STANDARDIZATION

**Task:** `180826_Admin Menu AppShell Behavior Standardization`
**Scope:** Admin
**Status:** Owner Proposed — Audit Completed — BRD Amended
**Authority:** Owner

---

# 1. Mục tiêu

Chuẩn hóa Menu và Header của Admin theo mô hình **AppShell persistent**.

Admin AppShell gồm:

```text
Admin AppShell
├── Header
├── Menu / Sidebar
└── Page Host
```

Header và Menu là thành phần của AppShell và phải được khởi tạo một lần, duy trì xuyên suốt quá trình Admin chuyển Page.

Khi Admin navigation:

```text
AppShell
├── Header       ← giữ nguyên
├── Menu         ← giữ nguyên
└── Page Host    ← thay đổi
```

Không được unload/reload toàn bộ AppShell chỉ vì Admin chuyển sang Page khác.

Task đồng thời chuẩn hóa behavior của Menu:

* Menu Parent mặc định Collapsed.
* Admin tự quyết định Expand/Collapse.
* Không tự động mở Parent chỉ vì Page bên trong đang active.
* Menu Parent sử dụng accordion trong phạm vi từng Module.
* Navigation không làm recreate AppShell/Header/Menu.

---

# 2. Phạm vi

Task bao gồm:

1. Admin AppShell lifecycle.
2. Admin Header persistence.
3. Admin Menu persistence.
4. Page Host navigation.
5. Parent Sub-menu Expand/Collapse.
6. Default Menu state.
7. Admin-controlled Menu state.
8. Accordion behavior.
9. Active Menu behavior.
10. Navigation giữa các Page.
11. Regression đối với Canonical Route/Menu Registry hiện hữu.

Task **không thay đổi**:

* Admin IA order/name đã Owner khóa.
* Page Identity.
* Feature Identity.
* Permission Identity.
* Canonical Route/Menu Registry.
* URL Architecture của Wave 2.
* Database identity.
* Business logic của các Page.
* User Web AppShell.
* Sidebar Rail collapse architecture hiện hữu.

---

# 3. Kiến trúc Runtime mục tiêu

Runtime mục tiêu:

```text
Admin AppShell
│
├── Header
│   └── Persistent
│
├── Menu / Sidebar
│   └── Persistent
│
└── Page Host
    └── Page Content thay đổi theo Navigation
```

Không được triển khai theo mô hình:

```text
Page A
├── Header
├── Menu
└── Content

↓ navigation

Page B
├── Header
├── Menu
└── Content
```

Trong đó toàn bộ document/AppShell bị unload và boot lại.

---

# 4. BR-01 — AppShell Persistent

Admin AppShell phải tồn tại xuyên suốt quá trình Admin navigation giữa các Page.

AppShell chỉ được khởi tạo một lần trong lifecycle của Admin application/session.

Navigation giữa các Page không được tạo AppShell instance mới.

---

# 5. BR-02 — Header thuộc AppShell

Header là thành phần persistent của Admin AppShell.

Khi Admin chuyển Page:

* Header không được unload/reload.
* Header không được recreate.
* Header state/runtime phải được duy trì.

---

# 6. BR-03 — Menu thuộc AppShell

Menu/Sidebar là thành phần persistent của Admin AppShell.

Khi Admin chuyển Page:

* Menu không được unload/reload.
* Menu không được recreate.
* Menu state phải được duy trì trong AppShell lifecycle.

---

# 7. BR-04 — Page Host

AppShell phải có một Page Host chịu trách nhiệm hiển thị Page hiện tại.

Navigation phải thực hiện:

```text
Menu click
    ↓
Resolve Route
    ↓
Page Host
    ↓
Load/replace Page Content
```

Không được unload toàn bộ AppShell chỉ để chuyển Page.

---

# 8. BR-05 — Navigation không reload AppShell

Khi Admin click một Menu/Page:

```text
Header       = giữ nguyên
Menu         = giữ nguyên
AppShell     = giữ nguyên
Page Host    = thay đổi
```

URL/Route/Page Identity vẫn phải tuân thủ Product Routing Identity & Localized URL Architecture SoT.

---

# 9. BR-06 — Menu Parent Expand/Collapse

Các Parent có Sub-menu phải hỗ trợ:

```text
Expanded
Collapsed
```

Admin là người quyết định trạng thái này.

Không được ép trạng thái theo Page active.

---

# 10. BR-07 — Default State

Parent Sub-menu mặc định:

```text
Collapsed
```

Không được tự động Expanded:

* Parent đầu tiên của Module.
* Parent chứa Page active.
* Parent theo bất kỳ Page-specific hard-code nào.

---

# 11. BR-08 — Admin-controlled State

Admin có thể chủ động:

```text
Expand Parent
Collapse Parent
```

Sau khi Admin chọn trạng thái, navigation giữa các Page không được tự ý thay đổi trạng thái đó.

Page active không được override quyết định của Admin.

---

# 12. BR-09 — Accordion

Trong cùng một Module, Parent Sub-menu sử dụng accordion.

Khi Admin Expand một Parent:

```text
Parent A → Expanded
Parent B → Collapsed
Parent C → Collapsed
```

Không cho phép đồng thời nhiều Parent sibling cùng Expanded trong cùng một Module.

Accordion chỉ áp dụng cho **Parent Sub-menu**.

---

# 13. BR-10 — Active Page không tự mở Parent

Page active phải được xác định chính xác theo Canonical Route/Page Identity.

Tuy nhiên:

```text
Active Page
≠
Auto Expand Parent
```

Parent chứa Page active có thể vẫn Collapsed.

Admin tự quyết định Expand nếu muốn xem Sub-menu.

---

# 14. BR-11 — Active Navigation

Khi Page thay đổi:

* Active Menu phải được cập nhật đúng.
* Active state phải dựa trên Page/Route Identity.
* Active state không được làm thay đổi trạng thái Expand/Collapse mà Admin đã chọn.

---

# 15. BR-12 — Canonical Navigation Registry

Menu tiếp tục sử dụng Canonical Route/Menu Registry hiện hữu.

Không tạo một routing architecture mới.

Navigation không được hard-code URL làm technical identity.

Phải tiếp tục tuân thủ:

```text
Page Identity
    ↓
Route/Menu Registry
    ↓
Canonical URL
```

---

# 16. BR-13 — Không thay đổi Identity

Task này không được làm thay đổi:

```text
Page ID
Feature ID
Permission Identity
Database Identity
Business Identity
```

Việc chuyển Page giữa các vị trí IA hoặc thay đổi URL không được tạo Page Identity mới.

---

# 17. BR-14 — Không duplicate AppShell

Trong một Admin application lifecycle chỉ được có:

```text
1 AppShell
1 Header
1 Menu
1 Page Host
```

Không được tạo AppShell/Header/Menu thứ hai chỉ vì navigation.

Không được giữ đồng thời:

```text
Old AppShell
+
New AppShell
```

---

# 18. BR-15 — Không duplicate Menu Implementation

Menu phải tiếp tục có một canonical runtime implementation.

Không được tạo Menu implementation riêng cho:

* Từng Page.
* Từng Module.
* Từng navigation state.
* AppShell mới.

---

# 19. BR-16 — Không tạo Page mới cho AppShell

Không được tạo Page/Route mới chỉ để:

* Quản lý Menu state.
* Quản lý Expand/Collapse.
* Duy trì AppShell.
* Thực hiện Page Host.

---

# 20. BR-17 — Sidebar Rail là cơ chế riêng

Task này chỉ thay đổi:

```text
Parent Sub-menu Expand / Collapse
```

Không thay đổi cơ chế:

```text
Sidebar Rail Collapse
```

Hai cơ chế phải được xử lý độc lập.

---

# 21. BR-18 — Không ảnh hưởng IA

Task này không thay đổi:

* Module order.
* Menu order.
* Menu name.
* Page/Sub-page relationship.
* Canonical IA đã khóa ở task trước.

Task chỉ thay đổi **runtime behavior của AppShell/Menu/Navigation**.

---

# 22. BR-19 — Không ảnh hưởng Wave 2 Routing

Wave 2 Routing Architecture tiếp tục là authority cho:

* Page Identity.
* Route Identity.
* Canonical URL.
* Route resolution.
* Navigation identity.
* Breadcrumb.
* Permission independence from URL.

Task này không được tạo routing architecture riêng.

---

# 23. BR-20 — Navigation Regression

Sau khi triển khai, phải chứng minh:

```text
Menu
 ↓
Route
 ↓
Page Identity
 ↓
Page Host
```

hoạt động đúng.

Navigation phải:

* Mở đúng Page.
* Cập nhật đúng URL.
* Cập nhật đúng Active Menu.
* Cập nhật đúng Breadcrumb.
* Không làm mất AppShell.
* Không tạo AppShell/Header/Menu instance mới.

---

# 24. BR-21 — AppShell State Regression

Phải kiểm tra khi Admin liên tục chuyển:

```text
Page A
→ Page B
→ Page C
→ Page D
→ Page A
```

thì:

* AppShell vẫn là một instance.
* Header vẫn giữ nguyên.
* Menu vẫn giữ nguyên.
* Parent Expand/Collapse không bị hệ thống tự override.
* Active Page vẫn chính xác.

---

# 25. BR-22 — Không phát sinh Implementation cũ + mới song song

Implementation phải được thay đổi trên canonical implementation hiện hữu.

Không được:

```text
Implementation mới
+
Implementation cũ
```

cùng tồn tại và cùng có khả năng chạy trong Admin runtime.

Không được giữ implementation cũ chỉ để fallback nếu nó tạo ra behavior duplicate hoặc conflict với AppShell mới.

---

# 26. Acceptance Criteria

### AC-01 — Default

Parent Sub-menu mặc định **Collapsed**.

### AC-02 — Admin Control

Admin có thể tự Expand/Collapse Parent.

### AC-03 — Không Auto Expand

Page active không tự động mở Parent.

### AC-04 — Accordion

Trong cùng Module chỉ một Parent được Expanded.

### AC-05 — AppShell Persistence

Navigation không unload/recreate AppShell.

### AC-06 — Header Persistence

Navigation không unload/recreate Header.

### AC-07 — Menu Persistence

Navigation không unload/recreate Menu.

### AC-08 — Page Host

Navigation chỉ thay đổi Page Host/Page Content.

### AC-09 — Active Navigation

Active Menu đúng Page/Route Identity.

### AC-10 — State Preservation

Admin Expand/Collapse → chuyển Page → trạng thái không bị hệ thống tự override.

### AC-11 — No Duplicate AppShell

Không có AppShell instance thứ hai trong lifecycle.

### AC-12 — No Duplicate Header

Không có Header implementation/instance thứ hai do navigation.

### AC-13 — No Duplicate Menu

Không có Menu implementation/instance thứ hai do navigation.

### AC-14 — No New Page

Không tạo Page/Route mới để phục vụ AppShell.

### AC-15 — Registry Integrity

Canonical Route/Menu Registry tiếp tục là nguồn duy nhất.

### AC-16 — URL Integrity

URL tiếp tục tuân thủ Product Routing Identity & Localized URL Architecture SoT.

### AC-17 — Identity Integrity

Page ID, Feature ID, Permission Identity và Database Identity không thay đổi.

### AC-18 — Navigation Regression

Không có broken navigation, sai Page, sai Active Menu hoặc sai Breadcrumb.

### AC-19 — Multi-page Navigation

Navigation qua nhiều Page liên tiếp không recreate AppShell/Header/Menu.

### AC-20 — No Legacy/New Conflict

Không tồn tại implementation cũ và implementation mới cùng chạy hoặc cùng quản lý một behavior.

---

# 27. Definition of Done

Task được coi là hoàn thành khi:

```text
BRD Owner Locked
        ↓
Audit
        ↓
Owner Decision D-01 → D-04
        ↓
Solution / Implementation Plan
        ↓
Implementation
        ↓
AppShell Persistence Test
        ↓
Menu Expand/Collapse Test
        ↓
Navigation Regression Test
        ↓
Duplicate / Identity / Route Test
        ↓
ALL AC PASS
```

Kết quả cuối cùng phải đạt đồng thời hai mục tiêu:

```text
MỤC TIÊU BAN ĐẦU
→ Menu Parent mặc định Collapsed
→ Admin tự quyết định Expand/Collapse

+

VẤN ĐỀ PHÁT HIỆN QUA AUDIT
→ AppShell thực sự persistent
→ Header persistent
→ Menu persistent
→ Chỉ Page Host thay đổi khi navigation
→ Không recreate AppShell/Header/Menu
```

**Task không được mở rộng sang thay đổi IA, URL Architecture, Page Identity, Permission hoặc Wave 2 Routing.**
