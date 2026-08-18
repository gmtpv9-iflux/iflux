# BRD — Product URL Architecture Standardization

**Product:** iFlux
**Task:** Product URL Architecture Standardization
**Phase:** S1 Reconstruction / Architecture Standardization
**Primary Implementation Scope:** Admin
**Authority:** Product URL Architecture SoT
**Status:** Owner Locked — BRD  
**Implementation Authorization:** Dispatcher + V5 (SoT §4 §5 §8.5 §8.6 constraint) trên 4 trang Quản trị viên + login. Wave 2 English **chưa** ủy quyền.  
**Solution:** [`04_Solution.md`](04_Solution.md) — **mở khóa** — architecture Dispatcher (không mở G-FLEX)

---

# 1. Mục tiêu

Chuẩn hóa kiến trúc URL của Product theo **SoT — Product URL Architecture**.

Task phải bảo đảm hệ thống sử dụng một mô hình URL thống nhất, trong đó URL là representation của vị trí Page trong Information Architecture (IA), còn Page Identity là technical identity độc lập với URL.

Mục tiêu kiến trúc:

```text
IA
Module
  ↓
Page / Menu
  ↓
Sub-page
  ↓
Canonical Route
  ↓
URL
```

và:

```text
URL
  ↓
Route Resolution
  ↓
Page Identity
```

URL không được trở thành Page Identity.

---

# 2. Authority

Task này **không tạo ra một URL SoT riêng cho Admin**.

Authority duy nhất là:

**SoT — Product URL Architecture**

SoT này có:

* Scope: Product-wide
* Status: Owner Locked
* Authority: Product SoT

Mọi:

* BRD
* Audit
* Governance
* Solution
* Migration
* Implementation
* Verification

của task phải tuân thủ Product URL Architecture SoT.

Không được tạo local rule ở Admin, Phase hoặc Module để override Product SoT.

---

# 3. Business Problem

Hệ thống cần một kiến trúc URL thống nhất có khả năng phản ánh IA thực tế mà không làm URL trở thành identity của Page.

Trong quá trình audit hệ thống đã phát hiện nhiều implementation và cách biểu diễn chồng lấn. Các evidence này cho thấy cần kiểm tra đặc biệt các khu vực:

* route;
* URL;
* navigation;
* breadcrumb;
* Page Identity;
* menu ownership;
* hardcoded URL;
* duplicate implementation;
* legacy implementation.

Nếu không chuẩn hóa, việc thay đổi IA có thể dẫn tới:

```text
IA thay đổi
   ↓
URL thay đổi
   ↓
phải sửa nhiều implementation
   ↓
Navigation lệch
Breadcrumb lệch
Route lệch
Page Identity bị ảnh hưởng
```

Kiến trúc mục tiêu phải cho phép:

```text
IA thay đổi
   ↓
Canonical Route Registry cập nhật
   ↓
URL mới
Navigation mới
Breadcrumb mới
```

trong khi:

```text
Page Identity
Feature Identity
Permission
Database Identity
```

không thay đổi.

---

# 4. Business Requirements

## BR-01 — URL phải phản ánh IA hiện tại

URL phải có khả năng phản ánh cấu trúc IA thực tế:

```text
Module → Page → Sub-page
```

hoặc cấu trúc tương ứng với IA thực tế của Page.

Ví dụ:

```text
/admin/system-settings/administrators/permissions
```

có thể là URL canonical hoàn toàn hợp lệ.

Không được áp dụng quy tắc cũ kiểu:

> Module không được xuất hiện trong URL.

Tên các cấp trong URL phải phản ánh đúng vị trí hiện tại của Page trong IA.

---

## BR-02 — Quy tắc ngôn ngữ URL phải tuân thủ Product SoT

### User App / User Web

Chỉ các URL của User App / User Web có yêu cầu SEO mới được localized.

Ví dụ:

```text
VI:
/thi-truong/dong-tien

EN:
/market/money-flow
```

Các locale khác nhau có thể có slug khác nhau nhưng phải resolve về cùng một technical Page Identity.

### Các surface còn lại

URL phải sử dụng tiếng Anh.

Bao gồm:

* Admin
* API
* Internal Tools
* System surfaces khác

Ví dụ:

```text
/admin/system-settings/administrators/permissions
```

Không localized URL Admin theo ngôn ngữ giao diện.

---

## BR-03 — URL không được là Page Identity

Mỗi Page phải có technical Page Identity ổn định.

Page Identity phải độc lập với:

* URL;
* Module;
* Menu;
* Sub-menu;
* locale.

Không được sử dụng URL làm:

```text
Page Identity
```

hoặc dùng URL làm khóa duy nhất để xác định Page.

---

## BR-04 — Page relocation không làm thay đổi Identity

Khi Page được di chuyển trong IA:

```text
Module A
  ↓
Menu B
  ↓
Sub-page C
```

sang:

```text
Module D
  ↓
Menu E
  ↓
Sub-page F
```

thì:

```text
Page Identity      = không đổi
Feature Identity   = không đổi
Permission         = không đổi
Database Identity  = không đổi
```

Trong khi:

```text
IA position
URL
Navigation
Breadcrumb
```

được phép thay đổi theo vị trí mới.

---

## BR-05 — URL phải resolve về Page Identity

Route resolution phải hỗ trợ:

```text
URL
 ↓
Canonical Route Registry
 ↓
Page Identity
```

Một canonical URL phải resolve đến một Page Identity duy nhất.

Route resolution không được phụ thuộc vào việc URL có từng là URL cũ của Page hay không.

---

## BR-06 — Page Identity phải resolve ngược về canonical URL

Hệ thống phải có khả năng xác định canonical URL của Page dựa trên:

```text
Page Identity
 ↓
Current IA Ownership
 ↓
Canonical Route
 ↓
URL
```

Không được duy trì Page Identity → URL mapping ở nhiều nguồn độc lập.

---

## BR-07 — Route Registry phải là canonical

Route Registry phải là nguồn canonical để quản lý mapping giữa:

```text
Page Identity
IA
Route
URL
```

Thay đổi IA phải được phản ánh thông qua canonical route architecture.

Không yêu cầu sửa thủ công nhiều implementation chỉ để cập nhật URL.

---

## BR-08 — Navigation phải phản ánh IA hiện tại

Navigation phải resolve từ canonical Page/IA/Route information.

Khi Page được di chuyển:

```text
Old IA
   ↓
New IA
```

Navigation phải tự phản ánh vị trí mới.

Không tạo Navigation duplicate chỉ để giữ URL hoặc vị trí cũ.

---

## BR-09 — Breadcrumb phải phản ánh IA hiện tại

Breadcrumb phải phản ánh hierarchy canonical của Page.

Ví dụ:

```text
System Settings
  /
Administrators
  /
Permissions
```

Nếu Page chuyển sang vị trí khác, Breadcrumb phải tự thay đổi theo IA mới.

Không duy trì Breadcrumb độc lập với canonical IA.

---

## BR-10 — Không nhân bản Page

Không được tạo Page mới chỉ vì:

* thay đổi URL;
* thay đổi Module;
* thay đổi Menu;
* thay đổi Sub-menu;
* thay đổi locale;
* thay đổi navigation.

Một Page chỉ có một canonical Page Identity.

---

## BR-11 — Không nhân bản Module/Menu/Sub-menu

Mỗi Module/Menu/Sub-menu chỉ có một canonical ownership trong IA.

Không tạo duplicate navigation structure chỉ để phục vụ một URL hoặc Page.

---

## BR-12 — Không nhân bản Route

Không tạo Route implementation thứ hai chỉ vì Page được:

* di chuyển;
* đổi URL;
* đổi IA;
* đổi locale;
* đổi navigation.

Nếu URL thay đổi do IA thay đổi, canonical route phải được cập nhật.

---

## BR-13 — Không phân tán canonical URL

Canonical URL không được hardcode phân tán trong nhiều implementation nếu URL có thể được resolve từ canonical route architecture.

Audit phải xác định tất cả nguồn có khả năng chứa URL:

* HTML;
* JS;
* template;
* manifest;
* configuration;
* backend;
* navigation;
* breadcrumb;
* redirect;
* database;
* runtime;
* các implementation khác.

---

## BR-14 — Legacy URL không được trở thành Identity thứ hai

Nếu hệ thống cần hỗ trợ compatibility với URL cũ, compatibility phải được xử lý như một cơ chế route/redirect có chủ đích.

Không được biến URL cũ thành:

* Page mới;
* Page Identity mới;
* Menu mới;
* Route canonical thứ hai.

---

## BR-15 — Locale không tạo Page Identity mới

User App / User Web có thể có:

```text
VI URL
EN URL
```

nhưng cả hai phải resolve về cùng một technical Page Identity.

Locale không được tạo Page duplicate.

---

## BR-16 — Thay đổi IA phải có một nguồn cập nhật canonical

Khi IA thay đổi, hệ thống phải có một canonical mechanism để cập nhật:

```text
Route
URL
Navigation
Breadcrumb
```

Không được yêu cầu Owner/Developer sửa thủ công nhiều nơi độc lập.

---

# 5. Primary Implementation Scope

Task có **Product-wide authority**, nhưng implementation đầu tiên tập trung vào **Admin trên Staging 1**.

Điều này có nghĩa:

```text
Product URL Architecture SoT
            ↓
Product-wide rules
            ↓
Task implementation
            ↓
Admin
```

Admin là **implementation scope đầu tiên**, không phải một URL architecture độc lập.

Các surface khác phải được audit ở mức dependency/architecture khi cần để bảo đảm implementation Admin không tạo ra một architecture riêng biệt với Product.

Các surface tiếp theo có thể được xử lý bằng task riêng nhưng vẫn phải sử dụng cùng Product URL Architecture SoT.

---

# 6. Mandatory Audit

Trước Implementation bắt buộc thực hiện Audit.

Audit phải kiểm tra Admin S1 theo Product URL Architecture SoT.

## 6.1 Page Inventory

Lập inventory:

| Field                    | Requirement |
| ------------------------ | ----------- |
| Page Identity            | Bắt buộc    |
| Feature Identity         | Nếu có      |
| Module                   | Bắt buộc    |
| Page/Menu                | Bắt buộc    |
| Sub-page                 | Nếu có      |
| Current URL              | Bắt buộc    |
| Current Route            | Bắt buộc    |
| Navigation source        | Bắt buộc    |
| Breadcrumb source        | Bắt buộc    |
| Permission               | Bắt buộc    |
| Database identity        | Nếu có      |
| Canonical implementation | Bắt buộc    |

---

## 6.2 Route Audit

Phải xác định:

* Route Registry hiện tại;
* route nằm ở đâu;
* route được khai báo bao nhiêu lần;
* route hardcode;
* route alias;
* legacy route;
* duplicate route;
* route không còn được sử dụng;
* route không resolve được Page Identity.

---

## 6.3 Page Identity Audit

Phải xác định Page Identity của từng Admin Page.

Đặc biệt kiểm tra:

```text
Page Identity = URL?
```

Nếu có, phải ghi nhận là deviation.

---

## 6.4 Navigation Audit

Xác định Navigation đang lấy thông tin từ:

* canonical IA;
* route registry;
* manifest;
* configuration;
* HTML;
* JS;
* database;
* hardcode;
* implementation khác.

---

## 6.5 Breadcrumb Audit

Xác định Breadcrumb được sinh từ:

* IA;
* Page Identity;
* Route;
* configuration;
* hardcode;
* URL parsing;
* implementation khác.

---

## 6.6 Duplicate Audit

Sử dụng các evidence audit đã có để xác định:

* duplicate implementation;
* `.ix-*`;
* Vuexy;
* Tabler;
* token cũ;
* CSS chồng lấn;
* file chết;
* route chồng lấn;
* navigation chồng lấn;
* implementation cùng chức năng.

Evidence hiện có phải được tái sử dụng khi còn phù hợp.

Không được coi việc tạo task mới là lý do để bỏ toàn bộ evidence đã có và audit lại từ số 0.

---

# 7. Evidence Governance

Các audit trước đây được sử dụng làm:

**Evidence / Audit Source**

chứ không phải Product SoT.

Thứ tự authority:

```text
Product URL Architecture SoT
          ↓
Task BRD
          ↓
Mandatory Audit
          ↓
Existing Evidence
          ↓
Solution / Plan
          ↓
Implementation
```

Nếu evidence cũ mâu thuẫn với Product URL Architecture SoT:

> Product URL Architecture SoT thắng.

Nếu evidence chưa đủ để quyết định:

> Không được tự suy diễn; phải ghi nhận gap trong Audit/Solution.

---

# 8. Functional Requirements

## FR-01 — URL → Page Identity

Canonical URL phải resolve đến một Page Identity duy nhất.

## FR-02 — Page Identity → Canonical URL

Page Identity phải resolve được canonical URL theo IA hiện tại.

## FR-03 — Page Identity → Navigation

Navigation phải có khả năng resolve từ Page/IA canonical.

## FR-04 — Page Identity → Breadcrumb

Breadcrumb phải resolve từ IA canonical.

## FR-05 — IA relocation

Page được phép thay đổi:

```text
Module
Menu
Sub-menu
```

mà không tạo Page Identity mới.

## FR-06 — Locale handling

User surfaces có SEO localization có thể có nhiều URL locale nhưng cùng Page Identity.

Admin và system surfaces không được localized URL.

---

# 9. Non-Functional Requirements

## NFR-01 — Single Canonical Identity

Mỗi Page chỉ có một Page Identity canonical.

## NFR-02 — Single Canonical Ownership

Mỗi Module/Menu/Sub-menu chỉ có một canonical ownership.

## NFR-03 — Single Canonical Route

Mỗi Page có một canonical route.

## NFR-04 — Deterministic Resolution

Một canonical URL không được resolve tới nhiều Page Identity.

## NFR-05 — Maintainability

Thay đổi IA không yêu cầu sửa thủ công nhiều implementation độc lập.

## NFR-06 — Traceability

Phải có khả năng trace:

```text
URL
 ↓
Route
 ↓
Page Identity
 ↓
IA
```

và:

```text
Page Identity
 ↓
IA
 ↓
Route
 ↓
URL
```

---

# 10. Acceptance Criteria

Task đạt Product URL Architecture SoT khi chứng minh được:

### AC-01

URL có thể chứa:

```text
Module → Page → Sub-page
```

khi IA thực tế yêu cầu.

### AC-02

User App/User Web chỉ localized URL khi thuộc surface có yêu cầu SEO.

### AC-03

Admin và các system surfaces sử dụng URL tiếng Anh.

### AC-04

URL không được sử dụng làm Page Identity.

### AC-05

Page relocation không làm thay đổi Page Identity.

### AC-06

Page relocation không làm thay đổi Feature Identity.

### AC-07

Page relocation không làm thay đổi Permission.

### AC-08

Page relocation không làm thay đổi Database Identity.

### AC-09

URL tự phản ánh IA mới.

### AC-10

Navigation tự phản ánh IA mới.

### AC-11

Breadcrumb tự phản ánh IA mới.

### AC-12

Route resolution resolve URL → Page Identity.

### AC-13

Không tạo duplicate Page khi Page relocation.

### AC-14

Không tạo duplicate Menu khi Page relocation.

### AC-15

Không tạo duplicate Route khi Page relocation.

### AC-16

Không phải sửa nhiều implementation thủ công khi IA thay đổi.

---

# 11. Verification Scenario

Phải thực hiện ít nhất một scenario chứng minh Page relocation.

### Before

```text
/admin/system-settings/administrators/permissions
```

Giả sử:

```text
Page Identity = PAGE_X
```

### IA change

Page được chuyển từ:

```text
System Settings
  └── Administrators
       └── Permissions
```

sang:

```text
Administrators
  └── Permissions
```

### Expected URL

```text
/admin/administrators/permissions
```

### Expected Identity

```text
Page Identity      = PAGE_X
Feature Identity   = unchanged
Permission         = unchanged
Database Identity  = unchanged
```

### Expected Runtime

```text
New URL
   ↓
PAGE_X
```

và:

```text
Navigation → new IA
Breadcrumb → new IA
```

Không được tạo:

```text
PAGE_Y
MENU_Y
ROUTE_Y
```

chỉ để phục vụ vị trí mới.

---

# 12. Regression Verification

Sau Implementation phải kiểm tra:

* Admin routes hiện hữu;
* Admin navigation;
* Admin breadcrumbs;
* Page loading;
* route resolution;
* permission;
* page identity;
* deep links;
* refresh trực tiếp tại URL;
* browser navigation;
* các route liên quan;
* không phát sinh duplicate route;
* không phát sinh duplicate Page/Menu.

Các route không nằm trong phạm vi thay đổi phải tiếp tục hoạt động bình thường.

---

# 13. Out of Scope

Task này không tự động:

* thiết kế lại toàn bộ Admin;
* xây Admin module mới;
* redesign UI;
* thay đổi Product URL Architecture SoT;
* tạo URL rule riêng cho Admin;
* localized Admin URL;
* redesign API architecture ngoài phạm vi cần thiết để tuân thủ Product SoT;
* thay đổi Database Identity không liên quan URL/Page Identity;
* quyết định tương lai của Staging 1;
* thực hiện Production deployment.

---

# 14. Implementation Governance

Task bắt buộc tuân thủ:

```text
BRD
 ↓
Mandatory Audit
 ↓
Audit Findings
 ↓
Solution
 ↓
Implementation Plan
 ↓
Owner Lock
 ↓
Implementation
 ↓
Verification
```

**BRD này không cấp quyền Implementation.**

Agent không được tự động:

* đổi URL;
* xóa route;
* xóa Page;
* xóa Menu;
* gộp implementation;
* thay đổi Page Identity;

chỉ dựa trên BRD.

Các quyết định đó phải được xác định trong Audit → Solution/Plan và được Owner khóa trước Implementation.

---

# 15. Definition of Done

Task chỉ hoàn thành khi:

1. Mandatory Audit hoàn tất.
2. Admin URL inventory hoàn tất.
3. Page Identity inventory hoàn tất.
4. Route inventory hoàn tất.
5. Navigation inventory hoàn tất.
6. Breadcrumb inventory hoàn tất.
7. Duplicate/legacy implementation được xác định.
8. Existing audit evidence liên quan đã được sử dụng.
9. Canonical Solution được xác định.
10. Owner khóa Solution/Plan.
11. Implementation hoàn tất.
12. Admin URL phản ánh đúng IA.
13. Admin URL sử dụng tiếng Anh.
14. Page Identity độc lập với URL.
15. Page relocation verification PASS.
16. Navigation relocation verification PASS.
17. Breadcrumb relocation verification PASS.
18. Không tạo duplicate Page/Menu/Route.
19. Regression test PASS.
20. Evidence và Verification được cập nhật vào Product Backlogs task.

---

# 16. Owner Lock

**Authority:** Product URL Architecture SoT

**Scope:** Product-wide principle; Admin là implementation scope đầu tiên của task.

**Status:** BRD Owner Locked

**Implementation:** Ủy quyền Wave 1 — 17/08/2026.

**Next Action:**

> Thi công Wave 1 theo `04_Solution.md` (đã khóa). Wave 2 chưa ủy quyền.
