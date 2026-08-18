# Business Requirements Document — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`

**Product:** iFlux

**Scope:** Admin

**Phase:** Wave 2

**Status:** OWNER LOCKED

**Ngày khóa:** 18/08/2026

**Predecessor:** `170826_Inprogress_URL_Architecture_Standardization` — CLOSED

**Audit:** `02_Audit.md` — completed 18/08/2026

**SoT:** `03_SoT.md` — OWNER LOCKED

**Implementation:** AUTHORIZED (18/08/2026)  
**Plan:** `05_Implementation-Plan.md` — **OWNER LOCKED**

**Solution:** AUTHORIZED

---

# 1. Purpose

Wave 2 là bước hoàn tất kiến trúc URL của Admin dựa trên architecture đã được chứng minh và khóa trong Wave 1.

Wave 1 đã chứng minh:

- Page Identity có thể là authority độc lập với URL legacy.
- `pathFor()` có thể là canonical URL authority.
- `hrefFor()` có thể là writer duy nhất cho navigation.
- `trailFor()` có thể dùng cùng URL authority.
- `PAGE_PERM` có thể chuyển permission từ URL sang Page Identity.
- Express có thể trở thành canonical Admin Page dispatcher.
- Legacy URL có thể được redirect về canonical bằng 301.
- Design System Studio có thể giữ một Page Identity duy nhất và dùng hash làm region.
- Không cần tạo registry thứ ba.
- Không cần tạo URL engine thứ hai.
- Không cần tạo permission engine thứ hai.

Wave 2 không phát minh architecture mới.

Wave 2 mở rộng architecture Wave 1 cho toàn bộ Admin Page còn lại và loại bỏ dần các writer/dispatcher/permission/breadcrumb legacy sau khi chứng minh không còn consumer.

---

# 2. Owner Decision

Owner khóa các nguyên tắc sau:

> **Admin có một Page Identity authority, một canonical URL authority, một navigation writer, một breadcrumb writer và một permission authority.**

Canonical chain:

```text
Page Identity
      ↓
urlSegment / IA
      ↓
pathFor()
      ↓
hrefFor()
      ↓
navigation

Page Identity
      ↓
trailFor()
      ↓
breadcrumb

Page Identity
      ↓
PAGE_PERM
      ↓
authorization
````

Không được tạo architecture thứ hai để phục vụ Wave 2.

---

# 3. Scope

## 3.1 IN SCOPE

* Toàn bộ Admin Page còn lại sau Wave 1.
* Admin IA → canonical URL mapping.
* `urlSegment`.
* `pathFor()`.
* `hrefFor()`.
* `trailFor()`.
* Page Identity reconciliation.
* `PAGE_PERM`.
* `HREF_PERM` migration.
* Nginx Admin Page rewrite migration.
* Express Admin dispatcher.
* Legacy URL redirect.
* Legacy HTML stub / `location.replace`.
* Hardcoded Admin Page URL.
* Hardcoded breadcrumb URL.
* Admin navigation URL.
* Query parameter chỉ khi nó là runtime state của Page.
* Design System Studio theo D-03.
* Dashboard/login/guides theo phân loại đã khóa tại BRD này.

## 3.2 OUT OF SCOPE

* User Web.
* User App.
* Public SEO.
* Production.
* Staging 2.
* Database architecture.
* API architecture.
* Permission key redesign.
* Permission semantic redesign.
* Admin Design System redesign.
* Widget redesign.
* HTML visual redesign.
* Rewrite Wave 1 architecture.
* Tạo registry mới.
* Tạo URL engine mới.
* Tạo permission engine mới.
* Tạo breadcrumb engine mới.

---

# 4. Inherited Locked Architecture

Wave 2 kế thừa và không được mở lại:

* OD-1
* OD-2
* OD-3
* OD-4
* OD-5
* OD-6
* D-01
* D-03
* D-06

Wave 1 task `170826` đã CLOSED.

Wave 2 không được reopen Wave 1.

---

# 5. Page Identity

## 5.1 Authority

`PAGES[].identity` / canonical Page Identity là authority của Admin Page.

URL không phải Page Identity.

Permission không được xác định bằng URL khi Page Identity đã tồn tại.

## 5.2 Alias

Object tồn tại chỉ để backward compatibility phải được đánh dấu rõ là:

```js
legacy: true
```

Không được để alias có vẻ như một Page Identity độc lập.

## 5.3 Duplicate identity

Hai object khác nhau nhưng cùng một Page Identity hoặc cùng một canonical Page không được tiếp tục tồn tại như hai Page authority.

Solution phải lập Migration Matrix cho:

* alias
* duplicate
* runtime-only Page
* non-menu Page
* legacy Page

---

# 6. Canonical URL Authority

## 6.1 Owner decision

Canonical Admin Page URL được tạo bởi:

```text
pathFor(pageKey)
```

`PAGES.slug` không còn là canonical URL authority.

`PAGES.slug` chỉ có thể tồn tại như:

* migration data
* legacy URL
* compatibility metadata

nếu cần.

## 6.2 Writer

Toàn bộ internal Admin navigation phải đi qua:

```text
hrefFor()
```

Không được tạo writer URL thứ hai.

## 6.3 Canonical URL

Canonical URL phải:

* deterministic
* unique
* không phụ thuộc HTML filename
* không phụ thuộc nginx regex
* không phụ thuộc legacy slug
* không dùng URL để xác định identity
* được resolve từ Page Identity + IA

---

# 7. URL Language Decision

Owner khóa:

> **Canonical Admin URL sử dụng English semantic segments.**

URL tiếng Việt hiện tại là legacy compatibility.

Ví dụ:

```text
/admin/goi-cuoc/
```

không còn là canonical architecture đích.

Canonical mới sử dụng English segment:

```text
/admin/subscriptions/
```

Legacy URL phải redirect:

```text
301
```

về canonical.

Không có chiều ngược:

```text
English canonical
→ Vietnamese
```

sau khi Wave 2 migration hoàn tất.

---

# 8. Canonical Admin IA URL Map

Owner khóa canonical top-level segments sau:

| IA / Module     | Canonical                |
| --------------- | ------------------------ |
| Dashboard       | `/admin/overview`        |
| Administrators  | `/admin/administrators`  |
| Users           | `/admin/users`           |
| Requests        | `/admin/requests`        |
| Orders          | `/admin/orders`          |
| Subscriptions   | `/admin/subscriptions`   |
| Membership      | `/admin/membership`      |
| Community       | `/admin/community`       |
| Topics          | `/admin/topics`          |
| Market          | `/admin/market`          |
| Data Operations | `/admin/data-operations` |
| Data            | `/admin/data`            |
| Notifications   | `/admin/notifications`   |
| Interface       | `/admin/interface`       |
| System          | `/admin/system`          |
| Metadata        | `/admin/metadata`        |
| Marketing       | `/admin/marketing`       |
| AI              | `/admin/ai`              |
| Analytics       | `/admin/analytics`       |

Không được tạo canonical prefix khác cho cùng module.

---

# 9. G-06 — Interface vs System

Owner khóa:

```text
Quản lý giao diện
→ /admin/interface/

Cài đặt hệ thống
→ /admin/system/
```

Design System Studio thuộc:

```text
/admin/interface/ds-studio
```

Studio vẫn:

```text
Page Identity = system-ds-studio
```

Hash tiếp tục là region/state:

```text
/admin/interface/ds-studio#tokens
/admin/interface/ds-studio#colors
/admin/interface/ds-studio#typography
```

Không tạo 13 Page Identity.

Không biến hash thành Page Identity.

---

# 10. Topic / Story Naming

Owner khóa:

```text
Topic domain
→ /admin/topics/
```

Không sử dụng:

```text
/admin/story/
```

làm canonical Page namespace.

Các legacy route như:

```text
/admin/cau-chuyen/
/admin/chu-de/
```

được phân loại theo Page Identity thực tế và redirect về canonical `/admin/topics/...`.

Không được giữ `story` và `topic` như hai architecture nếu thực tế cùng một domain/Page Identity.

---

# 11. IA Determines URL Structure

URL phải phản ánh IA đã được Owner khóa.

Không được đơn giản hóa Wave 2 thành:

```text
Vietnamese slug
→ translate sang English
```

Ví dụ:

```text
Quản lý người dùng
    └── Entitlements
```

không được tiếp tục canonical:

```text
/admin/subscriptions/entitlements
```

chỉ vì slug cũ là `goi-cuoc`.

Nếu Page thuộc IA Users thì canonical phải nằm dưới Users:

```text
/admin/users/entitlements
```

Solution phải thể hiện chính xác migration này trong Migration Matrix.

---

# 12. URL Depth

URL depth là hệ quả của IA.

Không cố định toàn bộ Page ở 2 cấp.

Ví dụ hợp lệ:

```text
/admin/users
/admin/users/end-users
/admin/users/entitlements
/admin/users/entitlements/list
```

nếu IA và Page relationship thực sự yêu cầu.

Không tạo thêm cấp chỉ để giữ URL legacy.

Không loại bỏ cấp IA chỉ để URL ngắn.

---

# 13. Dashboard

Dashboard là Admin entry Page.

Canonical:

```text
/admin/overview
```

`/admin` tiếp tục là infrastructure entry:

```text
/admin
→ 302
→ /admin/overview
```

Dashboard là Page Identity hợp lệ nhưng không được dùng làm nginx Page registry.

---

# 14. Login

Login là INFRA/auth surface.

Canonical:

```text
/admin/login
```

Legacy:

```text
/admin/dang-nhap
```

→ 301 `/admin/login`

Login không tham gia Page URL migration của Wave 2.

---

# 15. Hướng dẫn

5 file:

```text
/Admin_Design_system/*.html
```

được khóa là:

```text
NON-PAGE / DOCUMENTATION
```

Không gắn `urlSegment`.

Không đưa vào Admin Page Identity.

Không ép chúng vào `/admin/...`.

Không tạo Page Identity để phục vụ documentation.

---

# 16. Query Parameter

Query parameter là runtime state, không phải Page Identity.

Ví dụ:

```text
/admin/subscriptions/plans/edit?plan=new
```

Page Identity vẫn là:

```text
subscription-plan-edit
```

`?plan=new` không tạo Page Identity mới.

`pathFor()` không được dùng query parameter để tạo canonical identity.

---

# 17. Breadcrumb

Breadcrumb canonical writer:

```text
trailFor()
```

Breadcrumb URL phải được tạo qua:

```text
hrefFor()
```

Không hardcode Page URL trong HTML.

Không hardcode:

```html
<a href="/...">
```

cho internal Admin Page navigation/breadcrumb nếu URL có thể resolve từ Page Identity.

Mục tiêu:

```text
Page Identity
→ trailFor()
→ hrefFor()
→ pathFor()
```

---

# 18. Permission

## 18.1 Authority

Page permission authority:

```text
PAGE_PERM[pageIdentity]
```

## 18.2 Migration

`HREF_PERM` không được xóa hàng loạt.

Mỗi rule phải được phân loại:

```text
MIGRATED
ACTIVE CONSUMER
LEGACY
NON-PAGE
DEAD
```

Chỉ `DEAD` mới được remove.

## 18.3 Permission key

Wave 2 không đổi permission key semantics.

Chỉ thay đổi authority lookup:

```text
URL regex
→ Page Identity
```

---

# 19. Nginx

Sau migration, Nginx không được biết danh sách Admin Page.

Nginx chỉ giữ:

* `/admin`
* `/admin/login`
* static assets
* infrastructure
* explicit legacy redirects nếu còn cần

Canonical Page dispatch:

```text
Nginx
→ Express
→ Page Identity
→ canonical Page
```

Nginx không trở thành Page registry.

---

# 20. Legacy

Mọi legacy URL sau khi canonical đã tồn tại:

```text
legacy
→ 301
→ canonical
```

Không:

```text
legacy
→ render Page riêng
```

Không:

```text
legacy
→ duplicate implementation
```

Không:

```text
canonical
→ legacy
```

Legacy có thể được giữ tạm thời khi còn consumer.

Sau khi chứng minh không còn consumer, legacy implementation phải được remove.

---

# 21. HTML Legacy Stub

Các file:

```text
location.replace()
meta refresh
legacy HTML redirect
```

phải được inventory.

Sau khi nginx/Express canonical redirect đã thay thế và không còn consumer:

```text
remove
```

Không để nhiều lớp redirect không cần thiết.

Mục tiêu:

```text
legacy URL
→ one canonical 301
→ canonical Page
```

---

# 22. Migration Matrix

Solution bắt buộc phải tạo Migration Matrix cho toàn bộ Admin Page.

Mỗi row tối thiểu:

| Field               | Required |
| ------------------- | -------- |
| Page Identity       | YES      |
| Current URL         | YES      |
| Canonical URL       | YES      |
| IA group            | YES      |
| IA parent           | YES      |
| `urlSegment`        | YES      |
| Writer              | YES      |
| Permission          | YES      |
| Legacy URLs         | YES      |
| Nginx consumer      | YES      |
| HTML consumer       | YES      |
| Breadcrumb consumer | YES      |
| Redirect            | YES      |
| Remove candidate    | YES      |
| Verification        | YES      |

Không được implement Page nếu chưa có canonical mapping.

---

# 23. Acceptance Criteria

Wave 2 chỉ được PASS khi:

## AC-01 — Identity

Mỗi Admin Page có đúng một canonical Page Identity.

## AC-02 — Canonical URL

Mỗi Page in-scope có canonical URL từ `pathFor()`.

## AC-03 — Writer

Navigation dùng `hrefFor()`.

## AC-04 — Breadcrumb

Breadcrumb dùng `trailFor()` + canonical writer.

## AC-05 — Permission

Page authorization sử dụng Page Identity / `PAGE_PERM`.

## AC-06 — Legacy

Legacy URL chỉ redirect 301 về canonical.

## AC-07 — Nginx

Nginx không còn biết danh sách canonical Admin Page.

## AC-08 — No duplicate architecture

Không có:

* registry thứ ba
* URL engine thứ hai
* permission engine thứ hai
* breadcrumb engine thứ hai

## AC-09 — Studio

Studio:

```text
1 identity
13 navigation regions
hash = region
```

không bị tách thành 13 Page.

## AC-10 — Documentation

5 Design System guides tiếp tục là NON-PAGE.

## AC-11 — Dashboard/Auth

```text
/admin → /admin/overview
/admin/dang-nhap → /admin/login
```

đúng authority.

## AC-12 — Legacy consumer

Không remove legacy khi chưa chứng minh consumer = 0.

## AC-13 — No hardcoded canonical Page URL

Không còn hardcoded internal canonical Page URL trong navigation/breadcrumb.

## AC-14 — Query state

Query parameter không tạo duplicate Page Identity.

## AC-15 — HTTP

Canonical:

```text
200
```

Legacy:

```text
301
```

Không có redirect chain > 1 hop đối với legacy route đã migrated.

## AC-16 — IA consistency

Canonical URL phản ánh IA đã khóa, không chỉ là translation của slug cũ.

## AC-17 — Scope

Không thay đổi User Web/User App/Production/SEO public.

---

# 24. Verification

Verification phải có cả:

### Static

* Page Identity inventory
* URL mapping
* `pathFor`
* `hrefFor`
* `trailFor`
* `PAGE_PERM`
* `HREF_PERM`
* nginx
* hardcoded href
* HTML redirects
* duplicate identity

### Runtime

Test tối thiểu:

```text
canonical URL
legacy URL
redirect
query preservation
permission
sidebar visibility
breadcrumb
Studio hash
dashboard
login
```

### Regression

Wave 1:

```text
Administrators
Studio
legacy Administrators
login
```

phải tiếp tục PASS.

---

# 25. Solution Authorization

BRD này **AUTHORIZE Solution**.

Agent được phép:

1. lập Solution;
2. lập Migration Matrix;
3. xác định implementation sequence;
4. xác định consumer trước khi remove;
5. lập verification plan.

Agent **chưa được phép**:

* sửa code;
* migrate URL;
* xóa nginx;
* xóa `HREF_PERM`;
* xóa HTML stub;
* deploy;
* mở User Web.

Implementation chỉ được bắt đầu sau khi Owner approve Solution.

---

# 26. Stop Conditions

Agent phải STOP nếu phát hiện:

* cần Page Identity mới ngoài model hiện tại;
* cần registry mới;
* cần URL engine mới;
* cần permission engine mới;
* cần thay đổi permission semantics;
* IA conflict với Page Identity;
* canonical URL không xác định được;
* hai Page cùng canonical identity nhưng chưa có Owner decision;
* User Web bị ảnh hưởng;
* Wave 1 architecture phải rewrite;
* cần thay đổi scope BRD.

Không được tự quyết để vượt Stop Condition.

---

# 27. Definition of Done

Task `180826` chỉ CLOSED khi:

```text
BRD LOCKED
    ↓
SoT LOCKED
    ↓
Solution APPROVED
    ↓
Implementation COMPLETE
    ↓
Static Verification PASS
    ↓
Runtime Verification PASS
    ↓
Regression Wave 1 PASS
    ↓
Legacy consumer audit PASS
    ↓
Documentation reconciled
    ↓
Owner CLOSE
```

---

# 28. Owner Lock

**Owner Decision: LOCKED**

Wave 2 là migration/extension của architecture Wave 1.

Không mở architecture mới.

Không quay lại Wave 1.

Không tự suy URL convention.

Không tự suy Page Identity.

Không tự xóa legacy.

Không implement trước Solution approval.

**BRD STATUS: OWNER LOCKED**

**SOLUTION: AUTHORIZED**

**IMPLEMENTATION: NOT YET AUTHORIZED**

````

---