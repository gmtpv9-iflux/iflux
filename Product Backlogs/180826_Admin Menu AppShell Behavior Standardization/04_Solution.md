Đúng. Tôi nhận phần này.

**Cursor không “chất vấn ngược” sai; nó đang phát hiện các lỗ hổng mà đáng ra Solution Owner phải khóa trước khi giao Implementation.** Lỗi ở đây là tôi đã viết Solution ở mức behavioral architecture nhưng **chưa khóa implementation boundary đủ chặt theo Audit**. Vì vậy Agent có thể diễn giải thành nhiều hướng, trong đó có hướng phá BRD/SoT.

Đặc biệt, 6 điểm Cursor nêu ở cuối là **phải hấp thụ vào Solution**, không phải đẩy ngược cho Agent tự quyết.

Tôi chốt lại nguyên tắc Owner:

> **Audit đã chỉ ra implementation hiện hữu thế nào thì Solution phải chuẩn hóa nó theo hướng ít phá vỡ nhất; không được tự dựng một architecture mới rồi bắt Agent tự tìm cách nối vào hệ thống cũ.**

Và quan trọng: **không mở Implementation Plan ở bước này.**

Dưới đây là bản Solution đã sửa.

---

# Solution — Admin Menu AppShell Behavior Standardization

**Task:** `180826_Admin Menu AppShell Behavior Standardization`
**Status:** Owner Proposed — Revision 2
**Implementation:** Chưa mở
**Authority:** SoT — Admin AppShell & Menu Runtime Architecture
**Căn cứ:** BRD amended · Mandatory Audit · SoT · Owner Decisions D-01 → D-04 · Product Routing SoT

---

## 1. Solution Objective

Chuẩn hóa Admin từ runtime hiện tại:

```text
Document A
├── AppShell
│   ├── Header
│   └── Menu
└── Page A

        ↓ location.assign()

Document B
├── AppShell
│   ├── Header
│   └── Menu
└── Page B
```

thành:

```text
Admin Document
└── AppShell
    ├── Header
    ├── Menu
    └── Page Host
         └── Current Page
```

Trong đó:

* **Document chỉ bootstrap AppShell một lần.**
* **AppShell tồn tại xuyên suốt internal Admin navigation.**
* **Header không bị remount.**
* **Menu không bị remount.**
* **Page Host là boundary duy nhất thay đổi khi chuyển Page.**
* Các Page HTML hiện hữu tiếp tục là nguồn Page document/canonical route hiện tại.
* Internal navigation sử dụng nội dung của canonical Page hiện hữu để thay đổi Page Host.
* Không tạo một Page module registry hoặc routing registry thứ hai.
* Không thay Express/Wave 2 routing architecture.

---

# 2. Owner Decisions

Các quyết định sau là **LOCKED**:

| ID       | Decision                                                 |
| -------- | -------------------------------------------------------- |
| **D-01** | **B — Persistent AppShell + Page Host**                  |
| **D-02** | **A — Collapsed chỉ áp dụng Parent Sub-menu**            |
| **D-03** | **A — Accordion, một Parent Expanded trong cùng Module** |
| **D-04** | **A — Active Page không tự Expand Parent**               |

Implementation không được thay đổi các quyết định này.

---

# 3. Solution Principle

Task này là **runtime standardization trên architecture hiện hữu**, không phải rebuild Admin thành một frontend application mới.

Do đó:

```text
Existing Admin HTML
+
Existing Express routing
+
Existing Wave 2 Route/Menu Registry
+
Existing AppShell/Header/Menu implementation
        ↓
Standardize runtime behavior
```

Không được chuyển thành:

```text
New AppShell HTML
+
New Page Module Registry
+
New Router
+
New Header/Menu implementation
```

Đây là boundary quan trọng nhất của Solution.

---

# 4. Existing Page Document Is the Initial Document

Initial document của Admin tiếp tục là **HTML Page hiện hữu được Express phục vụ theo canonical route**.

Ví dụ:

```text
GET /admin/orders
        ↓
Existing Express route
        ↓
Existing orders HTML
        ↓
Admin AppShell bootstrap
```

Không tạo:

```text
GET /admin/app-shell
        ↓
Empty AppShell
        ↓
Load orders module
```

Không tạo một HTML shell mới để thay thế 97 Page HTML trong phạm vi Task này.

---

# 5. Express / Wave 2 Routing Remains SoT

Task không thay đổi:

```text
Express routing
Wave 2 Route Registry
Canonical URL
Page Identity
hrefFor()
pathFor()
```

Route hiện hữu tiếp tục xác định Page canonical.

Internal navigation chỉ thay đổi **runtime behavior sau khi route target đã được xác định**.

Không tạo:

```text
page_id → module
page_id → fragment
menu → private URL
```

registry riêng.

---

# 6. AppShell Runtime Root

AppShell hiện hữu trở thành runtime owner của:

```text
Header
Menu / Sidebar
Page Host
```

Implementation canonical hiện hữu:

```text
IfluxAdminAppShell
IfluxAdminAppShellSidebar
IfluxAdminAppShellHeader
```

phải được **reuse/refactor**, không tạo AppShell thứ hai.

AppShell chỉ bootstrap một lần trong một document lifecycle.

---

# 7. Existing AppShell Boot Must Remain the Single Boot Path

Hiện trạng Audit đã xác định Header/Menu/AppShell có boot behavior hiện hữu.

Solution không được tạo:

```text
Old boot
+
New AppShell.mount()
```

cùng active.

Nếu cần thay đổi lifecycle, implementation canonical hiện hữu phải được sửa để trở thành lifecycle duy nhất.

Sau khi chuẩn hóa:

```text
Document Load
    ↓
Existing Canonical AppShell Boot
    ↓
Header
Menu
Page Host
```

Không tồn tại một boot path thứ hai có khả năng mount cùng responsibility.

---

# 8. Canonical DOM Boundary

Solution giữ DOM vocabulary hiện hữu của Audit.

Các slot canonical hiện tại:

```text
data-ix-admin-shell
data-ix-admin-nav
```

tiếp tục là AppShell/Menu boundary.

Có thể bổ sung một Page Host marker vào vùng Page hiện hữu:

```text
data-ix-admin-page-host
```

nhưng **không thay toàn bộ DOM contract bằng một bộ attribute mới**.

Không tạo song song:

```text
data-ix-admin-header
data-ix-admin-nav
data-ix-admin-page-host
```

nếu việc đó tạo một AppShell DOM contract thứ hai bên cạnh contract hiện hữu.

---

# 9. Page Host Boundary

Page Host không mặc định đồng nghĩa với:

```text
.ix-content
```

Audit đã chứng minh Page có thể sở hữu các thành phần nằm ngoài `.ix-content`, bao gồm:

* Page chrome;
* offcanvas;
* overlay;
* Page-specific DOM;
* Page-specific CSS;
* Page-specific `body data-*`;
* Page-specific runtime initialization.

Do đó Page Host phải đại diện cho **toàn bộ Page-owned runtime/content boundary**, ngoại trừ:

```text
AppShell Header
AppShell Menu
AppShell-owned rail/offcanvas
AppShell-owned runtime
```

Nguyên tắc:

```text
AppShell-owned
    → stay persistent

Page-owned
    → replaceable Page Host content
```

Không được đơn giản hóa thành:

```text
replace .ix-content
```

nếu điều đó làm mất Page functionality.

---

# 10. Page Navigation Model

Internal navigation phải theo mô hình:

```text
Navigation Target
        ↓
Canonical Route Resolution
        ↓
Canonical Page URL
        ↓
Fetch existing canonical Page document
        ↓
Extract Page-owned boundary
        ↓
Replace Page Host
        ↓
Update Page lifecycle
        ↓
Update URL/history
        ↓
Update Active Navigation
```

Điểm khóa:

> **Page được lấy từ canonical Page HTML hiện hữu, không phải từ một Page Module Registry mới.**

---

# 11. No Empty Shell / No Page Module Architecture

Không được triển khai theo mô hình:

```text
AppShell document
    ↓
page_id
    ↓
import page module
```

nếu điều đó tạo ra một Page architecture mới.

Cũng không được tạo:

```text
PageRegistry
pageModules
pageComponents
```

chỉ để phục vụ AppShell migration.

Canonical Page vẫn là Page được xác định bởi Product Routing SoT.

---

# 12. Internal Navigation Scope

Persistent AppShell không chỉ áp dụng cho click Menu.

**Mọi internal navigation tới Admin route phải được xem là AppShell navigation**, bao gồm:

```text
Menu
Breadcrumb
Page links
Pagination / relevant Admin links
Action links
JavaScript navigation
history navigation
```

Nếu target là canonical internal Admin route:

```text
/admin/...
```

thì navigation phải đi qua canonical Admin navigation behavior thay vì unload document.

Không được định nghĩa:

```text
Menu navigation = SPA
Page navigation = MPA
```

vì như vậy AppShell persistence vẫn bị phá.

---

# 13. Legacy Full-Document Navigation Must Not Remain Active

Các call-site hiện hữu tạo internal document navigation như:

```text
location.assign(...)
location.href = ...
```

không được tiếp tục là active path cho canonical internal Admin navigation.

Đặc biệt, sidebar hiện hữu đang có behavior:

```text
location.assign(...)
```

phải được loại khỏi canonical internal navigation path.

Không chấp nhận:

```text
New Navigation Controller
+
Old location.assign
```

cùng có khả năng xử lý một Admin navigation.

---

# 14. Navigation Controller Ownership

Admin chỉ có **một canonical navigation path**.

Navigation Controller không phải là một routing system mới.

Nó chỉ là runtime orchestration layer:

```text
Canonical Route SoT
        ↓
Navigation Controller
        ↓
Page Host
```

Nó không sở hữu:

```text
URL registry
Page registry
Permission registry
Page Identity registry
```

những thứ này vẫn thuộc SoT hiện hữu.

---

# 15. Page Lifecycle

Page transition:

```text
Current Page
    ↓
dispose / unmount Page-owned runtime
    ↓
replace Page Host
    ↓
initialize next Page-owned runtime
```

Không được chạy lại AppShell initialization.

Không được chạy lại:

```text
Header bootstrap
Menu bootstrap
AppShell bootstrap
```

cho mỗi Page.

---

# 16. Page-Owned Runtime Must Survive Host Transition

Page có thể có:

```text
CSS
JS
body data-*
offcanvas
modal
form behavior
view gate
Page-specific initialization
```

Solution phải bảo toàn các contract đó.

Các Page-specific runtime chỉ được reinitialize trong phạm vi Page transition cần thiết.

Ngược lại, AppShell runtime:

```text
iflux-admin-ui.js
AppShell
Header
Menu
Route Registry
```

không được re-execute như Page runtime nếu chúng đã được bootstrap ở document level.

---

# 17. Document-Level Runtime Boundary

Solution phân biệt rõ:

### Persistent document/AppShell runtime

```text
AppShell
Header
Menu
Route/Menu Registry
AppShell UI runtime
```

### Replaceable Page runtime

```text
Page DOM
Page CSS
Page JS
Page body metadata
Page-owned overlays
Page-specific initialization
```

Không được đưa document-level runtime vào Page Host.

Không được để Page transition làm mất hoặc duplicate document-level runtime.

---

# 18. Header Persistence

Header:

```text
mount once
remain mounted
```

Internal navigation không:

```text
destroy Header
create Header
```

Nếu Header cần cập nhật state sau navigation thì chỉ update state/content cần thiết.

Header lifecycle vẫn thuộc AppShell lifecycle.

---

# 19. Menu Persistence

Menu:

```text
mount once
remain mounted
```

Internal navigation không được:

```text
Sidebar.render()
→ replace Menu DOM
```

theo cách làm mất disclosure state.

Đặc biệt, RBAC/gating/permission refresh **không được biến thành Menu remount làm reset state**.

Nếu Menu cần update vì permission:

```text
update existing Menu state
```

hoặc nếu bắt buộc phải render lại:

```text
capture canonical Menu state
→ render
→ restore state
```

nhưng không được làm mất Owner-defined state contract.

---

# 20. Menu State Contract

Menu disclosure state:

```text
Parent
├── Expanded
└── Collapsed
```

là state thuộc Menu/AppShell runtime.

State này không phụ thuộc Page lifecycle.

Do đó:

```text
Expand Parent A
    ↓
Navigate Page B
    ↓
Parent A remains Expanded
```

---

# 21. Default State

Theo D-02:

```text
Parent Sub-menu
    ↓
Default = Collapsed
```

Không được tiếp tục behavior:

```text
applyDefaultFirstParentOpen
```

nếu behavior đó khiến Parent đầu tiên tự Expanded.

Đây không phải optional cleanup.

Đây là behavior cũ mâu thuẫn trực tiếp với BRD/SoT.

---

# 22. Active Page Must Not Expand Parent

Theo D-04:

```text
Page Active
    ↓
Active Menu = true
```

không được dẫn tới:

```text
Parent = Expanded
```

Ví dụ hợp lệ:

```text
Parent A = Collapsed
└── Page B = Active
```

Active state và disclosure state hoàn toàn độc lập.

---

# 23. Accordion

Theo D-03:

Trong cùng Module:

```text
Parent A
Parent B
Parent C
```

tối đa một Parent được Expanded.

```text
Expand B
    ↓
A = Collapsed
B = Expanded
C = Collapsed
```

Accordion behavior hiện hữu được reuse/standardize, không tạo Accordion implementation thứ hai.

---

# 24. Rail State Is Out of Scope

D-02 chỉ áp dụng Parent Sub-menu.

Rail collapse/expand là state khác:

```text
Rail State
    ≠
Parent Disclosure State
```

Task không thay đổi cơ chế persistence hiện hữu của Rail.

Không dùng việc chuẩn hóa Parent state làm lý do thay đổi Rail state.

---

# 25. Active Navigation

Active state tiếp tục được resolve từ canonical:

```text
Route
+
Page Identity
```

Các resolver hiện hữu như:

```text
hrefFor
pathFor
detectActiveKey
trailFor
```

nếu đang là canonical implementation, tiếp tục được sử dụng.

Không tạo active-route registry mới.

---

# 26. Breadcrumb

Breadcrumb là một phần của Page/navigation state nhưng không phải AppShell Menu state.

Khi Page thay đổi:

```text
Canonical Route
    ↓
Page Identity
    ↓
Breadcrumb
```

được cập nhật.

Breadcrumb navigation tới internal Admin route cũng phải đi qua cùng canonical navigation path.

---

# 27. Browser History

Internal navigation phải đồng bộ browser history:

```text
A
 ↓
B
 ↓
C
```

Back:

```text
C → B
```

Forward:

```text
B → C
```

được xử lý trong cùng AppShell lifecycle.

`popstate` không tạo document/AppShell mới.

---

# 28. Direct URL

Direct URL vẫn phải hoạt động theo Express/Wave 2:

```text
Open /admin/orders
    ↓
Express serves existing orders HTML
    ↓
AppShell boot
    ↓
Current Page becomes Page Host
```

Sau đó:

```text
/admin/orders
    ↓
/admin/users
```

là internal Page transition trong cùng AppShell.

---

# 29. Redirect-only Pages

Audit đã xác định 13 file redirect-only.

Không biến chúng thành Page Host implementation.

Nếu user truy cập redirect-only URL:

```text
Legacy URL
    ↓
Existing canonical redirect behavior
    ↓
Canonical Admin URL
```

Sau khi tới canonical Admin Page, AppShell runtime tiếp tục hoạt động bình thường.

Không tạo Error Page hoặc Redirect Page module mới để thay thế routing architecture.

---

# 30. Login Boundary

`auth/login.html` không thuộc Admin AppShell Page lifecycle.

Login vẫn là document boundary riêng.

Do đó:

```text
Admin Page failure
```

không được biến thành:

```text
/admin/error
```

nếu việc đó tạo Page/Route mới.

Tương tự, authentication transition ra khỏi Admin application có thể kết thúc AppShell lifecycle vì đó là **application boundary**, không phải internal Page navigation.

---

# 31. Error Boundary

Nếu canonical Admin Page không load hoặc Page runtime không mount được:

```text
AppShell
├── Header    alive
├── Menu      alive
└── Page Host
      └── Error State
```

Error state thuộc Page Host.

Không được fallback bằng full-document reload chỉ để phục hồi Page.

Các trường hợp authentication boundary hoặc server-level failure phải tuân theo contract hiện hữu; không tự tạo một Page/Route architecture mới để xử lý chúng.

---

# 32. AppShell Uniqueness

Trong một document lifecycle:

```text
1 AppShell
1 Header
1 Menu
1 Page Host
1 canonical Navigation path
```

Không tồn tại:

```text
Old AppShell + New AppShell
Old Menu + New Menu
Old Navigation + New Navigation
```

cùng active.

Đây là invariant chống duplicate implementation.

---

# 33. Existing 97 Pages

Audit xác định:

```text
97 Page HTML
```

có Header/Menu slots.

Solution **không yêu cầu chuyển 97 file thành 97 Page module**.

Các file tiếp tục tồn tại theo canonical routing architecture.

Runtime mới chỉ thay đổi cách Page hiện hữu được sử dụng:

```text
Initial:
Existing HTML document

Internal:
Existing canonical Page HTML
        ↓
Page-owned boundary
        ↓
Page Host
```

Không yêu cầu rewrite business logic của 97 Page chỉ để đạt AppShell persistence.

---

# 34. Scope Boundary

Task không thay đổi:

```text
Express routing
Wave 2 Route Registry
Canonical URL
Page ID
Page Identity
Feature ID
Permission model
RBAC model
IA
Business Logic
Database Identity
Rail architecture
```

Chỉ thay đổi runtime behavior cần thiết để đạt Persistent AppShell.

---

# 35. Explicit Legacy Behaviors to Be Removed From Canonical Path

Solution này **không chỉ nói “không tạo implementation song song”**.

Các behavior cũ mâu thuẫn với Solution phải được loại khỏi canonical runtime path, bao gồm:

```text
location.assign()
```

cho internal Admin navigation;

```text
applyDefaultFirstParentOpen
```

nếu nó ép Parent Expanded;

cơ chế:

```text
Active Page
    ↓
Parent.open = true
```

và mọi Menu refresh/remount làm mất disclosure state.

Đây là **behavioral replacement**, không phải optional cleanup.

---

# 36. Final Canonical Runtime

Runtime cuối cùng phải có semantic model:

```text
Initial Document
      │
      ▼
┌──────────────────────────────┐
│        Admin AppShell        │
│                              │
│  ┌────────────────────────┐  │
│  │        Header          │  │
│  │       PERSISTENT       │  │
│  └────────────────────────┘  │
│                              │
│  ┌─────────┐ ┌────────────┐  │
│  │  Menu   │ │ Page Host  │  │
│  │PERSISTENT│ │ REPLACEABLE│  │
│  └─────────┘ └────────────┘  │
│                              │
└──────────────────────────────┘
```

Navigation:

```text
Menu
Breadcrumb
Page Link
JS Navigation
Back
Forward
        │
        ▼
Canonical Route SoT
        │
        ▼
Existing Canonical Page
        │
        ▼
Replace Page-owned boundary
        │
        ▼
Page Host
```

Trong toàn bộ quá trình:

```text
AppShell = same
Header   = same
Menu     = same
```

---

# 37. Solution Acceptance Contract

Solution này chỉ được coi là đạt khi implementation chứng minh được:

### AppShell

* Một AppShell trong một document lifecycle.
* Initial document là HTML Page hiện hữu.
* Không tạo empty AppShell document.
* Không thay Express/Wave 2 routing.
* Không có AppShell implementation song song.

### Page

* Page vẫn được xác định bởi canonical Route/Page Identity.
* Không có `page_id → module` registry thứ hai.
* Page Host chứa đầy đủ Page-owned boundary, không chỉ `.ix-content`.
* Page lifecycle độc lập AppShell lifecycle.
* Page failure không destroy AppShell.

### Navigation

* Menu navigation không unload document.
* Breadcrumb navigation không unload document.
* Page internal links không unload document.
* Internal JS navigation không unload document.
* Back/Forward không unload AppShell.
* Canonical Route/Menu Registry vẫn là SoT.

### Header/Menu

* Header mount một lần.
* Menu mount một lần.
* RBAC refresh không làm mất Menu state.
* Không còn active `location.assign()` path cho canonical internal navigation.
* Không còn default-first-parent-open behavior.
* Active Page không auto-expand Parent.

### Menu behavior

* Parent default = Collapsed.
* Admin-controlled Expand/Collapse.
* Accordion trong cùng Module.
* Disclosure state độc lập Active state.
* Disclosure state tồn tại xuyên Page navigation.
* Rail behavior không bị thay đổi.

---

# 38. Owner Lock Boundary

Sau khi bản Solution này được Owner Lock:

```text
BRD
 ↓
Audit
 ↓
SoT
 ↓
Solution
 ↓
OWNER LOCK
```

mới chuyển sang Agent.

Agent khi đó có trách nhiệm:

```text
Inspect existing implementation
        ↓
Map Solution → existing code
        ↓
Create Implementation Plan
```

Agent **không được tự quyết lại**:

* S1 vs S2;
* AppShell architecture;
* Page module architecture;
* Route registry;
* Menu state semantics;
* D-01 → D-04;
* Page Host boundary;
* navigation scope.

Các quyết định đó đã được Owner khóa trong Solution.

---