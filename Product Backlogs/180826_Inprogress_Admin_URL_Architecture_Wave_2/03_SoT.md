# Source of Truth — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`

**Product:** iFlux

**Status:** OWNER LOCKED

**Ngày khóa:** 18/08/2026

**Authority:** Owner

**Predecessor:** `170826_Inprogress_URL_Architecture_Standardization` — CLOSED

---

# 1. Purpose

Tài liệu này là Source of Truth cho toàn bộ quyết định architecture của Admin URL Architecture Wave 2.

Nếu source code, tài liệu khác, legacy implementation hoặc Agent interpretation mâu thuẫn với tài liệu này:

> **Tài liệu này là authority của Wave 2.**

Không được tạo architecture thay thế để giải quyết conflict.

---

# 2. Core Architecture

Admin URL architecture có một canonical chain duy nhất:

```text
IA
 ↓
Page Identity
 ↓
urlSegment
 ↓
pathFor()
 ↓
hrefFor()
 ↓
Navigation
````

Breadcrumb:

```text
Page Identity
 ↓
trailFor()
 ↓
hrefFor()
 ↓
pathFor()
```

Permission:

```text
Page Identity
 ↓
PAGE_PERM
 ↓
Authorization
```

Legacy:

```text
Legacy URL
 ↓
301
 ↓
Canonical URL
```

---

# 3. Authority Hierarchy

Thứ tự authority:

```text
1. Owner decisions
2. This SoT
3. Locked BRD
4. Wave 1 locked architecture
5. Approved Solution
6. Implementation
7. Existing legacy code
```

Legacy code không thể override SoT.

Một implementation đang tồn tại không có nghĩa nó là architecture đúng.

---

# 4. Page Identity SoT

Canonical Page Identity là authority.

URL không phải identity.

HTML filename không phải identity.

Permission key không phải identity.

Nginx location không phải identity.

Ví dụ:

```text
system-ds-studio
```

là một Page Identity.

Các hash:

```text
#tokens
#colors
#typography
```

là region/state.

Không tạo:

```text
system-ds-studio-tokens
system-ds-studio-colors
...
```

---

# 5. PAGES Registry

`PAGES` là registry Page Identity hiện tại.

Không tạo registry thứ hai.

Không tạo:

```text
URL_REGISTRY
PAGE_URL_REGISTRY
ADMIN_ROUTE_REGISTRY
```

hoặc registry tương đương.

Nếu cần metadata URL:

```text
urlSegment
legacySlugs
```

phải thuộc model hiện tại.

---

# 6. Canonical URL Authority

Canonical URL:

```text
pathFor(pageKey)
```

là authority duy nhất.

Không được dùng:

```text
PAGES.slug
window.location
hardcoded href
nginx regex
HTML filename
```

làm canonical URL writer.

`PAGES.slug` chỉ là legacy/migration metadata khi cần.

---

# 7. `urlSegment`

`urlSegment` mô tả Page/IA position trong canonical URL.

Nó phải được xác định từ IA đã khóa.

Không được suy ngược:

```text
legacy slug
→ urlSegment
```

nếu điều đó làm legacy URL trở thành architecture.

Canonical URL phải phản ánh IA.

---

# 8. Canonical URL Language

Canonical Admin URL dùng English semantic segments.

Vietnamese URLs là legacy.

Ví dụ:

```text
/admin/goi-cuoc/...
```

là legacy.

Canonical:

```text
/admin/subscriptions/...
```

hoặc canonical nested path theo IA.

Không có:

```text
canonical English
→ nginx rewrite
→ Vietnamese
```

sau migration.

---

# 9. Locked Top-Level URL Namespace

Canonical namespace:

```text
/admin/overview
/admin/administrators
/admin/users
/admin/requests
/admin/orders
/admin/subscriptions
/admin/membership
/admin/community
/admin/topics
/admin/market
/admin/data-operations
/admin/data
/admin/notifications
/admin/interface
/admin/system
/admin/metadata
/admin/marketing
/admin/ai
/admin/analytics
```

Không tạo synonym namespace cho cùng domain.

---

# 10. Interface / System Boundary

Owner đã khóa:

```text
Interface
→ /admin/interface/

System
→ /admin/system/
```

Design System Studio:

```text
/admin/interface/ds-studio
```

Identity:

```text
system-ds-studio
```

Hash:

```text
#<region>
```

là state/region.

---

# 11. Topic Boundary

Topic domain:

```text
/admin/topics/
```

Canonical namespace không dùng:

```text
/admin/story/
```

Các legacy:

```text
/admin/story/
/admin/cau-chuyen/
/admin/chu-de/
```

được resolve theo Page Identity và redirect về canonical topic route.

---

# 12. Dashboard

Dashboard:

```text
/admin/overview
```

Admin root:

```text
/admin
```

là infrastructure entry:

```text
/admin
→ 302
→ /admin/overview
```

Dashboard không trở thành nginx Page registry.

---

# 13. Authentication

Login:

```text
/admin/login
```

Legacy:

```text
/admin/dang-nhap
→ 301
→ /admin/login
```

Login là auth/infrastructure surface.

Không đưa login vào Page migration inventory như một Admin content Page.

---

# 14. Documentation

Các:

```text
/Admin_Design_system/*.html
```

là:

```text
NON-PAGE
DOCUMENTATION
```

Không có:

```text
urlSegment
Page Identity
PAGE_PERM
```

trừ khi một future Owner decision mở scope riêng.

---

# 15. Navigation

Canonical navigation writer:

```text
hrefFor(pageKey)
```

Navigation không được:

```text
href="/admin/..."
```

hardcode nếu Page Identity đã tồn tại.

Không tạo:

```text
navHrefFor()
routeHref()
adminUrl()
```

để cạnh tranh với `hrefFor()`.

---

# 16. Breadcrumb

Canonical breadcrumb writer:

```text
trailFor(pageKey)
```

URL của breadcrumb phải dùng:

```text
hrefFor()
```

Không hardcode:

```html
href="/admin/..."
```

trong breadcrumb.

Không tạo breadcrumb URL registry.

---

# 17. Permission

Canonical Page permission:

```text
PAGE_PERM[pageIdentity]
```

Permission resolution không lấy URL làm primary identity.

`HREF_PERM` chỉ là migration/compatibility fallback.

Không xóa `HREF_PERM` theo bulk operation.

Mỗi rule phải có evidence.

---

# 18. HREF_PERM Lifecycle

Mỗi `HREF_PERM` rule thuộc một trong:

```text
MIGRATED
ACTIVE CONSUMER
LEGACY
NON-PAGE
DEAD
```

Chỉ:

```text
DEAD
```

được remove.

Evidence tối thiểu:

```text
consumer inventory
runtime verification
replacement PAGE_PERM
regression
```

---

# 19. Nginx Authority

Nginx không phải Page registry.

Nginx không được quyết định canonical Page.

Nginx không được giữ danh sách module Page như architecture cuối.

Nginx chỉ giữ:

```text
infrastructure
authentication entry
static assets
root entry
legacy redirect
```

Canonical Admin Page request:

```text
Nginx
→ Express
→ Page Identity
→ Page
```

---

# 20. Express Authority

Express là canonical Admin Page dispatcher.

Dispatcher resolve:

```text
request
→ canonical/legacy classification
→ Page Identity
→ canonical Page
```

Legacy phải redirect.

Không render duplicate Page implementation cho legacy URL.

---

# 21. Legacy URL Policy

Legacy URL không phải canonical.

Nếu canonical đã tồn tại:

```text
legacy
→ 301
→ canonical
```

Không:

```text
legacy
→ 200 Page
```

Không:

```text
legacy
→ separate implementation
```

Không:

```text
legacy
→ second Page Identity
```

---

# 22. Redirect Policy

Mục tiêu:

```text
legacy
→ one 301
→ canonical
```

Không tạo redirect chain:

```text
legacy
→ old legacy
→ newer legacy
→ canonical
```

Nếu có chain trong migration:

* Solution phải ghi nhận;
* Implementation phải collapse về one-hop;
* Verification phải chứng minh.

---

# 23. IA / URL Relationship

IA là source để xây canonical URL.

Ví dụ:

```text
Quản lý người dùng
    └── Entitlements
```

canonical phải nằm trong Users namespace nếu Page thực sự thuộc Users.

Không giữ:

```text
/admin/subscriptions/entitlements
```

chỉ vì đó là legacy slug.

Legacy slug là evidence migration, không phải authority.

---

# 24. Page Identity Reconciliation

Nếu phát hiện:

```text
A
B
```

cùng render cùng Page:

Không tạo hai canonical identities.

Phải chọn:

```text
one canonical identity
```

và đánh dấu các object còn lại:

```text
legacy / alias / runtime-only
```

---

# 25. Runtime-only Page

Một Page có thể tồn tại ngoài sidebar.

Điều đó không làm nó thành duplicate identity.

Ví dụ:

```text
orders-edit
community-content-edit
```

có thể là runtime Page.

Runtime-only không đồng nghĩa:

```text
NON-PAGE
```

Solution phải phân biệt:

```text
canonical Page
runtime Page
alias
legacy
documentation
infrastructure
```

---

# 26. Query State

Query parameter không tạo Page Identity.

Ví dụ:

```text
/admin/subscriptions/plans/edit?plan=new
```

identity vẫn:

```text
subscription-plan-edit
```

Query là runtime state.

Canonical path không encode query thành identity.

---

# 27. Studio

D-03 tiếp tục LOCK:

```text
1 Page Identity
13 nav regions
13 hashes
```

Hash không phải route.

Không migrate Studio thành 13 Page.

---

# 28. Dashboard / Login / Guides Classification

| Surface                       | Classification         |
| ----------------------------- | ---------------------- |
| `/admin`                      | INFRA entry            |
| `/admin/overview`             | PAGE                   |
| `/admin/login`                | AUTH/INFRA             |
| `/Admin_Design_system/*.html` | NON-PAGE documentation |
| Admin modules                 | PAGE                   |

Classification này là SoT.

---

# 29. Canonical Namespace Table

| Domain          | Namespace         |
| --------------- | ----------------- |
| Overview        | `overview`        |
| Administrators  | `administrators`  |
| Users           | `users`           |
| Requests        | `requests`        |
| Orders          | `orders`          |
| Subscriptions   | `subscriptions`   |
| Membership      | `membership`      |
| Community       | `community`       |
| Topics          | `topics`          |
| Market          | `market`          |
| Data Operations | `data-operations` |
| Data            | `data`            |
| Notifications   | `notifications`   |
| Interface       | `interface`       |
| System          | `system`          |
| Metadata        | `metadata`        |
| Marketing       | `marketing`       |
| AI              | `ai`              |
| Analytics       | `analytics`       |

---

# 30. Forbidden Architecture

Wave 2 tuyệt đối không tạo:

```text
URL Registry #2
Route Registry #3
Page Identity Registry #2
Permission Engine #2
Breadcrumb Engine #2
Navigation Writer #2
Nginx Page Registry
```

Không giải quyết migration bằng cách tạo thêm abstraction.

---

# 31. Implementation Order

Implementation phải đi theo dependency:

```text
1. Page Identity reconciliation
        ↓
2. IA / urlSegment
        ↓
3. pathFor()
        ↓
4. hrefFor()
        ↓
5. trailFor()
        ↓
6. PAGE_PERM
        ↓
7. Express dispatcher
        ↓
8. Nginx simplification
        ↓
9. Legacy redirect
        ↓
10. HTML / hardcoded URL cleanup
        ↓
11. HREF_PERM cleanup
        ↓
12. Verification
```

Không thực hiện bước sau khi authority của bước trước chưa ổn định.

---

# 32. Verification Authority

Verification phải kiểm tra cùng một SoT:

```text
Identity
URL
Navigation
Breadcrumb
Permission
Dispatcher
Legacy
Nginx
```

Không chỉ kiểm tra HTTP 200.

Một Page PASS chỉ khi toàn bộ chain đúng.

---

# 33. Wave 1 Regression

Wave 1 phải tiếp tục PASS:

```text
Administrators
list
profile
roles
permissions
```

Studio:

```text
system-ds-studio
13 regions
```

Legacy Administrators:

```text
301
→ canonical
```

Login:

```text
/admin/login
```

không được regression.

---

# 34. Definition of Canonical

Một URL được gọi là canonical chỉ khi:

```text
Page Identity
+
urlSegment
+
pathFor()
+
Express serving
+
200
```

đồng thời navigation/breadcrumb/permission đều resolve về cùng identity.

---

# 35. Definition of Legacy

Một URL được gọi là legacy khi:

* không còn là canonical;
* chỉ tồn tại vì compatibility;
* redirect về canonical;
* không có Page implementation riêng;
* không có Page Identity riêng.

---

# 36. Definition of Dead

Legacy artifact chỉ được gọi là DEAD khi:

```text
0 active consumer
+
0 required compatibility
+
0 bookmark/entry dependency identified
+
replacement verified
```

Không được gọi một artifact là dead chỉ vì:

```text
không thấy nó được import
```

---

# 37. Solution Contract

Solution phải trả lời được:

1. Page Identity nào là canonical?
2. IA nào sở hữu Page?
3. Canonical URL là gì?
4. `urlSegment` nào?
5. Legacy URL nào?
6. Redirect nào?
7. Permission nào?
8. Nginx consumer nào?
9. HTML consumer nào?
10. Breadcrumb consumer nào?
11. Artifact nào có thể remove?
12. Verification nào chứng minh migration?

Nếu Solution không trả lời được một trong các câu trên:

```text
STOP
```

---

# 38. Owner Decision on Current Audit Findings

## F-W2-01

Alias thiếu `legacy: true`.

**Decision:**

Phải phân loại lại.

Alias không được được coi là canonical Page Identity.

---

## F-W2-02

IA tree có thể làm URL thay đổi.

**Decision:**

Canonical URL phải follow IA.

Không giữ legacy slug chỉ để tránh URL migration.

Migration Matrix là bắt buộc.

---

## F-W2-03

Query `?plan=new`.

**Decision:**

Runtime state.

Không tạo Page Identity.

---

## F-W2-04

Nginx vẫn biết Page.

**Decision:**

Migration required.

Không xóa trước khi consumer audit.

---

## F-W2-05

87 `HREF_PERM`.

**Decision:**

Không bulk delete.

Migrate từng nhóm theo evidence.

---

## F-W2-06

Wave 1 HTML stub.

**Decision:**

Giữ trong migration period.

Sau khi canonical redirect verified và consumer = 0:

```text
REMOVE
```

---

## F-W2-07

Breadcrumb hardcode.

**Decision:**

Migrate về:

```text
trailFor()
→ hrefFor()
```

---

## F-W2-08

Hướng dẫn.

**Decision:**

NON-PAGE.

Không đưa vào Page URL architecture.

---

## F-W2-09

G-06.

**Decision:**

LOCK:

```text
interface
system
```

tách namespace.

---

## F-W2-10

`system-audit`.

**Decision:**

Giữ D-06.

Không tạo identity/URL riêng nếu Page Identity chưa được chứng minh.

Solution phải map nó vào canonical architecture hiện tại.

---

# 39. SoT Conflict Rule

Nếu source code hiện tại khác SoT:

```text
SoT wins.
```

Nếu Audit cũ khác SoT:

```text
SoT wins.
```

Nếu legacy document khác SoT:

```text
SoT wins.
```

Nếu Agent interpretation khác SoT:

```text
SoT wins.
```

Không tự sửa SoT trong Implementation.

Chỉ Owner mới có quyền thay đổi SoT.

---

# 40. Change Control

Thay đổi các nội dung sau bắt buộc Owner decision:

* Page Identity
* canonical URL namespace
* URL language
* IA → URL rule
* `pathFor`
* `hrefFor`
* `trailFor`
* permission authority
* nginx architecture
* Studio identity
* scope

Agent không được tự lock thay đổi architecture.

---

# 41. Final Owner Lock

Wave 2 không phải một architecture discovery.

Wave 2 là:

> **Migration và expansion của architecture đã được chứng minh trong Wave 1.**

Canonical authority:

```text
Page Identity
→ IA
→ urlSegment
→ pathFor
→ hrefFor
```

Permission:

```text
Page Identity
→ PAGE_PERM
```

Breadcrumb:

```text
Page Identity
→ trailFor
```

Legacy:

```text
legacy
→ 301
→ canonical
```

Nginx:

```text
infrastructure
→ not Page registry
```

Studio:

```text
1 identity
13 regions
```

Documentation:

```text
NON-PAGE
```

User Web:

```text
OUT
```

No second architecture:

```text
LOCKED
```

---

# 42. Status

**SoT STATUS: OWNER LOCKED**

**BRD STATUS: OWNER LOCKED**

**AUDIT STATUS: COMPLETE**

**SOLUTION: AUTHORIZED**

**IMPLEMENTATION: NOT YET AUTHORIZED**

**NEXT ACTION: SOLUTION + MIGRATION MATRIX**

````